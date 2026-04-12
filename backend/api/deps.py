"""
deps.py — FastAPI Auth Dependencies

Verifies our own JWT tokens from the Authorization header.
Returns the authenticated User from the database.
"""

import os
import jwt
from fastapi import Request, HTTPException, Depends
from sqlmodel import Session, select
from models.database import get_session
from models.user import User

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"


def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
) -> User:
    """Extract JWT from Authorization header, decode it, return the User."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")

    user = session.exec(select(User).where(User.id == int(user_id))).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
