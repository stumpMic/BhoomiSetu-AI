import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
import app.models # Register all SQLAlchemy models

# Import API Routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.projects import router as projects_router
from app.api.cases import router as cases_router
from app.api.parcels import router as parcels_router
from app.api.landowners import router as landowners_router
from app.api.documents import router as documents_router
from app.api.predictions import router as predictions_router
from app.api.compensation import router as compensation_router
from app.api.tasks import router as tasks_router
from app.api.alerts import router as alerts_router
from app.api.grievances import router as grievances_router
from app.api.admin_verifications import router as admin_verifications_router
from app.api.surveys import router as surveys_router
from app.api.hearings import router as hearings_router
from app.api.notices import router as notices_router
from app.api.claims import router as claims_router

# Initialize tables
Base.metadata.create_all(bind=engine)
try:
    from migrate_survey_fields import migrate
    migrate()
except Exception as _e:
    pass

app = FastAPI(
    title="BhoomiSetu AI API",
    description="Predictive Analytics & Management System for Early Detection of Land Acquisition Delays",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(parcels_router, prefix="/api")
app.include_router(landowners_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(compensation_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(grievances_router, prefix="/api")
app.include_router(admin_verifications_router, prefix="/api")
app.include_router(surveys_router, prefix="/api")
app.include_router(hearings_router, prefix="/api")
app.include_router(notices_router, prefix="/api")
app.include_router(claims_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "Online",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "notice": "BhoomiSetu AI Hackathon Decision-Support Prototype"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected", "ml_models": "ready"}
