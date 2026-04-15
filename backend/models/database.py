"""
database.py — SQLModel Engine & Session Configuration (MySQL)

Reads DATABASE_URL from environment. Falls back to a local MySQL default.
Uses pymysql as the MySQL driver.
"""

import os
from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@ep-example.us-east-2.aws.neon.tech/vibeonjob?sslmode=require"
)

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    """Create all SQLModel tables. Called once on app startup."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency that yields a SQLModel Session."""
    with Session(engine) as session:
        yield session
