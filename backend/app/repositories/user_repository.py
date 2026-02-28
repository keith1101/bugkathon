import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Users


class UserRepository:
	def __init__(self, db: AsyncSession) -> None:
		self._db = db

	async def get_by_id(self, user_id: uuid.UUID) -> Users | None:
		result = await self._db.execute(select(Users).where(Users.id == user_id))
		return result.scalar_one_or_none()

	async def get_by_email(self, email: str) -> Users | None:
		result = await self._db.execute(select(Users).where(Users.email == email))
		return result.scalar_one_or_none()

	async def get_all(self) -> list[Users]:
		result = await self._db.execute(select(Users))
		return list(result.scalars().all())

	async def create(self, user: Users) -> Users:
		self._db.add(user)
		await self._db.flush()
		await self._db.refresh(user)
		return user

	async def update(self, user: Users) -> Users:
		await self._db.flush()
		await self._db.refresh(user)
		return user

	async def delete(self, user: Users) -> None:
		await self._db.delete(user)
		await self._db.flush()
