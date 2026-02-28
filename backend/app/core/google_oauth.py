import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from app.core.config import settings

DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def get_oauth_flow(redirect_uri: str) -> Flow:
    """
    Create OAuth Flow from client_secret.json.
    redirect_uri must match the URI registered in Google Cloud Console.
    """
    flow = Flow.from_client_secrets_file(
        settings.GOOGLE_CLIENT_SECRET_FILE,
        scopes=DRIVE_SCOPES,
        redirect_uri=redirect_uri,
    )
    return flow


def get_drive_credentials() -> Credentials | None:
    """
    Load credentials from token.json.
    Auto-refresh if expired using refresh_token.
    Return None if token.json does not exist or credentials are invalid.
    """
    if not os.path.exists(settings.GOOGLE_TOKEN_FILE):
        return None

    creds = Credentials.from_authorized_user_file(settings.GOOGLE_TOKEN_FILE, DRIVE_SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        save_drive_credentials(creds)

    return creds if (creds and creds.valid) else None


def save_drive_credentials(creds: Credentials) -> None:
    """
    Save credentials to token.json after user authorizes.
    """
    os.makedirs(os.path.dirname(settings.GOOGLE_TOKEN_FILE), exist_ok=True)
    with open(settings.GOOGLE_TOKEN_FILE, "w") as f:
        f.write(creds.to_json())


def is_drive_authorized() -> bool:
    """
    Check if Drive has been authorized (token.json exists and valid).
    """
    return get_drive_credentials() is not None
