import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers

app = FastAPI(
    title="GDGoC Certificate System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

if settings.APP_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "1.0.0"}


STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.exists(STATIC_DIR):
    # 1. /static/js + /static/css
    _static = os.path.join(STATIC_DIR, "static")
    if os.path.exists(_static):
        app.mount("/static", StaticFiles(directory=_static), name="static")

    # 2. /assets/ (logo, images)
    _assets = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    # 3. Catch-all — PHẢI đứng CUỐI CÙNG
    # FIX 1: Thêm response_model=None để FastAPI không generate Pydantic model
    # FIX 2: Bỏ Union type annotation -> dùng Response (base class)
    @app.get("/{full_path:path}", include_in_schema=False, response_model=None)
    async def serve_react(full_path: str):   # ← bỏ return type annotation
        if full_path.startswith(("api/", "docs", "redoc", "openapi", "health")):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse({"detail": "Frontend not built yet."}, status_code=404)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development",
    )