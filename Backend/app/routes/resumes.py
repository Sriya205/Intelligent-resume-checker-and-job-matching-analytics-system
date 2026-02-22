from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.resume import Resume
from app.utils.helpers import generate_unique_filename, allowed_file
import shutil
import os

router = APIRouter(prefix="/resumes", tags=["Resumes"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
def upload_resume(candidate_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not allowed_file(file.filename):
        return {"error": "Invalid file type"}

    filename = generate_unique_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume = Resume(candidate_id=candidate_id, file_path=file_path)
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {"message": "Resume uploaded successfully"} 