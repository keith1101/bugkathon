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
> API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React UI)
The frontend is a standard Node.js project. You can run it concurrently with the backend.
```bash
cd frontend
npm install
npm start
```
> The web interface will be available at [http://localhost:3000](http://localhost:3000)