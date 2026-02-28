from lxml import etree

from app.core.exceptions import BadRequestException


class SvgService:
	def render(self, svg_content: str, data: dict[str, str]) -> str:
		try:
			tree = etree.fromstring(svg_content.encode())
		except etree.XMLSyntaxError as exc:
			raise BadRequestException("SVG content không hợp lệ.") from exc

		for key, value in data.items():
			node = tree.find(f'.//*[@id="{key}"]')
			if node is not None:
				node.text = value

		return etree.tostring(tree, encoding="unicode")

	def validate(self, svg_content: str) -> bool:
		try:
			etree.fromstring(svg_content.encode())
			return True
		except etree.XMLSyntaxError as exc:
			raise BadRequestException("SVG content không hợp lệ.") from exc
