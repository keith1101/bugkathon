import re

from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.core.config import settings
from app.core.exceptions import BadRequestException

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


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
		range_: str = "Sheet1!A1:Z",
	) -> list[dict[str, str]]:
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

		headers = [h.strip().lower() for h in rows[0]]
		participants: list[dict[str, str]] = []
		for row in rows[1:]:
			row_padded = row + [""] * (len(headers) - len(row))
			participants.append(dict(zip(headers, row_padded)))

		return participants
