from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Job
from .schemas import JobCreate

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    db_job = Job(title=job.title, description=job.description)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/")
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()
