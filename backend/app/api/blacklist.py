from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.blacklist_item import BlacklistItem

router = APIRouter(prefix="/api/blacklist", tags=["Blacklist Watchlist"])

class BlacklistItemCreate(BaseModel):
    document_number: str
    full_name: str
    nationality: Optional[str] = "N/A"
    reason: str
    issuing_authority: Optional[str] = "Interpol / National Security"
    severity: Optional[str] = "CRITICAL"
    notes: Optional[str] = None

class BlacklistItemResponse(BaseModel):
    id: int
    document_number: str
    full_name: str
    nationality: Optional[str]
    reason: str
    issuing_authority: str
    severity: str
    is_active: bool
    notes: Optional[str]

    class Config:
        from_attributes = True

@router.get("", response_model=List[BlacklistItemResponse])
def get_all_blacklist(db: Session = Depends(get_db)):
    return db.query(BlacklistItem).filter(BlacklistItem.is_active == True).all()

@router.post("", response_model=BlacklistItemResponse)
def add_blacklist_entry(item: BlacklistItemCreate, db: Session = Depends(get_db)):
    existing = db.query(BlacklistItem).filter(
        BlacklistItem.document_number == item.document_number.upper().strip()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Document number already in watchlist")
    
    new_item = BlacklistItem(
        document_number=item.document_number.upper().strip(),
        full_name=item.full_name,
        nationality=item.nationality.upper() if item.nationality else "N/A",
        reason=item.reason,
        issuing_authority=item.issuing_authority,
        severity=item.severity,
        notes=item.notes
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/{item_id}")
def delete_blacklist_entry(item_id: int, db: Session = Depends(get_db)):
    item = db.query(BlacklistItem).filter(BlacklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(item)
    db.commit()
    return {"success": True, "message": "Entry removed from watchlist"}

@router.post("/seed")
def seed_default_watchlist(db: Session = Depends(get_db)):
    """Pre-populates the watchlist with realistic mock alerts for testing."""
    default_records = [
        {
            "document_number": "RU9901428",
            "full_name": "VIKTOR KOROLKOV",
            "nationality": "RUS",
            "reason": "Interpol Red Notice - Transnational Financial Fraud & Forgery",
            "issuing_authority": "Interpol General Secretariat",
            "severity": "CRITICAL",
            "notes": "Wanted under international arrest warrant #8839-2025"
        },
        {
            "document_number": "AF7829104",
            "full_name": "TARIQ AL-MANSOOR",
            "nationality": "SYR",
            "reason": "Revoked Stolen Passport - Document Reported Compromised",
            "issuing_authority": "UNHCR / National Immigration Bureau",
            "severity": "CRITICAL",
            "notes": "Original blank stolen in 2024 transit"
        },
        {
            "document_number": "UK4481029",
            "full_name": "JAMES MCCALLISTER",
            "nationality": "GBR",
            "reason": "Suspected Visa Fraud Ring Operator",
            "issuing_authority": "Border Security Command",
            "severity": "HIGH",
            "notes": "Multiple fraudulent entry attempts logged"
        }
    ]
    
    added = 0
    for rec in default_records:
        if not db.query(BlacklistItem).filter(BlacklistItem.document_number == rec["document_number"]).first():
            item = BlacklistItem(**rec)
            db.add(item)
            added += 1
    db.commit()
    return {"success": True, "seeded_count": added}
