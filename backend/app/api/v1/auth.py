"""
Auth endpoints — switch to HttpOnly Cookie authentication.
- POST /auth/login    → set cookies, return UserResponse (no token in body)
- POST /auth/refresh  → read refresh cookie, set new access cookie, return 200
- POST /auth/logout   → delete cookies, return 200
- GET  /auth/me       → requires auth (cookie or Bearer), return UserResponse
- POST /auth/register → unchanged
"""
from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse

from app.api.deps import get_auth_service, get_current_user
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.models.user import Users
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Cookie config ─────────────────────────────────────────────────────
ACCESS_TOKEN_COOKIE  = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"
COOKIE_SAMESITE      = "lax"
COOKIE_SECURE        = False   # ← True khi deploy HTTPS production


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    # UNCHANGED — register không dùng cookie
    user = await auth_service.register(payload)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Login → set HttpOnly cookies, return UserResponse (NO token in body)."""
    result = await auth_service.login(payload)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=result.access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=result.refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth/refresh",  # scope: only sent to /refresh
    )
    user = await auth_service.get_me_by_token(result.access_token)
    return UserResponse.model_validate(user)


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> JSONResponse:
    """Read refresh_token from cookie, set new access_token cookie, return 200."""
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not refresh_token:
        raise UnauthorizedException("Refresh token không tồn tại.")
    result = await auth_service.refresh(refresh_token)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=result.access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return JSONResponse(content={"message": "Token refreshed."})


@router.post("/logout")
async def logout(response: Response) -> JSONResponse:
    """Xóa cả 2 cookies."""
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path="/api/v1/auth/refresh")
    return JSONResponse(content={"message": "Logged out."})


@router.get("/me", response_model=UserResponse)
async def me(current_user: Users = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
