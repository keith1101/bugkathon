import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generated_asset import GeneratedAssets


class GeneratedAssetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[GeneratedAssets]:
        result = await self._db.execute(
            select(GeneratedAssets).order_by(GeneratedAssets.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, asset_id: uuid.UUID) -> GeneratedAssets | None:
        result = await self._db.execute(
            select(GeneratedAssets).where(GeneratedAssets.id == asset_id)
        )
        return result.scalar_one_or_none()

    async def get_by_log_id(self, log_id: uuid.UUID) -> list[GeneratedAssets]:
        result = await self._db.execute(
            select(GeneratedAssets)
            .where(GeneratedAssets.generation_log_id == log_id)
            .order_by(GeneratedAssets.created_at.asc())
        )
        return list(result.scalars().all())

    async def create(self, asset: GeneratedAssets) -> GeneratedAssets:
        self._db.add(asset)
        await self._db.flush()
        await self._db.refresh(asset)
        return asset

    async def update(self, asset: GeneratedAssets) -> GeneratedAssets:
        await self._db.flush()
        await self._db.refresh(asset)
        return asset

    async def update_status(
        self,
        asset_id: uuid.UUID,
        email_status: str,
        drive_file_id: str | None = None,
    ) -> GeneratedAssets | None:
        asset = await self.get_by_id(asset_id)
        if asset is None:
            return None

        asset.email_status = email_status
        if drive_file_id:
            asset.drive_file_id = drive_file_id

        await self._db.flush()
        await self._db.refresh(asset)
        return asset