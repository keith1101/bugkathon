import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Events
from app.models.template import Templates


class EventRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, event_id: uuid.UUID) -> Events | None:
        result = await self._db.execute(select(Events).where(Events.id == event_id))
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Events]:
        result = await self._db.execute(
            select(Events).order_by(Events.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, event: Events) -> Events:
        self._db.add(event)
        await self._db.flush()
        await self._db.refresh(event)
        return event

    async def update(self, event: Events) -> Events:
        await self._db.flush()
        await self._db.refresh(event)
        return event

    async def delete(self, event: Events) -> None:
        await self._db.delete(event)
        await self._db.flush()

    async def get_templates(self, event_id: uuid.UUID) -> list[Templates]:
        # simple query by foreign key
        result = await self._db.execute(select(Templates).where(Templates.event_id == event_id))
        return list(result.scalars().all())