import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, ValidationInfo, field_validator


class GenerationLogCreate(BaseModel):
	template_id: uuid.UUID
	google_sheet_url: str
	drive_folder_id: str | None = None
	column_mapping: dict[str, str] | None = None

	@field_validator("google_sheet_url")
	@classmethod
	def validate_google_sheet_url(cls, v: str) -> str:
		pattern = r"https://docs\.google\.com/spreadsheets/d/[\w-]+"
		if not re.match(pattern, v):
			raise ValueError("URL phải là Google Sheets hợp lệ.")
		return v


class GenerationLogResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: uuid.UUID
	template_id: uuid.UUID
	google_sheet_url: str
	drive_folder_id: str | None = None
	status: str
	total_records: int
	processed: int
	created_at: datetime | None = None
	updated_at: datetime | None = None


class GenerationLogStatusResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True, validate_default=True)

	id: uuid.UUID
	status: str
	total_records: int
	processed: int
	progress_percent: float = 0.0

	@field_validator("progress_percent", mode="before")
	@classmethod
	def compute_progress(cls, v: float, info: ValidationInfo) -> float:
		data = info.data
		total = data.get("total_records", 0)
		processed = data.get("processed", 0)
		if total == 0:
			return 0.0
		return round((processed / total) * 100, 2)
