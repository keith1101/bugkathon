import base64
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.models.generated_asset import GeneratedAssets

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

class GmailService:
    def __init__(self) -> None:
        credentials = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
        )
        delegated = credentials.with_subject(settings.GMAIL_SENDER_EMAIL)
        self._service = build("gmail", "v1", credentials=delegated)

    def send_certificate(
        self,
        to_email: str,
        participant_name: str,
        event_name: str,
        pdf_bytes: bytes,
        filename: str,
    ) -> None:
        msg = MIMEMultipart()
        msg["To"] = to_email
        msg["From"] = settings.GMAIL_SENDER_EMAIL
        msg["Subject"] = f"[GDGoC] Chứng nhận tham dự — {event_name}"

        body = MIMEText(
            (
                f"Xin chào {participant_name},<br>"
                "Chúc mừng bạn đã hoàn thành chương trình.<br>"
                "Vui lòng xem chứng nhận đính kèm trong email này."
            ),
            "html",
            "utf-8",
        )
        msg.attach(body)

        attachment = MIMEBase("application", "octet-stream")
        attachment.set_payload(pdf_bytes)
        encoders.encode_base64(attachment)
        attachment.add_header(
            "Content-Disposition",
            f'attachment; filename="{filename}"',
        )
        msg.attach(attachment)

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        try:
            self._service.users().messages().send(
                userId="me",
                body={"raw": raw},
            ).execute()
        except Exception as exc:
            raise BadRequestException(f"Không thể gửi email: {str(exc)}") from exc