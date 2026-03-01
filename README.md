# GDGoC Certificate System

A full-stack application built for designing SVG certificate templates and bulk-generating them into PDFs using dynamic data.

## 🏗️ Project Structure
The repository is split into two main sections:

- **`/frontend`**: A React.js single-page application where users can graphically design certificate templates and manage generation logic.
- **`/backend`**: A Python FastAPI backend connected to SQL Server that handles the API routes, SVG-to-PDF conversion, and optional Google integrations (Drive, Gmail).

## 🚀 Quick Start

### 1. Backend (API & Generation)
The backend relies on complex Linux-based C-libraries for PDF generation, so it **must be run using Docker**.
```bash
cd backend
cp .env.example .env  # Configure your environment variables here
docker-compose up --build
```
> API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React UI)
The frontend runs as a standard Node.js project and connects to backend APIs.
```bash
cd frontend
npm install
npm start
```
> Web app: [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Notes

- Frontend API base URL is controlled by `REACT_APP_API_BASE_URL` (default: `http://localhost:8000`).
- Authentication is cookie-based (HttpOnly cookies) with automatic refresh handling in the frontend API client.

## 🔐 Authentication Flow (High-level)

- `POST /api/v1/auth/login` sets session cookies.
- Protected pages verify session via `GET /api/v1/auth/me`.
- On `401`, frontend triggers `POST /api/v1/auth/refresh` and retries once.

For module-specific details, see:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)