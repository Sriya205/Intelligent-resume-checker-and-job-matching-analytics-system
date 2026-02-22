from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.candidate import Candidate

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/total-candidates")
def total_candidates(db: Session = Depends(get_db)):
    count = db.query(Candidate).count()
    return {"total_candidates": count}