import os
import json
import logging
import google.generativeai as genai
from models.schemas import AnalysisResponse

logger = logging.getLogger("vibeonjob.services.llm_analyzer")

def analyze_resume_gaps(resume_text: str, jd_text: str, match_score: float) -> AnalysisResponse:
    """
    Call Gemini LLM to get qualitative feedback on the gaps and improvements.
    We pass in the deterministic match score as context.
    """
    logger.debug("Configuring Gemini API client")
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        logger.warning("GOOGLE_API_KEY environment variable is missing or empty!")
        
    genai.configure(api_key=api_key)
    model_name = "gemini-2.5-flash"
    
    logger.info(f"Initializing generative model: {model_name}")
    model = genai.GenerativeModel(model_name)
    
    logger.debug("Constructing analytical prompt with context variables")
    prompt = f"""
    You are an expert technical recruiter and career coach.
    I have calculated a deterministic keyword match score of {match_score}% between the candidate's resume and the job description.
    
    Job Description:
    {jd_text}
    
    Candidate Resume:
    {resume_text}
    
    Analyze the raw text and provide qualitative feedback. 
    Respond ONLY with a valid JSON object matching this schema, no markdown blocks around it:
    {{
        "match_score": {match_score},
        "gaps": [
            {{"skill": "Name of missing skill", "relevancy": "Why it matters", "context": "How it is used in the JD"}}
        ],
        "improvements": [
            {{"section": "Resume section like 'Experience' or 'Summary'", "suggestion": "Specific rewrite or addition"}}
        ],
        "learning_path": [
            {{"skill": "Skill name", "reason": "Why learn it", "resources": "Optional resource string"}}
        ]
    }}
    """
    
    try:
        logger.info("Dispatching prompt to Gemini API... waiting for response")
        response = model.generate_content(prompt)
        logger.debug("Received raw response from Gemini")
        
        text = response.text.strip()
        logger.debug(f"Response snippet: {text[:100]}...")
        
        if text.startswith("```json"):
            logger.debug("Stripping ```json wrapper from response")
            text = text[7:-3]
        elif text.startswith("```"):
            logger.debug("Stripping ``` wrapper from response")
            text = text[3:-3]
            
        logger.debug("Parsing JSON response")
        data = json.loads(text.strip())
        data["match_score"] = match_score
        
        return AnalysisResponse(**data)
    except Exception as e:
        logger.error(f"Failed to process LLM request or parse output: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to parse LLM output: {str(e)}")
