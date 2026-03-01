from lxml import etree

from app.core.exceptions import BadRequestException


class SvgService:
	def render(self, svg_content: str, data: dict[str, str]) -> str:
		try:
			tree = etree.fromstring(svg_content.encode())
		except etree.XMLSyntaxError as exc:
			raise BadRequestException("SVG content không hợp lệ.") from exc

		# Replace {{key}} placeholders in all text nodes
		for element in tree.iter():
			if element.text:
				for key, value in data.items():
					placeholder = "{{" + key + "}}"
					if placeholder in element.text:
						element.text = element.text.replace(placeholder, value)
			if element.tail:
				for key, value in data.items():
					placeholder = "{{" + key + "}}"
					if placeholder in element.tail:
						element.tail = element.tail.replace(placeholder, value)

		return etree.tostring(tree, encoding="unicode")

	def validate(self, svg_content: str) -> bool:
		try:
			etree.fromstring(svg_content.encode())
			return True
		except etree.XMLSyntaxError as exc:
			raise BadRequestException("SVG content không hợp lệ.") from exc
