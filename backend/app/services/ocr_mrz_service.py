import re
import os
import cv2
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

# ─────────────────────────────────────────────────────────────────
# Document type constants
# ─────────────────────────────────────────────────────────────────
DOC_TYPES = {
    "AADHAAR_CARD":    "Aadhaar Card (UIDAI)",
    "PAN_CARD":        "PAN Card (Income Tax Dept)",
    "PASSPORT":        "Passport (ICAO)",
    "DRIVING_LICENSE": "Driving License (MoRTH)",
    "VOTER_ID":        "Voter ID / EPIC (ECI)",
    "VISA":            "Visa Sticker (Immigration)",
}

def _configure_pytesseract() -> bool:
    """Detect and configure Tesseract executable on Windows or Linux."""
    try:
        import pytesseract
        import shutil
        if shutil.which("tesseract"):
            return True
        for p in [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
        ]:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                return True
        return False
    except Exception:
        return False

class ICAO9303Validator:
    """
    Implements ICAO Doc 9303 specification for Machine Readable Travel Documents (MRTD).
    Performs standard 7-3-1 weight check digit verification.
    """
    WEIGHTS = [7, 3, 1]

    @classmethod
    def char_to_value(cls, ch: str) -> int:
        if ch.isdigit():
            return int(ch)
        elif ch.isalpha():
            return ord(ch.upper()) - ord('A') + 10
        elif ch == '<':
            return 0
        return 0

    @classmethod
    def calculate_check_digit(cls, data_str: str) -> int:
        total = 0
        for i, ch in enumerate(data_str):
            val = cls.char_to_value(ch)
            weight = cls.WEIGHTS[i % 3]
            total += val * weight
        return total % 10

    @classmethod
    def verify_check_digit(cls, data_str: str, expected_digit: str) -> bool:
        if not expected_digit.isdigit():
            return False
        calculated = cls.calculate_check_digit(data_str)
        return calculated == int(expected_digit)


