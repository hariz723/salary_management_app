import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info(f"Initialized database tables for {settings.PROJECT_NAME}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Salary Management System for ACME Corp (10,000 Employees). Provides high-performance analytics, multi-currency compensation modeling, fast paginated search, and audit trails.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


@app.middleware("http")
async def track_request_time(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"

    # Log incoming request duration
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} "
        f"completed in {process_time_ms:.2f}ms"
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "version": "1.0.0"}
