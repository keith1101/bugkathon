import json
import uuid

from lxml import etree

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.template import Templates
from app.repositories.event_repository import EventRepository
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import PreviewRequest, PreviewResponse, TemplateCreate, TemplateUpdate


class TemplateService:
    def __init__(
        self,
        template_repo: TemplateRepository,
        event_repo: EventRepository,
    ) -> None:
        self._template_repo = template_repo
        self._event_repo = event_repo

    async def get_all(self) -> list[Templates]:
        return await self._template_repo.get_all()

    async def get_by_id(self, template_id: uuid.UUID) -> Templates:
        template = await self._template_repo.get_by_id(template_id)
        if template is None:
            raise NotFoundException("Template không tồn tại.")
        return template

    async def get_by_event_id(self, event_id: uuid.UUID) -> list[Templates]:
        event = await self._event_repo.get_by_id(event_id)
        if event is None:
            raise NotFoundException("Event không tồn tại.")
        return await self._template_repo.get_by_event_id(event_id)

    async def create(self, payload: TemplateCreate) -> Templates:
        event = await self._event_repo.get_by_id(payload.event_id)
        if event is None:
            raise NotFoundException("Event không tồn tại.")

        try:
            etree.fromstring(payload.svg_content.encode())
        except etree.XMLSyntaxError:
            raise BadRequestException("SVG content không hợp lệ.")

        variables_json = json.dumps(payload.variables, ensure_ascii=False)

        new_template = Templates(
            event_id=payload.event_id,
            name=payload.name,
            svg_content=payload.svg_content,
            variables=variables_json,
        )
        return await self._template_repo.create(new_template)

    async def update(self, template_id: uuid.UUID, payload: TemplateUpdate) -> Templates:
        template = await self.get_by_id(template_id)

        if payload.name is not None:
            template.name = payload.name

        if payload.svg_content is not None:
            try:
                etree.fromstring(payload.svg_content.encode())
            except etree.XMLSyntaxError:
                raise BadRequestException("SVG content không hợp lệ.")
            template.svg_content = payload.svg_content

        if payload.variables is not None:
            template.variables = json.dumps(payload.variables, ensure_ascii=False)

        return await self._template_repo.update(template)

    async def delete(self, template_id: uuid.UUID) -> None:
        template = await self.get_by_id(template_id)
        await self._template_repo.delete(template)

    async def preview(self, template_id: uuid.UUID, payload: PreviewRequest) -> PreviewResponse:
        template = await self.get_by_id(template_id)

        tree = etree.fromstring(template.svg_content.encode())

        for key, value in payload.sample_data.items():
            node = tree.find(f'.//*[@id="{key}"]')
            if node is not None:
                node.text = value

        svg_string = etree.tostring(tree, encoding="unicode")
        return PreviewResponse(svg_string=svg_string)
