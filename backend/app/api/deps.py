"""
Dependency Injection container cho FastAPI.
Tất cả các `Depends(...)` dùng trong Router đều được khai báo ở đây.

Flow:
    Router → Depends(get_xxx_service)
                └── get_xxx_service → Depends(get_db)
                        └── get_db → AsyncSession từ SQLAlchemy
"""

import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException

from app.models.user import Users

from app.core.database import AsyncSessionFactory

# ── Auth bearer scheme ─────────────────────────────────────────────────────
# auto_error=False: don't throw 403 when no header (cookie fallback)
bearer_scheme = HTTPBearer(auto_error=False)

# ── Repositories ─────────────────────────────────────────────────────────────
from app.repositories.user_repository import UserRepository
from app.repositories.event_repository import EventRepository
from app.repositories.template_repository import TemplateRepository
from app.repositories.generation_log_repository import GenerationLogRepository
from app.repositories.generated_asset_repository import GeneratedAssetRepository

# ── Services ──────────────────────────────────────────────────────────────────
# from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.services.event_service import EventService
from app.services.template_service import TemplateService
from app.services.generation_log_service import GenerationLogService
from app.services.svg_service import SvgService
from app.services.pdf_service import PdfService
from app.services.google_sheets_service import GoogleSheetsService
from app.services.google_drive_service import GoogleDriveService
from app.services.gmail_service import GmailService
from app.services.generated_asset_service import GeneratedAssetService


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 0 — Database Session
# ══════════════════════════════════════════════════════════════════════════════

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Tạo AsyncSession cho mỗi request, tự động commit/rollback khi kết thúc.
    Dùng làm base dependency cho tất cả Repositories.

    Usage trong Router:
        async def endpoint(db: AsyncSession = Depends(get_db)): ...
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 1 — Repositories (nhận db session)
# ══════════════════════════════════════════════════════════════════════════════

def get_user_repository(
    db: AsyncSession = Depends(get_db),
) -> UserRepository:
    return UserRepository(db)


def get_event_repository(
    db: AsyncSession = Depends(get_db),
) -> EventRepository:
    return EventRepository(db)


def get_template_repository(
    db: AsyncSession = Depends(get_db),
) -> TemplateRepository:
    return TemplateRepository(db)


def get_generation_log_repository(
    db: AsyncSession = Depends(get_db),
) -> GenerationLogRepository:
    return GenerationLogRepository(db)


def get_generated_asset_repository(
    db: AsyncSession = Depends(get_db),
) -> GeneratedAssetRepository:
    return GeneratedAssetRepository(db)


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2A — Stateless / Singleton-like Services (không cần db)
# Các service này chỉ wrap Google APIs hoặc xử lý file
# ════════════════════════════==============================

def get_svg_service() -> SvgService:
    return SvgService()


def get_pdf_service() -> PdfService:
    return PdfService()


def get_google_sheets_service() -> GoogleSheetsService:
    return GoogleSheetsService()


def get_google_drive_service() -> GoogleDriveService:
    return GoogleDriveService()


def get_gmail_service() -> GmailService:
    return GmailService()


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2B — Business Logic Services (cần db + các service khác)
# ══════════════════════════════════════════════════════════════════════════════

# def get_user_service(
#     user_repo: UserRepository = Depends(get_user_repository),
# ) -> UserService:
#     return UserService(user_repo)


def get_event_service(
    event_repo: EventRepository = Depends(get_event_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> EventService:
    """EventService cần user_repo để validate created_by tồn tại."""
    return EventService(event_repo, user_repo)


def get_generated_asset_service(
    asset_repo: GeneratedAssetRepository = Depends(get_generated_asset_repository),
    log_repo: GenerationLogRepository = Depends(get_generation_log_repository),
    template_repo: TemplateRepository = Depends(get_template_repository),
    svg_service: SvgService = Depends(get_svg_service),
    pdf_service: PdfService = Depends(get_pdf_service),
    gmail_service: GmailService = Depends(get_gmail_service),
) -> GeneratedAssetService:
    return GeneratedAssetService(
        asset_repo=asset_repo,
        log_repo=log_repo,
        template_repo=template_repo,
        svg_service=svg_service,
        pdf_service=pdf_service,
        gmail_service=gmail_service,
    )

def get_template_service(
    template_repo: TemplateRepository = Depends(get_template_repository),
    event_repo: EventRepository = Depends(get_event_repository),
) -> TemplateService:
    return TemplateService(template_repo, event_repo)


def get_generation_log_service(
    db: AsyncSession = Depends(get_db),
    log_repo: GenerationLogRepository = Depends(get_generation_log_repository),
    asset_repo: GeneratedAssetRepository = Depends(get_generated_asset_repository),
    template_repo: TemplateRepository = Depends(get_template_repository),
    svg_service: SvgService = Depends(get_svg_service),
    pdf_service: PdfService = Depends(get_pdf_service),
    sheets_service: GoogleSheetsService = Depends(get_google_sheets_service),
    drive_service: GoogleDriveService = Depends(get_google_drive_service),
    gmail_service: GmailService = Depends(get_gmail_service),
) -> GenerationLogService:
    return GenerationLogService(
        generation_log_repo=log_repo,
        generated_asset_repo=asset_repo,
        template_repo=template_repo,
        svg_service=svg_service,
        pdf_service=pdf_service,
        sheets_service=sheets_service,
        drive_service=drive_service,
        gmail_service=gmail_service,
        db=db,
    )


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repo)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> Users:
    """
    Read token in priority order:
    1. HttpOnly Cookie 'access_token'  ← FE embedded (production)
    2. Authorization: Bearer header    ← Swagger UI / Postman testing
    """
    token: str | None = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise UnauthorizedException("Чуа đăng nhập.")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise UnauthorizedException("Token không đúng loại.")
        user_id = uuid.UUID(str(payload["sub"]))
    except (JWTError, ValueError, KeyError) as exc:
        raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.") from exc
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User không tồn tại.")
    return user