import uuid

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user, get_template_service
from app.models.user import Users
from app.schemas.template import (
    PreviewRequest,
    PreviewResponse,
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
)
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TemplateResponse)
async def create_template(
    payload: TemplateCreate,
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> TemplateResponse:
    template = await template_service.create(payload)
    return TemplateResponse.model_validate(template)


@router.get("", status_code=status.HTTP_200_OK, response_model=list[TemplateResponse])
async def list_templates(
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> list[TemplateResponse]:
    templates = await template_service.get_all()
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/{template_id}", status_code=status.HTTP_200_OK, response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> TemplateResponse:
    template = await template_service.get_by_id(template_id)
    return TemplateResponse.model_validate(template)


@router.put("/{template_id}", status_code=status.HTTP_200_OK, response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdate,
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> TemplateResponse:
    template = await template_service.update(template_id, payload)
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_template(
    template_id: uuid.UUID,
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> Response:
    await template_service.delete(template_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{template_id}/preview",
    status_code=status.HTTP_200_OK,
    response_model=PreviewResponse,
)
async def preview_template(
    template_id: uuid.UUID,
    payload: PreviewRequest,
    template_service: TemplateService = Depends(get_template_service),
    current_user: Users = Depends(get_current_user),
) -> PreviewResponse:
    return await template_service.preview(template_id, payload)
