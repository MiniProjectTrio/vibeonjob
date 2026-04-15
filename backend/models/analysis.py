"""
analysis.py — Analysis result history model (SQLModel)

Persists every resume analysis run so users can review past results.
Complex nested data (matched_skills, gaps, etc.) is stored as JSON strings.
"""

import json
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text


class Analysis(SQLModel, table=True):
    __tablename__ = "analyses"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    resume_id: int = Field(foreign_key="resumes.id", index=True)
    job_description: str = Field(sa_column=Column(Text))
    match_score: float = 0.0
    ats_score: float = 0.0
    matched_skills_json: str = Field(default="[]", sa_column=Column(Text))
    missing_skills_json: str = Field(default="[]", sa_column=Column(Text))
    gaps_json: str = Field(default="[]", sa_column=Column(Text))
    improvements_json: str = Field(default="[]", sa_column=Column(Text))
    learning_path_json: str = Field(default="[]", sa_column=Column(Text))
    keyword_suggestions_json: str = Field(default="[]", sa_column=Column(Text))
    recommended_resources_json: str = Field(default="[]", sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # ── Convenience properties to deserialise JSON fields ─────────────────

    @property
    def matched_skills(self) -> list:
        return json.loads(self.matched_skills_json)

    @property
    def missing_skills(self) -> list:
        return json.loads(self.missing_skills_json)

    @property
    def gaps(self) -> list:
        return json.loads(self.gaps_json)

    @property
    def improvements(self) -> list:
        return json.loads(self.improvements_json)

    @property
    def learning_path(self) -> list:
        return json.loads(self.learning_path_json)

    @property
    def keyword_suggestions(self) -> list:
        return json.loads(self.keyword_suggestions_json)

    @property
    def recommended_resources(self) -> list:
        return json.loads(self.recommended_resources_json)
