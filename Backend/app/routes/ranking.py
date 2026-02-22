from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.utils.helpers import calculate_keyword_score

router = APIRouter(prefix="/ranking", tags=["Ranking"])


@router.get("/{job_id}")
def rank_candidates(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    resumes = db.query(Resume).all()

    results = []

    for resume in resumes:
        score = calculate_keyword_score(resume.content, job.description)
        results.append({
            "candidate_id": resume.candidate_id,
            "score": score
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    return results