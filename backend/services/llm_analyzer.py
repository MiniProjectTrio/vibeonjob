"""
llm_analyzer.py — Gemini Presentation Layer

This is Layer 5 of the pipeline. The LLM receives ONLY pre-computed structured
data arrays — it never sees raw resume or JD text. Its sole job is to translate
mathematically-derived numbers into actionable human-readable career advice.

Key design principles:
  - All quantitative fields (match_score, frequencies, ranks) are overridden
    with our computed values AFTER the LLM response — we never trust LLM for numbers.
  - The prompt forces integer outputs for: priority_rank, jd_frequency,
    resume_frequency, recommended_additions, estimated_time_weeks.
  - LLM calls are delegated to LLMEngine (Strategy + Chain of Responsibility)
    which handles retries, fallback between providers (Gemini → Groq), and logging.
  - Every prompt, response snippet, and parse error is logged.
"""

import json
import logging
from models.schemas import AnalysisResponse
from services.llm_providers import create_default_engine

logger = logging.getLogger("vibeonjob.services.llm_analyzer")


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences that the LLM sometimes wraps JSON in."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _build_prompt(
    match_score: float,
    ats_score: float,
    jd_entities: list,
    resume_entities: list,
    matched_skills: list,
    missing_skills: list,
    jd_freq_map: dict,
    resume_freq_map: dict,
    keyword_suggestions: list,
) -> str:
    """
    Build the structured prompt for the LLM.
    The LLM receives pre-computed numbers and must produce concrete, quantified output.
    """
    # Serialise keyword suggestions for the LLM
    kw_data = [
        {
            "keyword": ks.keyword,
            "jd_frequency": ks.jd_frequency,
            "resume_frequency": ks.resume_frequency,
            "gap": ks.gap,
            "exact_phrase_from_jd": ks.exact_phrase,
            "coverage_pct": ks.coverage_pct,
        }
        for ks in keyword_suggestions
    ]

    payload = {
        "semantic_match_score_pct": match_score,
        "ats_keyword_score_pct": ats_score,
        "jd_requirements": jd_entities,
        "candidate_skills": resume_entities,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "jd_keyword_frequencies": jd_freq_map,
        "resume_keyword_frequencies": resume_freq_map,
        "keyword_gap_report": kw_data,
    }

    # ── Prompt payload size breakdown ────────────────────────────────────────
    payload_json = json.dumps(payload, indent=2)
    payload_chars = len(payload_json)
    logger.debug(f"Prompt payload keys: {list(payload.keys())}")
    logger.debug(
        f"Payload sizes: jd_entities={len(jd_entities)}, resume_entities={len(resume_entities)}, "
        f"matched={len(matched_skills)}, missing={len(missing_skills)}, "
        f"keyword_gaps={len(kw_data)}"
    )
    logger.info(
        f"Prompt payload breakdown (chars): "
        f"jd_requirements={len(json.dumps(jd_entities))}, "
        f"candidate_skills={len(json.dumps(resume_entities))}, "
        f"matched_skills={len(json.dumps(matched_skills))}, "
        f"missing_skills={len(json.dumps(missing_skills))}, "
        f"jd_freqs={len(json.dumps(jd_freq_map))}, "
        f"resume_freqs={len(json.dumps(resume_freq_map))}, "
        f"keyword_gap_report={len(json.dumps(kw_data))}, "
        f"TOTAL_DATA={payload_chars} chars (~{payload_chars // 4} tokens)"
    )

    prompt = f"""You are an expert career coach and ATS (Applicant Tracking System) specialist.
You have been given PRE-COMPUTED mathematical analysis of a candidate's resume vs a job description.
Your task is to interpret this data into CONCRETE, ACTIONABLE career advice with specific numbers.

DO NOT recalculate or second-guess the scores — they are mathematically verified.

=== PRE-COMPUTED ANALYSIS DATA ===
{json.dumps(payload, indent=2)}
===================================

Respond ONLY with a valid JSON object (no markdown, no code blocks, no commentary) matching EXACTLY this schema:

{{
  "gaps": [
    {{
      "skill": "<exact skill name from missing_skills>",
      "relevancy": "<1-2 sentences: why this skill matters for THIS specific role>",
      "context": "<1-2 sentences: how this skill is used day-to-day in the role>",
      "priority_rank": <integer 1-N, 1=most critical, based on jd_frequency>,
      "jd_frequency": <integer: exact value from jd_keyword_frequencies or 1 if not found>,
      "resume_frequency": <integer: exact value from resume_keyword_frequencies or 0>,
      "recommended_additions": <integer: how many times to add this keyword to their resume, typically 2-4>
    }}
  ],
  "improvements": [
    {{
      "section": "<resume section: Summary / Experience / Skills / Projects / Education>",
      "suggestion": "<specific, actionable instruction — what to change and why>",
      "before_example": "<a weak example of what their resume might currently say>",
      "after_example": "<a stronger rewrite that incorporates missing keywords naturally>"
    }}
  ],
  "learning_path": [
    {{
      "skill": "<skill name>",
      "reason": "<why learning this will improve their candidacy for THIS role>",
      "resources": "<specific course/book/platform with name, e.g. 'Coursera: Machine Learning Specialization by Andrew Ng'>",
      "estimated_time_weeks": <realistic integer: weeks to reach job-ready proficiency>,
      "difficulty": "<exactly one of: Beginner | Intermediate | Advanced>",
      "priority": "<exactly one of: High | Medium | Low>"
    }}
  ],
  "recommended_resources": [
    {{
      "skill": "<exact missing skill name>",
      "resource_type": "<exactly one of: Video | Documentation | Course | Tutorial>",
      "title": "<human-readable title, e.g. 'Next.js Full Course for Beginners'>",
      "url": "<real URL: YouTube search URL like https://www.youtube.com/results?search_query=nextjs+tutorial+2024, or official docs like https://nextjs.org/docs>",
      "description": "<1 sentence: why this specific resource helps bridge this exact gap>"
    }}
  ]
}}

Hard rules — violations will cause runtime errors:
1. "gaps" MUST cover every skill in missing_skills (one entry per skill, ranked by jd_frequency descending).
2. "improvements" MUST have 3-5 entries with concrete before/after resume line examples.
3. "learning_path" MUST have one entry per missing skill with a REAL, named resource.
4. "recommended_resources" MUST have 2-3 entries per missing skill. Use REAL URLs: YouTube search URLs (https://www.youtube.com/results?search_query=<encoded+query>), official documentation URLs, or well-known course platform URLs. Never invent fake URLs.
5. All integer fields (priority_rank, jd_frequency, resume_frequency, recommended_additions, estimated_time_weeks) MUST be integers, never strings or null.
6. difficulty MUST be exactly "Beginner", "Intermediate", or "Advanced".
7. priority MUST be exactly "High", "Medium", or "Low".
8. resource_type MUST be exactly "Video", "Documentation", "Course", or "Tutorial".
9. Return ONLY the JSON object — no prose, no markdown fences.
"""
    return prompt, payload_json


