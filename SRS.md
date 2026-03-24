# Software Requirements Specification (SRS)
**Project Name:** VibeOnJob AI Resume Analyzer  
**Version:** 1.0  

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive software requirement specification for the "VibeOnJob" application. It describes the scope, use cases, structural architecture, and non-functional requirements vital for the hybrid NLP+LLM platform.

### 1.2 Scope
VibeOnJob is an intelligent assessment platform designed for technical recruiters and job seekers. The platform accepts a user's resume (PDF/DOCX) alongside a target Job Description. It performs mathematical NLP comparisons and utilizes an LLM to generate qualitative resume improvements, identified gaps, and a targeted learning path.

---

## 2. Overall Description

### 2.1 Product Perspective
VibeOnJob operates as a self-contained monolith featuring an asynchronous backend (FastAPI) and a lightweight, vanilla client-side frontend utilizing a Glassmorphism design pattern. It interfaces externally with Google's Generative AI service (Gemini).

### 2.2 User Classes and Characteristics
- **Job Seekers:** Users seeking actionable advice on modifying their resumes and discovering technical skills needed for specific roles.
- **Recruiters / Evaluators:** Users auditing resumes en-masse to identify technical match percentages independently of LLM hallucinatory guesses.

---

## 3. System Features

### 3.1 Feature 1: Document Parsing Engine
- **Description:** System reliably extracts raw text strings from uploaded binaries.
- **Inputs:** `.pdf` and `.docx` files.
- **Logic:** PyMuPDF parses streams entirely in-memory. Fallback to `python-docx` for MS Word equivalents.

### 3.2 Feature 2: Deterministic Match Scoring (NLP)
- **Description:** System evaluates text overlap mathematically to provide a verifiable anchor score.
- **Logic:** Utilizes `scikit-learn`'s `TfidfVectorizer` to compute term frequency across the Job Description and Resume. Employs `cosine_similarity` to yield a strict 0-100% boundary match. 

### 3.3 Feature 3: Contextual Reasoning LLM Integration
- **Description:** Generates qualitative improvement data via a Large Language Model.
- **Inputs:** The extracted text array and the calculated TF-IDF Match Score vector.
- **Logic:** System restricts output strictly to a predefined JSON schema holding relational nodes for `gaps`, `improvements`, and `learning_path`.

### 3.4 Feature 4: Comprehensive Observability
- **Description:** The system tracks user actions and pipeline latency for debugging and evaluation audibility.
- **Logic:** Request middleware tracks response times. Root `logging` mechanism traces file type detection, NER keyword extraction hit-counts, and API payload transactions across multi-level severity bands (INFO, DEBUG, ERROR).

---

## 4. External Interface Requirements

### 4.1 UI Component Architecture
- **Web Interface:** Single Page Application (SPA) natively mounted to the FastAPI router. Features an animated `Chart.js` Doughnut Gauge metric overlay, dragging-and-dropping APIs, CSS3 gradients, and blurred panel depth manipulation.

### 4.2 Application Programming Interfaces
- **Google Generative AI:** Requires bidirectional API access to `gemini-2.5-flash` model via HTTP. Secured logic validated implicitly via `.env` or system var `GOOGLE_API_KEY`.

---

## 5. Non-Functional Requirements

### 5.1 Performance Criteria
- Text stream parsing and TF-IDF calculation cycle must terminate in under 500ms.
- End-to-end processing (including external LLM latency constraint) should resolve within roughly 3 to 6 seconds under standard gigabit network conditions.

### 5.2 Security & Compliance
- The application isolates process contexts. Uploads are maintained implicitly in runtime `BytesIO` streams. Resumes must **never** be written or flushed to the local hard-disk, resolving significant PII and data-retention vulnerabilities.
- FastAPI automatically routes to a highly-restrictive generalized CORS middleware interface.

### 5.3 Reliability & Fault Tolerance
- If the required downstream NLP package (`en_core_web_sm`) is unresolvable upon thread spawn, the `nlp_scorer.py` module traps the fatal `OSError` and triggers an automated hot-download routine over HTTP to ensure 100% uptime initialization.
