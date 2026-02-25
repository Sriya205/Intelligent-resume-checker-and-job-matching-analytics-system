from fastapi import APIRouter

router = APIRouter(prefix="/explainability", tags=["Explainability"])

@router.get("/")
def test_explainability():
    return {"message": "Explainability route working"}