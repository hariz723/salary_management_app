from fastapi import APIRouter
from app.api.v1.endpoints import employees, salaries, analytics, metadata, import_export, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(salaries.router, prefix="/salaries", tags=["Salaries"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(metadata.router, prefix="/metadata", tags=["Metadata"])
api_router.include_router(import_export.router, prefix="/data", tags=["Import & Export"])
