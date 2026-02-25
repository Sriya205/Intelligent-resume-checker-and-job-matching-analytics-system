from fastapi import FastAPI
from app.config import engine, Base

# Import routers directly (clean way)
from app.routes.auth import router as auth_router
from app.routes.candidates import router as candidates_router
from app.routes.email import router as email_router
from app.routes.jobs import router as jobs_router
from app.routes.ranking import router as ranking_router
from app.routes.reports import router as reports_router
from app.routes.resumes import router as resumes_router

# ⚠️ Only keep this if explainability.py exists
# from app.routes.explainability import router as explainability_router


app = FastAPI(title="Intelligent Resume Checker API")

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router)
app.include_router(candidates_router)
app.include_router(email_router)
app.include_router(jobs_router)
app.include_router(ranking_router)
app.include_router(reports_router)
app.include_router(resumes_router)

# ⚠️ Only include if file exists
# app.include_router(explainability_router)


@app.get("/")
def root():
    return {"message": "Backend Running Successfully 🚀"}