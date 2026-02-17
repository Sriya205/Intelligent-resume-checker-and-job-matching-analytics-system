from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    content = await file.read()
    return {"filename": file.filename, "message": "Uploaded Successfully"}
