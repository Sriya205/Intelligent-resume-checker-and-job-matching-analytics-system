from pydantic import BaseModel

class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str

class MatchResponse(BaseModel):
    match_score: float
