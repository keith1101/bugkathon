import io
import os
import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account

from app.core.config import settings

SCOPES = ["https://www.googleapis.com/auth/drive.file"]

class GoogleDriveService:
    def __init__(self) -> None:
        self._service = None
        try:
            if os.path.exists(settings.GOOGLE_SERVICE_ACCOUNT_FILE):
                credentials = service_account.Credentials.from_service_account_file(
                    settings.GOOGLE_SERVICE_ACCOUNT_FILE,
                    scopes=SCOPES,
                )
                self._service = build("drive", "v3", credentials=credentials)
            else:
                print(f"Warning: Google Service Account file not found at {settings.GOOGLE_SERVICE_ACCOUNT_FILE}")
        except Exception as e:
            print(f"Warning: Google Drive service initialization failed: {e}")

    def upload_pdf(self, pdf_bytes: bytes, filename: str, folder_id: str = None) -> str:
        """
        Uploads a PDF to Google Drive. 
        If credentials are missing or upload fails, saves the file to the local 'generated/' directory.
        """
        if not self._service:
            return self._save_locally(pdf_bytes, filename)
        
        try:
            file_metadata = {"name": filename, "mimeType": "application/pdf"}
            if folder_id:
                file_metadata["parents"] = [folder_id]
            
            media = MediaIoBaseUpload(io.BytesIO(pdf_bytes), mimetype="application/pdf")
            file = (
                self._service.files()
                .create(body=file_metadata, media_body=media, fields="id")
                .execute()
            )
            return file.get("id")
        except Exception as e:
            print(f"Google Drive upload failed: {e}. Falling back to local storage.")
            return self._save_locally(pdf_bytes, filename)

    def _save_locally(self, pdf_bytes: bytes, filename: str) -> str:
        # Ensure filename has .pdf extension
        if not filename.lower().endswith(".pdf"):
            filename += ".pdf"

        now = datetime.datetime.now().strftime("%Y-%m-%d")
        # In Docker, the 'generated' folder is expected at the root or mapped volume
        base_dir = "generated"
        dir_path = os.path.join(base_dir, now)
        
        try:
            os.makedirs(dir_path, exist_ok=True)
            file_path = os.path.join(dir_path, filename)
            
            with open(file_path, "wb") as f:
                f.write(pdf_bytes)
            
            print(f"File saved locally: {file_path}")
            return f"local:{file_path}"
        except Exception as e:
            print(f"Failed to save file locally: {e}")
            return "skipped_no_credentials_or_local_fail"
