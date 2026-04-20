# VibeOnJob — UML Diagrams & Flowcharts

> All diagrams use [Mermaid](https://mermaid.js.org/) syntax.

---

## Table of Contents

1. [System Architecture — Component Diagram](#1-system-architecture--component-diagram)
2. [6-Layer Analysis Pipeline — Flowchart](#2-6-layer-analysis-pipeline--flowchart)
3. [Class Diagram — Backend Services](#3-class-diagram--backend-services)
4. [Class Diagram — Data Models](#4-class-diagram--data-models)
5. [Class Diagram — Pydantic Schemas](#5-class-diagram--pydantic-schemas)
6. [Sequence Diagram — Resume Analysis Flow](#6-sequence-diagram--resume-analysis-flow)
7. [Sequence Diagram — Authentication Flow](#7-sequence-diagram--authentication-flow)
8. [Activity Diagram — Document Parsing (Layer 1)](#8-activity-diagram--document-parsing-layer-1)
9. [Activity Diagram — LLM Engine Retry & Fallback](#9-activity-diagram--llm-engine-retry--fallback)
10. [State Diagram — Analysis Lifecycle](#10-state-diagram--analysis-lifecycle)
11. [ER Diagram — Database Schema](#11-er-diagram--database-schema)
12. [Deployment Diagram](#12-deployment-diagram)
13. [Use Case Diagram](#13-use-case-diagram)
14. [Frontend Component Tree](#14-frontend-component-tree)
15. [Data Flow Diagram — Full Pipeline](#15-data-flow-diagram--full-pipeline)

---

## 1. System Architecture — Component Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        LP[LandingPage]
        AUTH_UI[Login / Signup Pages]
        DASH[Dashboard]
        AP[AnalyzePanel]
        AR[AnalysisResults]
        AH[AnalysisHistory]
        CTX[AuthContext]
    end

    subgraph Backend["Backend (FastAPI)"]
        MAIN[main.py — App Entry]
        subgraph API["API Layer"]
            AUTH_R[auth.py — Register/Login]
            ROUTES[routes.py — /analyze, /dashboard-data, /analyses]
            DEPS[deps.py — JWT Auth Dependency]
        end
        subgraph Services["Service Layer"]
            PARSER[parser.py]
            OCR[ocr_engine.py]
            ENTITY[entity_extractor.py]
            KEYWORD[keyword_analyzer.py]
            NLP[nlp_scorer.py]
            LLM_A[llm_analyzer.py]
            LLM_P[llm_providers.py]
        end
        subgraph Models["Data Models"]
            USER_M[User]
            RESUME_M[Resume]
            ANALYSIS_M[Analysis]
            SCHEMAS[Pydantic Schemas]
            DB[database.py — Engine/Session]
        end
    end

    subgraph External["External Services"]
        GEMINI[Google Gemini API]
        GROQ[Groq API]
        PG[(PostgreSQL / Neon DB)]
    end

    subgraph MLModels["ML Models (Local)"]
        SPACY[spaCy en_core_web_md]
        MINILM[all-MiniLM-L6-v2]
        TESS[Tesseract OCR]
    end

    Frontend -->|HTTP / JWT| Backend
    AUTH_UI --> AUTH_R
    AP -->|POST /api/analyze| ROUTES
    DASH -->|GET /api/dashboard-data| ROUTES
    AH -->|GET /api/analyses| ROUTES

    ROUTES --> PARSER
    ROUTES --> ENTITY
    ROUTES --> KEYWORD
    ROUTES --> NLP
    ROUTES --> LLM_A
    PARSER --> OCR
    LLM_A --> LLM_P
    LLM_P --> GEMINI
    LLM_P --> GROQ
    ENTITY --> SPACY
    NLP --> MINILM
    OCR --> TESS
    ROUTES --> DB
    AUTH_R --> DB
    DB --> PG
```

---

## 2. 6-Layer Analysis Pipeline — Flowchart

```mermaid
flowchart TD
    START([User uploads Resume + JD]) --> L1

    subgraph L1["Layer 1 — Document Parsing"]
        L1A{File type?}
        L1B[parse_pdf — PyMuPDF]
        L1C[parse_docx — python-docx]
        L1D[parse_image — OCR Engine]
        L1E[Raw Text Output]
        L1A -->|PDF| L1B
        L1A -->|DOCX| L1C
        L1A -->|JPG/PNG| L1D
        L1B --> L1E
        L1C --> L1E
        L1D --> L1E
    end

    L1E --> L1_CHECK{Text empty?}
    L1_CHECK -->|Yes| ERR1[Return 400 Error]
    L1_CHECK -->|No| L2

    subgraph L2["Layer 2 — NER Entity Extraction"]
        L2A[Preprocess text]
        L2B[spaCy NER pass — ORG, PRODUCT]
        L2C[Noun chunk dependency parse]
        L2D[Union & canonicalize vs ATS seeds]
        L2E["JD entities + Resume entities"]
        L2A --> L2B
        L2A --> L2C
        L2B --> L2D
        L2C --> L2D
        L2D --> L2E
    end

    L2E --> L2_CHECK{JD entities empty?}
    L2_CHECK -->|Yes| ERR2[Return 400 Error]
    L2_CHECK -->|No| L25

    subgraph L25["Layer 2.5 — ATS Keyword Density"]
        L25A[Count JD keyword frequencies]
        L25B[Count resume keyword frequencies]
        L25C[Compute gap severity per skill]
        L25D[Rank by JD frequency — highest priority first]
        L25E[Compute ATS score percentage]
        L25A --> L25B --> L25C --> L25D --> L25E
    end

    L25E --> L3

    subgraph L3["Layer 3 — Dense Vector Embedding"]
        L3A["Encode JD entities → 384-dim vectors (MiniLM)"]
        L3B["Encode Resume entities → 384-dim vectors"]
        L3A --> L3C[JD + Resume vector matrices]
        L3B --> L3C
    end

    L3C --> L4

    subgraph L4["Layer 4 — Cosine Similarity + Hungarian Matching"]
        L4A["Compute cosine similarity matrix (n×m)"]
        L4B["Hungarian algorithm — optimal bipartite assignment"]
        L4C{"similarity ≥ 0.45?"}
        L4D[Matched skills list]
        L4E[Missing skills list]
        L4F[Compute match_score percentage]
        L4G[Re-run keyword analysis with definitive missing list]
        L4A --> L4B --> L4C
        L4C -->|Yes| L4D
        L4C -->|No| L4E
        L4D --> L4F
        L4E --> L4F
        L4F --> L4G
    end

    L4G --> L5

    subgraph L5["Layer 5 — LLM Presentation"]
        L5A[Build structured prompt with pre-computed data]
        L5B[Send to LLM Engine — Gemini → Groq fallback]
        L5C[Parse JSON response — up to 3 retries]
        L5D[Override LLM numbers with pipeline-computed values]
        L5E[Build AnalysisResponse]
        L5A --> L5B --> L5C --> L5D --> L5E
    end

    L5E --> PERSIST[Persist Analysis to DB]
    PERSIST --> RESPOND([Return AnalysisResponse to client])
```

---

## 3. Class Diagram — Backend Services

```mermaid
classDiagram
    class LLMProvider {
        <<abstract>>
        +name: str*
        +is_available() bool*
        +generate(prompt: str) str*
    }

    class GeminiProvider {
        -_api_key: str
        -_model: str
        +name: str
        +is_available() bool
        +generate(prompt: str) str
    }

    class GroqProvider {
        -_api_key: str
        -_model: str
        +name: str
        +is_available() bool
        +generate(prompt: str) str
    }

    class LLMEngine {
        +providers: List~LLMProvider~
        +max_retries: int
        +retry_base_delay: float
        +generate(prompt: str) str
    }

    class EntityExtractor {
        +nlp: spacy.Language
        +HIGH_VALUE_ATS_SEEDS: frozenset
        +extract_entities(text: str) list
        -_preprocess_text(text: str) str
        -_extract_via_spacy_ner(doc) set
        -_extract_via_noun_chunks(doc) set
        -_filter_against_ats_seeds(entities: set) set
    }

    class NLPScorer {
        +embedding_model: SentenceTransformer
        +embed_entities(entities: list) ndarray
        +compute_similarity_matrix(jd_vec, res_vec) ndarray
        +compute_match_score(sim_matrix, jd, resume, threshold) dict
    }

    class KeywordAnalyzer {
        +analyze_keywords(jd_text, resume_text, jd_entities, resume_entities, missing) dict
        -_count_occurrences(text, keyword) int
        -_extract_exact_phrase(jd_text, keyword) str
    }

    class Parser {
        +parse_pdf(file_bytes) str
        +parse_pdf_with_pymupdf(file_bytes) str
        +parse_pdf_with_ocr(file_bytes) str
        +parse_docx(file_bytes) str
        +parse_image(file_bytes) str
    }

    class OCREngine {
        +extract_text_from_image(pil_img) str
        +preprocess_image(pil_img) Image
        -_detect_and_deskew(pil_img) Image
    }

    class LLMAnalyzer {
        +format_gap_analysis(...) AnalysisResponse
        -_build_prompt(...) tuple
        -_strip_code_fences(text) str
    }

    LLMProvider <|-- GeminiProvider
    LLMProvider <|-- GroqProvider
    LLMEngine o-- LLMProvider : "1..*"
    LLMAnalyzer --> LLMEngine : uses
    Parser --> OCREngine : delegates OCR
    LLMAnalyzer --> EntityExtractor : receives entities
    LLMAnalyzer --> NLPScorer : receives scores
    LLMAnalyzer --> KeywordAnalyzer : receives keywords
```

---

## 4. Class Diagram — Data Models

```mermaid
classDiagram
    class User {
        +id: int PK
        +email: str UNIQUE
        +password_hash: str
        +first_name: str?
        +username: str?
    }

    class Resume {
        +id: int PK
        +user_id: int FK
        +filename: str
        +file_path: str
        +file_size: int
        +content_type: str
        +uploaded_at: datetime
    }

    class Analysis {
        +id: int PK
        +user_id: int FK
        +resume_id: int FK
        +job_description: str
        +match_score: float
        +ats_score: float
        +matched_skills_json: str
        +missing_skills_json: str
        +gaps_json: str
        +improvements_json: str
        +learning_path_json: str
        +keyword_suggestions_json: str
        +recommended_resources_json: str
        +created_at: datetime
        +matched_skills() list
        +missing_skills() list
        +gaps() list
        +improvements() list
        +learning_path() list
        +keyword_suggestions() list
        +recommended_resources() list
    }

    User "1" --> "*" Resume : uploads
    User "1" --> "*" Analysis : runs
    Resume "1" --> "*" Analysis : analyzed in
```

---

## 5. Class Diagram — Pydantic Schemas

```mermaid
classDiagram
    class AnalysisResponse {
        +match_score: float
        +ats_score: float
        +matched_skills: List~SkillMatch~
        +missing_skills: List~str~
        +gaps: List~Gap~
        +improvements: List~Improvement~
        +learning_path: List~SkillToLearn~
        +keyword_suggestions: List~KeywordSuggestion~
        +recommended_resources: List~RecommendedResource~
    }

    class SkillMatch {
        +jd_skill: str
        +resume_skill: str
        +similarity: float
    }

    class Gap {
        +skill: str
        +relevancy: str
        +context: str
        +priority_rank: int
        +jd_frequency: int
        +resume_frequency: int
        +recommended_additions: int
    }

    class Improvement {
        +section: str
        +suggestion: str
        +before_example: str?
        +after_example: str?
    }

    class SkillToLearn {
        +skill: str
        +reason: str
        +resources: str?
        +estimated_time_weeks: int
        +difficulty: str
        +priority: str
    }

    class KeywordSuggestion {
        +keyword: str
        +jd_frequency: int
        +resume_frequency: int
        +gap: int
        +exact_phrase: str
        +coverage_pct: float
    }

    class RecommendedResource {
        +skill: str
        +resource_type: str
        +title: str
        +url: str
        +description: str
    }

    AnalysisResponse *-- SkillMatch
    AnalysisResponse *-- Gap
    AnalysisResponse *-- Improvement
    AnalysisResponse *-- SkillToLearn
    AnalysisResponse *-- KeywordSuggestion
    AnalysisResponse *-- RecommendedResource
```

---

## 6. Sequence Diagram — Resume Analysis Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant API as FastAPI Router
    participant PA as Parser
    participant EE as EntityExtractor
    participant KA as KeywordAnalyzer
    participant NS as NLPScorer
    participant LA as LLMAnalyzer
    participant LE as LLMEngine
    participant GEM as Gemini API
    participant DB as Database

    U->>FE: Upload resume + paste JD
    FE->>API: POST /api/analyze (multipart)
    API->>API: Verify JWT token
    API->>DB: Save Resume record

    rect rgb(40, 40, 80)
        Note over API,PA: Layer 1 — Document Parsing
        API->>PA: parse_pdf / parse_docx / parse_image
        PA-->>API: resume_text
    end

    rect rgb(40, 80, 40)
        Note over API,EE: Layer 2 — NER Entity Extraction
        API->>EE: extract_entities(job_description)
        EE-->>API: jd_entities
        API->>EE: extract_entities(resume_text)
        EE-->>API: resume_entities
    end

    rect rgb(80, 60, 40)
        Note over API,KA: Layer 2.5 — ATS Keyword Density
        API->>KA: analyze_keywords(jd, resume, entities, missing)
        KA-->>API: keyword_report + ats_score
    end

    rect rgb(80, 40, 80)
        Note over API,NS: Layer 3 & 4 — Embedding + Matching
        API->>NS: embed_entities(jd_entities)
        NS-->>API: jd_vectors [n×384]
        API->>NS: embed_entities(resume_entities)
        NS-->>API: resume_vectors [m×384]
        API->>NS: compute_similarity_matrix
        NS-->>API: sim_matrix [n×m]
        API->>NS: compute_match_score (Hungarian)
        NS-->>API: match_score + matched + missing
    end

    API->>KA: Re-run with definitive missing skills
    KA-->>API: refined keyword_report

    rect rgb(80, 40, 40)
        Note over API,GEM: Layer 5 — LLM Presentation
        API->>LA: format_gap_analysis(all computed data)
        LA->>LE: generate(prompt)
        LE->>GEM: API call (with retries)
        GEM-->>LE: raw JSON text
        LE-->>LA: raw response
        LA->>LA: Parse JSON + override numbers
        LA-->>API: AnalysisResponse
    end

    API->>DB: Persist Analysis record
    API-->>FE: AnalysisResponse JSON
    FE-->>U: Display results in Dashboard
```

---

## 7. Sequence Diagram — Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant AUTH as /api/auth
    participant DEPS as deps.py
    participant DB as Database

    Note over U,DB: Registration
    U->>FE: Fill signup form
    FE->>AUTH: POST /api/auth/register {email, password, first_name}
    AUTH->>DB: Check email uniqueness
    DB-->>AUTH: No existing user
    AUTH->>AUTH: SHA-256 pre-hash + bcrypt
    AUTH->>DB: INSERT User
    AUTH->>AUTH: Generate JWT (24h expiry)
    AUTH-->>FE: {token, user}
    FE->>FE: Store token in AuthContext

    Note over U,DB: Login
    U->>FE: Fill login form
    FE->>AUTH: POST /api/auth/login {email, password}
    AUTH->>DB: SELECT User by email
    AUTH->>AUTH: Verify bcrypt hash
    AUTH->>AUTH: Generate JWT
    AUTH-->>FE: {token, user}

    Note over U,DB: Authenticated Request
    FE->>DEPS: GET /api/dashboard-data (Bearer token)
    DEPS->>DEPS: Decode JWT
    DEPS->>DB: SELECT User by id
    DEPS-->>FE: User object injected
```

---

## 8. Activity Diagram — Document Parsing (Layer 1)

```mermaid
flowchart TD
    A([Receive uploaded file]) --> B{Detect file extension}

    B -->|.pdf| C[Read bytes into memory]
    B -->|.docx| D[Read bytes into memory]
    B -->|.jpg/.jpeg/.png| E[Read bytes into memory]
    B -->|Other| F[Return 400: Unsupported type]

    C --> G[Open with PyMuPDF]
    G --> H[Extract text blocks per page]
    H --> I[Sort blocks by position — top-to-bottom, left-to-right]
    I --> J[Join pages with double newline]

    D --> K[Open with python-docx]
    K --> L[Extract paragraphs]
    L --> M[Join with newline]

    E --> N[Open with PIL]
    N --> O[Detect & deskew rotation]
    O --> P{OpenCV available?}
    P -->|Yes| Q[Denoise + Otsu threshold]
    P -->|No| R[Pillow autocontrast + binarize]
    Q --> S[Tesseract OCR]
    R --> S

    J --> T{Text empty?}
    M --> T
    S --> T

    T -->|Yes| U[Return 400: No text extracted]
    T -->|No| V([Return extracted text])
```

---

## 9. Activity Diagram — LLM Engine Retry & Fallback

```mermaid
flowchart TD
    START([Receive prompt]) --> INIT[Load provider chain from env]
    INIT --> LOOP_P{Next provider in chain?}

    LOOP_P -->|No more providers| FAIL[Raise ValueError — all providers failed]
    LOOP_P -->|Yes| CHECK{Provider API key set?}

    CHECK -->|No| SKIP[Log warning, skip provider]
    SKIP --> LOOP_P

    CHECK -->|Yes| ATT_INIT["attempt = 1"]
    ATT_INIT --> ATTEMPT{attempt ≤ max_retries?}

    ATTEMPT -->|No| EXHAUST[Log: all retries exhausted for this provider]
    EXHAUST --> LOOP_P

    ATTEMPT -->|Yes| CALL[Call provider.generate — prompt]
    CALL --> RESULT{Success?}

    RESULT -->|Yes| RETURN([Return raw text])
    RESULT -->|No| LOG_ERR[Log error + elapsed time]
    LOG_ERR --> WAIT["Sleep: base_delay × 2^(attempt-1)"]
    WAIT --> INC["attempt += 1"]
    INC --> ATTEMPT

    style FAIL fill:#8B0000,color:#fff
    style RETURN fill:#006400,color:#fff
```

---

## 10. State Diagram — Analysis Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Uploaded : User uploads resume + JD
    Uploaded --> Parsing : Layer 1 starts
    Parsing --> ParseError : Empty / unsupported file
    ParseError --> [*]

    Parsing --> Extracting : Text extracted
    Extracting --> ExtractionError : No JD entities found
    ExtractionError --> [*]

    Extracting --> KeywordAnalysis : Entities extracted
    KeywordAnalysis --> Embedding : ATS scores computed
    Embedding --> Matching : Vectors encoded
    Matching --> LLMPresentation : Hungarian matching done

    LLMPresentation --> LLMRetry : JSON parse failed
    LLMRetry --> LLMPresentation : Retry attempt
    LLMRetry --> LLMFallback : Max retries exhausted
    LLMFallback --> LLMPresentation : Try next provider
    LLMFallback --> Failed : All providers failed

    LLMPresentation --> Persisting : Response assembled
    Persisting --> Completed : Saved to DB
    Completed --> [*]
    Failed --> [*]
```

---

## 11. ER Diagram — Database Schema

```mermaid
erDiagram
    USERS {
        int id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar username
    }

    RESUMES {
        int id PK
        int user_id FK
        varchar filename
        varchar file_path
        int file_size
        varchar content_type
        datetime uploaded_at
    }

    ANALYSES {
        int id PK
        int user_id FK
        int resume_id FK
        text job_description
        float match_score
        float ats_score
        text matched_skills_json
        text missing_skills_json
        text gaps_json
        text improvements_json
        text learning_path_json
        text keyword_suggestions_json
        text recommended_resources_json
        datetime created_at
    }

    USERS ||--o{ RESUMES : "uploads"
    USERS ||--o{ ANALYSES : "runs"
    RESUMES ||--o{ ANALYSES : "analyzed_in"
```

---

## 12. Deployment Diagram

```mermaid
graph LR
    subgraph Client["Client Browser"]
        REACT[React SPA — Vite build]
    end

    subgraph Server["Backend Server"]
        UVICORN[Uvicorn ASGI Server]
        FASTAPI[FastAPI Application]
        subgraph ML["ML Runtime"]
            SPACY_R[spaCy NER Model]
            MINILM_R[MiniLM Embeddings]
            TESS_R[Tesseract OCR]
        end
    end

    subgraph Cloud["Cloud Services"]
        NEON[(Neon PostgreSQL)]
        GEMINI_S[Google Gemini API]
        GROQ_S[Groq Cloud API]
    end

    REACT -->|HTTPS + JWT| UVICORN
    UVICORN --> FASTAPI
    FASTAPI --> ML
    FASTAPI -->|SQLAlchemy| NEON
    FASTAPI -->|google-genai SDK| GEMINI_S
    FASTAPI -->|groq SDK| GROQ_S
```

---

## 13. Use Case Diagram

```mermaid
flowchart LR
    USER((User))

    UC1[Register Account]
    UC2[Login]
    UC3[Upload Resume]
    UC4[Enter Job Description]
    UC5[Run Gap Analysis]
    UC6[View Analysis Results]
    UC7[View Analysis History]
    UC8[View Dashboard Summary]
    UC9[Generate ATS Resume]

    USER --- UC1
    USER --- UC2
    USER --- UC3
    USER --- UC4
    USER --- UC5
    USER --- UC6
    USER --- UC7
    USER --- UC8
    USER --- UC9

    UC3 -.->|includes| UC5
    UC4 -.->|includes| UC5
    UC5 -.->|includes| UC6
    UC9 -.->|extends| UC6
```

---

## 14. Frontend Component Tree

```mermaid
graph TD
    APP[App.jsx — Router]
    CTX[AuthContext Provider]

    APP --> CTX
    CTX --> NAV[NavBar]
    CTX --> SCROLL[ScrollToTop]

    CTX --> LAND[LandingPage /]
    CTX --> LOGIN[LoginPage /login]
    CTX --> SIGNUP[SignupPage /signup]
    CTX --> DASHB[Dashboard /dashboard]
    CTX --> ABOUT[AboutPage /about]
    CTX --> FEAT[FeaturesPage /features]
    CTX --> FREE[FreeToolsPage /free-tools]
    CTX --> PRIV[PrivacyPage /privacy]
    CTX --> TERMS[TermsPage /terms]

    LAND --> HERO[HeroSection]
    LAND --> BENTO[BentoGrid]
    LAND --> CTA[CTASection]
    LAND --> FOOT[Footer]

    DASHB --> APANEL[AnalyzePanel]
    DASHB --> ARESULTS[AnalysisResults]
    DASHB --> AHIST[AnalysisHistory]

    style DASHB fill:#1a1a3e,stroke:#7c3aed,color:#fff
    style ARESULTS fill:#1a1a3e,stroke:#7c3aed,color:#fff
```

---

## 15. Data Flow Diagram — Full Pipeline

```mermaid
flowchart LR
    subgraph Input["User Input"]
        PDF[Resume PDF/DOCX/IMG]
        JD[Job Description Text]
    end

    subgraph L1["Layer 1"]
        PARSE["Parser\n(PyMuPDF / python-docx / OCR)"]
    end

    subgraph L2["Layer 2"]
        NER["spaCy NER\n+ Noun Chunks"]
    end

    subgraph L25["Layer 2.5"]
        ATS["Keyword Frequency\nCounter"]
    end

    subgraph L3["Layer 3"]
        EMB["MiniLM\nSentence Encoder"]
    end

    subgraph L4["Layer 4"]
        COS["Cosine Similarity\nMatrix"]
        HUN["Hungarian\nAlgorithm"]
    end

    subgraph L5["Layer 5"]
        LLM["LLM Engine\n(Gemini → Groq)"]
    end

    subgraph Output["Output"]
        RESP["AnalysisResponse\n(JSON)"]
    end

    PDF --> PARSE
    PARSE -->|resume_text| NER
    JD -->|jd_text| NER
    NER -->|jd_entities\nresume_entities| ATS
    NER -->|entities| EMB
    ATS -->|freq_maps\nats_score| L5
    EMB -->|384-dim vectors| COS
    COS -->|sim_matrix| HUN
    HUN -->|match_score\nmatched\nmissing| L5
    LLM -->|structured JSON| RESP
    JD -->|raw text| ATS
    PARSE -->|raw text| ATS
```

---

## 16. Data Parsing Flow Diagram

```mermaid
flowchart TD
    START([File Upload]) --> EXT{File Extension?}

    EXT -->|.pdf| PDF[PyMuPDF Text Extraction]
    EXT -->|.docx| DOCX[python-docx Paragraph Extraction]
    EXT -->|.jpg / .png| IMG[OCR Engine]
    EXT -->|Other| ERR[❌ 400 Unsupported Type]

    PDF --> TEXT[resume_text]
    DOCX --> TEXT
    IMG --> TEXT

    TEXT --> CHECK{Text Empty?}
    CHECK -->|Yes| FAIL[❌ 400 No Text Extracted]
    CHECK -->|No| OUT([✅ Proceed to Layer 2])

    style ERR fill:#8B0000,color:#fff
    style FAIL fill:#8B0000,color:#fff
    style OUT fill:#006400,color:#fff
```

---

*Generated for VibeOnJob — Hybrid NLP+LLM Resume Gap Analyzer*
