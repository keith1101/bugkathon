import uuid

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.generation_log import GenerationLog
from app.models.generated_asset import GeneratedAssets
from app.models.template import Templates
from app.repositories.generated_asset_repository import GeneratedAssetRepository
from app.repositories.generation_log_repository import GenerationLogRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.generation_log import GenerationLogCreate
from app.services.gmail_service import GmailService
from app.services.google_sheets_service import GoogleSheetsService
from app.services.google_drive_service import GoogleDriveService
from app.services.pdf_service import PdfService
from app.services.svg_service import SvgService


class GenerationLogService:
	def __init__(
		self,
		generation_log_repo: GenerationLogRepository,
		generated_asset_repo: GeneratedAssetRepository,
		template_repo: TemplateRepository,
		svg_service: SvgService,
		pdf_service: PdfService,
		sheets_service: GoogleSheetsService,
		drive_service: GoogleDriveService,
		gmail_service: GmailService,
		db: AsyncSession,
	) -> None:
		self._log_repo = generation_log_repo
		self._asset_repo = generated_asset_repo
		self._template_repo = template_repo
		self._svg = svg_service
		self._pdf = pdf_service
		self._sheets = sheets_service
		self._drive = drive_service
		self._gmail = gmail_service
		self._db = db

	async def get_all(self) -> list[GenerationLog]:
		return await self._log_repo.get_all()

	async def get_by_id(self, log_id: uuid.UUID) -> GenerationLog:
		log = await self._log_repo.get_by_id(log_id)
		if not log:
			raise NotFoundException("Generation Log không tồn tại.")
		return log

	async def get_assets_by_log_id(self, log_id: uuid.UUID) -> list[GeneratedAssets]:
		await self.get_by_id(log_id)
		return await self._asset_repo.get_by_log_id(log_id)

	async def trigger(
		self,
		payload: GenerationLogCreate,
		background_tasks: BackgroundTasks,
	) -> GenerationLog:
		template = await self._template_repo.get_by_id(payload.template_id)
		if not template:
			raise NotFoundException("Template không tồn tại.")

		new_log = GenerationLog(
			template_id=payload.template_id,
			google_sheet_url=payload.google_sheet_url,
			drive_folder_id=payload.drive_folder_id,
			status="PENDING",
		)

		log = await self._log_repo.create(new_log)
		await self._db.commit()

		background_tasks.add_task(
			self._process_batch,
			log_id=log.id,
			template=template,
			column_mapping=payload.column_mapping,
            create_pdf=payload.create_pdf,
            save_to_drive=payload.save_to_drive,
            send_email=payload.send_email,
            email_column=payload.email_column,
		)
		return log

	async def _process_batch(
		self,
		log_id: uuid.UUID,
		template: Templates,
		column_mapping: dict[str, str] | None = None,
        create_pdf: bool = True,
        save_to_drive: bool = False,
        send_email: bool = False,
        email_column: str | None = None,
	) -> None:
		try:
			await self._log_repo.update_status(log_id, "PROCESSING")
			await self._db.commit()

			log = await self._log_repo.get_by_id(log_id)
			if log is None:
				raise NotFoundException("Generation Log không tồn tại.")

			participants = self._sheets.read_participants(
				log.google_sheet_url,
				column_mapping=column_mapping,
			)

			await self._log_repo.update_status(
				log_id,
				"PROCESSING",
				total_records=len(participants),
				processed=0,
			)
			await self._db.commit()

			for participant in participants:
				# Resolve participant_name / participant_email from data.
				# column_mapping keys = SVG variable names, so "name" might be the key.
				# Also support explicit "participant_name" / "participant_email" keys.
				p_name = (
					participant.get("participant_name")
					or participant.get("name")
					or participant.get("name")
					or ""
				)
				# If the user selected an explicit email column on the frontend UI, use it.
				# Otherwise default to "participant_email" / "email"
				p_email = ""
				if email_column and email_column in participant:
					p_email = participant.get(email_column, "")
				else:
					p_email = (
						participant.get("participant_email")
						or participant.get("email")
						or participant.get("Email")
						or ""
					)

				print(f"Debug: p_name={p_name}, p_email={p_email}, send_email={send_email}, email_column={email_column}, pdf_bytes={'Yes' if create_pdf else 'No'}")

				asset = GeneratedAssets(
					generation_log_id=log_id,
					participant_name=p_name,
					participant_email=p_email,
					email_status="PENDING",
				)
				asset = await self._asset_repo.create(asset)
				await self._db.commit()

				try:
					svg_rendered = self._svg.render(template.svg_content, participant)
					pdf_bytes = None
					filename = f"{p_name or asset.id}.pdf"

					if create_pdf:
						pdf_bytes = self._pdf.convert(svg_rendered)
						# Always save a local copy for "DONE" status to be meaningful
						self._drive._save_locally(pdf_bytes, filename)

					drive_file_id = None

					if save_to_drive and pdf_bytes:
						drive_file_id = self._drive.upload_pdf(
							pdf_bytes=pdf_bytes,
							filename=filename,
							folder_id=log.drive_folder_id,
						)

					email_sent = False
					if send_email and pdf_bytes and p_email:
						try:
							self._gmail.send_certificate(
								to_email=p_email,
								participant_name=p_name,
								event_name=template.name,
								pdf_bytes=pdf_bytes,
								filename=filename,
							)
							email_sent = True
						except Exception as e:
							print(f"Skipping email for {p_email} as Gmail is not authorized or failed: {e}")

					await self._asset_repo.update_status(
						asset.id,
						"SENT" if email_sent else "DONE",
						drive_file_id=drive_file_id,
					)
					await self._db.commit()
				except Exception as e:
					print(f"Error processing participant {p_name}: {e}")
					await self._asset_repo.update_status(asset.id, "FAILED")
					await self._db.commit()
				finally:
					await self._log_repo.increment_processed(log_id)
					await self._db.commit()

			await self._log_repo.update_status(log_id, "COMPLETED")
			await self._db.commit()
		except Exception as e:
			print(f"Critical error in batch processing for log {log_id}: {e}")
			await self._log_repo.update_status(log_id, "FAILED")
			await self._db.commit()
