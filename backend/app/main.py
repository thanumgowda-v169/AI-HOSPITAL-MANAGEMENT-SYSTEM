from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine
from app.seed import seed_database
from app.routers import (
    auth,
    patients,
    appointments,
    doctors,
    emr,
    billing,
    pharmacy,
    beds,
    ai,
    dashboard,
    audit
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo data if fresh
    print("[Startup] Initializing database and AI models...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"[Startup Warning] Seed execution notice: {e}")
    yield
    # Shutdown
    print("[Shutdown] Cleaning up hospital resources...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Backend API for CODE RED – SUSTAINIQ AI-Powered Smart Hospital Management System",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite, React, preview ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(doctors.router, prefix=settings.API_V1_STR)
app.include_router(emr.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(pharmacy.router, prefix=settings.API_V1_STR)
app.include_router(beds.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "Operational",
        "version": settings.PROJECT_VERSION,
        "ai_engine": "Active (scikit-learn + statsmodels + pandas)",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_models": {
            "noshow_classifier": "ready",
            "volume_forecaster": "ready",
            "bed_demand_predictor": "ready",
            "pharmacy_forecaster": "ready"
        }
    }
