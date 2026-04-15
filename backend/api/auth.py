"""
auth.py — Registration & Login Endpoints

Simple email+password auth. Returns a JWT on success.
"""

import os
import jwt
import bcrypt
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from models.database import get_session
from models.user import User

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


def _create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _get_password_hash(password: str) -> str:
    # Pre-hash with SHA-256 to support passwords > 72 bytes
    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_hash.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return bcrypt.checkpw(pw_hash.encode("utf-8"), hashed_password.encode("utf-8"))


# ── Request schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register")
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    # Check if email already taken
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=_get_password_hash(body.password),
        first_name=body.first_name,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "token": _create_token(user.id, user.email),
        "user": {"id": user.id, "email": user.email, "first_name": user.first_name},
    }


@router.post("/login")
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "token": _create_token(user.id, user.email),
        "user": {"id": user.id, "email": user.email, "first_name": user.first_name},
    }
