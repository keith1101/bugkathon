import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import Templates


class TemplateRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, template_id: uuid.UUID) -> Templates | None:
        result = await self._db.execute(
            select(Templates).where(Templates.id == template_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Templates]:
        result = await self._db.execute(
            select(Templates).order_by(Templates.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_event_id(self, event_id: uuid.UUID) -> list[Templates]:
        result = await self._db.execute(
            select(Templates)
            .where(Templates.event_id == event_id)
            .order_by(Templates.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, template: Templates) -> Templates:
        self._db.add(template)
        await self._db.flush()
        await self._db.refresh(template)
        return template

    async def update(self, template: Templates) -> Templates:
        await self._db.flush()
        await self._db.refresh(template)
        return template

    async def delete(self, template: Templates) -> None:
        await self._db.delete(template)
        await self._db.flush()
