# GDGoC Certificate System

A full-stack application for visually designing SVG certificates, mapping them to Google Sheets data, and bulk-generating PDFs with background async processing.

## 🏗️ Structure

- **`/frontend` (React.js)**: Drag-and-drop template editor (`react-konva`), data mapping, and live job tracking.
- **`/backend` (Python FastAPI)**: Async generation worker, SQL Server integration, CairoSVG PDF conversion, and Google API integrations (Drive, Gmail).

## 🚀 Quick Start

Ensure Docker is installed. The backend requires Docker for C-libraries (Cairo) and ODBC drivers.

**1. Backend**
```bash
cd backend
# Add credentials/service_account.json & client_secret.json, configure .env
docker compose up -d api --build
```
*API docs at `http://localhost:8000/docs`*

**2. Frontend**
```bash
cd frontend
npm install
npm start
```
*App at `http://localhost:3000`*

## 📚 Docs
- [Backend details](backend/README.md)
- [Frontend details](frontend/README.md)