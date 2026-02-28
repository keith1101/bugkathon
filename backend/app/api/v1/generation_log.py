import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.api.deps import get_current_user, get_generation_log_service
from app.models.user import Users
from app.schemas.generated_asset import GeneratedAssetResponse
from app.schemas.generation_log import (
	GenerationLogCreate,
	GenerationLogResponse,
	GenerationLogStatusResponse,
)
from app.services.generation_log_service import GenerationLogService

router = APIRouter(prefix="/generation-log", tags=["Generation Log"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=GenerationLogResponse)
async def trigger_generation(
	payload: GenerationLogCreate,
	background_tasks: BackgroundTasks,
	current_user: Users = Depends(get_current_user),
	generation_log_service: GenerationLogService = Depends(get_generation_log_service),
) -> GenerationLogResponse:
	_ = current_user
	log = await generation_log_service.trigger(payload, background_tasks)
	return GenerationLogResponse.model_validate(log)


@router.get("", response_model=list[GenerationLogResponse])
async def get_generation_logs(
	current_user: Users = Depends(get_current_user),
	generation_log_service: GenerationLogService = Depends(get_generation_log_service),
) -> list[GenerationLogResponse]:
	_ = current_user
	logs = await generation_log_service.get_all()
	return [GenerationLogResponse.model_validate(log) for log in logs]


@router.get("/{log_id}", response_model=GenerationLogResponse)
async def get_generation_log(
	log_id: uuid.UUID,
	current_user: Users = Depends(get_current_user),
	generation_log_service: GenerationLogService = Depends(get_generation_log_service),
) -> GenerationLogResponse:
	_ = current_user
	log = await generation_log_service.get_by_id(log_id)
	return GenerationLogResponse.model_validate(log)


@router.get("/{log_id}/status", response_model=GenerationLogStatusResponse)
async def get_generation_log_status(
	log_id: uuid.UUID,
	current_user: Users = Depends(get_current_user),
	generation_log_service: GenerationLogService = Depends(get_generation_log_service),
) -> GenerationLogStatusResponse:
	_ = current_user
	log = await generation_log_service.get_by_id(log_id)
	return GenerationLogStatusResponse.model_validate(log)


@router.get("/{log_id}/assets", response_model=list[GeneratedAssetResponse])
async def get_generated_assets(
	log_id: uuid.UUID,
	current_user: Users = Depends(get_current_user),
	generation_log_service: GenerationLogService = Depends(get_generation_log_service),
) -> list[GeneratedAssetResponse]:
	_ = current_user
	assets = await generation_log_service.get_assets_by_log_id(log_id)
	return [GeneratedAssetResponse.model_validate(asset) for asset in assets]
