# VibeOnJob — Technical Overview

---

## What This Project Does (50 words)

VibeOnJob takes a candidate's resume and a job description, then runs both through a
six-layer AI pipeline: it extracts skills using NLP, measures keyword frequency gaps,
embeds skills into vector space for semantic comparison, matches them using the Hungarian
algorithm, and finally calls Gemini to produce concrete, numbered career advice.

---

## Technologies to Study

Work through these in order — each one maps directly to a layer in the pipeline.

### 1. Python Fundamentals
Core language used throughout. Focus on: type hints, `dataclasses`, `async/await`, list
comprehensions, `f-strings`, and module structure (`__init__.py`, relative imports).

**Resource:** *Python Docs — Tutorial* → https://docs.python.org/3/tutorial/

---

### 2. FastAPI
The web framework that exposes the `/api/analyze` HTTP endpoint and serves the static
frontend. Understand: `APIRouter`, `UploadFile`, `Form`, `HTTPException`, middleware,
and Pydantic response models.

**Resource:** *FastAPI Official Docs* → https://fastapi.tiangolo.com/

---

### 3. Pydantic
Used for data validation and schema definition. Every response the API returns is defined
as a Pydantic `BaseModel`. Understand: field types, `Optional`, default values, `.model_dump()`.

**Resource:** *Pydantic Docs* → https://docs.pydantic.dev/

---

### 4. Natural Language Processing (NLP) with spaCy
spaCy powers the entity extraction layer. Study: tokenisation, Named Entity Recognition
(NER), dependency parsing, noun chunks, and how `en_core_web_md` pipeline components
work (`tok2vec`, `parser`, `ner`). The `_md` model (96 MB) includes 300-dimensional word
vectors, which provide significantly better NER accuracy on technical vocabulary compared
to the smaller `_sm` model.

**Resource:** *spaCy 101* → https://spacy.io/usage/spacy-101

---

### 5. Sentence Transformers (Dense Embeddings)
The `all-MiniLM-L6-v2` model converts skill strings into 384-dimensional vectors where
semantically similar concepts are geometrically close. Study: word embeddings, transformer
architecture basics, sentence-level encoding vs token-level encoding.

**Resource:** *SBERT.net* → https://www.sbert.net/

---

### 6. Linear Algebra — Cosine Similarity
Used to measure how similar two skill vectors are. Understand: dot products, vector norms,
the cosine similarity formula `cos(θ) = (A · B) / (‖A‖ ‖B‖)`, and why it is
scale-invariant (unlike Euclidean distance).

**Resource:** *3Blue1Brown — Essence of Linear Algebra* → https://www.3blue1brown.com/topics/linear-algebra

---

### 7. The Hungarian Algorithm (Optimal Assignment Problem)
Used by `scipy.optimize.linear_sum_assignment` to find the globally optimal pairing of
JD skills to resume skills. Study: bipartite graphs, cost matrices, why greedy nearest-
neighbour fails, and time complexity O(n³).

**Resource:** *Wikipedia — Hungarian algorithm* → https://en.wikipedia.org/wiki/Hungarian_algorithm

---

### 8. Regular Expressions (`re` module)
Used in `keyword_analyzer.py` and `entity_extractor.py` for word-boundary matching,
occurrence counting, and extracting verbatim phrases from text. Study: `\b`, `re.findall`,
`re.escape`, lookaheads.

**Resource:** *Python `re` docs* → https://docs.python.org/3/library/re.html

---

### 9. Google Gemini API (`google-genai` SDK)
The LLM presentation layer. Understand: prompt engineering, structured JSON output,
`client.models.generate_content()`, and how to constrain an LLM to produce specific
integer fields rather than freeform prose.

**Resource:** *Google AI for Developers* → https://ai.google.dev/

---

### 10. React + Vite (Frontend)
The frontend is built with React 18 and Vite. Study: functional components, `useState`/
`useEffect` hooks, `useContext` for auth state, React Router v6 for client-side routing,
and the `fetch` API with `FormData` for file uploads. Styling uses Tailwind CSS utility
classes with a custom design system.

**Resource:** *React Docs* → https://react.dev/

---

### 11. SVG Animated Gauges
The score gauges (Semantic Match + ATS Score) are rendered as SVG `<circle>` elements.
The animated fill effect uses `stroke-dasharray` and `stroke-dashoffset` with CSS
transitions. Study: SVG coordinate system, `<circle>` attributes (`cx`, `cy`, `r`),
stroke rendering, and CSS `transition` on SVG properties.

**Resource:** *MDN — SVG Tutorial* → https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial

---

## How Every Step Works — Detailed Pipeline Walkthrough

