"""
JeevanSetu Backend — FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import (
    auth,
    emergency,
    hospital,
    credential,
    consent,
    notification,
    audit,
    admin,
    webhook,
    ai,
)

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Multilingual Emergency Response Platform",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(emergency.router, prefix="/api/emergency", tags=["Emergency"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(hospital.router, prefix="/api/hospitals", tags=["Hospitals"])
app.include_router(credential.router, prefix="/api/credentials", tags=["Credentials"])
app.include_router(consent.router, prefix="/api/consent", tags=["Consent"])
app.include_router(notification.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(webhook.router, prefix="/api/webhook", tags=["Webhooks"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
