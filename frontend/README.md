# Bugkathon Frontend

React web client for creating and generating certificate templates.

## ✨ Features
- **Visual Editor**: `react-konva` for drag-and-drop template manipulation.
- **Dynamic Mapping**: Map Google Sheet columns to SVG `{{variables}}`.
- **Live Tracking**: Polls backend for batch processing progress status.

## 🚀 Setup
Ensure the backend is running at `http://localhost:8000` (controlled via `REACT_APP_API_BASE_URL` in `.env`).

```bash
npm install
npm start
```

## 🔐 Auth & API
- **Auth**: HttpOnly cookie-based session with automatic `401` refresh intercepts.
- **Services**: All Axios calls are abstracted in `src/config/api.js` (`AuthAPI`, `GenerationAPI`, etc.).