```
User uploads resume (PDF/DOCX) + pastes job description
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  Layer 1  │  Document Parsing                            │
│  Layer 2  │  NER + Noun-Chunk Entity Extraction          │
│  Layer 2.5│  ATS Keyword Frequency Analysis              │
│  Layer 3  │  Dense Vector Embedding (MiniLM)             │
│  Layer 4  │  Cosine Similarity + Hungarian Matching      │
│  Layer 5  │  Gemini LLM Presentation                     │
└──────────────────────────────────────────────────────────┘
                    │
                    ▼
        JSON response → Frontend renders results
```

---

### Layer 1 — Document Parsing (`services/parser.py`)

**What it solves:** A resume is a binary file (PDF or DOCX), not plain text. Before any
NLP can happen, we must extract the raw text.

**How it works:**

- If the file is a `.pdf`, the `parse_pdf()` function opens it using `PyMuPDF` (`fitz`).
  PyMuPDF reads each page of the PDF and calls `page.get_text()`, which extracts all
  text that is embedded in the PDF as a text layer (not images). The text from every
  page is concatenated into one large string.

- If the file is a `.docx`, `parse_docx()` uses `python-docx` to open the file from
  a bytes buffer (`io.BytesIO`). It iterates over `doc.paragraphs` — the logical
  paragraph objects Word uses — and joins them with newlines.

**Key numbers logged:** number of pages (PDF) or paragraphs (DOCX), total characters extracted.

**Output:** A single `str` of the resume's full text.

**Edge cases handled:** If the extracted text is empty (e.g., a scanned image PDF with no
text layer), the pipeline raises an HTTP 400 error with a clear message.

---

### Layer 2 — NER Entity Extraction (`services/entity_extractor.py`)

**What it solves:** To compare a resume against a job description, we must first identify
*what skills and technologies each one mentions*. Free-form text is chaotic — we need
structured entity lists.

**Design decision — no keyword matching:**
An earlier version used a static vocabulary list and did string matching against it.
That is TF-IDF thinking: it only works for terms you predicted in advance. The current
version uses *linguistic structure* instead.

**How it works (two NLP passes on the same `spaCy` doc):**

**Pass 1 — Named Entity Recognition (NER):**
spaCy's `en_core_web_md` model was trained to label spans of text with category tags.
The `_md` model includes 300-dimensional word vectors, enabling significantly better
entity recognition on technical terminology compared to the `_sm` variant.
We extract spans labelled `ORG` (organisations/companies, which captures tools like
"Docker", "AWS"), `PRODUCT`, and `WORK_OF_ART`. Each matched span is lowercased and
filtered (length 2–40 chars, not a pure integer).

**Pass 2 — Noun Chunk Dependency Parsing:**
spaCy's parser builds a dependency tree for every sentence (which word depends on which).
A "noun chunk" is a flat sub-tree whose head is a noun — e.g. "machine learning pipeline",
"REST API design". We extract all 1–4 word noun chunks shorter than 50 characters.
Leading determiners ("a", "the", "your") are stripped.

**Canonicalization:**
The union of both passes is compared against a curated `HIGH_VALUE_ATS_SEEDS` set
(~100 well-known tech skills). If an extracted entity overlaps with a seed (exact match
or substring), it is replaced with the canonical seed form. This unifies variants like
"k8s" and "kubernetes" into a single term. Non-seed entities that look technical are also kept.

**Output:** A sorted, deduplicated `list[str]` of entities from each document.
Both `jd_entities` and `resume_entities` are produced by calling `extract_entities()`
twice — once on each text.

---

### Layer 2.5 — ATS Keyword Frequency Analysis (`services/keyword_analyzer.py`)

**What it solves:** Semantic matching tells you *if* a skill is conceptually present.
But ATS systems (Applicant Tracking Systems) used by recruiters are dumb — they
literally count how many times a keyword appears. If "Python" appears 5× in the JD
but 0× in your resume, no semantic embedding will save you. We need raw counts.

**How it works:**

1. **Count occurrences:** For every entity extracted from the JD, we run
   `re.findall(r'\b' + re.escape(skill) + r'\b', text.lower())` on both the JD text
   and the resume text. `\b` is a word boundary anchor, so "go" won't match "golang".
   This gives us `jd_frequency[skill]` and `resume_frequency[skill]`.

2. **Extract exact phrase:** We find a short snippet (≤60 chars) surrounding each keyword
   in the JD using a regex. This gives the user the *verbatim phrasing* the job ad uses,
   so they can copy it directly into their resume rather than guessing.

3. **Compute gap:** `gap = jd_frequency - resume_frequency`. A gap of 3 means the JD
   mentions the skill 3 more times than your resume does.

