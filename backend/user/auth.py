import os
import time
import hmac
import json
import base64
import hashlib

SECRET = os.getenv("SECRET_KEY", "dev-secret-key")
_SECRET_BYTES = SECRET.encode("utf-8")


def _b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64u_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return (salt + dk).hex()


def verify_password(password: str, stored_hex: str) -> bool:
    raw = bytes.fromhex(stored_hex)
    salt = raw[:16]
    expected = raw[16:]
    got = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return hmac.compare_digest(got, expected)


def _sign(message: bytes) -> bytes:
    return hmac.new(_SECRET_BYTES, message, hashlib.sha256).digest()


def create_access_token(subject: str | int, expires_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": str(subject), "exp": int(time.time()) + expires_seconds}
    header_b64 = _b64u(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = _sign(signing_input)
    return f"{header_b64}.{payload_b64}.{_b64u(sig)}"


def decode_access_token(token: str) -> dict:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
    except ValueError:
        raise ValueError("Invalid token format")

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = _b64u_decode(sig_b64)
    expected = _sign(signing_input)
    if not hmac.compare_digest(sig, expected):
        raise ValueError("Invalid token signature")

    payload = json.loads(_b64u_decode(payload_b64).decode("utf-8"))
    exp = payload.get("exp")
    if exp is None or int(time.time()) > int(exp):
        raise ValueError("Token expired")
    return payload
