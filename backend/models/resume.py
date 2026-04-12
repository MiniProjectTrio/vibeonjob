"""
resume.py — Resume file storage model (SQLModel)

Each uploaded resume is stored on disk. This model tracks its metadata
and links it back to the user who uploaded it.
"""

from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Resume(SQLModel, table=True):
    __tablename__ = "resumes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    filename: str
    file_path: str              # Relative path on disk, e.g. "uploads/abc123.pdf"
    file_size: int              # Bytes
    content_type: str           # MIME type, e.g. "application/pdf"
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
