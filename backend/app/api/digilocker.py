from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.digilocker_service import DigiLockerService

router = APIRouter(prefix="/api/digilocker", tags=["DigiLocker Government KYC Gateway"])

class DigiLockerOTPRequest(BaseModel):
    identifier: str  # Mobile number or 12-digit Aadhaar

class DigiLockerVerifyRequest(BaseModel):
    transaction_id: str
    otp: str
    document_type: Optional[str] = "AADHAAR"
    uploaded_fields: Optional[Dict[str, Any]] = None

@router.post("/request-otp")
def generate_digilocker_otp(payload: DigiLockerOTPRequest):
    return DigiLockerService.request_otp(payload.identifier)

@router.post("/fetch-document")
def verify_and_fetch_digilocker_doc(payload: DigiLockerVerifyRequest):
    result = DigiLockerService.verify_otp_and_fetch_document(
        transaction_id=payload.transaction_id,
        otp_entered=payload.otp,
        doc_type=payload.document_type or "AADHAAR",
        uploaded_fields=payload.uploaded_fields
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "DigiLocker OTP verification failed.")
        )
    return result
