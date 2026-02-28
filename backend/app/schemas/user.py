import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
	email: EmailStr
	name: str
	role: str
	password: str


class UserUpdate(BaseModel):
	name: str | None = None
	role: str | None = None


class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: uuid.UUID
	email: str
	name: str
	role: str
	created_at: datetime | None = None
