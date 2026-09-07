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

class SMSConfigRequest(BaseModel):
    fast2sms_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

@router.post("/configure-sms")
def configure_sms_gateway(payload: SMSConfigRequest):
    import os
    if payload.fast2sms_api_key is not None:
        os.environ["FAST2SMS_API_KEY"] = payload.fast2sms_api_key.strip()
    if payload.twilio_account_sid is not None:
        os.environ["TWILIO_ACCOUNT_SID"] = payload.twilio_account_sid.strip()
    if payload.twilio_auth_token is not None:
        os.environ["TWILIO_AUTH_TOKEN"] = payload.twilio_auth_token.strip()
    if payload.twilio_phone_number is not None:
        os.environ["TWILIO_PHONE_NUMBER"] = payload.twilio_phone_number.strip()
    return {
        "success": True,
        "message": "SMS Gateway configuration updated successfully!",
        "has_fast2sms": bool(os.environ.get("FAST2SMS_API_KEY")),
        "has_twilio": bool(os.environ.get("TWILIO_ACCOUNT_SID"))
    }
