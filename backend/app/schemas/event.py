import datetime
import uuid

from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    name: str
    event_date: datetime.date


class EventUpdate(BaseModel):
    name: str | None = None
    event_date: datetime.date | None = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    event_date: datetime.date
    created_by: uuid.UUID
    created_at: datetime.datetime | None = None