def format_gap_analysis(
    match_score: float,
    ats_score: float,
    jd_entities: list,
    resume_entities: list,
    matched_skills: list,
    missing_skills: list,
    jd_freq_map: dict,
    resume_freq_map: dict,
    keyword_suggestions: list,
) -> AnalysisResponse:
    """
    Layer 5: LLM Presentation Layer.

    Sends pre-computed structured data to the LLM engine (with automatic
    provider fallback) and maps the response onto our Pydantic AnalysisResponse
    schema. All numeric fields from our pipeline override LLM-provided values
    after parsing.

    Args:
        match_score: semantic match score (0-100) from Hungarian algorithm
        ats_score: ATS keyword coverage score (0-100) from keyword_analyzer
        jd_entities: extracted JD skills
        resume_entities: extracted resume skills
        matched_skills: list of matched skill pairs with similarity
        missing_skills: list of JD skills not matched in resume
        jd_freq_map: {skill: occurrence_count} for JD text
        resume_freq_map: {skill: occurrence_count} for resume text
        keyword_suggestions: KeywordSuggestion objects from keyword_analyzer

    Returns:
        AnalysisResponse Pydantic model
    """
    logger.info("=== Layer 5: LLM Presentation Layer ===")

    # ── Build the LLM engine (Strategy + Chain of Responsibility) ────────────
    engine = create_default_engine()
    logger.info(f"LLM Engine: {engine}")

    # ── Build prompt ─────────────────────────────────────────────────────────
    prompt, payload_json = _build_prompt(
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
    prompt_char_count = len(prompt)
    approx_tokens = prompt_char_count // 4
    # The prompt has two components: data payload + schema/instruction template
    # Schema template is ~2000 tokens of static text (output JSON schema + hard rules)
    schema_overhead_chars = prompt_char_count - len(payload_json)
    logger.info(
        f"Prompt built: ~{prompt_char_count} chars (~{approx_tokens} tokens estimated) | "
        f"data payload: ~{len(payload_json)} chars (~{len(payload_json) // 4} tokens), "
        f"schema+instructions: ~{schema_overhead_chars} chars (~{schema_overhead_chars // 4} tokens)"
    )

    # ── Dispatch via LLM Engine (handles retries + fallback) ─────────────────
    # Wrap generate + JSON parse in a retry loop — if the LLM returns truncated
    # or malformed JSON, we re-generate rather than crashing the pipeline.
    _JSON_PARSE_RETRIES = 3
    data = None
    last_parse_error = None

    for parse_attempt in range(1, _JSON_PARSE_RETRIES + 1):
        logger.info(f"LLM generate + parse attempt {parse_attempt}/{_JSON_PARSE_RETRIES}...")
        raw_text = engine.generate(prompt)

        logger.debug(f"Raw response length: {len(raw_text)} chars")
        logger.debug(f"Response preview (first 200 chars): {raw_text[:200]}")

        # ── Parse JSON ───────────────────────────────────────────────────────
        cleaned = _strip_code_fences(raw_text)
        logger.debug("Parsing JSON response...")
        try:
            data = json.loads(cleaned)
            logger.info(f"JSON parsing successful on attempt {parse_attempt}")
            break
        except json.JSONDecodeError as e:
            last_parse_error = e
            logger.warning(
                f"JSON parse attempt {parse_attempt}/{_JSON_PARSE_RETRIES} failed: {e}. "
                f"Response tail (last 200 chars): ...{raw_text[-200:]}"
            )
            if parse_attempt < _JSON_PARSE_RETRIES:
                logger.info("Re-generating LLM response...")

    if data is None:
        logger.critical(
            f"All {_JSON_PARSE_RETRIES} JSON parse attempts failed. "
            f"Last error: {last_parse_error}"
        )
        raise ValueError(
            f"LLM returned unparseable JSON after {_JSON_PARSE_RETRIES} attempts: "
            f"{last_parse_error}"
        )

    # ── Override all numeric/list fields with our computed values ─────────────
    # LLM text fields are kept; quantitative fields are ALWAYS overridden.
    logger.info(
        "Overriding LLM numeric outputs with pipeline-computed values "
        "(match_score, ats_score, matched_skills, missing_skills, jd/resume frequencies)"
    )

    # Override gap frequencies with our computed values
    if "gaps" in data:
        for gap in data["gaps"]:
            skill = gap.get("skill", "")
            gap["jd_frequency"] = jd_freq_map.get(skill, gap.get("jd_frequency", 1))
            gap["resume_frequency"] = resume_freq_map.get(skill, gap.get("resume_frequency", 0))
            logger.debug(
                f"  Gap override: '{skill}' jd_freq={gap['jd_frequency']}, "
                f"resume_freq={gap['resume_frequency']}"
            )

    # Sort gaps by priority_rank ascending
    if "gaps" in data:
        data["gaps"].sort(key=lambda g: g.get("priority_rank", 999))
        logger.debug(f"Gaps sorted by priority_rank. Count: {len(data['gaps'])}")

    # Build final response
    response_data = {
        "match_score": match_score,          # Always use our computed score
        "ats_score": ats_score,              # Always use our computed score
        "matched_skills": matched_skills,    # Always use our computed matches
        "missing_skills": missing_skills,    # Always use our computed misses
        "gaps": data.get("gaps", []),
        "improvements": data.get("improvements", []),
        "learning_path": data.get("learning_path", []),
        "keyword_suggestions": [ks.model_dump() for ks in keyword_suggestions],
        "recommended_resources": data.get("recommended_resources", []),
    }

    logger.info(
        f"Response assembled: gaps={len(response_data['gaps'])}, "
        f"improvements={len(response_data['improvements'])}, "
        f"learning_path={len(response_data['learning_path'])}, "
        f"keyword_suggestions={len(response_data['keyword_suggestions'])}, "
        f"recommended_resources={len(response_data['recommended_resources'])}"
    )
    logger.info("=== Layer 5 Complete ===")
    return AnalysisResponse(**response_data)
