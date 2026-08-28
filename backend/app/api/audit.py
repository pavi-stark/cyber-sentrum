from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.models.screening_log import ScreeningLog

router = APIRouter(prefix="/api/audit", tags=["Audit & Inspection Logs"])

@router.get("/logs")
def get_audit_logs(
    limit: int = 50,
    risk_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ScreeningLog).order_by(ScreeningLog.timestamp.desc())
    
    if risk_filter and risk_filter.upper() != "ALL":
        query = query.filter(ScreeningLog.risk_level == risk_filter.upper())
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (ScreeningLog.full_name.ilike(search_term)) |
            (ScreeningLog.document_number.ilike(search_term)) |
            (ScreeningLog.session_id.ilike(search_term))
        )
        
    logs = query.limit(limit).all()
    return logs

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(ScreeningLog).count()
    low_risk = db.query(ScreeningLog).filter(ScreeningLog.risk_level == "LOW").count()
    review_req = db.query(ScreeningLog).filter(ScreeningLog.risk_level == "REVIEW").count()
    high_risk = db.query(ScreeningLog).filter(ScreeningLog.risk_level == "HIGH").count()
    
    approved = db.query(ScreeningLog).filter(ScreeningLog.officer_decision == "APPROVED").count()
    rejected = db.query(ScreeningLog).filter(ScreeningLog.officer_decision == "REJECTED").count()
    pending = db.query(ScreeningLog).filter(ScreeningLog.officer_decision == "PENDING").count()
    
    # Calculate avg risk score
    avg_score_res = db.query(func.avg(ScreeningLog.composite_risk_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res else 18.5
    
    # Exact live counts from SQLite database
    verified_count = low_risk
    suspicious_count = review_req
    rejected_count = high_risk
    docs_scanned = total
    
    return {
        "total_screenings": total,
        "verified_count": verified_count,
        "suspicious_count": suspicious_count,
        "rejected_count": rejected_count,
        "documents_scanned": docs_scanned,
        "low_risk_count": low_risk,
        "review_required_count": review_req,
        "high_risk_count": high_risk,
        "approved_count": approved,
        "rejected_count": rejected,
        "pending_count": pending,
        "average_risk_score": avg_score if total > 0 else 0.0,
        "system_status": "ONLINE",
        "active_ai_models": [
            "ICAO-9303 Checksum Engine",
            "UIDAI Verhoeff Checksum",
            "Income Tax PAN Validator",
            "Error Level Forensics (ELA)",
            "Biometric Face Matching",
            "2D-FFT Moiré Anti-Spoofing"
        ]
    }

