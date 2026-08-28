from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime, timezone
from app.core.database import Base

class ScreeningLog(Base):
    __tablename__ = "screening_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Document Meta
    document_type = Column(String(50), default="PASSPORT")
    document_number = Column(String(64), nullable=True, index=True)
    full_name = Column(String(255), nullable=True)
    nationality = Column(String(10), nullable=True)
    dob = Column(String(20), nullable=True)
    expiry_date = Column(String(20), nullable=True)
    sex = Column(String(10), nullable=True)
    
    # Risk Outcomes
    risk_level = Column(String(20), nullable=False)  # LOW, REVIEW, HIGH
    composite_risk_score = Column(Float, nullable=False) # 0 - 100
    
    # Sub-scores
    face_match_score = Column(Float, nullable=True) # 0 - 100
    tamper_score = Column(Float, nullable=True)     # 0 - 100
    mrz_valid = Column(String(10), default="PASS")  # PASS, FAIL, N/A
    blacklist_status = Column(String(20), default="CLEAN") # CLEAN, HIT
    expiry_status = Column(String(20), default="VALID")    # VALID, NEAR_EXPIRY, EXPIRED
    
    # Explainability & Visualizations
    risk_factors = Column(JSON, nullable=True) # Detailed list of reasons
    extracted_fields = Column(JSON, nullable=True)
    mrz_details = Column(JSON, nullable=True)
    
    # Officer Decision
    officer_decision = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, ESCALATED
    officer_notes = Column(Text, nullable=True)
    decision_timestamp = Column(DateTime, nullable=True)