4. **Coverage %:** `(resume_frequency / jd_frequency) * 100`. Zero means completely
   missing; 100% means you're at parity.

5. **Priority ranking:** Missing skills are sorted by `jd_frequency` descending. A skill
   that appears 5× in the JD is more important to fix than one that appears once.

6. **ATS score:** `(sum of min(resume_freq, jd_freq) for each JD skill) / (sum of all JD
   frequencies) * 100`. This measures what fraction of the JD's total keyword budget your
   resume covers.

**Output:** `keyword_suggestions` (list of `KeywordSuggestion` objects, ranked), `ats_score`,
`jd_freq_map`, `resume_freq_map`.

---

### Layer 3 — Dense Vector Embedding (`services/nlp_scorer.py → embed_entities()`)

**What it solves:** We want to know that "Python programming" and "Python development"
are the same thing, and that "Python" is unrelated to "Kubernetes". Keyword matching
cannot do this. We need skill strings to live in a mathematical space where *meaning*
determines proximity.

**How it works:**

The `all-MiniLM-L6-v2` model from Sentence Transformers is loaded once at startup.
It is a distilled BERT model trained specifically to produce sentence-level embeddings —
it produces one 384-dimensional vector per input string regardless of its length.

We call `embedding_model.encode(entities)` on the JD entity list, then again on the
resume entity list. This returns two numpy arrays:
- `jd_vectors`: shape `(n_jd_skills, 384)`
- `resume_vectors`: shape `(n_resume_skills, 384)`

Each row is a point in 384-dimensional space. Semantically related skills cluster
together — "machine learning", "deep learning", and "neural networks" will all be
geometrically close to each other.

**Output:** Two `np.ndarray` matrices.

---

### Layer 4 — Cosine Similarity + Hungarian Matching (`services/nlp_scorer.py → compute_similarity_matrix() + compute_match_score()`)

**What it solves:** We have two sets of vectors. We need to find: (a) which resume skill
best corresponds to each JD skill, and (b) a single number summarising overall alignment.

**Step 4a — Cosine similarity matrix:**
`sklearn.metrics.pairwise.cosine_similarity(jd_vectors, resume_vectors)` computes the
cosine similarity between every JD skill vector and every resume skill vector. The result
is a matrix of shape `(n_jd, n_resume)` where cell `[i][j]` is the similarity score
(0.0–1.0) between the i-th JD skill and the j-th resume skill.

**Step 4b — Hungarian algorithm:**
A naive approach would pair each JD skill with whichever resume skill is most similar.
But this can double-count — the same resume skill could be greedily matched to multiple
JD skills. The Hungarian algorithm (via `scipy.optimize.linear_sum_assignment`) solves
the *optimal assignment problem*: it finds the one-to-one pairing that maximises the
*total* similarity across all pairs simultaneously. Internally, it uses `cost = 1 - similarity`
because the algorithm minimises cost.

**Threshold filtering:**
Any pairing with similarity < 0.45 (configurable) is rejected as "not a real match".
JD skills that had no resume partner crossing this threshold become **missing skills**.

**Match score:**
`(number of accepted matches) / (total JD skills) * 100`. This is the semantic score
shown in the first gauge on the UI.

**Output:** `match_score`, `matched_skills` (with similarity %), `missing_skills`, `coverage_detail`.

---

### Layer 5 — LLM Presentation (`services/llm_analyzer.py`)

**What it solves:** The pipeline now has all the numbers: match score, ATS score,
per-skill frequencies, gap severities. But a list of numbers is not useful to a job
seeker. They need *interpretation*: why does a gap matter, what should they study,
how should they rewrite their resume? This is where language intelligence is needed.

**Design principle — LLM is data-in, prose-out:**
The LLM never sees the raw resume or raw JD. It receives only the pre-computed
structured arrays. This ensures:
- The scores cannot be hallucinated (we override them after parsing).
- The LLM focuses on interpretation, not calculation.
- The response is auditable — every number in the output traces back to a computable source.

**How the prompt works:**
The prompt gives Gemini a JSON blob containing:
`jd_requirements`, `candidate_skills`, `matched_skills`, `missing_skills`,
`jd_keyword_frequencies`, `resume_keyword_frequencies`, `keyword_gap_report`.

It then demands a JSON response with a strict schema enforcing specific integer fields:
- `priority_rank` — ordering number
- `jd_frequency` — override from our frequency map
- `resume_frequency` — override from our frequency map
- `recommended_additions` — how many times to add the keyword
- `estimated_time_weeks` — realistic learning time
- `difficulty` — must be exactly `"Beginner"`, `"Intermediate"`, or `"Advanced"`
- `priority` — must be exactly `"High"`, `"Medium"`, or `"Low"`

