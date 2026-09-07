import os
import requests
import json
from typing import Dict, Any

class SMSService:
    """
    Real-Time SMS Gateway Service for Indian & Global Mobile Phone OTP Delivery.
    Supported Providers:
    1. Fast2SMS (Free / Instant Indian SMS API - https://www.fast2sms.com)
    2. Twilio (Global SMS API - https://www.twilio.com)
    3. Live Simulation Fallback (with on-screen carrier message)
    """

    @classmethod
    def send_otp_sms(cls, mobile_number: str, otp_code: str) -> Dict[str, Any]:
        """
        Sends real physical SMS OTP to the citizen mobile number.
        """
        clean_mobile = mobile_number.strip().replace(" ", "").replace("-", "")
        # Strip leading +91 or 0 for 10-digit Indian numbers
        if clean_mobile.startswith("+91"):
            clean_mobile = clean_mobile[3:]
        elif clean_mobile.startswith("91") and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]
        elif clean_mobile.startswith("0") and len(clean_mobile) == 11:
            clean_mobile = clean_mobile[1:]

        fast2sms_key = os.environ.get("FAST2SMS_API_KEY", "").strip()
        twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
        twilio_token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
        twilio_from = os.environ.get("TWILIO_PHONE_NUMBER", "").strip()

        # ── 1. Fast2SMS Provider (India) ──
        if fast2sms_key and len(clean_mobile) == 10 and clean_mobile.isdigit():
            try:
                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "variables_values": otp_code,
                    "route": "otp",
                    "numbers": clean_mobile
                }
                headers = {
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json"
                }
                response = requests.post(url, json=payload, headers=headers, timeout=8)
                res_data = response.json()
                if res_data.get("return") is True:
                    return {
                        "success": True,
                        "provider": "FAST2SMS_INDIA",
                        "real_sms_sent": True,
                        "message": f"Real SMS OTP successfully delivered to +91 {clean_mobile} via Fast2SMS Telecom Gateway."
                    }
                else:
                    error_msg = res_data.get("message", ["Delivery failed"])[0] if isinstance(res_data.get("message"), list) else str(res_data.get("message"))
                    print(f"Fast2SMS API notice: {error_msg}")
            except Exception as e:
                print(f"Fast2SMS error: {str(e)}")

        # ── 2. Twilio Provider (Global) ──
        if twilio_sid and twilio_token and twilio_from:
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                target_phone = f"+91{clean_mobile}" if len(clean_mobile) == 10 else f"+{clean_mobile}"
                data = {
                    "From": twilio_from,
                    "To": target_phone,
                    "Body": f"Government of India (DigiLocker): Your OTP for Aadhaar/ID identity verification is {otp_code}. Valid for 10 mins."
                }
                response = requests.post(url, data=data, auth=(twilio_sid, twilio_token), timeout=8)
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "provider": "TWILIO_GLOBAL",
                        "real_sms_sent": True,
                        "message": f"Real SMS OTP dispatched to {target_phone} via Twilio Gateway."
                    }
            except Exception as e:
                print(f"Twilio error: {str(e)}")

        # ── 3. Live Notification Carrier Fallback ──
        return {
            "success": True,
            "provider": "LOCAL_GATEWAY_SIMULATOR",
            "real_sms_sent": False,
            "message": f"Live OTP {otp_code} generated for +91 {clean_mobile}.",
            "setup_hint": "To send actual physical SMS to your phone, set FAST2SMS_API_KEY in backend/.env"
        }
