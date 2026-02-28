import uuid
from typing import List

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user, get_event_service
from app.models.user import Users
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventUpdate,
)
from app.schemas.template import TemplateResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EventResponse)
async def create_event(
    payload: EventCreate,
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    event = await event_service.create(payload, created_by=current_user.id)
    return EventResponse.model_validate(event)


@router.get("", response_model=List[EventResponse])
async def list_events(
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> List[EventResponse]:
    events = await event_service.get_all()
    return [EventResponse.model_validate(e) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: uuid.UUID,
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    event = await event_service.get_by_id(event_id)
    return EventResponse.model_validate(event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    event = await event_service.update(event_id, payload)
    return EventResponse.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> None:
    await event_service.delete(event_id)


@router.get("/{event_id}/templates", response_model=List[TemplateResponse])
async def list_event_templates(
    event_id: uuid.UUID,
    current_user: Users = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> List[TemplateResponse]:
    templates = await event_service.get_templates(event_id)
    return [TemplateResponse.model_validate(t) for t in templates]
