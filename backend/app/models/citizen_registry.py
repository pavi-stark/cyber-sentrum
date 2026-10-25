from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class CitizenRegistryRecord(Base):
    """
    Official Government Central Identity Database Record.
    Used to cross-verify extracted details against authoritative government records:
    - UIDAI Central Identities Data Repository (CIDR)
    - ECI National Electoral Roll (EPIC Database)
    - MoRTH SARATHI / VAHAN National Driving License Register
    """
    __tablename__ = "citizen_registry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_type = Column(String(50), nullable=False, index=True) # AADHAAR_CARD, VOTER_ID, DRIVING_LICENSE
    document_number = Column(String(50), nullable=False, unique=True, index=True) # Clean unspaced & uppercase
    document_number_formatted = Column(String(50), nullable=False) # Formatted (e.g. 4078 7264 6921)
    full_name = Column(String(150), nullable=False, index=True)
    dob = Column(String(50), nullable=True) # Normalized DD/MM/YYYY or DD-MM-YYYY
    gender = Column(String(20), nullable=True) # MALE, FEMALE, OTHER
    father_or_guardian = Column(String(150), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    pin_code = Column(String(20), nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    blood_group = Column(String(10), nullable=True)
    organ_donor = Column(String(5), nullable=True)
    issuing_authority = Column(String(150), nullable=True)
    status = Column(String(30), default="ACTIVE", index=True) # ACTIVE, SUSPENDED, REVOKED, FLAGGED
    is_genuine = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def is_active(self):
        return self.status == "ACTIVE"

    def to_dict(self):
        return {
            "id": self.id,
            "document_type": self.document_type,
            "document_number": self.document_number,
            "document_number_formatted": self.document_number_formatted,
            "full_name": self.full_name,
            "dob": self.dob,
            "gender": self.gender,
            "father_or_guardian": self.father_or_guardian,
            "address": self.address,
            "state": self.state,
            "pin_code": self.pin_code,
            "issue_date": self.issue_date,
            "expiry_date": self.expiry_date,
            "blood_group": self.blood_group,
            "organ_donor": self.organ_donor,
            "issuing_authority": self.issuing_authority,
            "status": self.status,
            "is_active": self.status == "ACTIVE",
            "is_genuine": self.is_genuine,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
