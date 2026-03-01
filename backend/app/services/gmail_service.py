import base64
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from googleapiclient.discovery import build

from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.core.google_oauth import get_gmail_credentials


class GmailService:
    def __init__(self) -> None:
        creds = get_gmail_credentials()
        if creds is None:
            raise BadRequestException(
                "Gmail chưa được authorize. "
                "Truy cập GET /api/v1/oauth/gmail/authorize để authorize."
            )
        self._service = build("gmail", "v1", credentials=creds)

    def send_certificate(
        self,
        to_email: str,
        participant_name: str,
        event_name: str,
        pdf_bytes: bytes,
        filename: str,
    ) -> None:
        # Đảm bảo filename có extension .pdf
        if not filename.lower().endswith(".pdf"):
            filename = filename + ".pdf"

        msg = MIMEMultipart("mixed")
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

        attachment = MIMEBase("application", "pdf")
        attachment.set_payload(pdf_bytes)
        encoders.encode_base64(attachment)
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=filename,
        )
        attachment.add_header("Content-Type", "application/pdf", name=filename)
        msg.attach(attachment)

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        try:
            self._service.users().messages().send(
                userId="me",
                body={"raw": raw},
            ).execute()
        except Exception as exc:
            raise BadRequestException(f"Không thể gửi email: {str(exc)}") from exc