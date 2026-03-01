# Bugkathon Backend Service

FastAPI application serving as the core engine for the Certificate System.

## ✨ Features
- **Async Workers**: `BackgroundTasks` for non-blocking PDF batch generation.
- **Conversion**: Dynamic SVG to PDF rendering via `CairoSVG`.
- **Integrations**: Google Sheets (data), Drive (storage), and Gmail OAuth (dispatch).

## 🚀 Docker Setup

Docker is required for the underlying Cairo/Pango C-libraries.

1. Configure `backend/.env` (Database URL, Gmail sender).
2. Place `service_account.json` and `client_secret.json` in `backend/credentials/`.
3. Run `docker compose up -d api --build`.

*Docs at `http://localhost:8000/docs`. PDFs save to `backend/generated/` locally if Drive upload is disabled.*

## 🔐 Gmail OAuth
To send emails, navigate to `http://localhost:8000/api/v1/oauth/gmail/authorize` to generate the `gmail_token.json` authorization file for the sender account.