"""
routes.py — FastAPI API Router

Implements the 6-layer analysis pipeline:
  Layer 1: Document Parsing (PDF/DOCX → raw text)
  Layer 2: NER Entity Extraction (spaCy NER + noun chunks)
  Layer 2.5: ATS Keyword Density Analysis (frequency counts + gap metrics)
  Layer 3: Dense Vector Embedding (MiniLM 384-dim)
  Layer 4: Cosine Similarity + Hungarian Algorithm Matching
  Layer 5: LLM Presentation (Gemini → structured JSON)

Each layer's timing is individually logged for performance profiling.
"""

import time
import uuid
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from models.schemas import AnalysisResponse
from services.parser import parse_pdf, parse_docx
from services.entity_extractor import extract_entities
from services.keyword_analyzer import analyze_keywords
from services.nlp_scorer import embed_entities, compute_similarity_matrix, compute_match_score
from services.llm_analyzer import format_gap_analysis

logger = logging.getLogger("vibeonjob.api.routes")
router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    request_id = str(uuid.uuid4())[:8]
    pipeline_start = time.time()

    logger.info(
        f"[{request_id}] ═══════════════════════════════════════════════════════"
    )
    logger.info(
        f"[{request_id}] Starting 6-Layer Analysis Pipeline"
    )
    logger.info(
        f"[{request_id}] File: '{resume.filename}' | "
        f"JD length: {len(job_description)} chars"
    )
    logger.info(
        f"[{request_id}] ═══════════════════════════════════════════════════════"
    )

    try:
        # ── Layer 1: Document Parsing ─────────────────────────────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 1: Document Parsing ──")

        content = await resume.read()
        logger.info(
            f"[{request_id}] Read {len(content):,} bytes from upload: '{resume.filename}'"
        )

        filename_lower = resume.filename.lower()
        if filename_lower.endswith(".pdf"):
            logger.info(f"[{request_id}] Format detected: PDF → using PyMuPDF")
            resume_text = parse_pdf(content)
        elif filename_lower.endswith(".docx"):
            logger.info(f"[{request_id}] Format detected: DOCX → using python-docx")
            resume_text = parse_docx(content)
        else:
            logger.warning(
                f"[{request_id}] Unsupported file extension: '{resume.filename}'"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Please upload a PDF or DOCX file."
            )

        if not resume_text or not resume_text.strip():
            logger.error(
                f"[{request_id}] Layer 1 FAILED: document returned empty text"
            )
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the resume. Is the PDF text-selectable?"
            )

        resume_word_count = len(resume_text.split())
        jd_word_count = len(job_description.split())
        layer1_time = time.time() - t0
        logger.info(
            f"[{request_id}] Layer 1 complete ({layer1_time:.3f}s): "
            f"resume={len(resume_text):,} chars ({resume_word_count} words), "
            f"JD={len(job_description):,} chars ({jd_word_count} words)"
        )

        # ── Layer 2: Entity Extraction ────────────────────────────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 2: NER Entity Extraction ──")

        jd_entities = extract_entities(job_description)
        resume_entities = extract_entities(resume_text)

        layer2_time = time.time() - t0
        logger.info(
            f"[{request_id}] Layer 2 complete ({layer2_time:.3f}s): "
            f"JD={len(jd_entities)} entities, Resume={len(resume_entities)} entities"
        )

        if not jd_entities:
            logger.error(
                f"[{request_id}] Layer 2 FAILED: zero entities from JD. "
                f"JD text preview: {job_description[:200]}"
            )
            raise HTTPException(
                status_code=400,
                detail="Could not extract any skills or requirements from the job description."
            )

        # ── Layer 2.5: ATS Keyword Density Analysis ───────────────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 2.5: ATS Keyword Density Analysis ──")

        # We need matched/missing for keyword_analyzer, but we don't have them yet.
        # Run a preliminary set-difference to seed the missing list for frequency analysis.
        # The definitive missing list will come from Layer 4 (Hungarian algorithm).
        preliminary_missing = list(set(jd_entities) - set(resume_entities))
        logger.info(
            f"[{request_id}] Preliminary missing (set diff): {len(preliminary_missing)} skills "
            f"(will be refined by Hungarian matching in Layer 4)"
        )

        keyword_report = analyze_keywords(
            jd_text=job_description,
            resume_text=resume_text,
            jd_entities=jd_entities,
            resume_entities=resume_entities,
            missing_skills=preliminary_missing,
        )

        jd_freq_map = keyword_report["jd_freq_map"]
        resume_freq_map = keyword_report["resume_freq_map"]
        ats_score = keyword_report["ats_score"]

        layer25_time = time.time() - t0
        logger.info(
            f"[{request_id}] Layer 2.5 complete ({layer25_time:.3f}s): "
            f"ATS score={ats_score}%, "
            f"{len(keyword_report['keyword_suggestions'])} keyword gap reports"
        )

        # ── Layer 3: Dense Vector Embedding ──────────────────────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 3: Dense Vector Embedding (MiniLM) ──")

        jd_vectors = embed_entities(jd_entities)
        resume_vectors = embed_entities(resume_entities)

        layer3_time = time.time() - t0
        logger.info(
            f"[{request_id}] Layer 3 complete ({layer3_time:.3f}s): "
            f"JD vectors={jd_vectors.shape}, "
            f"Resume vectors={resume_vectors.shape if resume_vectors.size else '(empty)'}"
        )

        # ── Layer 4: Cosine Similarity + Hungarian Matching ───────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 4: Cosine Similarity + Hungarian Matching ──")

        sim_matrix = compute_similarity_matrix(jd_vectors, resume_vectors)
        score_result = compute_match_score(sim_matrix, jd_entities, resume_entities)

        match_score = score_result["match_score"]
        matched_skills = score_result["matched_skills"]
        missing_skills = score_result["missing_skills"]
        coverage_detail = score_result.get("coverage_detail", {})

        # Re-run keyword analysis with definitive missing skills from Hungarian
        logger.info(
            f"[{request_id}] Refining keyword gap report with Hungarian missing list: "
            f"{len(missing_skills)} definitive missing skills"
        )
        keyword_report = analyze_keywords(
            jd_text=job_description,
            resume_text=resume_text,
            jd_entities=jd_entities,
            resume_entities=resume_entities,
            missing_skills=missing_skills,
        )
        keyword_suggestions = keyword_report["keyword_suggestions"]
        ats_score = keyword_report["ats_score"]

        layer4_time = time.time() - t0
        logger.info(
            f"[{request_id}] Layer 4 complete ({layer4_time:.3f}s): "
            f"semantic_score={match_score}%, ats_score={ats_score}%, "
            f"matched={len(matched_skills)}, missing={len(missing_skills)}"
        )

        # ── Layer 5: LLM Presentation ─────────────────────────────────────────
        t0 = time.time()
        logger.info(f"[{request_id}] ── Layer 5: LLM Presentation (Gemini) ──")

        analysis_result = format_gap_analysis(
            match_score=match_score,
            ats_score=ats_score,
            jd_entities=jd_entities,
            resume_entities=resume_entities,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            jd_freq_map=jd_freq_map,
            resume_freq_map=resume_freq_map,
            keyword_suggestions=keyword_suggestions,
        )

        layer5_time = time.time() - t0
        total_time = time.time() - pipeline_start

        logger.info(
            f"[{request_id}] Layer 5 complete ({layer5_time:.3f}s)"
        )
        logger.info(
            f"[{request_id}] ═══════════════════════════════════════════════════════"
        )
        logger.info(
            f"[{request_id}] Pipeline COMPLETE in {total_time:.2f}s total | "
            f"L1={layer1_time:.2f}s L2={layer2_time:.2f}s "
            f"L2.5={layer25_time:.2f}s L3={layer3_time:.2f}s "
            f"L4={layer4_time:.2f}s L5={layer5_time:.2f}s"
        )
        logger.info(
            f"[{request_id}] Results: semantic={match_score}%, ats={ats_score}%, "
            f"matched={len(matched_skills)}, missing={len(missing_skills)}, "
            f"gaps={len(analysis_result.gaps)}, "
            f"improvements={len(analysis_result.improvements)}, "
            f"learning_path={len(analysis_result.learning_path)}"
        )
        logger.info(
            f"[{request_id}] ═══════════════════════════════════════════════════════"
        )

        return analysis_result

    except HTTPException:
        logger.warning(
            f"[{request_id}] HTTPException raised — re-raising without modification"
        )
        raise
    except Exception as e:
        total_time = time.time() - pipeline_start
        logger.exception(
            f"[{request_id}] UNEXPECTED ERROR after {total_time:.2f}s: {type(e).__name__}: {e}"
        )
        raise HTTPException(status_code=500, detail=str(e))
