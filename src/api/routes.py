from fastapi import APIRouter
from src.api.schemas import ResumeRequest, MatchResponse
from src.ml.predict import predict_match

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "API is running"}

@router.post("/match", response_model=MatchResponse)
def match_resume(data: ResumeRequest):
    score = predict_match(
        data.resume_text,
        data.job_description
    )
    return {"match_score": score}

