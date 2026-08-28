from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS
from app.core.database import engine, Base, SessionLocal
from app.models.blacklist_item import BlacklistItem
from app.api.screening import router as screening_router
from app.api.blacklist import router as blacklist_router
from app.api.audit import router as audit_router
from app.api.demo_samples import router as samples_router
from app.api.digilocker import router as digilocker_router

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based Fake Identity & Document Screening System",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(screening_router)
app.include_router(blacklist_router)
app.include_router(audit_router)
app.include_router(samples_router)
app.include_router(digilocker_router)

from app.models.screening_log import ScreeningLog
from datetime import datetime, timedelta, timezone

@app.on_event("startup")
def startup_event():
    """Auto-seed default Interpol watchlist alerts and initial screening logs on first launch"""
    db = SessionLocal()
    try:
        count = db.query(BlacklistItem).count()
        if count == 0:
            default_records = [
                BlacklistItem(
                    document_number="RU9901428",
                    full_name="VIKTOR KOROLKOV",
                    nationality="RUS",
                    reason="Interpol Red Notice - Transnational Financial Fraud & Forgery",
                    issuing_authority="Interpol General Secretariat",
                    severity="CRITICAL",
                    notes="Wanted under international arrest warrant #8839-2025"
                ),
                BlacklistItem(
                    document_number="AF7829104",
                    full_name="TARIQ AL-MANSOOR",
                    nationality="SYR",
                    reason="Revoked Stolen Passport - Document Compromised",
                    issuing_authority="UNHCR / National Immigration Bureau",
                    severity="CRITICAL",
                    notes="Reported stolen blank series in 2024"
                ),
                BlacklistItem(
                    document_number="UK4481029",
                    full_name="JAMES MCCALLISTER",
                    nationality="GBR",
                    reason="Suspected Visa Fraud Syndicate",
                    issuing_authority="Border Security Command",
                    severity="HIGH",
                    notes="Multiple fraudulent entry attempts logged"
                )
            ]
            db.add_all(default_records)
            db.commit()

        # Keep watchlist reference alerts
        pass
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "Cyber Sentry AI Document Screening Terminal",
        "hackathon": "Smart India Hackathon 2026",
        "problem_statement_id": "26188",
        "endpoints": {
            "docs": "/docs",
            "screen": "/api/screen/process-json",
            "samples": "/api/samples",
            "blacklist": "/api/blacklist",
            "audit": "/api/audit/logs"
        }
    }
