from pydantic import BaseModel
from typing import List, Optional


class SkillMatch(BaseModel):
    jd_skill: str
    resume_skill: str
    similarity: float


class Gap(BaseModel):
    skill: str
    relevancy: str
    context: str
    priority_rank: int = 0          # 1 = most critical gap
    jd_frequency: int = 0           # How many times skill appears in JD text
    resume_frequency: int = 0       # How many times skill appears in resume (0 = missing)
    recommended_additions: int = 1  # How many times to add this keyword to resume


class Improvement(BaseModel):
    section: str
    suggestion: str
    before_example: Optional[str] = None  # Weak version of the resume line
    after_example: Optional[str] = None   # Rewritten strong version


class SkillToLearn(BaseModel):
    skill: str
    reason: str
    resources: Optional[str] = None
    estimated_time_weeks: int = 4        # Realistic weeks to reach proficiency
    difficulty: str = "Intermediate"     # Beginner / Intermediate / Advanced
    priority: str = "Medium"             # High / Medium / Low


class KeywordSuggestion(BaseModel):
    keyword: str
    jd_frequency: int           # Raw occurrences in JD text
    resume_frequency: int       # Raw occurrences in resume text
    gap: int                    # jd_frequency - resume_frequency
    exact_phrase: str           # Verbatim phrase as it appears in the JD
    coverage_pct: float         # resume_freq / jd_freq * 100 (0 = completely missing)


class AnalysisResponse(BaseModel):
    match_score: float
    ats_score: float = 0.0                     # Separate ATS keyword density score (0-100)
    matched_skills: List[SkillMatch]
    missing_skills: List[str]
    gaps: List[Gap]
    improvements: List[Improvement]
    learning_path: List[SkillToLearn]
    keyword_suggestions: List[KeywordSuggestion] = []  # Priority-ranked ATS keywords
