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
app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(ranking.router)


@app.get("/")
def root():
    return {"message": "Backend Running Successfully 🚀"}
