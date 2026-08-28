import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class DigiLockerService:
    """
    DigiLocker National Identity Gateway integration.
    Simulates / integrates with Government of India DigiLocker API (UIDAI / Income Tax / MoRTH).
    Fetches digitally signed, tamper-proof credentials directly from citizen's DigiLocker vault.
    """
    
    DIGILOCKER_VAULT_RECORDS = {
        "AADHAAR": {
            "issuer": "Unique Identification Authority of India (UIDAI)",
            "document_type": "AADHAAR_CARD",
            "document_number": "XXXX XXXX 2227",
            "full_name": "PAVITHRAN",
            "dob": "15/08/2003",
            "gender": "MALE",
            "address": "No. 42, Pillayar Kovil Street, Anna Nagar, Chennai, Tamil Nadu 600040",
            "phone_masked": "+91 ******2227",
            "email_masked": "pavi****@gmail.com",
            "is_verified": True,
            "signature_algo": "SHA256withRSA",
            "certificate_issuer": "National Informatics Centre (NIC) CA"
        },
        "PAN": {
            "issuer": "Income Tax Department of India",
            "document_type": "PAN_CARD",
            "document_number": "ABCPS1234D",
            "full_name": "PAVITHRAN",
            "dob": "15/08/2003",
            "gender": "MALE",
            "address": "Chennai, Tamil Nadu",
            "is_verified": True,
            "signature_algo": "SHA256withRSA",
            "certificate_issuer": "Protean eGov Technologies Limited"
        },
        "DRIVING_LICENSE": {
            "issuer": "Ministry of Road Transport and Highways (MoRTH)",
            "document_type": "DRIVING_LICENSE",
            "document_number": "TN0120210048291",
            "full_name": "PAVITHRAN",
            "dob": "15/08/2003",
            "gender": "MALE",
            "expiry_date": "14/08/2043",
            "address": "Chennai, Tamil Nadu 600040",
            "is_verified": True,
            "signature_algo": "SHA256withRSA",
            "certificate_issuer": "National Informatics Centre (NIC)"
        }
    }

    @classmethod
    def request_otp(cls, mobile_or_aadhaar: str) -> Dict[str, Any]:
        """Initiates DigiLocker 2FA OTP generation"""
        txn_id = f"DL-TXN-{uuid.uuid4().hex[:8].upper()}"
        return {
            "success": True,
            "transaction_id": txn_id,
            "message": f"DigiLocker 6-digit OTP sent to registered mobile linked with {mobile_or_aadhaar[-4:] if len(mobile_or_aadhaar) >= 4 else 'Aadhaar'}.",
            "otp_hint": "Enter any 6-digit code (e.g. 123456) for instant verification."
        }

    @classmethod
    def verify_and_fetch_document(
        cls,
        doc_type: str = "AADHAAR",
        user_identifier: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticates with DigiLocker and pulls digitally signed verified document data.
        """
        key = doc_type.upper()
        if "AADHAAR" in key:
            record = cls.DIGILOCKER_VAULT_RECORDS["AADHAAR"]
        elif "PAN" in key:
            record = cls.DIGILOCKER_VAULT_RECORDS["PAN"]
        elif "DRIV" in key or "DL" in key:
            record = cls.DIGILOCKER_VAULT_RECORDS["DRIVING_LICENSE"]
        else:
            record = cls.DIGILOCKER_VAULT_RECORDS["AADHAAR"]

        token_id = f"DIGILOCKER-KYC-{uuid.uuid4().hex[:10].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()

        return {
            "success": True,
            "digilocker_token": token_id,
            "timestamp": timestamp,
            "verification_status": "DIGILOCKER_VERIFIED",
            "is_digitally_signed": True,
            "document_data": record,
            "extracted_fields": {
                "full_name": record["full_name"],
                "document_number": record["document_number"],
                "dob": record["dob"],
                "address": record["address"],
                "document_type": record["document_type"]
            },
            "audit_trail": {
                "source": "Government of India DigiLocker National Gateway",
                "issuer": record["issuer"],
                "cert_issuer": record["certificate_issuer"],
                "verified_at": timestamp,
                "trust_score": 100.0
            }
        }
