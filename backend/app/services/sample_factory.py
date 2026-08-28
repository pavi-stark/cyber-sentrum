import io
import cv2
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from app.services.ocr_mrz_service import ICAO9303Validator
from app.services.national_id_service import VerhoeffAlgorithm

class SampleFactory:
    """
    Generates realistic synthetic demo documents across Passports, Aadhaar Cards, PAN Cards, and Visas for SIH evaluation.
    """

    @staticmethod
    def _draw_synthetic_face(draw, x, y, size=140, face_style="male_1", is_tampered=False):
        skin_tones = {
            "male_1": (224, 185, 155),
            "female_1": (245, 205, 180),
            "male_2": (140, 95, 65),
            "female_2": (210, 160, 130)
        }
        skin = skin_tones.get(face_style, (224, 185, 155))
        
        # Face Oval
        draw.ellipse([x, y, x + size, y + int(size * 1.25)], fill=skin, outline=(100, 70, 50), width=2)
        
        # Hair
        if "female" in face_style:
            draw.arc([x - 12, y - 12, x + size + 12, y + int(size * 0.95)], 180, 360, fill=(180, 90, 40), width=22)
            draw.line([x - 6, y + 20, x - 6, y + size + 15], fill=(180, 90, 40), width=18)
            draw.line([x + size + 6, y + 20, x + size + 6, y + size + 15], fill=(180, 90, 40), width=18)
        else:
            draw.arc([x - 5, y - 5, x + size + 5, y + int(size * 0.6)], 190, 350, fill=(30, 20, 15), width=16)

        # Eyes
        eye_y = y + int(size * 0.52)
        draw.ellipse([x + int(size * 0.20), eye_y, x + int(size * 0.38), eye_y + 14], fill=(255, 255, 255), outline=(40, 30, 20))
        draw.ellipse([x + int(size * 0.27), eye_y + 3, x + int(size * 0.35), eye_y + 11], fill=(30, 20, 15))
        
        draw.ellipse([x + int(size * 0.62), eye_y, x + int(size * 0.80), eye_y + 14], fill=(255, 255, 255), outline=(40, 30, 20))
        draw.ellipse([x + int(size * 0.65), eye_y + 3, x + int(size * 0.73), eye_y + 11], fill=(30, 20, 15))

        # Eyebrows
        draw.line([x + int(size * 0.18), eye_y - 6, x + int(size * 0.40), eye_y - 4], fill=(30, 20, 15), width=3)
        draw.line([x + int(size * 0.60), eye_y - 4, x + int(size * 0.82), eye_y - 6], fill=(30, 20, 15), width=3)

        # Nose
        nose_y = y + int(size * 0.68)
        draw.line([x + int(size * 0.5), eye_y + 5, x + int(size * 0.46), nose_y + 8], fill=(120, 80, 50), width=2)
        draw.line([x + int(size * 0.46), nose_y + 8, x + int(size * 0.54), nose_y + 8], fill=(120, 80, 50), width=2)

        # Mouth
        mouth_y = y + int(size * 0.95)
        mouth_color = (200, 60, 60) if "female" in face_style else (150, 70, 70)
        draw.arc([x + int(size * 0.35), mouth_y - 5, x + int(size * 0.65), mouth_y + 10], 20, 160, fill=mouth_color, width=4)

        # Clothes
        draw.rectangle([x + int(size * 0.35), y + int(size * 1.15), x + int(size * 0.65), y + int(size * 1.4)], fill=skin)
        shirt_color = (180, 50, 80) if "female" in face_style else (25, 45, 80)
        draw.polygon([
            (x - 15, y + int(size * 1.35)),
            (x + size + 15, y + int(size * 1.35)),
            (x + int(size * 0.7), y + int(size * 1.15)),
            (x + int(size * 0.3), y + int(size * 1.15))
        ], fill=shirt_color)

        if is_tampered:
            # Highlight splicing edges
            draw.rectangle([x - 8, y - 8, x + size + 8, y + int(size * 1.38)], outline=(255, 30, 30), width=4)

    @staticmethod
    def generate_demo_case(case_key: str) -> dict:
        width, height = 800, 520
        selfie_im = Image.new("RGB", (320, 360), color=(225, 230, 240))
        selfie_draw = ImageDraw.Draw(selfie_im)
        
        # -------------------------------------------------------------
        # 1. INDIAN AADHAAR CARD CASES
        # -------------------------------------------------------------
        if case_key == "aadhaar_valid":
            doc_im = Image.new("RGB", (width, height), color=(255, 255, 255))
            draw = ImageDraw.Draw(doc_im)

            # Aadhaar Top Tri-color band
            draw.rectangle([0, 0, width, 18], fill=(255, 153, 51))
            draw.rectangle([0, 18, width, 36], fill=(255, 255, 255))
            draw.rectangle([0, 36, width, 54], fill=(19, 136, 8))

            # Header Text
            draw.text((280, 65), "भारत सरकार | GOVERNMENT OF INDIA", fill=(10, 20, 50))
            draw.text((230, 88), "भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)", fill=(180, 50, 20))

            # Photo Box
            draw.rectangle([45, 130, 235, 360], fill=(240, 245, 250), outline=(150, 160, 180), width=2)
            SampleFactory._draw_synthetic_face(draw, 65, 145, size=125, face_style="male_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            # Demographic Details
            draw.text((260, 150), "नाम / Name: RAJESH KUMAR SHARMA", fill=(20, 30, 60))
            draw.text((260, 185), "जन्म तिथि / DOB: 14/05/1992", fill=(20, 30, 60))
            draw.text((260, 220), "लिंग / Gender: पुरुष / MALE", fill=(20, 30, 60))

            # Valid 12-digit Aadhaar Number (Verhoeff Checksum Verified!)
            # 5489 2109 4325 -> Verhoeff Check Digit = 5
            aadhaar_num = "5489 2109 4325"
            draw.rectangle([180, 400, 620, 460], fill=(245, 248, 255), outline=(200, 215, 240), width=2)
            draw.text((250, 418), aadhaar_num, fill=(180, 40, 20))
            draw.text((320, 475), "मेरा आधार, मेरी पहचान", fill=(100, 110, 130))

            # QR Code Box
            draw.rectangle([600, 140, 740, 280], fill=(245, 245, 245), outline=(100, 100, 100), width=2)
            for qx in range(615, 725, 15):
                for qy in range(155, 265, 15):
                    if (qx + qy) % 2 == 0:
                        draw.rectangle([qx, qy, qx + 10, qy + 10], fill=(30, 30, 30))

            doc_buf = io.BytesIO()
            doc_im.save(doc_buf, format="JPEG", quality=92)
            selfie_buf = io.BytesIO()
            selfie_im.save(selfie_buf, format="JPEG", quality=90)

            return {
                "key": case_key,
                "title": "Aadhaar Card: Genuine Valid Identity",
                "document_type": "AADHAAR_CARD",
                "expected_outcome": "LOW",
                "mrz_text": "",
                "extracted_fields": {
                    "document_type": "AADHAAR_CARD",
                    "document_number": "548921094325",
                    "full_name": "RAJESH KUMAR SHARMA",
                    "dob": "14/05/1992",
                    "sex": "M",
                    "nationality": "IND"
                },
                "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
                "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
                "doc_bytes": doc_buf.getvalue(),
                "selfie_bytes": selfie_buf.getvalue()
            }

        elif case_key == "aadhaar_tampered":
            doc_im = Image.new("RGB", (width, height), color=(255, 255, 255))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 18], fill=(255, 153, 51))
            draw.rectangle([0, 18, width, 36], fill=(255, 255, 255))
            draw.rectangle([0, 36, width, 54], fill=(19, 136, 8))

            draw.text((280, 65), "भारत सरकार | GOVERNMENT OF INDIA", fill=(10, 20, 50))
            draw.text((230, 88), "भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)", fill=(180, 50, 20))

            # Swapped / Pasted Photo with tampering border
            draw.rectangle([45, 130, 235, 360], fill=(240, 245, 250), outline=(255, 50, 50), width=3)
            SampleFactory._draw_synthetic_face(draw, 65, 145, size=125, face_style="male_2", is_tampered=True)
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            draw.text((260, 150), "नाम / Name: AMIT VERMA", fill=(20, 30, 60))
            draw.text((260, 185), "जन्म तिथि / DOB: 18/09/1995", fill=(20, 30, 60))
            draw.text((260, 220), "लिंग / Gender: पुरुष / MALE", fill=(20, 30, 60))

            # INVALID Aadhaar Number (Fails Verhoeff Checksum!)
            aadhaar_invalid = "9988 7766 5543"  # Calculated Verhoeff check is 0, but ends with 3
            draw.rectangle([180, 400, 620, 460], fill=(255, 240, 240), outline=(255, 100, 100), width=2)
            draw.text((250, 418), aadhaar_invalid, fill=(220, 20, 20))
            draw.text((320, 475), "मेरा आधार, मेरी पहचान", fill=(100, 110, 130))

            # Inject localized tampering artifacts
            doc_np = np.array(doc_im)
            noise = np.random.randint(-40, 40, (230, 190, 3), dtype=np.int16)
            patch = doc_np[130:360, 45:235].astype(np.int16) + noise
            doc_np[130:360, 45:235] = np.clip(patch, 0, 255).astype(np.uint8)
            doc_im = Image.fromarray(doc_np)

            doc_buf = io.BytesIO()
            doc_im.save(doc_buf, format="JPEG", quality=92)
            selfie_buf = io.BytesIO()
            selfie_im.save(selfie_buf, format="JPEG", quality=90)

            return {
                "key": case_key,
                "title": "Aadhaar Card: Forged Number (Verhoeff Failed)",
                "document_type": "AADHAAR_CARD",
                "expected_outcome": "HIGH",
                "mrz_text": "",
                "extracted_fields": {
                    "document_type": "AADHAAR_CARD",
                    "document_number": "998877665543",
                    "full_name": "AMIT VERMA",
                    "dob": "18/09/1995",
                    "sex": "M",
                    "nationality": "IND"
                },
                "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
                "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
                "doc_bytes": doc_buf.getvalue(),
                "selfie_bytes": selfie_buf.getvalue()
            }

        # -------------------------------------------------------------
        # 2. INDIAN PAN CARD CASES
        # -------------------------------------------------------------
        elif case_key == "pan_valid":
            doc_im = Image.new("RGB", (width, height), color=(220, 235, 245))
            draw = ImageDraw.Draw(doc_im)

            # Top Header
            draw.rectangle([0, 0, width, 55], fill=(30, 85, 140))
            draw.text((220, 10), "आयकर विभाग | INCOME TAX DEPARTMENT", fill=(255, 255, 255))
            draw.text((310, 32), "भारत सरकार / GOVT. OF INDIA", fill=(200, 225, 255))

            # Photo Box
            draw.rectangle([45, 110, 215, 310], fill=(240, 245, 250), outline=(80, 120, 160), width=2)
            SampleFactory._draw_synthetic_face(draw, 60, 120, size=115, face_style="male_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            # Demographic Details
            name = "SHARMA RAJESH"
            pan_no = "ABCPS1234D" # 'P' = Person, 'S' = Surname Sharma!
            
            draw.text((245, 115), "नाम / Name:", fill=(70, 90, 110))
            draw.text((245, 135), name, fill=(15, 30, 60))

            draw.text((245, 175), "पिता का नाम / Father's Name:", fill=(70, 90, 110))
            draw.text((245, 195), "RAMESH SHARMA", fill=(15, 30, 60))

            draw.text((245, 235), "जन्म की तारीख / Date of Birth:", fill=(70, 90, 110))
            draw.text((245, 255), "14/05/1992", fill=(15, 30, 60))

            # PAN Card Number Box
            draw.rectangle([45, 370, 480, 440], fill=(245, 250, 255), outline=(100, 140, 180), width=2)
            draw.text((60, 380), "स्थायी लेखा संख्या / Permanent Account Number", fill=(80, 100, 130))
            draw.text((60, 405), pan_no, fill=(180, 40, 20))

            # Signature Box
            draw.rectangle([520, 370, 750, 440], fill=(255, 255, 255), outline=(150, 160, 180), width=1)
            draw.line([(540, 415), (600, 395), (660, 420), (730, 400)], fill=(20, 40, 90), width=2)
            draw.text((580, 425), "Signature", fill=(150, 160, 180))

            doc_buf = io.BytesIO()
            doc_im.save(doc_buf, format="JPEG", quality=92)
            selfie_buf = io.BytesIO()
            selfie_im.save(selfie_buf, format="JPEG", quality=90)

            return {
                "key": case_key,
                "title": "PAN Card: Valid Individual (P) Identity",
                "document_type": "PAN_CARD",
                "expected_outcome": "LOW",
                "mrz_text": "",
                "extracted_fields": {
                    "document_type": "PAN_CARD",
                    "document_number": "ABCPS1234D",
                    "full_name": "SHARMA RAJESH",
                    "father_name": "RAMESH SHARMA",
                    "dob": "14/05/1992",
                    "nationality": "IND"
                },
                "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
                "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
                "doc_bytes": doc_buf.getvalue(),
                "selfie_bytes": selfie_buf.getvalue()
            }

        elif case_key == "pan_forged":
            doc_im = Image.new("RGB", (width, height), color=(220, 235, 245))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 55], fill=(30, 85, 140))
            draw.text((220, 10), "आयकर विभाग | INCOME TAX DEPARTMENT", fill=(255, 255, 255))
            draw.text((310, 32), "भारत सरकार / GOVT. OF INDIA", fill=(200, 225, 255))

            draw.rectangle([45, 110, 215, 310], fill=(240, 245, 250), outline=(80, 120, 160), width=2)
            SampleFactory._draw_synthetic_face(draw, 60, 120, size=115, face_style="male_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            # Forged PAN: 4th char is 'X' (invalid entity) and 5th char 'Z' does not match surname 'Verma'
            pan_invalid = "ABCXZ9999K"
            draw.text((245, 115), "नाम / Name:", fill=(70, 90, 110))
            draw.text((245, 135), "VERMA AMIT", fill=(15, 30, 60))

            draw.text((245, 175), "पिता का नाम / Father's Name:", fill=(70, 90, 110))
            draw.text((245, 195), "SURESH VERMA", fill=(15, 30, 60))

            draw.text((245, 235), "जन्म की तारीख / Date of Birth:", fill=(70, 90, 110))
            draw.text((245, 255), "18/09/1995", fill=(15, 30, 60))

            # Tampered PAN Number Box
            draw.rectangle([45, 370, 480, 440], fill=(255, 240, 240), outline=(255, 80, 80), width=2)
            draw.text((60, 380), "स्थायी लेखा संख्या / Permanent Account Number", fill=(80, 100, 130))
            draw.text((60, 405), pan_invalid, fill=(220, 20, 20))

            doc_buf = io.BytesIO()
            doc_im.save(doc_buf, format="JPEG", quality=92)
            selfie_buf = io.BytesIO()
            selfie_im.save(selfie_buf, format="JPEG", quality=90)

            return {
                "key": case_key,
                "title": "PAN Card: Forged Structure (Invalid Entity)",
                "document_type": "PAN_CARD",
                "expected_outcome": "HIGH",
                "mrz_text": "",
                "extracted_fields": {
                    "document_type": "PAN_CARD",
                    "document_number": "ABCXZ9999K",
                    "full_name": "VERMA AMIT",
                    "father_name": "SURESH VERMA",
                    "dob": "18/09/1995",
                    "nationality": "IND"
                },
                "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
                "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
                "doc_bytes": doc_buf.getvalue(),
                "selfie_bytes": selfie_buf.getvalue()
            }

        # -------------------------------------------------------------
        # 3. VISA & IMMIGRATION STICKER CASES
        # -------------------------------------------------------------
        elif case_key == "visa_valid":
            doc_im = Image.new("RGB", (width, height), color=(248, 250, 240))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 60], fill=(20, 60, 45))
            draw.text((30, 15), "IMMIGRATION VISA / VISA DE SEJOUR", fill=(255, 255, 255))
            draw.text((30, 38), "CONSULAR AFFAIRS & BORDER CONTROL", fill=(180, 220, 195))

            draw.rectangle([35, 90, 205, 290], fill=(235, 240, 235), outline=(100, 140, 120), width=2)
            SampleFactory._draw_synthetic_face(draw, 50, 100, size=115, face_style="female_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="female_1")

            # Stamp
            draw.ellipse([540, 100, 720, 280], outline=(180, 60, 60), width=3)
            draw.text((575, 175), "VISA GRANTED", fill=(180, 60, 60))
            draw.text((585, 200), "ENTRY: MULTIPLE", fill=(180, 60, 60))

            v_no = "V9842019"
            draw.text((230, 100), "VISA NUMBER / NO DU VISA: " + v_no, fill=(180, 30, 30))
            draw.text((230, 135), "BEARER NAME: ERIKSSON, ANNA MARIA", fill=(20, 40, 30))
            draw.text((230, 170), "NATIONALITY: UTO", fill=(20, 40, 30))
            draw.text((230, 205), "VISA CLASS: B1/B2 BUSINESS & TOURIST", fill=(20, 40, 30))
            draw.text((230, 240), "VALID UNTIL: 20/09/2028", fill=(20, 40, 30))

            # 2-line TD2 Visa MRZ
            mrz_l1 = "V<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<"
            mrz_l2 = "V9842019<7UTO7408122F2809204<<<<<<<<<<<<<"
            draw.rectangle([0, 395, width, height], fill=(255, 255, 255), outline=(180, 190, 205), width=2)
            draw.text((30, 420), mrz_l1, fill=(20, 20, 20))
            draw.text((30, 460), mrz_l2, fill=(20, 20, 20))

            doc_buf = io.BytesIO()
            doc_im.save(doc_buf, format="JPEG", quality=92)
            selfie_buf = io.BytesIO()
            selfie_im.save(selfie_buf, format="JPEG", quality=90)

            return {
                "key": case_key,
                "title": "Visa Sticker: Valid Multiple-Entry",
                "document_type": "VISA_STICKER",
                "expected_outcome": "LOW",
                "mrz_text": f"{mrz_l1}\n{mrz_l2}",
                "extracted_fields": {
                    "document_type": "VISA",
                    "document_number": v_no,
                    "full_name": "ANNA MARIA ERIKSSON",
                    "dob": "12/08/1974",
                    "sex": "F",
                    "nationality": "UTO",
                    "expiry_date": "20/09/2028"
                },
                "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
                "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
                "doc_bytes": doc_buf.getvalue(),
                "selfie_bytes": selfie_buf.getvalue()
            }

        # -------------------------------------------------------------
        # 4. STANDARD PASSPORT CASES
        # -------------------------------------------------------------
        elif case_key == "clean_pass":
            title = "Passport: Genuine Valid Passport"
            name = "ERIKSSON, ANNA MARIA"
            doc_no = "L898902C3"
            nat = "UTO"
            dob_display = "12/08/1974"
            dob_mrz = "740812"
            sex = "F"
            exp_display = "15/04/2030"
            exp_mrz = "300415"

            doc_im = Image.new("RGB", (width, height), color=(242, 245, 250))
            draw = ImageDraw.Draw(doc_im)

            for i in range(0, width, 25):
                draw.line([(i, 0), (i + 150, height)], fill=(225, 232, 242), width=1)
                draw.line([(width - i, 0), (width - i - 150, height)], fill=(225, 232, 242), width=1)

            draw.rectangle([0, 0, width, 70], fill=(24, 43, 73))
            draw.text((30, 15), "PASSPORT / PASSEPORT", fill=(255, 255, 255))
            draw.text((30, 40), "GLOBAL BORDER CONTROL IDENTIFICATION SYSTEM", fill=(180, 200, 230))

            draw.rectangle([35, 100, 235, 340], fill=(230, 235, 245), outline=(100, 120, 150), width=2)
            SampleFactory._draw_synthetic_face(draw, 55, 115, size=130, face_style="female_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="female_1")

            d_chk = str(ICAO9303Validator.calculate_check_digit(doc_no))
            dob_chk = str(ICAO9303Validator.calculate_check_digit(dob_mrz))
            exp_chk = str(ICAO9303Validator.calculate_check_digit(exp_mrz))
            comp_data = doc_no + d_chk + dob_mrz + dob_chk + exp_mrz + exp_chk + "ZE184226B<<<<<1"
            comp_chk = str(ICAO9303Validator.calculate_check_digit(comp_data))

            mrz_l1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
            mrz_l2 = f"{doc_no}{d_chk}{nat}{dob_mrz}{dob_chk}{sex}{exp_mrz}{exp_chk}ZE184226B<<<<<1{comp_chk}"

        elif case_key == "altered_dob":
            title = "Passport: Forged DOB (Checksum Mismatch)"
            name = "GARCIA, CARLOS MIGUEL"
            doc_no = "P34829104"
            nat = "ESP"
            dob_display = "25/11/1999"
            dob_mrz = "991125"
            sex = "M"
            exp_display = "20/09/2029"
            exp_mrz = "290920"

            doc_im = Image.new("RGB", (width, height), color=(242, 245, 250))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 70], fill=(24, 43, 73))
            draw.text((30, 15), "PASSPORT / PASSEPORT", fill=(255, 255, 255))
            draw.text((30, 40), "GLOBAL BORDER CONTROL IDENTIFICATION SYSTEM", fill=(180, 200, 230))

            draw.rectangle([35, 100, 235, 340], fill=(230, 235, 245), outline=(100, 120, 150), width=2)
            SampleFactory._draw_synthetic_face(draw, 55, 115, size=130, face_style="male_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            draw.rectangle([440, 230, 580, 260], fill=(255, 255, 180), outline=(255, 50, 50), width=2)
            
            d_chk = str(ICAO9303Validator.calculate_check_digit(doc_no))
            dob_chk = "2" # Intentional check digit error
            exp_chk = str(ICAO9303Validator.calculate_check_digit(exp_mrz))

            mrz_l1 = "P<ESPGARCIA<<CARLOS<MIGUEL<<<<<<<<<<<<<<<<<<"
            mrz_l2 = f"{doc_no}{d_chk}{nat}{dob_mrz}{dob_chk}{sex}{exp_mrz}{exp_chk}<<<<<<<<<<<<<<<9"

        elif case_key == "swapped_photo":
            title = "Passport: Photo Swapped (Impersonator)"
            name = "JOHNSON, DAVID MARK"
            doc_no = "US7739102"
            nat = "USA"
            dob_display = "04/03/1985"
            dob_mrz = "850304"
            sex = "M"
            exp_display = "18/12/2028"
            exp_mrz = "281218"

            doc_im = Image.new("RGB", (width, height), color=(242, 245, 250))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 70], fill=(24, 43, 73))
            draw.text((30, 15), "PASSPORT / PASSEPORT", fill=(255, 255, 255))
            draw.text((30, 40), "GLOBAL BORDER CONTROL IDENTIFICATION SYSTEM", fill=(180, 200, 230))

            draw.rectangle([35, 100, 235, 340], fill=(230, 235, 245), outline=(100, 120, 150), width=2)
            SampleFactory._draw_synthetic_face(draw, 55, 115, size=130, face_style="female_1", is_tampered=True)
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_2")

            d_chk = str(ICAO9303Validator.calculate_check_digit(doc_no))
            dob_chk = str(ICAO9303Validator.calculate_check_digit(dob_mrz))
            exp_chk = str(ICAO9303Validator.calculate_check_digit(exp_mrz))

            mrz_l1 = "P<USAJOHNSON<<DAVID<MARK<<<<<<<<<<<<<<<<<<<<"
            mrz_l2 = f"{doc_no}{d_chk}{nat}{dob_mrz}{dob_chk}{sex}{exp_mrz}{exp_chk}<<<<<<<<<<<<<<<8"

        elif case_key == "blacklisted":
            title = "Passport: Interpol Red Notice (Watchlist)"
            name = "KOROLKOV, VIKTOR"
            doc_no = "RU9901428"
            nat = "RUS"
            dob_display = "14/06/1979"
            dob_mrz = "790614"
            sex = "M"
            exp_display = "10/10/2027"
            exp_mrz = "271010"

            doc_im = Image.new("RGB", (width, height), color=(242, 245, 250))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 70], fill=(24, 43, 73))
            draw.text((30, 15), "PASSPORT / PASSEPORT", fill=(255, 255, 255))
            draw.text((30, 40), "GLOBAL BORDER CONTROL IDENTIFICATION SYSTEM", fill=(180, 200, 230))

            draw.rectangle([35, 100, 235, 340], fill=(230, 235, 245), outline=(100, 120, 150), width=2)
            SampleFactory._draw_synthetic_face(draw, 55, 115, size=130, face_style="male_2")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_2")

            d_chk = str(ICAO9303Validator.calculate_check_digit(doc_no))
            dob_chk = str(ICAO9303Validator.calculate_check_digit(dob_mrz))
            exp_chk = str(ICAO9303Validator.calculate_check_digit(exp_mrz))

            mrz_l1 = "P<RUSKOROLKOV<<VIKTOR<<<<<<<<<<<<<<<<<<<<<<<"
            mrz_l2 = f"{doc_no}{d_chk}{nat}{dob_mrz}{dob_chk}{sex}{exp_mrz}{exp_chk}<<<<<<<<<<<<<<<2"

        else: # expired passport
            title = "Passport: Expired Travel Document"
            name = "SHARMA, ROHIT"
            doc_no = "Z19482031"
            nat = "IND"
            dob_display = "08/11/1990"
            dob_mrz = "901108"
            sex = "M"
            exp_display = "12/01/2024"
            exp_mrz = "240112"

            doc_im = Image.new("RGB", (width, height), color=(242, 245, 250))
            draw = ImageDraw.Draw(doc_im)

            draw.rectangle([0, 0, width, 70], fill=(24, 43, 73))
            draw.text((30, 15), "PASSPORT / PASSEPORT", fill=(255, 255, 255))
            draw.text((30, 40), "GLOBAL BORDER CONTROL IDENTIFICATION SYSTEM", fill=(180, 200, 230))

            draw.rectangle([35, 100, 235, 340], fill=(230, 235, 245), outline=(100, 120, 150), width=2)
            SampleFactory._draw_synthetic_face(draw, 55, 115, size=130, face_style="male_1")
            SampleFactory._draw_synthetic_face(selfie_draw, 90, 70, size=140, face_style="male_1")

            d_chk = str(ICAO9303Validator.calculate_check_digit(doc_no))
            dob_chk = str(ICAO9303Validator.calculate_check_digit(dob_mrz))
            exp_chk = str(ICAO9303Validator.calculate_check_digit(exp_mrz))

            mrz_l1 = "P<INDSHARMA<<ROHIT<<<<<<<<<<<<<<<<<<<<<<<<<<"
            mrz_l2 = f"{doc_no}{d_chk}{nat}{dob_mrz}{dob_chk}{sex}{exp_mrz}{exp_chk}<<<<<<<<<<<<<<<6"

        fields = [
            ("Type / Type", "P"),
            ("Country Code / Pays", nat),
            ("Passport No. / No du Passeport", doc_no),
            ("Surname / Nom", name.split(",")[0].strip()),
            ("Given Names / Prenoms", name.split(",")[1].strip() if "," in name else ""),
            ("Nationality / Nationalite", nat),
            ("Date of Birth / Date de Naissance", dob_display),
            ("Sex / Sexe", sex),
            ("Date of Expiry / Date d'expiration", exp_display)
        ]

        start_x, start_y = 260, 95
        line_height = 27
        for idx, (label, val) in enumerate(fields):
            draw.text((start_x, start_y + idx * line_height), label.upper(), fill=(110, 125, 145))
            draw.text((start_x + 220, start_y + idx * line_height), val, fill=(15, 25, 45))

        draw.rectangle([0, 395, width, height], fill=(255, 255, 255), outline=(180, 190, 205), width=2)
        draw.text((30, 420), mrz_l1, fill=(20, 20, 20))
        draw.text((30, 460), mrz_l2, fill=(20, 20, 20))

        doc_buf = io.BytesIO()
        doc_im.save(doc_buf, format="JPEG", quality=92)
        selfie_buf = io.BytesIO()
        selfie_im.save(selfie_buf, format="JPEG", quality=90)

        return {
            "key": case_key,
            "title": title,
            "document_type": "PASSPORT",
            "expected_outcome": "LOW" if case_key == "clean_pass" else ("REVIEW" if case_key == "expired" else "HIGH"),
            "mrz_text": f"{mrz_l1}\n{mrz_l2}",
            "extracted_fields": {
                "document_type": "PASSPORT",
                "document_number": doc_no,
                "full_name": name.replace(",", " "),
                "dob": dob_display,
                "sex": sex,
                "nationality": nat,
                "expiry_date": exp_display
            },
            "doc_image_base64": f"data:image/jpeg;base64,{base64.b64encode(doc_buf.getvalue()).decode('utf-8')}",
            "selfie_image_base64": f"data:image/jpeg;base64,{base64.b64encode(selfie_buf.getvalue()).decode('utf-8')}",
            "doc_bytes": doc_buf.getvalue(),
            "selfie_bytes": selfie_buf.getvalue()
        }
