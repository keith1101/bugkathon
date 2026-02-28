from app.core.exceptions import BadRequestException


class PdfService:
	def convert(self, svg_string: str) -> bytes:
		try:
			import cairosvg

			return cairosvg.svg2pdf(bytestring=svg_string.encode("utf-8"))
		except Exception as exc:
			raise BadRequestException(
				f"Không thể convert SVG sang PDF: {str(exc)}"
			) from exc
