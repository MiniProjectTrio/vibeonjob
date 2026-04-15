"""
keyword_analyzer.py — ATS Keyword Density & Gap Severity Service

This service performs raw-frequency analysis of extracted skills against source
text, giving users CONCRETE NUMBERS (e.g., "Python appears 5× in the JD but
only 1× in your resume"). This is distinct from the semantic similarity scoring.

Pipeline position: Layer 2.5 — between entity extraction and vector embedding.
"""

import re
import logging
from models.schemas import KeywordSuggestion

logger = logging.getLogger("vibeonjob.services.keyword_analyzer")


def _count_occurrences(text: str, keyword: str) -> int:
    """
    Count how many times a keyword (or phrase) appears in text.
    Uses word-boundary regex to avoid partial matches (e.g. 'go' inside 'golang').
    Case-insensitive.
    """
    pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
    count = len(re.findall(pattern, text.lower()))
    logger.debug(f"  '{keyword}' → {count} occurrences in text")
    return count


def _extract_exact_phrase(jd_text: str, keyword: str) -> str:
    """
    Find the verbatim phrase surrounding a keyword in the JD.
    Returns a short snippet (≤ 60 chars) so users can copy the ATS-optimised form.
    Falls back to the keyword itself if no surrounding context is found.
    """
    pattern = r'(?i)([^\n.]{0,25}\b' + re.escape(keyword) + r'\b[^\n.]{0,25})'
    match = re.search(pattern, jd_text)
    if match:
        snippet = match.group(1).strip()
        # Truncate cleanly at word boundary
        if len(snippet) > 60:
            snippet = snippet[:60].rsplit(' ', 1)[0] + '…'
        logger.debug(f"  Exact phrase for '{keyword}': \"{snippet}\"")
        return snippet
    return keyword


def analyze_keywords(
    jd_text: str,
    resume_text: str,
    jd_entities: list,
    resume_entities: list,
    missing_skills: list,
) -> dict:
    """
    Core keyword density analysis.

    Computes per-skill occurrence counts in both JD and resume text, derives
    gap severity, and returns:
      - keyword_suggestions: priority-ranked list of KeywordSuggestion objects
      - ats_score: 0-100 float representing how well the resume covers JD keywords
      - jd_freq_map: raw frequency dict for each JD entity (passed to LLM)
      - resume_freq_map: raw frequency dict for each resume entity (passed to LLM)

    Args:
        jd_text: raw JD text
        resume_text: raw resume text
        jd_entities: extracted entities from JD (from entity_extractor)
        resume_entities: extracted entities from resume (from entity_extractor)
        missing_skills: skills present in JD but not matched in resume

    Returns:
        dict with keys: keyword_suggestions, ats_score, jd_freq_map, resume_freq_map
    """
    logger.info(
        f"Starting ATS keyword density analysis: "
        f"{len(jd_entities)} JD entities, {len(resume_entities)} resume entities, "
        f"{len(missing_skills)} missing skills"
    )

    # ── Step 1: Count occurrences of every JD entity in both texts ──────────
    logger.info("Step 1: Counting raw keyword occurrences in JD and resume texts")
    jd_freq_map: dict[str, int] = {}
    resume_freq_map: dict[str, int] = {}

    for entity in jd_entities:
        jd_freq_map[entity] = _count_occurrences(jd_text, entity)

    for entity in jd_entities:
        # Measure resume coverage against JD skill list specifically
        resume_freq_map[entity] = _count_occurrences(resume_text, entity)

    # Also count resume-only entities for completeness in logs
    resume_only_entities = set(resume_entities) - set(jd_entities)
    resume_only_freq = {e: _count_occurrences(resume_text, e) for e in resume_only_entities}
    logger.info(
        f"Step 1 complete: {len(resume_only_entities)} resume-only entities "
        f"(not required by this JD)"
    )
    logger.debug(f"JD frequency map: {jd_freq_map}")
    logger.debug(f"Resume frequency map (JD skills): {resume_freq_map}")

    # ── Step 2: Build gap report for missing skills ──────────────────────────
    logger.info("Step 2: Computing gap severity for missing skills")
    keyword_suggestions: list[KeywordSuggestion] = []

    for skill in missing_skills:
        jd_freq = jd_freq_map.get(skill, 0)
        resume_freq = resume_freq_map.get(skill, 0)
        gap = max(0, jd_freq - resume_freq)

        # Coverage: what % of JD mentions is covered in resume
        coverage_pct = round((resume_freq / jd_freq * 100) if jd_freq > 0 else 0.0, 1)

        exact_phrase = _extract_exact_phrase(jd_text, skill)

        logger.debug(
            f"  Gap: '{skill}' | JD freq={jd_freq}, Resume freq={resume_freq}, "
            f"gap={gap}, coverage={coverage_pct}%"
        )

        keyword_suggestions.append(
            KeywordSuggestion(
                keyword=skill,
                jd_frequency=jd_freq,
                resume_frequency=resume_freq,
                gap=gap,
                exact_phrase=exact_phrase,
                coverage_pct=coverage_pct,
            )
        )

    # ── Step 3: Priority-rank by gap severity (highest JD freq first) ────────
    logger.info("Step 3: Ranking missing skills by JD frequency (highest priority first)")
    keyword_suggestions.sort(key=lambda k: (k.jd_frequency, k.gap), reverse=True)

    for rank, ks in enumerate(keyword_suggestions, start=1):
        logger.debug(f"  Rank {rank}: '{ks.keyword}' (JD freq={ks.jd_frequency}, gap={ks.gap})")

    # ── Step 4: Compute ATS score ─────────────────────────────────────────────
    logger.info("Step 4: Computing overall ATS keyword coverage score")
    if jd_entities:
        total_jd_mentions = sum(jd_freq_map.values())
        total_resume_coverage = sum(
            min(resume_freq_map.get(e, 0), jd_freq_map.get(e, 0))
            for e in jd_entities
        )

        if total_jd_mentions > 0:
            ats_score = round((total_resume_coverage / total_jd_mentions) * 100, 2)
        else:
            ats_score = 0.0
    else:
        ats_score = 0.0

    logger.info(
        f"ATS analysis complete: {len(keyword_suggestions)} missing keyword reports generated, "
        f"ATS score = {ats_score}%"
    )

    return {
        "keyword_suggestions": keyword_suggestions,
        "ats_score": ats_score,
        "jd_freq_map": jd_freq_map,
        "resume_freq_map": resume_freq_map,
    }
