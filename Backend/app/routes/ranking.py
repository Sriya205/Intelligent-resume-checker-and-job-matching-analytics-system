from fastapi import APIRouter
from .services.scoring import calculate_score

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.post("/")
def rank(resume_text: str, job_description: str):
    score = calculate_score(resume_text, job_description)
    return {"match_score": score}
