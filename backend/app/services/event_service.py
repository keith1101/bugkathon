import uuid
from typing import List

from app.core.exceptions import NotFoundException, BadRequestException
from app.models.event import Events
from app.models.user import Users
from app.repositories.event_repository import EventRepository
from app.repositories.user_repository import UserRepository
from app.schemas.event import EventCreate, EventUpdate
from app.models.template import Templates


class EventService:
    def __init__(self, event_repo: EventRepository, user_repo: UserRepository) -> None:
        self.event_repo = event_repo
        self.user_repo = user_repo

    async def get_all(self) -> List[Events]:
        return await self.event_repo.get_all()

    async def get_by_id(self, event_id: uuid.UUID) -> Events:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("Sự kiện không tồn tại.")
        return event

    async def create(self, payload: EventCreate, created_by: uuid.UUID) -> Events:
        # verify user exists
        user = await self.user_repo.get_by_id(created_by)
        if not user:
            raise BadRequestException("Người dùng tạo không tồn tại.")

        new_event = Events(
            name=payload.name,
            event_date=payload.event_date,
            created_by=created_by,
        )
        return await self.event_repo.create(new_event)

    async def update(self, event_id: uuid.UUID, payload: EventUpdate) -> Events:
        event = await self.get_by_id(event_id)
        if payload.name is not None:
            event.name = payload.name
        if payload.event_date is not None:
            event.event_date = payload.event_date
        return await self.event_repo.update(event)

    async def delete(self, event_id: uuid.UUID) -> None:
        event = await self.get_by_id(event_id)
        await self.event_repo.delete(event)

    async def get_templates(self, event_id: uuid.UUID) -> List[Templates]:
        # make sure event exists
        await self.get_by_id(event_id)
        return await self.event_repo.get_templates(event_id)
