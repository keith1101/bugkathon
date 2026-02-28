"""
GoogleDriveService — dual auth mode:
  Mode 1 (PRIMARY):  OAuth 2.0 — loads token from credentials/token.json
  Mode 2 (FALLBACK): Service Account — uses credentials/service_account.json

_build_service() is called on EVERY __init__ (each request via Depends).
This ensures auto-refreshed OAuth token is always used.
"""

import io

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.core.google_oauth import get_drive_credentials

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


class GoogleDriveService:
    def __init__(self) -> None:
        self._service = self._build_service()

    def _build_service(self):
        """
        Build Google Drive API client.
        Priority:
          1. OAuth 2.0 credentials (token.json) — if authorized
          2. Service Account (service_account.json) — fallback
        """
        oauth_creds = get_drive_credentials()
        if oauth_creds:
            return build("drive", "v3", credentials=oauth_creds)

        # Fallback: Service Account
        sa_creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
        )
        return build("drive", "v3", credentials=sa_creds)

    def upload_pdf(
        self,
        pdf_bytes: bytes,
        filename: str,
        folder_id: str | None = None,
    ) -> str:
        """
        Upload PDF bytes to Google Drive.
        Returns drive_file_id (string).
        """
        file_metadata: dict[str, object] = {"name": filename}
        if folder_id:
            file_metadata["parents"] = [folder_id]

        media = MediaIoBaseUpload(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            resumable=False,
        )

        try:
            file = (
                self._service.files()
                .create(
                    body=file_metadata,
                    media_body=media,
                    fields="id",
                )
                .execute()
            )
            return file.get("id")
        except Exception as exc:
            raise BadRequestException(
                f"Không thể upload lên Google Drive: {str(exc)}"
            ) from exc
