from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.job import Job

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/")
def create_job(title: str, company_name: str, description: str, db: Session = Depends(get_db)):
    job = Job(title=title, company_name=company_name, description=description)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/")
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()
