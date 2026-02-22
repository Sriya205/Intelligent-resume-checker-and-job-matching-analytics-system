from fastapi import FastAPI
from app.config import engine, Base

# Import ALL models (VERY IMPORTANT)
from app.models import candidate, job, resume, email_log

# Import routers
from app.routes import jobs, resumes, ranking

app = FastAPI(title="Intelligent Resume Checker API")

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
from app.routes import (
    auth,
    candidates,
    jobs,
    resumes,
    ranking,
    email,
    explainability,
    reports,
)

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(ranking.router)
app.include_router(email.router)
app.include_router(explainability.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Backend Running Successfully 🚀"}
