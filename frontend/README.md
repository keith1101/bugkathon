# Bugkathon Frontend

React web client for creating certificate templates and triggering batch certificate generation.

## 1. Quick Start

### Prerequisites
- Node.js 18+
- Backend API running at `http://localhost:8000` (default)

### Run locally
```bash
# 1) Install dependencies
npm install

# 2) Start dev server
npm start
```

Open `http://localhost:3000`.

## 2. Environment Configuration

The frontend reads API base URL from:

- `REACT_APP_API_BASE_URL` (default: `http://localhost:8000`)

Example:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 3. Current Architecture

- **Framework & Routing:** React, `react-router-dom`
- **Template Editor Canvas:** `react-konva`
- **API Client:** Axios in `src/config/api.js`
- **Auth Model:** HttpOnly cookie-based session with automatic refresh

## 4. Authentication Flow

- Login: `POST /api/v1/auth/login` sets cookies from backend
- Protected requests include cookies via `withCredentials: true`
- On `401`, interceptor calls `POST /api/v1/auth/refresh` then retries request once
- Session check for protected routes uses `GET /api/v1/auth/me`

## 5. API Service Modules

`src/config/api.js` exposes:

- `AuthAPI`
- `TemplatesAPI`
- `EventsAPI`
- `GenerationAPI`

These modules are used directly by pages/components for backend communication.
