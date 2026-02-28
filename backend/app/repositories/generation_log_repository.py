import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generation_log import GenerationLog


class GenerationLogRepository:
	def __init__(self, db: AsyncSession) -> None:
		self._db = db

	async def get_by_id(self, log_id: uuid.UUID) -> GenerationLog | None:
		result = await self._db.execute(
			select(GenerationLog).where(GenerationLog.id == log_id)
		)
		return result.scalar_one_or_none()

	async def get_all(self) -> list[GenerationLog]:
		result = await self._db.execute(
			select(GenerationLog).order_by(GenerationLog.created_at.desc())
		)
		return list(result.scalars().all())

	async def create(self, log: GenerationLog) -> GenerationLog:
		self._db.add(log)
		await self._db.flush()
		await self._db.refresh(log)
		return log

	async def update_status(
		self,
		log_id: uuid.UUID,
		status: str,
		total_records: int | None = None,
		processed: int | None = None,
	) -> None:
		log = await self.get_by_id(log_id)
		if log is None:
			return

		log.status = status
		if total_records is not None:
			log.total_records = total_records
		if processed is not None:
			log.processed = processed
		log.updated_at = datetime.now(timezone.utc)
		await self._db.flush()

	async def increment_processed(self, log_id: uuid.UUID) -> None:
		log = await self.get_by_id(log_id)
		if log is None:
			return

		log.processed += 1
		log.updated_at = datetime.now(timezone.utc)
		await self._db.flush()
