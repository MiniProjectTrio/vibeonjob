from pydantic import BaseModel
from typing import List, Optional

class Gap(BaseModel):
    skill: str
    relevancy: str
    context: str

class Improvement(BaseModel):
    section: str
    suggestion: str

class SkillToLearn(BaseModel):
    skill: str
    reason: str
    resources: Optional[str] = None

class AnalysisResponse(BaseModel):
    match_score: float
    gaps: List[Gap]
    improvements: List[Improvement]
    learning_path: List[SkillToLearn]
