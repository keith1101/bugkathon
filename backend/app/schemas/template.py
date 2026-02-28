import json
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TemplateCreate(BaseModel):
    event_id: uuid.UUID
    name: str
    svg_content: str
    variables: list[str]


class TemplateUpdate(BaseModel):
    name: str | None = None
    svg_content: str | None = None
    variables: list[str] | None = None


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    name: str
    svg_content: str
    variables: list[str]
    created_at: datetime | None = None

    @field_validator("variables", mode="before")
    @classmethod
    def parse_variables(cls, v: str | list) -> list[str]:
        """
        DB stores variables as JSON string '["name","date"]'.
        Parse it to list[str] for the response.
        If already a list (in-memory object), return as-is.
        """
        if isinstance(v, str):
            return json.loads(v)
        return v


class PreviewRequest(BaseModel):
    sample_data: dict[str, str]


class PreviewResponse(BaseModel):
    svg_string: str
