from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.candidate import Candidate

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.post("/")
def create_candidate(full_name: str, email: str, phone: str, db: Session = Depends(get_db)):
    candidate = Candidate(full_name=full_name, email=email, phone=phone)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/")
def get_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()