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
    # 1.  Detect which document type the image contains
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
    # 1.  Detect which document type the image contains
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def detect_document_type(image_bytes: bytes) -> Dict[str, Any]:
        """
        Auto-detects the government document type from the image.
        Returns:
            {
                "detected_type": "AADHAAR_CARD" | "PAN_CARD" | "PASSPORT" | ...
                "confidence": "HIGH" | "MEDIUM" | "LOW",
                "reason": "...",
                "detected": True | False
            }
        """
        try:
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"detected_type": None, "confidence": "NONE", "reason": "Invalid image", "detected": False}

            h, w = img.shape[:2]
            aspect = float(w) / float(h)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # ── Step 1: Scan QR code using multi-pass scanner ──────
            qr_data = OCRMRZService._scan_qr_robust(img)

            if qr_data and len(qr_data.strip()) > 5:
                qr = qr_data.strip()

                # Aadhaar QR (XML format or 12-digit number)
                if (re.search(r'uid=', qr, re.IGNORECASE)
                        or "PrintLetterBarcodeData" in qr
                        or re.search(r'\b\d{12}\b', qr)
                        or "yob=" in qr or "dob=" in qr):
                    return {"detected_type": "AADHAAR_CARD", "confidence": "HIGH",
                            "reason": "QR code contains UIDAI Aadhaar data", "detected": True,
                            "qr_data": qr}

                # Passport / TD3 MRZ in QR
                if re.search(r'P[<A-Z][A-Z]{3}', qr):
                    return {"detected_type": "PASSPORT", "confidence": "HIGH",
                            "reason": "QR code contains ICAO MRZ TD3 passport data", "detected": True,
                            "qr_data": qr}

                # PAN QR
                if re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', qr):
                    return {"detected_type": "PAN_CARD", "confidence": "HIGH",
                            "reason": "QR code contains PAN card number pattern", "detected": True,
                            "qr_data": qr}

                # Voter ID QR
                if re.search(r'\b[A-Z]{3}[0-9]{7}\b', qr) or re.search(r'EPIC', qr, re.IGNORECASE):
                    return {"detected_type": "VOTER_ID", "confidence": "HIGH",
                            "reason": "QR code contains EPIC Voter ID data", "detected": True,
                            "qr_data": qr}

                # DL QR
                if re.search(r'\b[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}\b', qr):
                    return {"detected_type": "DRIVING_LICENSE", "confidence": "HIGH",
                            "reason": "QR code contains Driving License number", "detected": True,
                            "qr_data": qr}

                # Visa QR
                if re.search(r'VISA|V[0-9]{7,}', qr, re.IGNORECASE):
                    return {"detected_type": "VISA", "confidence": "HIGH",
                            "reason": "QR code contains Visa sticker data", "detected": True,
                            "qr_data": qr}

                # Unrecognized QR payload
                return {"detected_type": None, "confidence": "NONE",
                        "reason": "QR code detected does not contain recognized Government ID data", "detected": False}

            # ── Step 2: Check for Aadhaar Header Emblem & UIDAI layout (A4 Portrait or Card) ──
            # Aadhaar documents MUST have the saffron UIDAI header banner (r > 130 and r > b * 1.3)
            # AND a distinct biometric facial portrait or official emblem
            top_strip = img[:int(h * 0.22), :]
            mean_top = np.mean(top_strip.reshape(-1, 3), axis=0) # BGR
            b, g, r = mean_top
            has_aadhaar_saffron = (r > 130 and r > b * 1.3 and r > g * 1.05)

            # Facial portrait check
            has_face = False
            try:
                face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                if os.path.exists(face_cascade_path):
                    face_cascade = cv2.CascadeClassifier(face_cascade_path)
                    faces = face_cascade.detectMultiScale(gray, 1.1, 3, minSize=(30, 30))
                    if len(faces) > 0:
                        has_face = True
            except Exception:
                pass

            if has_aadhaar_saffron and has_face:
                return {
                    "detected_type": "AADHAAR_CARD",
                    "confidence": "MEDIUM",
                    "reason": "UIDAI Aadhaar government header banner & portrait detected",
                    "detected": True
                }

            # ── Step 3: Card Layout Specific Headers ──
            if 1.25 <= aspect <= 1.95 and has_face:
                # PAN Card: Dark blue header banner + Photo
                if b > 100 and b > r * 1.25:
                    return {"detected_type": "PAN_CARD", "confidence": "MEDIUM",
                            "reason": "Income Tax PAN card blue header & portrait detected", "detected": True}

                # Voter ID / Driving License card with photo
                return {"detected_type": "VOTER_ID", "confidence": "LOW",
                        "reason": "Identity card with photo detected", "detected": True}

            # If no conclusive visual rule matched (e.g. generic text, guidelines, resume, screenshot)
            return {"detected_type": None, "confidence": "NONE",
                    "reason": "No recognized Government ID structure, QR code, or official emblem detected", "detected": False}

        except Exception as e:
            return {"detected_type": None, "confidence": "NONE",
                    "reason": f"Detection error: {str(e)}", "detected": False}


    # ─────────────────────────────────────────────────────────────
    # 2.  Validate document structure (strictly reject non-ID images)
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    def validate_document_structure(img_bgr: np.ndarray) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates if the image is a genuine document (Aadhaar, PAN, Passport, DL, etc.).
        Rejects maps, landscapes, street photos, and random non-document graphics.
        """
        try:
            h, w = img_bgr.shape[:2]
            aspect = float(w) / float(h)

            # 1. Aspect ratio check (Standard documents are ~0.70 portrait or ~1.4 - 1.6 landscape)
            if aspect < 0.40 or aspect > 2.6:
                return False, "INVALID_ASPECT_RATIO", {
                    "reason": f"Aspect ratio ({aspect:.2f}) does not match standard government credential format."
                }

            # 2. Map & Terrain Detection (Rejects street maps, satellite, outdoor photos)
            hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            green_mask = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
            blue_mask = cv2.inRange(hsv, (90, 40, 40), (130, 255, 255))
            terrain_ratio = (np.sum(green_mask > 0) + np.sum(blue_mask > 0)) / float(h * w)

            # QR check
            qr_data = OCRMRZService._scan_qr_robust(img_bgr)
            has_qr = bool(qr_data and len(qr_data.strip()) > 5)

            # If large map terrain / water bodies are present and no QR code exists -> reject map
            if terrain_ratio > 0.15 and not has_qr:
                return False, "INVALID_NON_IDENTITY_IMAGE", {
                    "reason": "Image contains map tiles/geographic terrain rather than a government identity credential."
                }

            # 3. Document Paper / Card Background Check
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            mean_intensity = float(np.mean(gray))

            # Reject completely black or unreadable dark images
            if mean_intensity < 40 and not has_qr:
                return False, "INVALID_NON_IDENTITY_IMAGE", {
                    "reason": "Image is too dark or empty to contain a readable document."
                }

            # 4. Text line & layout structure
            edges = cv2.Canny(gray, 50, 150)
            edge_density = float(np.sum(edges > 0)) / float(gray.size)

            # Reject chaotic noise / extreme textures without QR
            if edge_density > 0.35 and not has_qr:
                return False, "INVALID_NON_IDENTITY_IMAGE", {
                    "reason": "Image texture is too noisy or complex for a document layout."
                }

            return True, "VALID_IDENTITY_TEMPLATE", {
                "has_qr": has_qr,
                "mean_intensity": round(mean_intensity, 1),
                "terrain_ratio": round(terrain_ratio, 3),
                "aspect_ratio": round(aspect, 2)
            }
        except Exception:
            return True, "VALID_IDENTITY_TEMPLATE", {"note": "Pass through"}

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

            # Step 1: Validate document structure
            is_valid_structure, template_code, template_info = OCRMRZService.validate_document_structure(img)
            if not is_valid_structure:
                return {
                    "success": False,
                    "is_valid_document": False,
                    "error": "NON_DOCUMENT_IMAGE: The uploaded file does not match any recognized government identity document template.",
                    "extracted_fields": {},
                    "detected_document_type": None
                }

            # Step 2: Detect document type
            detection = OCRMRZService.detect_document_type(image_bytes)
            detected_type = detection.get("detected_type")
            qr_raw = detection.get("qr_data", "")

            if not detection.get("detected") or not detected_type:
                return {
                    "success": False,
                    "is_valid_document": False,
                    "error": "NON_DOCUMENT_IMAGE: The uploaded image is not a recognized Government Identity document (Aadhaar, Voter ID, Driving License, PAN, Passport).",
                    "extracted_fields": {},
                    "detected_document_type": None
                }

            # Step 3: Extract type-specific fields
            if detected_type == "AADHAAR_CARD":
                fields = OCRMRZService._extract_aadhaar_fields(qr_raw, img=img)
            elif detected_type == "PAN_CARD":
                fields = OCRMRZService._extract_pan_fields(qr_raw, img=img)
            elif detected_type == "PASSPORT":
                fields = OCRMRZService._extract_passport_fields(qr_raw, img=img)
            elif detected_type == "VOTER_ID":
                fields = OCRMRZService._extract_voter_id_fields(qr_raw, img=img)
            elif detected_type == "DRIVING_LICENSE":
                fields = OCRMRZService._extract_dl_fields(qr_raw, img=img)
            elif detected_type == "VISA":
                fields = OCRMRZService._extract_visa_fields(qr_raw, img=img)
            else:
                fields = {}

            fields["document_type"] = detected_type

            return {
                "success": True,
                "is_valid_document": True,
                "detected_document_type": detected_type,
                "detection_confidence": detection.get("confidence", "MEDIUM"),
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
        """Run OCR on image using pytesseract if available with OpenCV preprocessing."""
        if img_bgr is None or img_bgr.size == 0:
            return ""
        try:
            import pytesseract
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            filtered = cv2.bilateralFilter(gray, 9, 75, 75)
            norm = cv2.normalize(filtered, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
            text = pytesseract.image_to_string(norm, config='--psm 6')
            if len(text.strip()) < 10:
                text = pytesseract.image_to_string(gray)
            return text or ""
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

        # ── Visual Image OCR Fallback if fields are missing ────────
        if (not fields["full_name"] or not fields["document_number"]) and img is not None:
            ocr_text = OCRMRZService._ocr_image_text(img)
            if ocr_text:
                if not fields["document_number"]:
                    m = re.search(r'\b(\d{4}\s\d{4}\s\d{4})\b', ocr_text) or re.search(r'\b(\d{12})\b', ocr_text)
                    if m:
                        raw_uid = re.sub(r'\s', '', m.group(1))
                        fields["document_number"] = f"{raw_uid[:4]} {raw_uid[4:8]} {raw_uid[8:]}"
                if not fields["dob"]:
                    m = re.search(r'(?:DOB|Birth|YOB|Year)[:\s]*(\d{2}[/-]\d{2}[/-]\d{4}|\d{4})', ocr_text, re.I) or re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")
                if not fields["gender"]:
                    if re.search(r'\b(FEMALE|WOMAN)\b', ocr_text, re.I): fields["gender"] = "FEMALE"
                    elif re.search(r'\b(MALE|MAN)\b', ocr_text, re.I): fields["gender"] = "MALE"
                if not fields["full_name"]:
                    lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
                    for l in lines:
                        if re.match(r'^[A-Z][a-zA-Z\s\.]{3,35}$', l) and not re.search(r'GOVERNMENT|INDIA|UIDAI|AADHAAR|DOB|MALE|FEMALE', l, re.I):
                            fields["full_name"] = l.upper()
                            break

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
                    m = re.search(r'\b([A-Z]{3}[0-9]{7})\b', ocr_text)
                    if m: fields["document_number"] = m.group(1).upper()
                if not fields["dob"]:
                    m = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")

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
                    m = re.search(r'\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4,11})\b', ocr_text)
                    if m: fields["document_number"] = re.sub(r'[-\s]', '', m.group(1)).upper()
                if not fields["dob"]:
                    m = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', ocr_text)
                    if m: fields["dob"] = m.group(1).replace("-", "/")

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
