import uuid

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.generated_asset import GeneratedAssets
from app.repositories.generated_asset_repository import GeneratedAssetRepository
from app.repositories.generation_log_repository import GenerationLogRepository
from app.repositories.template_repository import TemplateRepository
from app.services.gmail_service import GmailService
from app.services.pdf_service import PdfService
from app.services.svg_service import SvgService


class GeneratedAssetService:
    def __init__(
        self,
        asset_repo: GeneratedAssetRepository,
        log_repo: GenerationLogRepository,
        template_repo: TemplateRepository,
        svg_service: SvgService,
        pdf_service: PdfService,
        gmail_service: GmailService,
    ) -> None:
        self.asset_repo = asset_repo
        self.log_repo = log_repo
        self.template_repo = template_repo
        self.svg_service = svg_service
        self.pdf_service = pdf_service
        self.gmail_service = gmail_service

    async def get_all(self) -> list[GeneratedAssets]:
        return await self.asset_repo.get_all()

    async def get_by_id(self, asset_id: uuid.UUID) -> GeneratedAssets:
        asset = await self.asset_repo.get_by_id(asset_id)
        if not asset:
            raise NotFoundException("Generated asset không tồn tại.")
        return asset

    async def resend_email(self, asset_id: uuid.UUID) -> GeneratedAssets:
        asset = await self.get_by_id(asset_id)
        if asset.email_status != "FAILED":
            raise BadRequestException("Chỉ có bản ghi thất bại mới được gửi lại email.")

        log = await self.log_repo.get_by_id(asset.generation_log_id)
        if not log:
            raise NotFoundException("Generation log không tồn tại.")

        template = await self.template_repo.get_by_id(log.template_id)
        if not template:
            raise NotFoundException("Template không tồn tại.")

        data: dict[str, str] = {
            "participant_name": asset.participant_name,
            "participant_email": asset.participant_email,
        }
        svg_rendered: str = self.svg_service.render(template.svg_content, data)
        pdf_bytes: bytes = self.pdf_service.convert(svg_rendered)
        filename: str = f"{asset.participant_name}.pdf"

        try:
            self.gmail_service.send_certificate(
                to_email=asset.participant_email,
                participant_name=asset.participant_name,
                event_name=template.name,
                pdf_bytes=pdf_bytes,
                filename=filename,
            )
            updated = await self.asset_repo.update_status(asset_id, "SENT")
        except Exception:
            updated = await self.asset_repo.update_status(asset_id, "FAILED")

        return updated if updated is not None else asset
