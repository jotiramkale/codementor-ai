"""
app/auth/security.py

Real password hashing (argon2, via passlib) and real JWT encode/decode
(via python-jose) — genuinely functional code, not stubs, because
neither needs a running database to work correctly. This is what the
frontend's authService.js has been simulating since Phase 3: never
storing a plaintext password, and a signed token instead of a raw
session object.

The frontend currently keeps its mock session in localStorage (see
authService.js's own comment on why that's fine for a mock but not the
real plan). Once this backend is live, the real token from
create_access_token() below should be kept in an httpOnly cookie, not
localStorage — this file doesn't decide where the frontend stores it,
but it's worth restating here since this is the file that makes the
real security property (a cookie JS can't read) actually meaningful.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# argon2 chosen to match the spec's "secure password hashing such as
# Argon2 or bcrypt" — either is fine; argon2 is the more modern default.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, role: str, expires_minutes: int | None = None) -> str:
    """
    `subject` is the user id (as a string) — the JWT `sub` claim.
    `role` is included so route dependencies can check admin access
    without a database round-trip on every request.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes if expires_minutes is not None else settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Returns the decoded payload, or None if the token is invalid/expired."""
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
