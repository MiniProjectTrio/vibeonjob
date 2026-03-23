import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.schemas import AnalysisResponse
from services.parser import parse_pdf, parse_docx
from services.nlp_scorer import calculate_match_score
from services.llm_analyzer import analyze_resume_gaps

logger = logging.getLogger("vibeonjob.api.routes")
router = APIRouter()

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    logger.info(f"Starting analysis for uploaded file: {resume.filename}")
    try:
        # 1. Parse Resume
        logger.debug("Reading file content...")
        content = await resume.read()
        
        if resume.filename.endswith(".pdf"):
            logger.info("Parsing PDF document")
            resume_text = parse_pdf(content)
        elif resume.filename.endswith(".docx"):
            logger.info("Parsing DOCX document")
            resume_text = parse_docx(content)
        else:
            logger.warning(f"Unsupported file format uploaded: {resume.filename}")
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        if not resume_text.strip():
            logger.error("Failed to extract any text from the document.")
            raise HTTPException(status_code=400, detail="Could not extract text from the resume")

        logger.debug(f"Extracted {len(resume_text)} characters from resume.")

        # 2. Hybrid NLP Pipeline Phase 1: Deterministic Match Score
        logger.info("Phase 1: Calculating deterministic NLP match score")
        score = calculate_match_score(resume_text, job_description)
        logger.info(f"Phase 1 Complete: NLP score calculated as {score}%")

        # 3. Hybrid NLP Pipeline Phase 2: LLM Contextual Reasoning
        logger.info("Phase 2: Sending data to LLM for contextual reasoning")
        analysis_result = analyze_resume_gaps(resume_text, job_description, score)
        logger.info("Phase 2 Complete: Received structured reasoning from LLM")

        logger.info("Analysis fully completed successfully. Returning response.")
        return analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("An unexpected error occurred during /analyze processing")
        raise HTTPException(status_code=500, detail=str(e))
