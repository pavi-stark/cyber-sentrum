from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.digilocker_service import DigiLockerService

router = APIRouter(prefix="/api/digilocker", tags=["DigiLocker Government KYC Gateway"])

class DigiLockerOTPRequest(BaseModel):
    identifier: str  # Mobile number or 12-digit Aadhaar

class DigiLockerVerifyRequest(BaseModel):
    transaction_id: str
    otp: str
    document_type: Optional[str] = "AADHAAR"

@router.post("/request-otp")
def generate_digilocker_otp(payload: DigiLockerOTPRequest):
    return DigiLockerService.request_otp(payload.identifier)

@router.post("/fetch-document")
def verify_and_fetch_digilocker_doc(payload: DigiLockerVerifyRequest):
    return DigiLockerService.verify_and_fetch_document(payload.document_type)
