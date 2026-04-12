# VibeOnJob — AI Resume Gap Analyzer

**VibeOnJob** is a full-stack AI-powered resume analysis tool that compares your resume against any job description using a 6-layer NLP+LLM pipeline. It produces semantic match scores, ATS keyword coverage, prioritised skill gaps, concrete resume rewrite suggestions, and a personalised learning roadmap.

## Architecture

```
vibeonjob/
├── backend/          ← FastAPI + Python
│   ├── main.py       ← App entry point
│   ├── api/          ← Routes, auth
│   ├── models/       ← SQLModel models (Neon Postgres)
│   ├── services/     ← NLP pipeline services
│   ├── uploads/      ← Stored resume files
│   └── .env          ← Backend secrets
├── frontend/         ← React + Vite
│   ├── src/          ← React components
│   └── .env.local    ← Frontend config
└── README.md
```

### Analysis Pipeline (6 Layers)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 1 | PyMuPDF / python-docx | Document parsing (PDF/DOCX → text) |
| 2 | spaCy NER + noun chunks | Entity/skill extraction |
| 2.5 | Regex frequency counter | ATS keyword density analysis |
| 3 | MiniLM (sentence-transformers) | 384-dim dense vector embeddings |
| 4 | SciPy Hungarian algorithm | Optimal bipartite skill matching |
| 5 | Google Gemini 2.5 Flash | Structured career advice generation |

### Authentication Flow

1. User signs up via `/signup` → backend hashes password with bcrypt, returns JWT
2. User logs in via `/login` → backend verifies password, returns JWT
3. Frontend stores JWT in `localStorage`, sends it with every API request
4. Backend verifies JWT on protected routes → grants access

---

## Prerequisites

- **Python** 3.11+
- **Node.js** 18+ and npm
- A **Neon** account (free tier at [neon.tech](https://neon.tech))
- **Tesseract OCR** (optional, for scanned PDF support)

---

## Backend Setup

### 1. Navigate to the backend

```bash
cd backend
```

### 2. Create a Python virtual environment

```bash
python -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 4. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Name your database `vibeonjob`
3. Copy the connection string from the Neon dashboard

### 5. Configure environment variables

```bash
cp .env.example .env
```

Edit `backend/.env` with your actual values:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/vibeonjob?sslmode=require
JWT_SECRET=some-long-random-secret-string
GOOGLE_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### 6. Start the backend server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Tables are created automatically on first startup.

---

## Frontend Setup

### 1. Navigate to the frontend

```bash
cd frontend
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Create account (email, password, first_name) |
| `POST` | `/api/auth/login` | ❌ | Sign in (email, password) → returns JWT |
| `POST` | `/api/analyze` | ✅ JWT | Upload resume + JD, run full pipeline |
| `GET` | `/api/dashboard-data` | ✅ JWT | User welcome data + analysis count |
| `GET` | `/api/analyses` | ✅ JWT | List all past analyses |
| `GET` | `/api/analyses/{id}` | ✅ JWT | Get a specific past analysis |

---

## Production Deployment

### Backend

```bash
cd backend
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx, Vercel, Netlify, etc.
```

### Environment Variables for Production

- `DATABASE_URL` → your Neon Postgres connection string
- `JWT_SECRET` → a strong, unique secret (use `openssl rand -hex 32`)
- `FRONTEND_URL` → your production frontend domain (for CORS)
- `VITE_API_URL` → your production backend URL

---

## Project Structure (Backend Detail)

```
backend/
├── main.py                  # FastAPI app, lifespan, CORS, routers
├── requirements.txt         # Python dependencies
├── .env                     # Secrets (git-ignored)
├── .env.example             # Template for secrets
├── uploads/                 # Stored resume files
├── api/
│   ├── __init__.py
│   ├── auth.py              # Register + Login endpoints
│   ├── deps.py              # get_current_user (JWT verification)
│   └── routes.py            # /analyze, /dashboard-data, /analyses
├── models/
│   ├── __init__.py
│   ├── database.py          # SQLModel engine + Neon Postgres session
│   ├── user.py              # User model (email + password_hash)
│   ├── resume.py            # Resume file metadata model
│   ├── analysis.py          # Analysis result history model
│   └── schemas.py           # Pydantic response schemas
└── services/
    ├── __init__.py
    ├── parser.py             # PDF/DOCX → text
    ├── entity_extractor.py   # spaCy NER + noun chunks
    ├── keyword_analyzer.py   # ATS frequency analysis
    ├── nlp_scorer.py         # MiniLM embeddings + Hungarian matching
    └── llm_analyzer.py       # Gemini LLM presentation layer
```

---

## License

This project is for educational and portfolio purposes.
