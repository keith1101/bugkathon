import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GeneratedAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    generation_log_id: uuid.UUID
    participant_name: str
    participant_email: str
    email_status: str
    drive_file_id: str | None = None
    created_at: datetime | None = None