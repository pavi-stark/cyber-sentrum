from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from datetime import datetime, timezone
from app.core.database import Base

class BlacklistItem(Base):
    __tablename__ = "blacklist_items"

    id = Column(Integer, primary_key=True, index=True)
    document_number = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    nationality = Column(String(10), nullable=True)
    reason = Column(String(255), nullable=False)
    issuing_authority = Column(String(100), default="Interpol / National Security")
    severity = Column(String(20), default="CRITICAL")  # CRITICAL, HIGH, SUSPECT
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
