from fastapi import APIRouter

from app.api.v1 import auth, generation_log, templates, events, generated_assets, oauth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(templates.router)
api_router.include_router(generation_log.router)
api_router.include_router(events.router)
api_router.include_router(generated_assets.router)
api_router.include_router(oauth.router)
