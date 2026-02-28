# Bugkathon Frontend

Bugkathon is a React-based web app designed for designing SVG certificates and bulk-generating them into PDFs using dynamic data. This repository contains the standalone frontend prototype.

## 1. Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm start
```
*Open [http://localhost:3000](http://localhost:3000) to view it in the browser.*

## 2. Core Architecture
- **Framework & Routing:** React.js, `react-router-dom`
- **Canvas Engine:** `react-konva` (drag & drop design tools)
- **Data Parsing:** `papaparse` (handles CSV & Google Sheets parsing)
- **PDF Generation:** `jspdf` & `jszip` (renders canvases offline, compiles to an archive)
- **Data Persistence:** Mocked internally via browser `localStorage`

## 3. Backend Integration
This frontend is built as a self-contained prototype but is pre-configured for real backend deployment. 
Check `src/config/api.js` for the **Axios** setup. It contains:
- Pre-made interceptors for JWT authorization headers.
- Exported placeholder API services (`TemplatesAPI`, `AuthAPI`).
- Simply replace the `localStorage` logic in the components with these API calls once your Node.js/Python server is ready!

> For an in-depth checklist on migrating to a Node/Python backend, check the comments inside `src/config/api.js`.
