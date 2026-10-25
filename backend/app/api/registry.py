from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.core.database import get_db
from app.services.registry_service import RegistryService
from app.models.citizen_registry import CitizenRegistryRecord

router = APIRouter(prefix="/api/registry", tags=["Government Central Identity Database"])

class VerifyDocumentPayload(BaseModel):
    document_type: str
    document_number: str
    extracted_fields: Optional[Dict[str, Any]] = None

class CreateRecordPayload(BaseModel):
    document_type: str
    document_number: str
    document_number_formatted: Optional[str] = None
    full_name: str
    dob: Optional[str] = None
    gender: Optional[str] = "MALE"
    father_or_guardian: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    blood_group: Optional[str] = None
    organ_donor: Optional[str] = "N"
    issuing_authority: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    notes: Optional[str] = None

@router.get("/records")
def list_registry_records(
    doc_type: Optional[str] = Query(None, description="Filter by document type (AADHAAR_CARD, VOTER_ID, DRIVING_LICENSE)"),
    search: Optional[str] = Query(None, description="Search by name, document number, father name, or state"),
    db: Session = Depends(get_db)
):
    """List all official citizen records in the government database with search & filter."""
    records = RegistryService.list_records(db, doc_type=doc_type, search=search)
    return {
        "total": len(records),
        "records": records
    }

@router.get("/record/{doc_number}")
def get_registry_record(doc_number: str, db: Session = Depends(get_db)):
    """Fetch an official citizen record by document number."""
    rec = RegistryService.get_record_by_number(doc_number, db)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Citizen record '{doc_number}' not found in registry.")
    return rec

@router.post("/verify")
def verify_document_endpoint(payload: VerifyDocumentPayload, db: Session = Depends(get_db)):
    """Cross-verify document details against official Government Central Database records."""
    return RegistryService.verify_document_against_database(
        doc_type=payload.document_type,
        doc_number=payload.document_number,
        extracted_fields=payload.extracted_fields,
        db=db
    )

@router.post("/seed")
def seed_defaults_endpoint(db: Session = Depends(get_db)):
    """Re-seed standard database records for Aadhaar, Voter ID, and Driving License."""
    count = RegistryService.seed_registry_defaults(db)
    return {"message": f"Database verified & seeded with official citizen records.", "total": count}

@router.post("/record")
def create_or_update_record(payload: CreateRecordPayload, db: Session = Depends(get_db)):
    """Add a new citizen identity record into the government registry database."""
    import re
    clean_num = re.sub(r'[\s\-_]', '', payload.document_number).upper()
    existing = db.query(CitizenRegistryRecord).filter(
        CitizenRegistryRecord.document_number == clean_num
    ).first()

    formatted_num = payload.document_number_formatted or payload.document_number
    if existing:
        existing.full_name = payload.full_name.upper()
        existing.dob = payload.dob
        existing.gender = payload.gender
        existing.father_or_guardian = payload.father_or_guardian
        existing.address = payload.address
        existing.state = payload.state
        existing.pin_code = payload.pin_code
        existing.issue_date = payload.issue_date
        existing.expiry_date = payload.expiry_date
        existing.blood_group = payload.blood_group
        existing.organ_donor = payload.organ_donor
        existing.issuing_authority = payload.issuing_authority
        existing.status = payload.status
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return {"message": "Record updated", "record": existing.to_dict()}
    else:
        new_rec = CitizenRegistryRecord(
            document_type=payload.document_type.upper(),
            document_number=clean_num,
            document_number_formatted=formatted_num,
            full_name=payload.full_name.upper(),
            dob=payload.dob,
            gender=payload.gender,
            father_or_guardian=payload.father_or_guardian,
            address=payload.address,
            state=payload.state,
            pin_code=payload.pin_code,
            issue_date=payload.issue_date,
            expiry_date=payload.expiry_date,
            blood_group=payload.blood_group,
            organ_donor=payload.organ_donor,
            issuing_authority=payload.issuing_authority,
            status=payload.status,
            notes=payload.notes
        )
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        return {"message": "Record created", "record": new_rec.to_dict()}
