"""
user.py — User model (SQLModel)

Stores user credentials and profile data.
"""

from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    first_name: Optional[str] = None
    username: Optional[str] = None
