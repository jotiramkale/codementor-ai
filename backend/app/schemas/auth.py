"""
app/schemas/auth.py

Request/response shapes for authentication.

IMPORTANT SECURITY NOTE: unlike the frontend's demo authService.js,
SignUpRequest below has NO is_admin or role field. The frontend's
"Sign up as admin (demo)" checkbox only works there because nothing
checks it against anything real — it's a demo convenience with no
backend to lie to. A real backend must never let the client grant
itself privileges by including a field in a request; that's a textbook
privilege-escalation bug. Making someone an admin has to happen through
a trusted, server-side path (e.g. a database update performed by an
existing admin, or a separate invite-only endpoint) — never a value
read straight from what the client submitted. This is one of the
clearest real differences between a demo shortcut and production
security, so it's called out here rather than silently "fixed" by
just leaving the field off without explanation.
"""

from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
