from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.database.init_db import init_db
from app.presentation.routes import admin, auth, messages, system, users, websocket
from app.utilities.network import get_local_ip
from app.utilities.rate_limiter import InMemoryRateLimiter, RateLimitMiddleware
from app.websocket.manager import manager


origins = [
    "https://codex-chat-app.vercel.app",
]

settings = get_settings()
configure_logging(settings)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # if settings.app_env.lower() in {"local", "development", "dev"}:
    init_db()
    ip = get_local_ip()
    logger.info("Backend ready: http://%s:8000", ip)
    yield
    await manager.shutdown()


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, limiter=InMemoryRateLimiter(settings.rate_limit_per_minute))

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(system.router)
app.include_router(websocket.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.message, "data": None})


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"success": False, "message": "Internal server error", "data": None})
