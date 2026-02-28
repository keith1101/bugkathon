from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.google_oauth import (
    get_oauth_flow,
    is_drive_authorized,
    save_drive_credentials,
)
from app.models.user import Users

router = APIRouter(prefix="/oauth", tags=["OAuth"])


@router.get("/drive/status")
async def drive_status(
    current_user: Users = Depends(get_current_user),
) -> JSONResponse:
    """Check if Google Drive has been authorized via OAuth 2.0."""
    authorized = is_drive_authorized()
    message = (
        "Drive đã được authorize."
        if authorized
        else "Chưa authorize. Truy cập GET /oauth/drive/authorize để bắt đầu."
    )
    return JSONResponse(content={"authorized": authorized, "message": message})


@router.get("/drive/authorize")
async def drive_authorize(
    request: Request,
) -> RedirectResponse:
    """Redirect admin to Google consent screen to authorize Drive access."""
    redirect_uri = str(request.url_for("drive_callback"))
    flow = get_oauth_flow(redirect_uri=redirect_uri)
    authorization_url, _ = flow.authorization_url(
        access_type="offline",  
        prompt="consent",       
    )
    return RedirectResponse(url=authorization_url)


@router.get("/drive/callback", name="drive_callback")
async def drive_callback(
    request: Request,
    code: str,
) -> JSONResponse:
    """
    Handle Google OAuth callback.
    Exchanges authorization code for credentials and saves token.json.
    No auth required — Google redirects here without Bearer token.
    """
    redirect_uri = str(request.url_for("drive_callback"))
    flow = get_oauth_flow(redirect_uri=redirect_uri)
    flow.fetch_token(code=code)
    creds = flow.credentials
    save_drive_credentials(creds)
    return JSONResponse(
        content={
            "message": "Google Drive đã được authorize thành công!",
            "token_saved": True,
            "token_file": settings.GOOGLE_TOKEN_FILE,
            "hint": "Từ giờ batch job sẽ upload PDF lên Drive tự động.",
        }
    )
