from app.services.sample_factory import SampleFactory
from app.services.ocr_mrz_service import OCRMRZService
from app.services.forensics_service import ForensicsEngine
from app.services.face_service import FaceBiometricService
from app.services.risk_service import RiskScorer

for key in ['clean_pass', 'altered_dob', 'swapped_photo', 'blacklisted', 'expired']:
    s = SampleFactory.generate_demo_case(key)
    mrz = OCRMRZService.parse_mrz(s['mrz_text'])
    ela = ForensicsEngine.analyze_document_forensics(s['doc_bytes'])
    face = FaceBiometricService.match_document_to_selfie(s['doc_bytes'], s['selfie_bytes'])
    risk = RiskScorer.calculate_composite_risk(
        mrz_data=mrz,
        forensics_data=ela,
        face_data=face,
        blacklist_hit=(key == 'blacklisted'),
        blacklist_details={'reason': 'Red Notice'} if key == 'blacklisted' else {},
        expiry_info={'status': 'EXPIRED' if key == 'expired' else 'VALID', 'expiry_date': '2024-01-12'}
    )
    rl = risk["risk_level"]
    sc = risk["composite_risk_score"]
    mv = mrz.get("valid", False)
    fm = face.get("match_score")
    print(f"CASE [{key.upper()}]: Risk={rl} (Score: {sc}) | MRZ Valid={mv} | Face Match={fm}%")
