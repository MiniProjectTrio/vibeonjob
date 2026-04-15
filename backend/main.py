"""
main.py — FastAPI Application Entry Point

Initialises the app, CORS, database tables, and mounts all routers.
Run with:  cd backend && uvicorn main:app --reload
"""

import os
import logging
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from models.database import create_db_and_tables
from api.routes import router as api_router
from api.auth import router as auth_router


# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger("vibeonjob.main")


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables (if not exist)...")
    create_db_and_tables()
    logger.info("Database tables ready.")
    yield


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="VibeOnJob API",
    description="Hybrid NLP+LLM Resume Gap Analyzer",
    lifespan=lifespan,
)


# ── Request logging middleware ───────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Incoming Request: {request.method} {request.url.path}")
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        f"Outgoing Response: {response.status_code} for {request.url.path} "
        f"(took {process_time:.4f}s)"
    )
    return response


# ── CORS ─────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/auth")
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
