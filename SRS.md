# Software Requirements Specification (SRS)
**Project Name:** VibeOnJob — Hybrid AI Resume Analyzer  
**Version:** 2.0  

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive software requirement specification for the "VibeOnJob" application. It describes the 5-layer hybrid processing pipeline, system features, external interfaces, and non-functional requirements.

### 1.2 Scope
VibeOnJob is an entity-level semantic matching engine that evaluates a candidate's resume against a target job description. It uses Named Entity Recognition, dense vector embeddings, and optimal bipartite matching (Hungarian algorithm) to produce a mathematically provable match score, then employs a constrained LLM for human-readable presentation.

---

## 2. Overall Description

### 2.1 Product Perspective
VibeOnJob operates as a self-contained monolith: an async FastAPI backend with a lightweight vanilla JS frontend. External dependency is limited to Google Generative AI (Gemini) for the presentation layer only.

### 2.2 User Classes
- **Job Seekers:** Upload resumes and receive quantified skill gap analysis with learning paths.
- **Recruiters / Evaluators:** Audit resumes with mathematically verifiable match scores independent of LLM hallucination.

---

## 3. System Features — 5-Layer Pipeline

### 3.1 Layer 1: Document Parsing Engine
- **Description:** Extracts raw text from uploaded binary documents.
- **Inputs:** `.pdf` and `.docx` files.
- **Processing:** PyMuPDF for PDF streams, python-docx for Word documents. All processing occurs in-memory via `BytesIO` — files are never written to disk.

### 3.2 Layer 2: Named Entity Recognition (NER)
- **Description:** Extracts only skills, tools, and concepts from both documents.
- **Processing:** Dual-strategy extraction:
  1. **Domain Vocabulary Matching:** A curated set of 100+ tech terms matched via regex word boundaries.
  2. **spaCy NER + Noun Chunks:** Named entities (ORG, PRODUCT) and short noun chunks captured for broader coverage.
- **Output:** Two deduplicated entity lists: `jd_entities[]` and `resume_entities[]`.
- **Rationale:** Dimensionality reduction — eliminates narrative filler and focuses on quantifiable data points.

### 3.3 Layer 3: Dense Vector Embeddings
- **Description:** Converts entity strings into 384-dimensional dense vectors using a local transformer model.
- **Model:** `all-MiniLM-L6-v2` via the `sentence-transformers` library.
- **Processing:** Runs locally on CPU. Understands semantic relationships (e.g., "React" ≈ "Frontend Framework").
- **Output:** Two NumPy matrices of shape `(n, 384)` and `(m, 384)`.

### 3.4 Layer 4: Cosine Similarity Matrix + Hungarian Algorithm
- **Description:** Computes optimal 1:1 alignment between JD requirements and candidate skills.
- **Processing:**
  1. Full cosine similarity matrix `(n × m)` computed via `sklearn.metrics.pairwise.cosine_similarity`.
  2. Cost matrix `(1 - similarity)` passed to `scipy.optimize.linear_sum_assignment` (Hungarian algorithm).
  3. Matches above configurable threshold (default 0.45) are retained.
- **Output:** `match_score` (float, 0-100), `matched_skills[]`, `missing_skills[]`.
- **Rationale:** Optimal bipartite matching provides the mathematically best alignment, not greedy or heuristic.

### 3.5 Layer 5: LLM Presentation Layer
- **Description:** Translates pre-computed structured arrays into human-readable career analysis.
- **Input:** Only structured data: `jd_requirements`, `candidate_skills`, `matched_skills`, `missing_skills`, `match_score`. Raw resume/JD text is **never** passed to the LLM.
- **Processing:** Google Gemini 2.5 Flash generates structured JSON containing gap analysis, resume improvements, and learning paths.
- **Output Validation:** Match score and skill arrays are overridden from computed values post-LLM to prevent hallucination.

---

## 4. External Interface Requirements

### 4.1 User Interface
- Single Page Application served directly by FastAPI's `StaticFiles`.
- Features: animated Chart.js doughnut gauge, skill alignment table with similarity bars, missing skill chips, drag-and-drop file upload, glassmorphic design.

### 4.2 API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Accepts `resume` (file) and `job_description` (form text). Returns `AnalysisResponse` JSON. |

### 4.3 External Services
- **Google Generative AI:** Outbound HTTPS to `generativelanguage.googleapis.com`. Authenticated via `GOOGLE_API_KEY` environment variable.
- **HuggingFace Model Hub:** One-time HTTPS download of `all-MiniLM-L6-v2` (~80MB). Cached locally after first run.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Layers 1-4 (parsing through Hungarian matching) must complete in under 1 second on standard hardware.
- Layer 5 (LLM) adds 2-5 seconds depending on network latency.
- Embedding model loads once at startup; subsequent requests reuse the in-memory model.

### 5.2 Security & Data Privacy
- Uploaded files are processed entirely in-memory (`BytesIO`). No PII is persisted to disk.
- Raw document text is never sent to external APIs. Only extracted entity arrays are sent to the LLM.
- CORS middleware is configured for cross-origin access control.

### 5.3 Reliability & Fault Tolerance
- spaCy model auto-downloads if missing at startup.
- Embedding model auto-downloads from HuggingFace on first run.
- LLM output is post-processed: mathematical values are always overridden from local computation, preventing hallucinated scores.

### 5.4 Observability
- Python `logging` module with multi-level severity (DEBUG, INFO, WARNING, ERROR).
- HTTP middleware logs request method, path, and response time for every request.
- Each pipeline layer logs entry, exit, and key metrics (entity counts, vector shapes, similarity values).
