from fastapi import APIRouter, HTTPException
from app.services.sample_factory import SampleFactory

router = APIRouter(prefix="/api/samples", tags=["Demo Test Samples"])

SAMPLE_CATALOG = [
    {
        "key": "aadhaar_dilip",
        "name": "Structure 1: UIDAI Aadhaar Card (Dilip Mehti)",
        "description": "Authentic e-Aadhaar sheet structure with UIDAI header, 12-digit number (4078 7264 6921), and confirmed database record.",
        "expected_risk": "LOW",
        "document_type": "AADHAAR_CARD",
        "category": "Approved Structure 1"
    },
    {
        "key": "voter_epic",
        "name": "Structure 2: ECI Voter ID (Subhash Chandra Roy)",
        "description": "Authentic ECI Elector Photo Identity Card structure with top barcode (FSZ2007891) and confirmed electoral roll registry.",
        "expected_risk": "LOW",
        "document_type": "VOTER_ID",
        "category": "Approved Structure 2"
    },
    {
        "key": "dl_bhaskar",
        "name": "Structure 3: Indian Union Driving Licence (Bhaskar Adhikary)",
        "description": "Authentic Indian Union Driving Licence smart card structure (WB23 20150223071) with EMV chip and confirmed SARATHI registry.",
        "expected_risk": "LOW",
        "document_type": "DRIVING_LICENSE",
        "category": "Approved Structure 3"
    },
    {
        "key": "dl_mismatch",
        "name": "Fraud Case 4: Name Altered vs Database Record",
        "description": "Driving Licence where applicant name has been digitally forged. Triggers RECORD_MISMATCH against government registry.",
        "expected_risk": "HIGH",
        "document_type": "DRIVING_LICENSE",
        "category": "Registry Mismatch"
    },
    {
        "key": "fake_unregistered",
        "name": "Fraud Case 5: Unregistered Credential (Not in Database)",
        "description": "Counterfeit card with non-existent document number. Triggers NOT_FOUND_IN_REGISTRY alert.",
        "expected_risk": "HIGH",
        "document_type": "DRIVING_LICENSE",
        "category": "Database Alert"
    },
    {
        "key": "rejected_structure",
        "name": "Rejection Case 6: Unsupported Document Structure",
        "description": "Non-approved format / non-document image. Triggers immediate DOCUMENT_STRUCTURE_REJECTED.",
        "expected_risk": "HIGH",
        "document_type": "REJECTED",
        "category": "Structure Rejection"
    },
    {
        "key": "clean_pass",
        "name": "Standard Genuine Passport",
        "description": "Legitimate passport with matching biometric live face and valid ICAO 9303 checksums.",
        "expected_risk": "LOW",
        "document_type": "PASSPORT",
        "category": "Legacy Test"
    },
    {
        "key": "aadhaar_tampered",
        "name": "Forged Aadhaar (Verhoeff Failed)",
        "description": "Tampered Aadhaar with invalid check digit (Verhoeff Checksum Failure) & photo splicing.",
        "expected_risk": "HIGH",
        "document_type": "AADHAAR_CARD",
        "category": "Legacy Test"
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