**Overrides:**
After the JSON is parsed, the pipeline overrides `match_score`, `ats_score`,
`matched_skills`, `missing_skills`, and per-gap frequency fields with our
mathematically computed values. The LLM's text fields (reason, context, suggestions,
before/after examples) are kept; LLM numbers are discarded.

**Retry logic:**
Up to 3 attempts with exponential backoff (1.5s, 3s, 6s) to handle transient API errors.
Every attempt, response, and parse failure is logged.

**Output:** Fully populated `AnalysisResponse` Pydantic model.

---

### Layer 6 — Frontend Rendering (React + Vite)

The frontend is built with React 18, Vite, and Tailwind CSS. The Dashboard page
orchestrates the pipeline interaction through three key components:

**`AnalyzePanel.jsx` — Upload & Submit:**
1. A drag-and-drop file zone accepts PDF/DOCX resumes with validation.
2. A textarea captures the full job description text.
3. On submit, a `FormData` object is built and sent via `fetch('POST /api/analyze')`
   with the JWT `Authorization` header.
4. A progress indicator shows the 6-layer pipeline steps during the 15-30 second analysis.

**`AnalysisResults.jsx` — Results Visualization:**
1. **Dual SVG gauges** — Semantic Match Score and ATS Score, animated via
   `stroke-dashoffset` CSS transitions on SVG `<circle>` elements.
2. **Quick stat cards** — counts for matched, missing, gaps, and learning path items.
3. **Six tabbed sections:**
   - **Overview** — Matched skills (green chips with hover tooltips showing similarity %)
     and missing skills (red chips).
   - **Gaps** — Priority-ranked cards with JD frequency, resume frequency, recommended
     additions, relevancy explanation, and day-to-day context.
   - **Improvements** — Resume section badges with specific suggestions and side-by-side
     before (red) / after (green) rewrite examples.
   - **Learning Path** — Skill cards with difficulty badges (Beginner/Intermediate/Advanced),
     priority levels, estimated weeks, and named resource recommendations.
   - **ATS Keywords** — Frequency table with colour-coded gap counts and visual
     coverage progress bars (red <25%, amber 25–75%, green >75%).
   - **Resources** — Clickable resource cards grouped by type (Video/Course/Documentation/
     Tutorial) with external links.

**`AnalysisHistory.jsx` — Past Analyses:**
Fetches `GET /api/analyses` and displays a scrollable list of past analysis summaries
with colour-coded score badges. Clicking an entry loads the full detail via
`GET /api/analyses/{id}` into the results panel.

**State flow:** Upload form → API call → results panel → "New Analysis" resets to upload.

---

## Data Flow Summary

```
resume file (bytes)  ──► parse_pdf / parse_docx ──► resume_text (str)
job description (str) ─────────────────────────────► jd_text (str)

resume_text ──► extract_entities() ──► resume_entities [ "python", "fastapi", ... ]
jd_text     ──► extract_entities() ──► jd_entities     [ "python", "kubernetes", ... ]

(jd_text, resume_text, jd_entities, resume_entities, missing*) ──►
    keyword_analyzer.analyze_keywords() ──►
        jd_freq_map      { "python": 4, "kubernetes": 3, ... }
        resume_freq_map  { "python": 1, "kubernetes": 0, ... }
        keyword_suggestions [ KeywordSuggestion(keyword, jd_freq, resume_freq, gap, exact_phrase, coverage_pct), ... ]
        ats_score        42.8

jd_entities  ──► embed_entities() ──► jd_vectors  (n × 384)
resume_entities ► embed_entities() ──► resume_vectors (m × 384)

(jd_vectors, resume_vectors) ──► compute_similarity_matrix() ──► sim_matrix (n × m)

(sim_matrix, jd_entities, resume_entities) ──► compute_match_score() ──►
    match_score      67.5
    matched_skills   [ { jd_skill, resume_skill, similarity: 0.82, similarity_pct: 82.0 }, ... ]
    missing_skills   [ "kubernetes", "terraform", ... ]

(all of the above) ──► format_gap_analysis() ──► Gemini API ──►
    AnalysisResponse {
        match_score, ats_score,
        matched_skills, missing_skills,
        gaps      [ { skill, relevancy, context, priority_rank, jd_frequency, resume_frequency, recommended_additions } ],
        improvements [ { section, suggestion, before_example, after_example } ],
        learning_path [ { skill, reason, resources, estimated_time_weeks, difficulty, priority } ],
        keyword_suggestions [ { keyword, jd_frequency, resume_frequency, gap, exact_phrase, coverage_pct } ],
        recommended_resources [ { skill, resource_type, title, url, description } ]
    }

JSON ──► React Dashboard ──► 6-tab UI with SVG gauges, tables, cards
```
