"""
auth.py — Registration & Login Endpoints

Simple email+password auth. Returns a JWT on success.
"""

import os
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt
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


# ── Request schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str | None = None

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
        password_hash=bcrypt.hash(body.password),
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
    if not user or not bcrypt.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "token": _create_token(user.id, user.email),
        "user": {"id": user.id, "email": user.email, "first_name": user.first_name},
    }