class OCRMRZService:

    # ─────────────────────────────────────────────────────────────
    # 1.  Detect and Validate Approved Document Structures
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def _scan_qr_robust(img_bgr: np.ndarray) -> Optional[str]:
        """
        Multi-pass QR and Barcode scanner using zxingcpp + OpenCV.
        Handles full A4 letters, photocopies, screenshots, and high-res document scans.
        """
        if img_bgr is None or img_bgr.size == 0:
            return None

        # 1. ZXing-C++ direct pass (World-class native QR / barcode engine)
        try:
            import zxingcpp
            results = zxingcpp.read_barcodes(img_bgr)
            for r in results:
                if r.text and len(r.text.strip()) > 5:
                    return r.text.strip()
        except Exception:
            pass

        detector = cv2.QRCodeDetector()

        # 2. OpenCV direct pass
        try:
            qr_data, _, _ = detector.detectAndDecode(img_bgr)
            if qr_data and len(qr_data.strip()) > 5:
                return qr_data.strip()
        except Exception:
            pass

        # 3. Grayscale Otsu thresholding with ZXing
        try:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            try:
                import zxingcpp
                results = zxingcpp.read_barcodes(thresh)
                for r in results:
                    if r.text and len(r.text.strip()) > 5:
                        return r.text.strip()
            except Exception:
                pass

            qr_data, _, _ = detector.detectAndDecode(thresh)
            if qr_data and len(qr_data.strip()) > 5:
                return qr_data.strip()
        except Exception:
            pass

        # 4. Regional crop scanning (for Aadhaar A4 xerox / letters / cards)
        h, w = img_bgr.shape[:2]
        crops = [
            img_bgr[int(h * 0.25):int(h * 0.75), int(w * 0.35):],  # Middle-right (Aadhaar letter QR)
            img_bgr[int(h * 0.55):, int(w * 0.35):],               # Bottom-right (Aadhaar cut-out card QR)
            img_bgr[int(h * 0.50):, :],                            # Bottom half
            img_bgr[:, int(w * 0.40):],                            # Right half
            img_bgr[:int(h * 0.50), int(w * 0.40):],               # Top-right
        ]

        for c in crops:
            if c.size == 0:
                continue
            try:
                try:
                    import zxingcpp
                    results = zxingcpp.read_barcodes(c)
                    for r in results:
                        if r.text and len(r.text.strip()) > 5:
                            return r.text.strip()
                except Exception:
                    pass

                d, _, _ = detector.detectAndDecode(c)
                if d and len(d.strip()) > 5:
                    return d.strip()

                # Try 2x upscale
                ch, cw = c.shape[:2]
                if 80 < ch < 1200 and 80 < cw < 1200:
                    c_up = cv2.resize(c, (cw * 2, ch * 2), interpolation=cv2.INTER_CUBIC)
                    try:
                        import zxingcpp
                        results = zxingcpp.read_barcodes(c_up)
                        for r in results:
                            if r.text and len(r.text.strip()) > 5:
                                return r.text.strip()
                    except Exception:
                        pass

                    d, _, _ = detector.detectAndDecode(c_up)
                    if d and len(d.strip()) > 5:
                        return d.strip()
            except Exception:
                continue

        return None

    # ─────────────────────────────────────────────────────────────
    # 1.  Detect and Validate Approved Document Structures
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def _detect_certificate_or_non_id(ocr_text: str) -> Tuple[bool, str]:
        """
        Detects if the text matches an academic degree, course certificate, award,
        participation certificate, invoice, or non-identity document.
        """
        if not ocr_text:
            return False, ""

        upper = ocr_text.upper()

        # Keywords strongly indicating an academic or award certificate
        cert_terms = [
            "CERTIFICATE OF", "CERTIFICATE", "CERTIFY THAT", "THIS IS TO CERTIFY",
            "PROUDLY PRESENTED TO", "AWARDED TO", "PRESENTED TO", "SUCCESSFULLY COMPLETED",
            "COMPLETION OF", "FOR PARTICIPATION", "PARTICIPATED IN", "IN APPRECIATION OF",
            "CERTIFICATE OF MERIT", "CERTIFICATE OF APPRECIATION", "CERTIFICATE OF ACHIEVEMENT",
            "DIPLOMA IN", "BACHELOR OF", "MASTER OF", "DEGREE OF", "ACADEMIC YEAR",
            "SEMINAR ON", "WORKSHOP ON", "TRAINING PROGRAMME", "FACULTY OF",
            "COURSE COMPLETION", "STUDENT ID", "GRADE SHEET", "TRANSCRIPT OF",
            "MARKSHEET", "HEAD OF DEPARTMENT", "PRINCIPAL SIGNATURE",
            "TAX INVOICE", "COMMERCIAL INVOICE", "BILL OF SUPPLY", "ESTIMATE / QUOTATION"
        ]

        found_terms = [t for t in cert_terms if t in upper]

        # Government ID Authority keywords that legitimately appear on genuine government credentials
        govt_id_authorities = [
            "UNIQUE IDENTIFICATION AUTHORITY", "UIDAI",
            "ELECTION COMMISSION OF INDIA", "ELECTOR PHOTO IDENTITY",
            "MINISTRY OF ROAD TRANSPORT", "UNION DRIVING LICENCE",
            "STATE TRANSPORT DEPARTMENT", "MOTOR VEHICLES ACT",
            "INCOME TAX DEPARTMENT", "PERMANENT ACCOUNT NUMBER",
            "REPUBLIC OF INDIA PASSPORT"
        ]
        has_govt_id_authority = any(ga in upper for ga in govt_id_authorities)

        if found_terms and not has_govt_id_authority:
            terms_str = ", ".join(found_terms[:3])
            return True, f"DOCUMENT_REJECTED: File contains certificate or non-identity markers ({terms_str}). Government identity screening strictly requires an Aadhaar Card, Voter ID, or Driving License."

        return False, ""

    @staticmethod
    def _detect_structure_features(img_bgr: np.ndarray) -> Tuple[Optional[str], float, str]:
        """
        Strictly validates if the image matches one of the 3 approved government document structures:
        1. AADHAAR_CARD (UIDAI e-Aadhaar A4 portrait or PVC card)
        2. VOTER_ID (ECI EPIC portrait card with top barcode and photo frame)
        3. DRIVING_LICENSE (Indian Union Driving Licence smart card)

        NEVER classifies arbitrary certificates or unrelated images based purely on aspect ratio or color!
        """
        if img_bgr is None or img_bgr.size == 0:
            return None, 0.0, "Invalid image data"

        h, w = img_bgr.shape[:2]
        aspect = float(w) / float(h)

        # Step A: Perform optical text recognition
        ocr_text = OCRMRZService._ocr_image_text(img_bgr).upper()

        # Step B: Check if document is an academic certificate, diploma, or non-identity document
        is_cert, cert_reason = OCRMRZService._detect_certificate_or_non_id(ocr_text)
        if is_cert:
            return None, 0.0, cert_reason

        # Step C: Check 1 - Indian Union Driving Licence (Requires real DL text markers or standard DL format)
        dl_kw = [
            "DRIVING LICEN", "UNION DRIVING", "MOTOR VEHICLE", "AUTHORISATION TO DRIVE",
            "FORM 7", "TRANSPORT DEPARTMENT", "LICENSING AUTHORITY", "SARATHI",
            "PARIVAHAN", "DL NO", "D.L. NO"
        ]
        has_dl_kw = any(kw in ocr_text for kw in dl_kw)
        has_dl_regex = bool(
            re.search(r'\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7}\b', ocr_text) or
            re.search(r'\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b', ocr_text)
        )

        if has_dl_kw or has_dl_regex:
            return "DRIVING_LICENSE", 0.98, "Approved Structure: Indian Union Driving Licence (MoRTH Smart Card Template)"

        # Step D: Check 2 - Voter ID / EPIC (Requires ECI / EPIC text markers or valid EPIC number)
        voter_kw = [
            "ELECTION COMMISSION OF INDIA", "ELECTOR PHOTO", "EPIC NO", "EPIC",
            "BHARAT NIRVACHAN", "NIRVACHAN SADAN"
        ]
        has_voter_kw = any(kw in ocr_text for kw in voter_kw)
        has_epic_regex = bool(re.search(r'\b[A-Z]{3}[0-9]{7}\b', ocr_text))

        if has_voter_kw or has_epic_regex:
            return "VOTER_ID", 0.98, "Approved Structure: ECI Elector Photo Identity Card (EPIC Template)"

        # Step E: Check 3 - UIDAI Aadhaar Card (Requires UIDAI / Aadhaar text markers or 12-digit UID)
        aadhaar_kw = [
            "AADHAAR", "UIDAI", "UNIQUE IDENTIFICATION", "MERA AADHAAR",
            "MERI PEHCHAN", "BHARAT SARKAR", "ENROLMENT NO", "ENROLLMENT NO", "GOVERNMENT OF INDIA"
        ]
        has_aadhaar_kw = any(kw in ocr_text for kw in aadhaar_kw)
        has_uid_regex = bool(
            re.search(r'\b\d{4}\s\d{4}\s\d{4}\b', ocr_text) or
            re.search(r'\b[Xx\d]{4}\s[Xx\d]{4}\s\d{4}\b', ocr_text)
        )

        if has_aadhaar_kw or has_uid_regex:
            return "AADHAAR_CARD", 0.98, "Approved Structure: UIDAI Aadhaar Card (e-Aadhaar / Official Template)"

        # Step F: Check 4 - Passport / Visa / PAN Credentials
        if "PASSPORT" in ocr_text or "PASSEPORT" in ocr_text or "P<" in ocr_text:
            return "PASSPORT", 0.98, "Approved Structure: ICAO Doc 9303 Machine Readable Travel Document (Passport)"

        if ("VISA" in ocr_text and "STICKER" in ocr_text) or "V<" in ocr_text:
            return "VISA", 0.95, "Approved Structure: International Visa Sticker"

        if "INCOME TAX DEPARTMENT" in ocr_text or "PERMANENT ACCOUNT NUMBER" in ocr_text or bool(re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', ocr_text)):
            return "PAN_CARD", 0.95, "Approved Structure: Income Tax PAN Card"

        return None, 0.0, "DOCUMENT_STRUCTURE_REJECTED: Uploaded file does not conform to approved UIDAI Aadhaar Card, ECI Voter ID, or MoRTH Driving Licence structures."

    @staticmethod
    def detect_document_type(image_bytes: bytes) -> Dict[str, Any]:
        """
        Auto-detects whether the uploaded image matches one of the 3 accepted document structures.
        """
        try:
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"detected_type": None, "confidence": "NONE", "reason": "Invalid image", "detected": False}

            # QR Code Check
            qr_data = OCRMRZService._scan_qr_robust(img)
            if qr_data and len(qr_data.strip()) > 5:
                qr = qr_data.strip()

                # UIDAI Aadhaar QR check: Must be XML PrintLetterBarcodeData, or uid= attribute, or large compressed integer
                is_uidai_qr = (
                    "PrintLetterBarcodeData" in qr or
                    bool(re.search(r'\buid=["\']?\d{12}["\']?', qr, re.IGNORECASE)) or
                    (qr.isdigit() and len(qr) > 80)
                )
                if is_uidai_qr:
                    return {"detected_type": "AADHAAR_CARD", "confidence": "HIGH",
                            "reason": "QR code contains verified UIDAI Aadhaar data", "detected": True,
                            "qr_data": qr}

                # Voter ID QR / Barcode check: Must contain EPIC or 3-letter + 7-digit EPIC ID
                if "EPIC" in qr.upper() or bool(re.search(r'\b[A-Z]{3}[0-9]{7}\b', qr)):
                    return {"detected_type": "VOTER_ID", "confidence": "HIGH",
                            "reason": "QR code contains verified EPIC Voter ID data", "detected": True,
                            "qr_data": qr}

                # Driving License QR check: Must have MoRTH / DL keywords or standard DL format
                if ("DRIVING" in qr.upper() or "SARATHI" in qr.upper() or "MORTH" in qr.upper() or
                        bool(re.search(r'\b[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}\b', qr))):
                    return {"detected_type": "DRIVING_LICENSE", "confidence": "HIGH",
                            "reason": "QR code contains verified Driving License data", "detected": True,
                            "qr_data": qr}

            # Structure detection
            doc_type, conf, reason = OCRMRZService._detect_structure_features(img)
            if doc_type:
                return {
                    "detected_type": doc_type,
                    "confidence": "HIGH" if conf >= 0.9 else "MEDIUM",
                    "reason": reason,
                    "detected": True
                }

            return {
                "detected_type": None,
                "confidence": "NONE",
                "reason": reason or "UNSUPPORTED_STRUCTURE: Uploaded document does not match approved Aadhaar, Voter ID, or Driving License structures.",
                "detected": False
            }

        except Exception as e:
            return {"detected_type": None, "confidence": "NONE",
                    "reason": f"Detection error: {str(e)}", "detected": False}

    # ─────────────────────────────────────────────────────────────
    # 2.  Validate document structure (strictly reject non-matching structures)
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def validate_document_structure(img_bgr: np.ndarray) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates whether the image matches ONE of the 3 approved government document structures:
        - Aadhaar Card (UIDAI)
        - Voter ID (ECI EPIC)
        - Indian Union Driving Licence (MoRTH)
        Rejects all non-matching structures, non-document graphics, and invalid credential templates.
        """
        try:
            doc_type, conf, reason = OCRMRZService._detect_structure_features(img_bgr)
            if doc_type in ("AADHAAR_CARD", "VOTER_ID", "DRIVING_LICENSE", "PASSPORT", "VISA", "PAN_CARD"):
                return True, "VALID_APPROVED_STRUCTURE", {
                    "matched_structure": doc_type,
                    "confidence": conf,
                    "details": reason
                }

            return False, "DOCUMENT_STRUCTURE_REJECTED", {
                "reason": (
                    "Document structure rejected. This screening system strictly accepts only the 3 approved "
                    "Indian Government identity structures: 1) UIDAI Aadhaar Card, 2) ECI Voter ID (EPIC), "
                    "and 3) Indian Union Driving Licence. The uploaded image does not conform to any of these."
                ),
                "accepted_structures": ["AADHAAR_CARD", "VOTER_ID", "DRIVING_LICENSE"]
            }
        except Exception as e:
            return False, "DOCUMENT_STRUCTURE_REJECTED", {"reason": f"Structure validation error: {str(e)}"}

    # ─────────────────────────────────────────────────────────────
    # 3.  Extract document fields per document type from QR + image
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def extract_document_fields(image_bytes: bytes) -> Dict[str, Any]:
        """
        Main extraction entry point called by /api/screen/ocr-extract.
        Auto-detects document type from the image, then extracts the
        appropriate fields for THAT specific document type.
        Returns structured fields + the detected document type.
        """
        try:
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {
                    "success": False,
                    "is_valid_document": False,
                    "error": "Invalid image data – could not decode image",
                    "extracted_fields": {},
                    "detected_document_type": None
                }

            # Step 1: Validate document structure strictly (Only 3 structures accepted)
            is_valid_structure, template_code, template_info = OCRMRZService.validate_document_structure(img)
            if not is_valid_structure:
                return {
                    "success": False,
                    "is_valid_document": False,
                    "error": "DOCUMENT_STRUCTURE_REJECTED: The uploaded file does not match any of the 3 approved document structures (UIDAI Aadhaar Card, ECI Voter ID, or Indian Union Driving Licence).",
                    "extracted_fields": {},
                    "detected_document_type": None,
                    "accepted_structures": ["AADHAAR_CARD", "VOTER_ID", "DRIVING_LICENSE"]
                }

            # Step 2: Detect document type
            detection = OCRMRZService.detect_document_type(image_bytes)
            detected_type = detection.get("detected_type")
            qr_raw = detection.get("qr_data", "")

            if not detection.get("detected") or detected_type not in ("AADHAAR_CARD", "VOTER_ID", "DRIVING_LICENSE"):
                return {
                    "success": False,
                    "is_valid_document": False,
                    "error": "DOCUMENT_STRUCTURE_REJECTED: The uploaded image is not a recognized approved Government Identity document (Only Aadhaar, Voter ID, and Driving License are accepted).",
                    "extracted_fields": {},
                    "detected_document_type": None,
                    "accepted_structures": ["AADHAAR_CARD", "VOTER_ID", "DRIVING_LICENSE"]
                }

            # Step 3: Extract type-specific fields
            if detected_type == "AADHAAR_CARD":
                fields = OCRMRZService._extract_aadhaar_fields(qr_raw, img=img)
            elif detected_type == "VOTER_ID":
                fields = OCRMRZService._extract_voter_id_fields(qr_raw, img=img)
            elif detected_type == "DRIVING_LICENSE":
                fields = OCRMRZService._extract_dl_fields(qr_raw, img=img)
            else:
                fields = {}

            fields["document_type"] = detected_type

            return {
                "success": True,
                "is_valid_document": True,
                "detected_document_type": detected_type,
                "detection_confidence": detection.get("confidence", "HIGH"),
                "detection_reason": detection.get("reason", ""),
                "extracted_fields": fields
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "is_valid_document": False,
                "detected_document_type": None,
                "extracted_fields": {}
            }

    @staticmethod
    def _ocr_image_text(img_bgr: Optional[np.ndarray]) -> str:
        """Run OCR on image using pytesseract if available with multi-pass OpenCV preprocessing."""
        if img_bgr is None or img_bgr.size == 0:
            return ""
        try:
            import pytesseract
            _configure_pytesseract()

            h, w = img_bgr.shape[:2]
            # Upscale if low resolution (target min width 1200px)
            if w < 1200 and h < 1200:
                scale = min(3.0, 1600.0 / max(w, h))
                if scale > 1.2:
                    proc_img = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
                else:
                    proc_img = img_bgr
            else:
                proc_img = img_bgr

            gray = cv2.cvtColor(proc_img, cv2.COLOR_BGR2GRAY)

            # Pass 1: CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # Pass 2: Bilateral filter to reduce noise while keeping edges sharp
            denoised = cv2.bilateralFilter(enhanced, 7, 50, 50)
            
            # Extract text using PSM 11 (sparse text, typical for ID cards) and PSM 6 (uniform block)
            try:
                text1 = pytesseract.image_to_string(denoised, config='--oem 3 --psm 11')
            except Exception:
                text1 = ""

            try:
                text2 = pytesseract.image_to_string(denoised, config='--oem 3 --psm 6')
            except Exception:
                text2 = ""

            combined = text1 if len(text1.strip()) >= len(text2.strip()) else text2
            if len(combined.strip()) < 10:
                # Try Otsu threshold
                _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
                try:
                    text3 = pytesseract.image_to_string(thresh, config='--psm 11')
                    if len(text3.strip()) > len(combined.strip()):
                        combined = text3
                except Exception:
                    pass

            return combined or ""
        except Exception:
            return ""

    # ─────────────────────────────────────────────────────────────
    # Per-document-type field extractors
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_aadhaar_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract Aadhaar-specific fields: UID (12-digit), Name, DOB, Gender, Address from XML or Secure QR or visual OCR"""
        fields = {
            "full_name": "", "document_number": "", "dob": "",
            "gender": "", "address": ""
        }
        if qr_raw:
            # ── Format 1: UIDAI Secure QR (Large compressed integer) ─────
            try:
                clean_digits = re.sub(r'\s', '', qr_raw)
                if clean_digits.isdigit() and len(clean_digits) > 80:
                    val = int(clean_digits)
                    byte_len = (val.bit_length() + 7) // 8
                    raw_bytes = val.to_bytes(byte_len, byteorder='big')
                    import zlib
                    decompressed = None
                    try:
                        decompressed = zlib.decompress(raw_bytes, 16 + zlib.MAX_WBITS)
                    except Exception:
                        try:
                            decompressed = zlib.decompress(raw_bytes)
                        except Exception:
                            pass

                    if decompressed:
                        parts = [p.decode('utf-8', errors='ignore').strip() for p in decompressed.split(b'\xff') if p]
                        if len(parts) >= 4:
                            ref_id = parts[0] if len(parts) > 0 else ""
                            name = parts[1] if len(parts) > 1 else ""
                            dob = parts[2] if len(parts) > 2 else ""
                            gender = parts[3] if len(parts) > 3 else ""

                            if name and re.match(r'^[A-Za-z\s\.]+$', name):
                                fields["full_name"] = name.upper()
                            if dob:
                                fields["dob"] = dob.replace("-", "/")
                            if gender:
                                g = gender.upper()
                                fields["gender"] = "MALE" if g.startswith("M") else "FEMALE" if g.startswith("F") else g
                            if ref_id and len(ref_id) >= 4:
                                fields["document_number"] = f"XXXX XXXX {ref_id[-4:]}"

                            addr_parts = [p for p in parts[4:] if p and len(p) > 1 and not p.isdigit()]
                            if addr_parts:
                                fields["address"] = ", ".join(addr_parts)
                            return fields
            except Exception:
                pass

            # ── Format 2: UIDAI XML QR (<PrintLetterBarcodeData ...>) ───
            m = re.search(r'name=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["full_name"] = m.group(1).strip().upper()

            m = re.search(r'dob=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m:
                fields["dob"] = m.group(1).strip()
            else:
                m = re.search(r'yob=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
                if m: fields["dob"] = f"01/01/{m.group(1).strip()}"

            m = re.search(r'uid=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m:
                raw_uid = re.sub(r'\s', '', m.group(1).strip())
                if len(raw_uid) == 12:
                    fields["document_number"] = f"{raw_uid[:4]} {raw_uid[4:8]} {raw_uid[8:]}"
                else:
                    fields["document_number"] = raw_uid
            else:
                m = re.search(r'\b(\d{4})\s?(\d{4})\s?(\d{4})\b', qr_raw)
                if m: fields["document_number"] = f"{m.group(1)} {m.group(2)} {m.group(3)}"

            m = re.search(r'gender=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m:
                g = m.group(1).strip().upper()
                fields["gender"] = "MALE" if g in ("M", "MALE") else "FEMALE" if g in ("F", "FEMALE") else g

        # ── Visual Image OCR / Layout Fallback if fields are missing ────────
        if (not fields["full_name"] or not fields["document_number"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'\b(\d{4}\s\d{4}\s\d{4})\b', ocr_text) or \
                        re.search(r'\b([Xx\d]{4}\s[Xx\d]{4}\s\d{4})\b', ocr_text) or \
                        re.search(r'\b(\d{12})\b', ocr_text)
                    if m:
                        raw_uid = re.sub(r'\s', '', m.group(1))
                        if len(raw_uid) == 12:
                            fields["document_number"] = f"{raw_uid[:4]} {raw_uid[4:8]} {raw_uid[8:]}"
                        else:
                            fields["document_number"] = m.group(1).upper()

                if not fields["dob"]:
                    m = re.search(r'(?:DOB|Date of Birth|Birth|YOB|Year)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})', ocr_text, re.I) or \
                        re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")

                if not fields["gender"]:
                    if re.search(r'\b(FEMALE|WOMAN)\b', ocr_text, re.I): fields["gender"] = "FEMALE"
                    elif re.search(r'\b(MALE|MAN)\b', ocr_text, re.I): fields["gender"] = "MALE"
                    elif re.search(r'\b(TRANSGENDER)\b', ocr_text, re.I): fields["gender"] = "TRANSGENDER"

                if not fields["full_name"]:
                    lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
                    for i, l in enumerate(lines):
                        upper_l = l.upper()
                        # If line says "To:" or "Recipient:"
                        if re.match(r'^(TO|RECIPIENT)[:\s]*$', upper_l) and i + 1 < len(lines):
                            cand = lines[i+1].strip()
                            if re.match(r'^[A-Za-z\s\.]{3,35}$', cand):
                                fields["full_name"] = cand.upper()
                                break
                        # Match name-like line
                        if re.match(r'^[A-Z][a-zA-Z\s\.]{3,35}$', l):
                            if not re.search(r'GOVERNMENT|INDIA|UIDAI|AADHAAR|DOB|MALE|FEMALE|ENROLMENT|AUTHORITY|UNIQUE|HELP|ENROLLMENT|MERI|MERA|PEHCHAN|SARKAR', upper_l):
                                fields["full_name"] = l.upper()
                                break

                # Address extraction if present
                if not fields.get("address"):
                    m_addr = re.search(r'(?:Address|S/O|D/O|W/O|C/O)[:\s\-]+([^\n\r]+(?:[\n\r]+[^\n\r]+){1,3})', ocr_text, re.I)
                    if m_addr:
                        fields["address"] = re.sub(r'[\r\n]+', ', ', m_addr.group(1).strip())

        return fields

    @staticmethod
    def _extract_pan_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract PAN-specific fields: PAN number (10 chars), Name, Father's Name, DOB"""
        fields = {
            "full_name": "", "document_number": "", "dob": "", "father_name": ""
        }
        if qr_raw:
            m = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', qr_raw)
            if m: fields["document_number"] = m.group(1).upper()
            m = re.search(r'name=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["full_name"] = m.group(1).strip().upper()
            m = re.search(r'father=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["father_name"] = m.group(1).strip().upper()
            m = re.search(r'dob=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["dob"] = m.group(1).strip()

        if (not fields["document_number"] or not fields["full_name"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', ocr_text)
                    if m: fields["document_number"] = m.group(1).upper()
                if not fields["dob"]:
                    m = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")
                if not fields["full_name"]:
                    lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
                    for l in lines:
                        if re.match(r'^[A-Z\s\.]{3,35}$', l) and not re.search(r'INCOME|TAX|DEPARTMENT|GOVT|INDIA|PERMANENT|ACCOUNT|SIGNATURE', l, re.I):
                            fields["full_name"] = l.upper()
                            break

        return fields

    @staticmethod
    def _extract_passport_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract Passport fields: Passport No, Name, DOB, Expiry, Nationality, MRZ"""
        fields = {
            "full_name": "", "document_number": "", "dob": "",
            "expiry_date": "", "nationality": "IND", "mrz_line1": "", "mrz_line2": ""
        }
        if qr_raw:
            mrz_res = OCRMRZService.parse_mrz(qr_raw)
            if mrz_res.get("success") and mrz_res.get("fields"):
                f = mrz_res["fields"]
                fields["full_name"] = f.get("full_name", "")
                fields["document_number"] = f.get("document_number", "")
                fields["dob"] = f.get("dob", "")
                fields["expiry_date"] = f.get("expiry_date", "")
                fields["nationality"] = f.get("nationality", "IND")
                raw = mrz_res.get("raw_mrz", [])
                if len(raw) >= 1: fields["mrz_line1"] = raw[0]
                if len(raw) >= 2: fields["mrz_line2"] = raw[1]

        if (not fields["document_number"] or not fields["full_name"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'\b([A-Z][0-9]{7,8})\b', ocr_text)
                    if m: fields["document_number"] = m.group(1).upper()
                if not fields["dob"]:
                    m = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")

        return fields

    @staticmethod
    def _extract_voter_id_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract Voter ID fields: EPIC number (3 alpha + 7 digit), Name, DOB, Constituency"""
        fields = {
            "full_name": "", "document_number": "", "dob": "", "constituency": ""
        }
        if qr_raw:
            m = re.search(r'\b([A-Z]{3}[0-9]{7})\b', qr_raw)
            if m: fields["document_number"] = m.group(1).upper()
            m = re.search(r'name=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["full_name"] = m.group(1).strip().upper()
            m = re.search(r'dob=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if not m: m = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', qr_raw)
            if m: fields["dob"] = m.group(1).strip()
            m = re.search(r'constituency=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["constituency"] = m.group(1).strip().upper()

        if (not fields["document_number"] or not fields["full_name"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'\b([A-Z]{3}[0-9]{7})\b', ocr_text) or \
                        re.search(r'(?:EPIC\s*NO|CARD\s*NO)[:\s\-]*([A-Z0-9]{10})', ocr_text, re.I)
                    if m: fields["document_number"] = m.group(1).upper()
                if not fields["dob"]:
                    m = re.search(r'(?:DOB|Date of Birth|Birth)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})', ocr_text, re.I) or \
                        re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")
                if not fields["full_name"]:
                    m = re.search(r'(?:Elector\'?s?\s*Name|Name)[:\s\-]+([A-Za-z\s\.]+)', ocr_text, re.I)
                    if m:
                        candidate = m.group(1).strip().upper()
                        if candidate and not any(kw in candidate for kw in ["ELECTION", "COMMISSION", "FATHER", "HUSBAND", "INDIA", "EPIC"]):
                            fields["full_name"] = candidate
                    if not fields["full_name"]:
                        lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
                        for l in lines:
                            if re.match(r'^[A-Z][a-zA-Z\s\.]{3,35}$', l) and not re.search(r'ELECTION|COMMISSION|INDIA|ELECTOR|PHOTO|IDENTITY|CARD|EPIC|FATHER|NAME|SEX|DOB', l, re.I):
                                fields["full_name"] = l.upper()
                                break
                if not fields.get("father_or_guardian"):
                    m_f = re.search(r'(?:Father\'?s?\s*Name|Husband\'?s?\s*Name)[:\s\-]+([A-Za-z\s\.]+)', ocr_text, re.I)
                    if m_f:
                        fields["father_or_guardian"] = m_f.group(1).strip().upper()

        return fields

    @staticmethod
    def _extract_dl_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract Driving License fields: DL number (State+RTO+Year+Serial), Name, DOB, Expiry, Vehicle Class"""
        fields = {
            "full_name": "", "document_number": "", "dob": "",
            "expiry_date": "", "vehicle_class": ""
        }
        if qr_raw:
            m = re.search(r'\b([A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7})\b', qr_raw)
            if m: fields["document_number"] = m.group(1).upper()
            m = re.search(r'name=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["full_name"] = m.group(1).strip().upper()
            m = re.search(r'dob=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if not m: m = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', qr_raw)
            if m: fields["dob"] = m.group(1).strip()
            m = re.search(r'expiry=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["expiry_date"] = m.group(1).strip()
            m = re.search(r'class=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["vehicle_class"] = m.group(1).strip().upper()

        if (not fields["document_number"] or not fields["full_name"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'(?:DL\s*NO|LICEN[SC]E\s*NO|NO\.?)[:\s\-]*([A-Z0-9\/\-\s]{10,20})', ocr_text, re.I)
                    if m:
                        clean_dl = re.sub(r'[\s\-]', '', m.group(1)).upper()
                        if len(clean_dl) >= 10:
                            fields["document_number"] = clean_dl
                    if not fields["document_number"]:
                        m2 = re.search(r'\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7})\b', ocr_text) or \
                             re.search(r'\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b', ocr_text) or \
                             re.search(r'\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11})\b', ocr_text)
                        if m2:
                            fields["document_number"] = re.sub(r'[-\s]', '', m2.group(1)).upper()

                if not fields["dob"]:
                    m = re.search(r'(?:DOB|Date of Birth|Birth)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})', ocr_text, re.I) or \
                        re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")

                if not fields["expiry_date"]:
                    m = re.search(r'(?:Valid(?:ity)?|Expiry|Exp)[:\s\w]*(\d{2}[/-]\d{2}[/-]\d{4})', ocr_text, re.I)
                    if m: fields["expiry_date"] = m.group(1).replace("-", "/")

                if not fields["vehicle_class"]:
                    m = re.search(r'\b(LMV(?:-GV)?|MCWG|MCWOG|TRANS|HMV|3W-NT)\b', ocr_text)
                    if m: fields["vehicle_class"] = m.group(1).upper()

                if not fields["full_name"]:
                    m = re.search(r'(?:Name|Holder\'?s?\s*Name)[:\s\-]+([A-Za-z\s\.]+)', ocr_text, re.I)
                    if m:
                        candidate = m.group(1).strip().upper()
                        if candidate and not any(kw in candidate for kw in ["DRIVING", "UNION", "FATHER", "SON", "DAUGHTER", "AUTHORITY", "VALIDITY"]):
                            fields["full_name"] = candidate
                    if not fields["full_name"]:
                        lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
                        for l in lines:
                            if re.match(r'^[A-Z][a-zA-Z\s\.]{3,35}$', l) and not re.search(r'DRIVING|LICEN|UNION|INDIA|TRANSPORT|GOVERNMENT|VALID|MOTOR|DATE|NAME|FORM', l, re.I):
                                fields["full_name"] = l.upper()
                                break

                if not fields.get("father_or_guardian"):
                    m_f = re.search(r'(?:Father\'?s?\s*Name|S/O|D/O|W/O)[:\s\-]+([A-Za-z\s\.]+)', ocr_text, re.I)
                    if m_f:
                        fields["father_or_guardian"] = m_f.group(1).strip().upper()

        return fields

    @staticmethod
    def _extract_visa_fields(qr_raw: str, img: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Extract Visa fields: Visa number, Name, DOB, Expiry, Visa class, Issuing country"""
        fields = {
            "full_name": "", "document_number": "", "dob": "",
            "expiry_date": "", "visa_class": "", "issuing_country": ""
        }
        if qr_raw:
            m = re.search(r'\b(V[0-9]{7,10})\b', qr_raw, re.IGNORECASE)
            if m: fields["document_number"] = m.group(1).upper()
            m = re.search(r'name=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["full_name"] = m.group(1).strip().upper()
            m = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', qr_raw)
            if m: fields["dob"] = m.group(1).strip()
            m = re.search(r'class=["\']([^"\']+)["\']', qr_raw, re.IGNORECASE)
            if m: fields["visa_class"] = m.group(1).strip().upper()

        return fields

    # ─────────────────────────────────────────────────────────────
    # 4.  ICAO MRZ parsing (Passport / Visa / National ID)
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def parse_mrz(mrz_text: str) -> Dict[str, Any]:
        """
        Parses 2-line (TD3 / TD2) or 3-line (TD1) MRZ strings with ICAO 9303 check digit validations.
        """
        lines = [line.strip().replace(" ", "").upper() for line in mrz_text.splitlines() if line.strip()]
        if not lines:
            return {"success": False, "error": "No MRZ lines found", "valid": False, "checksum_valid": False, "fields": {}}

        valid_lines = [re.sub(r'[^A-Z0-9<]', '', l) for l in lines]
        valid_lines = [l for l in valid_lines if len(l) >= 25]

        if len(valid_lines) == 2:
            l1, l2 = valid_lines[0], valid_lines[1]
            if len(l1) >= 44 and len(l2) >= 44:
                return OCRMRZService._parse_td3(l1[:44], l2[:44])
            elif len(l1) >= 36 and len(l2) >= 36:
                return OCRMRZService._parse_td2(l1[:36], l2[:36])

        if len(valid_lines) == 3 and len(valid_lines[0]) >= 30:
            return OCRMRZService._parse_td1(valid_lines[0][:30], valid_lines[1][:30], valid_lines[2][:30])

        return {"success": False, "error": "Unable to determine standard MRZ format (TD1/TD2/TD3)",
                "valid": False, "checksum_valid": False, "fields": {}}

    @staticmethod
    def _parse_td3(l1: str, l2: str) -> Dict[str, Any]:
        name_section = l1[5:44]
        name_parts = name_section.split("<<")
        surname = name_parts[0].replace("<", " ").strip() if len(name_parts) > 0 else ""
        given_names = name_parts[1].replace("<", " ").strip() if len(name_parts) > 1 else ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname

        doc_num = l2[0:9].replace("<", "")
        doc_num_chk = l2[9]
        nationality = l2[10:13].replace("<", "")
        dob_raw = l2[13:19]
        dob_chk = l2[19]
        sex = l2[20].replace("<", "")
        expiry_raw = l2[21:27]
        expiry_chk = l2[27]
        composite_chk = l2[43] if len(l2) >= 44 else "0"

        doc_num_valid = ICAO9303Validator.verify_check_digit(doc_num, doc_num_chk)
        dob_valid = ICAO9303Validator.verify_check_digit(dob_raw, dob_chk)
        expiry_valid = ICAO9303Validator.verify_check_digit(expiry_raw, expiry_chk)
        composite_valid = ICAO9303Validator.verify_check_digit(l2[0:10] + l2[13:20] + l2[21:43], composite_chk)
        is_all_valid = doc_num_valid and dob_valid and expiry_valid and composite_valid

        def _fmt(yymmdd: str) -> str:
            if len(yymmdd) != 6 or not yymmdd.isdigit():
                return yymmdd
            yy, mm, dd = int(yymmdd[0:2]), yymmdd[2:4], yymmdd[4:6]
            curr_yy = datetime.now().year % 100
            century = "19" if yy > curr_yy else "20"
            return f"{dd}/{mm}/{century}{yymmdd[0:2]}"

        return {
            "success": True, "format": "TD3 (Passport)",
            "valid": is_all_valid, "checksum_valid": is_all_valid,
            "checks": {
                "document_number_checksum": {"valid": doc_num_valid, "expected": doc_num_chk},
                "dob_checksum": {"valid": dob_valid, "expected": dob_chk},
                "expiry_checksum": {"valid": expiry_valid, "expected": expiry_chk},
                "composite_checksum": {"valid": composite_valid, "expected": composite_chk}
            },
            "fields": {
                "document_type": "PASSPORT", "full_name": full_name,
                "document_number": doc_num, "nationality": nationality,
                "dob": _fmt(dob_raw), "sex": sex, "expiry_date": _fmt(expiry_raw)
            },
            "raw_mrz": [l1, l2]
        }

    @staticmethod
    def _parse_td2(l1: str, l2: str) -> Dict[str, Any]:
        name_section = l1[5:36]
        name_parts = name_section.split("<<")
        surname = name_parts[0].replace("<", " ").strip() if len(name_parts) > 0 else ""
        given_names = name_parts[1].replace("<", " ").strip() if len(name_parts) > 1 else ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname

        doc_num = l2[0:9].replace("<", "")
        doc_num_chk = l2[9]
        nationality = l2[10:13].replace("<", "")
        dob_raw = l2[13:19]
        dob_chk = l2[19]
        sex = l2[20].replace("<", "")
        expiry_raw = l2[21:27]
        expiry_chk = l2[27]

        doc_num_valid = ICAO9303Validator.verify_check_digit(doc_num, doc_num_chk)
        dob_valid = ICAO9303Validator.verify_check_digit(dob_raw, dob_chk)
        expiry_valid = ICAO9303Validator.verify_check_digit(expiry_raw, expiry_chk)
        is_all_valid = doc_num_valid and dob_valid and expiry_valid

        def _fmt(yymmdd: str) -> str:
            if len(yymmdd) != 6 or not yymmdd.isdigit():
                return yymmdd
            yy, mm, dd = int(yymmdd[0:2]), yymmdd[2:4], yymmdd[4:6]
            curr_yy = datetime.now().year % 100
            century = "19" if yy > curr_yy else "20"
            return f"{dd}/{mm}/{century}{yymmdd[0:2]}"

        return {
            "success": True, "format": "TD2 (Visa / ID)",
            "valid": is_all_valid, "checksum_valid": is_all_valid,
            "checks": {
                "document_number_checksum": {"valid": doc_num_valid, "expected": doc_num_chk},
                "dob_checksum": {"valid": dob_valid, "expected": dob_chk},
                "expiry_checksum": {"valid": expiry_valid, "expected": expiry_chk}
            },
            "fields": {
                "document_type": "VISA", "full_name": full_name,
                "document_number": doc_num, "nationality": nationality,
                "dob": _fmt(dob_raw), "sex": sex, "expiry_date": _fmt(expiry_raw)
            },
            "raw_mrz": [l1, l2]
        }

    @staticmethod
    def _parse_td1(l1: str, l2: str, l3: str) -> Dict[str, Any]:
        doc_num = l1[5:14].replace("<", "")
        doc_num_chk = l1[14]
        dob_raw = l2[0:6]
        dob_chk = l2[6]
        sex = l2[7].replace("<", "")
        expiry_raw = l2[8:14]
        expiry_chk = l2[14]
        nationality = l2[15:18].replace("<", "")

        name_section = l3[0:30]
        name_parts = name_section.split("<<")
        surname = name_parts[0].replace("<", " ").strip() if len(name_parts) > 0 else ""
        given_names = name_parts[1].replace("<", " ").strip() if len(name_parts) > 1 else ""
        full_name = f"{given_names} {surname}".strip() if given_names else surname

        doc_num_valid = ICAO9303Validator.verify_check_digit(doc_num, doc_num_chk)
        dob_valid = ICAO9303Validator.verify_check_digit(dob_raw, dob_chk)
        expiry_valid = ICAO9303Validator.verify_check_digit(expiry_raw, expiry_chk)
        is_all_valid = doc_num_valid and dob_valid and expiry_valid

        def _fmt(yymmdd: str) -> str:
            if len(yymmdd) != 6 or not yymmdd.isdigit():
                return yymmdd
            yy, mm, dd = int(yymmdd[0:2]), yymmdd[2:4], yymmdd[4:6]
            curr_yy = datetime.now().year % 100
            century = "19" if yy > curr_yy else "20"
            return f"{dd}/{mm}/{century}{yymmdd[0:2]}"

        return {
            "success": True, "format": "TD1 (National ID Card)",
            "valid": is_all_valid, "checksum_valid": is_all_valid,
            "checks": {
                "document_number_checksum": {"valid": doc_num_valid, "expected": doc_num_chk},
                "dob_checksum": {"valid": dob_valid, "expected": dob_chk},
                "expiry_checksum": {"valid": expiry_valid, "expected": expiry_chk}
            },
            "fields": {
                "document_type": "NATIONAL_ID", "full_name": full_name,
                "document_number": doc_num, "nationality": nationality,
                "dob": _fmt(dob_raw), "sex": sex, "expiry_date": _fmt(expiry_raw)
            },
            "raw_mrz": [l1, l2, l3]
        }

    """
    Implements ICAO Doc 9303 specification for Machine Readable Travel Documents (MRTD).
    Performs standard 7-3-1 weight check digit verification.
    """
    WEIGHTS = [7, 3, 1]

    @classmethod
    def char_to_value(cls, ch: str) -> int:
        if ch.isdigit():
            return int(ch)
        elif ch.isalpha():
            return ord(ch.upper()) - ord('A') + 10
        elif ch == '<':
            return 0
        return 0

    @classmethod
    def calculate_check_digit(cls, data_str: str) -> int:
        total = 0
        for i, ch in enumerate(data_str):
            val = cls.char_to_value(ch)
            weight = cls.WEIGHTS[i % 3]
            total += val * weight
        return total % 10

    @classmethod
    def verify_check_digit(cls, data_str: str, expected_digit: str) -> bool:
        if not expected_digit.isdigit():
            return False
        calculated = cls.calculate_check_digit(data_str)
        return calculated == int(expected_digit)
