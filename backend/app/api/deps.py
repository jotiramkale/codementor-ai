"""
app/api/deps.py

Shared FastAPI dependencies. get_current_user mirrors the frontend's
ProtectedRoute.jsx (Phase 3); get_current_admin_user mirrors
AdminRoute.jsx (Phase 18) — the same two-guard split as the frontend,
now enforced server-side where it actually matters. The frontend's
guards are real for UX (hiding pages, redirecting), but only a
server-side check like this one is a real security boundary — a
student inspecting network requests could bypass any frontend-only
check trivially.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/signin")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise credentials_error

    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise credentials_error

    return user


def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
