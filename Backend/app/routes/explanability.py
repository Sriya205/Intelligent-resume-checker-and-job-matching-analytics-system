from fastapi import APIRouter

router = APIRouter(prefix="/explainability", tags=["Explainability"])


@router.get("/")
def explain():
    return {
        "message": "This module explains why a candidate received a specific ranking score."
    }