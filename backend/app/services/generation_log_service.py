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
from app.services.google_drive_service import GoogleDriveService
from app.services.google_sheets_service import GoogleSheetsService
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
		)
		return log

	async def _process_batch(
		self,
		log_id: uuid.UUID,
		template: Templates,
	) -> None:
		try:
			await self._log_repo.update_status(log_id, "PROCESSING")
			await self._db.commit()

			log = await self._log_repo.get_by_id(log_id)
			if log is None:
				raise NotFoundException("Generation Log không tồn tại.")

			participants = self._sheets.read_participants(log.google_sheet_url)

			await self._log_repo.update_status(
				log_id,
				"PROCESSING",
				total_records=len(participants),
				processed=0,
			)
			await self._db.commit()

			for participant in participants:
				asset = GeneratedAssets(
					generation_log_id=log_id,
					participant_name=participant.get("participant_name", ""),
					participant_email=participant.get("participant_email", ""),
					email_status="PENDING",
				)
				asset = await self._asset_repo.create(asset)
				await self._db.commit()

				try:
					svg_rendered = self._svg.render(template.svg_content, participant)
					pdf_bytes = self._pdf.convert(svg_rendered)

					participant_name = participant.get("participant_name", "")
					filename = f"{participant_name or asset.id}.pdf"
					drive_file_id = self._drive.upload_pdf(
						pdf_bytes=pdf_bytes,
						filename=filename,
						folder_id=log.drive_folder_id,
					)

					self._gmail.send_certificate(
						to_email=participant.get("participant_email", ""),
						participant_name=participant_name,
						event_name=template.name,
						pdf_bytes=pdf_bytes,
						filename=filename,
					)

					await self._asset_repo.update_status(
						asset.id,
						"SENT",
						drive_file_id=drive_file_id,
					)
					await self._db.commit()
				except Exception:
					await self._asset_repo.update_status(asset.id, "FAILED")
					await self._db.commit()
				finally:
					await self._log_repo.increment_processed(log_id)
					await self._db.commit()

			await self._log_repo.update_status(log_id, "COMPLETED")
			await self._db.commit()
		except Exception:
			await self._log_repo.update_status(log_id, "FAILED")
			await self._db.commit()
