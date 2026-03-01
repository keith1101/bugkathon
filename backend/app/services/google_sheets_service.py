import re

from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.core.config import settings
from app.core.exceptions import BadRequestException

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def _col_letter_to_index(letter: str) -> int:
	"""Convert column letter (A, B, ..., Z, AA, AB, ...) to 0-based index."""
	result = 0
	for ch in letter.upper():
		result = result * 26 + (ord(ch) - ord("A") + 1)
	return result - 1


class GoogleSheetsService:
	def __init__(self) -> None:
		credentials = service_account.Credentials.from_service_account_file(
			settings.GOOGLE_SERVICE_ACCOUNT_FILE,
			scopes=SCOPES,
		)
		self._service = build("sheets", "v4", credentials=credentials)

	def extract_spreadsheet_id(self, url: str) -> str:
		match = re.search(r"/spreadsheets/d/([\w-]+)", url)
		if not match:
			raise BadRequestException("Không thể parse Spreadsheet ID từ URL.")
		return match.group(1)

	def read_participants(
		self,
		sheet_url: str,
		column_mapping: dict[str, str] | None = None,
		range_: str = "Sheet1!A:Z",
	) -> list[dict[str, str]]:
		"""
		Read participants from Google Sheets.

		column_mapping: maps SVG variable name → sheet column letter.
		  Example: {"name": "A", "role": "C", "participant_email": "B"}
		  Keys become the dict keys in the returned list.
		  If None, falls back to using sheet headers as keys.
		"""
		spreadsheet_id = self.extract_spreadsheet_id(sheet_url)
		result = (
			self._service.spreadsheets()
			.values()
			.get(spreadsheetId=spreadsheet_id, range=range_)
			.execute()
		)
		rows = result.get("values", [])

		if len(rows) < 2:
			return []

		# ── Column-letter mapping (from UI DATA MAPPING) ──────────
		if column_mapping:
			index_map: dict[str, int] = {}
			for var_name, col_letter in column_mapping.items():
				index_map[var_name] = _col_letter_to_index(col_letter)

			participants: list[dict[str, str]] = []
			for row in rows[1:]:
				entry: dict[str, str] = {}
				for var_name, col_idx in index_map.items():
					entry[var_name] = row[col_idx].strip() if col_idx < len(row) else ""
				participants.append(entry)
			return participants

		# ── Fallback: use sheet headers as keys ─────────────────────
		raw_headers = [h.strip().lower() for h in rows[0]]

		participants = []
		for row in rows[1:]:
			row_padded = row + [""] * (len(raw_headers) - len(row))
			participants.append(dict(zip(raw_headers, row_padded)))

		return participants
