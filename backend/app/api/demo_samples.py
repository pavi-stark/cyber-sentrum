from fastapi import APIRouter, HTTPException
from app.services.sample_factory import SampleFactory

router = APIRouter(prefix="/api/samples", tags=["Demo Test Samples"])

SAMPLE_CATALOG = [
    {
        "key": "clean_pass",
        "name": "Case 1: Standard Genuine Passport",
        "description": "Legitimate passport with matching biometric live face and valid ICAO 9303 checksums.",
        "expected_risk": "LOW",
        "document_type": "PASSPORT",
        "category": "Passport"
    },
    {
        "key": "altered_dob",
        "name": "Case 2: Forged / Spliced DOB",
        "description": "Visual Date of Birth altered digitally. Triggers MRZ Checksum discrepancy & high ELA tamper anomaly.",
        "expected_risk": "HIGH",
        "document_type": "PASSPORT",
        "category": "Passport"
    },
    {
        "key": "swapped_photo",
        "name": "Case 3: Photo Swapped Impersonator",
        "description": "Passport portrait replaced with an impostor. Triggers Biometric Facial Mismatch & frame splicing artifacts.",
        "expected_risk": "HIGH",
        "document_type": "PASSPORT",
        "category": "Passport"
    },
    {
        "key": "aadhaar_valid",
        "name": "Case 4: Genuine Aadhaar Card",
        "description": "Valid 12-digit Indian Aadhaar number verified with UIDAI Verhoeff Checksum Algorithm.",
        "expected_risk": "LOW",
        "document_type": "AADHAAR_CARD",
        "category": "National ID"
    },
    {
        "key": "aadhaar_tampered",
        "name": "Case 5: Forged Aadhaar (Verhoeff Failed)",
        "description": "Tampered Aadhaar with invalid check digit (Verhoeff Checksum Failure) & photo splicing.",
        "expected_risk": "HIGH",
        "document_type": "AADHAAR_CARD",
        "category": "National ID"
    },
    {
        "key": "pan_valid",
        "name": "Case 6: Genuine PAN Card",
        "description": "Valid 10-character PAN structure with 'P' entity type and matching surname initial.",
        "expected_risk": "LOW",
        "document_type": "PAN_CARD",
        "category": "National ID"
    },
    {
        "key": "pan_forged",
        "name": "Case 7: Forged PAN Card",
        "description": "PAN card with invalid entity code and surname mismatch.",
        "expected_risk": "HIGH",
        "document_type": "PAN_CARD",
        "category": "National ID"
    },
    {
        "key": "visa_valid",
        "name": "Case 8: Valid Multiple-Entry Visa",
        "description": "Legitimate consular visa sticker with verified MRZ and entry stamp.",
        "expected_risk": "LOW",
        "document_type": "VISA_STICKER",
        "category": "Visa"
    },
    {
        "key": "blacklisted",
        "name": "Case 9: Interpol Red Notice Wanted",
        "description": "Passport matches an active high-priority Interpol security watchlist alert for transnational fraud.",
        "expected_risk": "HIGH",
        "document_type": "PASSPORT",
        "category": "Watchlist Alert"
    },
    {
        "key": "expired",
        "name": "Case 10: Expired Travel Document",
        "description": "Document expired past valid travel window. Flagged for officer exception handling.",
        "expected_risk": "REVIEW",
        "document_type": "PASSPORT",
        "category": "Validity Check"
    }
]

@router.get("")
def get_sample_catalog():
    return SAMPLE_CATALOG

@router.get("/{case_key}")
def get_sample_data(case_key: str):
    valid_keys = [s["key"] for s in SAMPLE_CATALOG]
    if case_key not in valid_keys:
        raise HTTPException(status_code=404, detail="Invalid demo sample key")
    
    sample = SampleFactory.generate_demo_case(case_key)
    return {
        "key": sample["key"],
        "title": sample["title"],
        "document_type": sample.get("document_type", "PASSPORT"),
        "expected_outcome": sample["expected_outcome"],
        "mrz_text": sample["mrz_text"],
        "extracted_fields": sample.get("extracted_fields", {}),
        "doc_image_base64": sample["doc_image_base64"],
        "selfie_image_base64": sample["selfie_image_base64"]
    }
