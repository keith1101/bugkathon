import uuid

from jose import JWTError

from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import Users
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    async def register(self, payload: RegisterRequest) -> Users:
        existing_user = await self.user_repo.get_by_email(payload.email)
        if existing_user:
            raise ConflictException("Email đã được đăng ký.")

        new_user = Users(
            email=payload.email,
            name=payload.name,
            role=payload.role,
            hashed_password=hash_password(payload.password),
        )
        return await self.user_repo.create(new_user)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(payload.email)
        if not user or not user.hashed_password:
            raise UnauthorizedException("Email hoặc mật khẩu không đúng.")

        if not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedException("Email hoặc mật khẩu không đúng.")

        return TokenResponse(
            access_token=create_access_token(str(user.id), extra={"role": user.role}),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except JWTError as exc:
            raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.") from exc

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Token không đúng loại.")

        try:
            user_id = uuid.UUID(str(payload["sub"]))
        except (KeyError, ValueError) as exc:
            raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.") from exc

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User không tồn tại.")

        return TokenResponse(
            access_token=create_access_token(str(user.id), extra={"role": user.role}),
            refresh_token=create_refresh_token(str(user.id)),
        )

    async def get_me_by_token(self, access_token: str) -> Users:
        """
        Decode access_token và trả về Users object.
        Dùng trong login endpoint sau khi set cookie.
        """
        try:
            payload = decode_token(access_token)
        except JWTError as exc:
            raise UnauthorizedException("Token không hợp lệ.") from exc
        user_id = uuid.UUID(str(payload["sub"]))
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User không tồn tại.")
        return user