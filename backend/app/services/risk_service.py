from typing import Dict, Any, List
from datetime import datetime

class RiskScorer:
    @staticmethod
    def calculate_composite_risk(
        mrz_data: Dict[str, Any],
        forensics_data: Dict[str, Any],
        face_data: Dict[str, Any],
        blacklist_hit: bool,
        blacklist_details: Dict[str, Any],
        expiry_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Combines multi-modal signals into an explainable 0-100 composite risk score.
        """
        risk_score: float = 0.0
        risk_factors: List[Dict[str, Any]] = []

        # 0. Document Template & Structural Validity Signal
        if forensics_data.get("status") == "INVALID_DOCUMENT_STRUCTURE":
            risk_score += 90.0
            risk_factors.append({
                "category": "DOCUMENT_INTEGRITY",
                "severity": "CRITICAL",
                "impact_score": 90,
                "title": "Invalid Document Structure / Non-ID Image",
                "description": "The uploaded file does not match any recognized government identity document template (Aadhaar, PAN, Passport, Voter ID, DL)."
            })

        # 1. Blacklist / Watchlist Signal (Immediate Critical Severity)
        if blacklist_hit:
            risk_score += 65.0
            risk_factors.append({
                "category": "WATCHLIST_SECURITY",
                "severity": "CRITICAL",
                "impact_score": 65,
                "title": "Blacklist Watchlist Alert",
                "description": f"Document ID matches active alert: {blacklist_details.get('reason', 'Security Watchlist Hit')} (Authority: {blacklist_details.get('issuing_authority', 'Interpol')})"
            })

        # 2. MRZ & Checksum Validity Signal
        mrz_valid = mrz_data.get("checksum_valid", True)
        if not mrz_valid:
            risk_score += 45.0
            checks = mrz_data.get("checks", {})
            failed_checks = [k.replace('_', ' ').title() for k, v in checks.items() if not v.get("valid", True)]
            fail_desc = ", ".join(failed_checks) if failed_checks else "ICAO 9303 Check Digit Failure"
            
            risk_factors.append({
                "category": "DOCUMENT_INTEGRITY",
                "severity": "HIGH",
                "impact_score": 45,
                "title": "MRZ Checksum Discrepancy",
                "description": f"Mathematical check digit mismatch: {fail_desc}. Strong indicator of altered visual text or forged document numbers."
            })
        elif mrz_data.get("success", False):
            risk_factors.append({
                "category": "DOCUMENT_INTEGRITY",
                "severity": "LOW",
                "impact_score": 0,
                "title": "MRZ Validation Verified",
                "description": "All ICAO 9303 checksums (Doc Num, DOB, Expiry, Composite) verified mathematically."
            })

        # 3. Image Forensics & Tamper Score
        tamper_score = float(forensics_data.get("tamper_score", 0.0))
        if tamper_score >= 40.0:
            impact = min(45, round(tamper_score * 0.6, 1))
            risk_score += impact
            risk_factors.append({
                "category": "IMAGE_FORENSICS",
                "severity": "HIGH",
                "impact_score": impact,
                "title": "High Digital Tamper Anomaly (ELA)",
                "description": f"Error Level Analysis identified high compression variance ({tamper_score}% anomaly). Spliced photo or text manipulation suspected."
            })
        elif tamper_score >= 20.0:
            impact = min(25, round(tamper_score * 0.4, 1))
            risk_score += impact
            risk_factors.append({
                "category": "IMAGE_FORENSICS",
                "severity": "MEDIUM",
                "impact_score": impact,
                "title": "Moderate Compression Inconsistency",
                "description": f"Minor localized variance ({tamper_score}%) detected. Officer review of photo boundaries recommended."
            })
        else:
            risk_factors.append({
                "category": "IMAGE_FORENSICS",
                "severity": "LOW",
                "impact_score": 0,
                "title": "Forensics Clear",
                "description": f"Uniform compression profile ({tamper_score}% variance). No digital splicing detected."
            })

        # 4. Biometric Face Verification (Only evaluated when live selfie is provided)
        if face_data.get("selfie_provided") is True and face_data.get("match_score") is not None:
            match_score = face_data.get("match_score")
            if match_score < 45.0:
                risk_score += 45.0
                risk_factors.append({
                    "category": "BIOMETRIC_IDENTITY",
                    "severity": "HIGH",
                    "impact_score": 45,
                    "title": "Facial Biometric Mismatch",
                    "description": f"Live face does not match document portrait (Confidence: {match_score}%). Potential identity impersonation."
                })
            elif match_score < 75.0:
                risk_score += 15.0
                risk_factors.append({
                    "category": "BIOMETRIC_IDENTITY",
                    "severity": "MEDIUM",
                    "impact_score": 15,
                    "title": "Borderline Biometric Match",
                    "description": f"Moderate facial similarity ({match_score}%). Visual confirmation by human officer recommended."
                })
            else:
                risk_factors.append({
                    "category": "BIOMETRIC_IDENTITY",
                    "severity": "LOW",
                    "impact_score": 0,
                    "title": "Biometrics Verified",
                    "description": f"Strong facial consistency ({match_score}%) between passenger and document photo."
                })
        
            # Liveness / Anti-spoofing
            liveness = face_data.get("liveness", {})
            if liveness and liveness.get("status") == "POTENTIAL_SPOOF":
                risk_score += 25.0
                risk_factors.append({
                    "category": "ANTI_SPOOFING",
                    "severity": "HIGH",
                    "impact_score": 25,
                    "title": "Live Camera Spoof Suspected",
                    "description": liveness.get("description", "High-frequency Moiré grid detected, indicating potential smartphone/screen replay.")
                })

        # 5. Expiry Validity Status
        exp_status = expiry_info.get("status", "VALID")
        if exp_status == "EXPIRED":
            risk_score += 35.0
            risk_factors.append({
                "category": "DOCUMENT_VALIDITY",
                "severity": "MEDIUM",
                "impact_score": 35,
                "title": "Document Expired",
                "description": f"Document expired on {expiry_info.get('expiry_date', 'N/A')}. Ineligible for travel without visa extension."
            })
        elif exp_status == "NEAR_EXPIRY":
            risk_score += 15.0
            risk_factors.append({
                "category": "DOCUMENT_VALIDITY",
                "severity": "LOW",
                "impact_score": 15,
                "title": "Near Expiration Warning",
                "description": "Document expires in less than 6 months. May breach 6-month validity rule for certain destinations."
            })

        # Cap composite score at 100
        composite_score = round(min(100.0, max(0.0, risk_score)), 1)

        # Determine final decision bracket
        if composite_score <= 25.0 and not blacklist_hit and mrz_valid:
            risk_level = "LOW"
            recommendation = "CLEAR_PASS"
            summary = "All automated integrity, biometric, and security checks passed. Safe for expedited clearance."
        elif composite_score <= 60.0 and not blacklist_hit:
            risk_level = "REVIEW"
            recommendation = "OFFICER_REVIEW"
            summary = "Screening identified borderline signals or minor anomalies. Manual inspection required before clearance."
        else:
            risk_level = "HIGH"
            recommendation = "HOLD_AND_ESCALATE"
            summary = "Critical security triggers or forgery indicators detected. Intercept passenger and escalate to secondary inspection."

        return {
            "composite_risk_score": composite_score,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "summary": summary,
            "risk_factors": risk_factors
        }
