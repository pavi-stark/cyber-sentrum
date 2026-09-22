import os
import time
import hmac
import hashlib
import json
import base64
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Secret key for Cryptographic JWT Token Signing (Configurable via ENV)
SECRET_KEY = os.environ.get("CYBER_SENTRY_SECRET_KEY", "CYBER_SENTRY_GOV_2026_SECURE_HMAC_SHA256_KEY_26188")
TOKEN_EXPIRY_SECONDS = 86400  # 24 Hours

security_bearer = HTTPBearer(auto_error=False)

# ── 1. Cryptographic Token Generator & Validator ─────────────────────────────
class TokenSecurity:
    @staticmethod
    def _b64_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    @staticmethod
    def _b64_decode(data_str: str) -> bytes:
        padding = 4 - (len(data_str) % 4)
        if padding != 4:
            data_str += '=' * padding
        return base64.urlsafe_b64decode(data_str)

    @classmethod
    def generate_token(cls, payload: Dict[str, Any]) -> str:
        """Generates a tamper-proof signed JWT Bearer token with 24h validity."""
        header = {"alg": "HS256", "typ": "JWT"}
        payload_data = payload.copy()
        payload_data["exp"] = int(time.time()) + TOKEN_EXPIRY_SECONDS
        payload_data["iat"] = int(time.time())

        header_b64 = cls._b64_encode(json.dumps(header).encode('utf-8'))
        payload_b64 = cls._b64_encode(json.dumps(payload_data).encode('utf-8'))

        signature = hmac.new(
            SECRET_KEY.encode('utf-8'),
            f"{header_b64}.{payload_b64}".encode('utf-8'),
            hashlib.sha256
        ).digest()
        sig_b64 = cls._b64_encode(signature)

        return f"{header_b64}.{payload_b64}.{sig_b64}"

    @classmethod
    def verify_token(cls, token: str) -> Optional[Dict[str, Any]]:
        """Verifies JWT token signature and expiration integrity."""
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None
            header_b64, payload_b64, sig_b64 = parts

            expected_sig = hmac.new(
                SECRET_KEY.encode('utf-8'),
                f"{header_b64}.{payload_b64}".encode('utf-8'),
                hashlib.sha256
            ).digest()

            if not hmac.compare_digest(cls._b64_encode(expected_sig), sig_b64):
                return None

            payload = json.loads(cls._b64_decode(payload_b64).decode('utf-8'))
            if payload.get("exp", 0) < int(time.time()):
                return None  # Expired

            return payload
        except Exception:
            return None


# ── 2. Request Throttling & DDoS Protection (Rate Limiting) ─────────────────
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Limits requests to 120 requests/minute per client IP to protect against
    brute-force attacks, credential stuffing, and volumetric denial of service.
    """
    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_history: Dict[str, list] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        current_time = time.time()

        # Clean old timestamps
        if client_ip in self.request_history:
            self.request_history[client_ip] = [
                t for t in self.request_history[client_ip]
                if current_time - t < self.window_seconds
            ]
        else:
            self.request_history[client_ip] = []

        if len(self.request_history[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Real-time security layer rate limit triggered (120 req/min). Please wait a moment."
                }
            )

        self.request_history[client_ip].append(current_time)
        return await call_next(request)


# ── 3. Security Headers Enforcement Middleware ──────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects enterprise military-grade HTTP security headers for all API & web responses.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=()"
        response.headers["X-Powered-By"] = "CyberSentry-AI-Defense"
        return response


# ── 4. Input Sanitization & Anti-Injection Guard ────────────────────────────
class InputSanitizer:
    DANGEROUS_PATTERNS = [
        "<script", "</script>", "javascript:", "onload=", "onerror=",
        "UNION SELECT", "DROP TABLE", "--", "exec(", "eval("
    ]

    @classmethod
    def sanitize_string(cls, val: str) -> str:
        if not val or not isinstance(val, str):
            return val
        sanitized = val.strip()
        for p in cls.DANGEROUS_PATTERNS:
            if p.lower() in sanitized.lower():
                sanitized = sanitized.replace(p, "")
        return sanitized
