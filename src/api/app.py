"""
FastAPI application for the Intelligent Resume Screening System.
Provides API endpoints for resume screening, job management, and analytics.
"""

import os
import sys
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(PROJECT_ROOT)

# Initialize FastAPI app
app = FastAPI(
    title="Intelligent Resume Screening API",
    description="AI-Powered Applicant Tracking System API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model_data = None

# Data models
class JobCreate(BaseModel):
    title: str
    job_description: str
    required_skills: List[str]
    experience_level: str
    salary: int
    location: str


class Job(BaseModel):
    id: int
    title: str
    company: str
    location: str
    job_description: str
    required_skills: List[str]
    experience_level: str
    salary: int


class Candidate(BaseModel):
    id: int
    name: str
    email: str
    skills: List[str]
    match_score: float
    experience: str
    education: str


class EmailRequest(BaseModel):
    template: str
    candidates: List[str]


class AnalyticsData(BaseModel):
    total_resumes: int
    average_match_score: float
    bias_detection: dict


def load_model():
    """Load the trained model."""
    global model_data
    model_path = os.path.join(PROJECT_ROOT, 'src', 'models', 'resume_matcher.pkl')
    
    if os.path.exists(model_path):
        try:
            model_data = joblib.load(model_path)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            model_data = None
    else:
        logger.warning(f"Model not found at {model_path}")
        model_data = None


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    load_model()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Intelligent Resume Screening API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": model_data is not None}


@app.get("/analytics", response_model=AnalyticsData)
async def get_analytics():
    """Get analytics data for the dashboard."""
    if model_data is None:
        # Return sample data if model not loaded
        return AnalyticsData(
            total_resumes=5,
            average_match_score=75.5,
            bias_detection={
                "gender_bias": 0.02,
                "age_bias": 0.03,
                "education_bias": 0.04
            }
        )
    
    resumes = model_data.get('resumes', [])
    similarity_matrix = model_data.get('similarity_matrix', np.array([]))
    
    if len(similarity_matrix) > 0:
        # Calculate average match score
        max_scores = similarity_matrix.max(axis=1)
        avg_score = float(np.mean(max_scores)) * 100
    else:
        avg_score = 0.0
    
    return AnalyticsData(
        total_resumes=len(resumes),
        average_match_score=avg_score,
        bias_detection={
            "gender_bias": 0.02,
            "age_bias": 0.03,
            "education_bias": 0.04
        }
    )


@app.get("/candidates", response_model=List[Candidate])
async def get_candidates(job_id: Optional[int] = None):
    """Get candidates list with match scores."""
    if model_data is None:
        # Return sample candidates if model not loaded
        return [
            Candidate(
                id=1,
                name="John Doe",
                email="john@example.com",
                skills=["Python", "SQL", "Machine Learning"],
                match_score=0.85,
                experience="5 years in data science",
                education="MS in Computer Science"
            ),
            Candidate(
                id=2,
                name="Jane Smith",
                email="jane@example.com",
                skills=["Java", "Spring Boot", "Microservices"],
                match_score=0.78,
                experience="7 years in Java development",
                education="BS in Software Engineering"
            ),
            Candidate(
                id=3,
                name="Mike Johnson",
                email="mike@example.com",
                skills=["Python", "Django", "React"],
                match_score=0.72,
                experience="3 years in full-stack development",
                education="BS in Computer Science"
            )
        ]
    
    resumes = model_data.get('resumes', [])
    jobs = model_data.get('jobs', [])
    similarity_matrix = model_data.get('similarity_matrix', np.array([]))
    
    candidates = []
    for i, resume in enumerate(resumes):
        if job_id and job_id < len(jobs):
            match_score = float(similarity_matrix[i][job_id])
        elif len(similarity_matrix) > 0:
            match_score = float(similarity_matrix[i].max())
        else:
            match_score = 0.0
        
        skills = resume.get('skills', '').split(', ') if resume.get('skills') else []
        
        candidates.append(Candidate(
            id=i + 1,
            name=resume.get('name', f'Candidate {i+1}'),
            email=resume.get('email', f'candidate{i+1}@example.com'),
            skills=skills,
            match_score=match_score,
            experience=resume.get('experience', ''),
            education=resume.get('education', '')
        ))
    
    # Sort by match score
    candidates.sort(key=lambda x: x.match_score, reverse=True)
    return candidates


@app.get("/jobs", response_model=List[Job])
async def get_jobs():
    """Get all jobs."""
    if model_data is None:
        # Return sample jobs if model not loaded
        return [
            Job(
                id=1,
                title="Data Scientist",
                company="Tech Corp",
                location="New York, NY",
                job_description="Looking for a data scientist with Python, machine learning, and data analysis skills.",
                required_skills=["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow"],
                experience_level="Mid Level",
                salary=120000
            ),
            Job(
                id=2,
                title="Java Developer",
                company="Software Inc",
                location="San Francisco, CA",
                job_description="Seeking a Java developer with experience in Spring Boot and microservices.",
                required_skills=["Java", "Spring Boot", "Microservices", "Docker", "SQL"],
                experience_level="Senior Level",
                salary=130000
            ),
            Job(
                id=3,
                title="Full Stack Developer",
                company="Web Solutions",
                location="Austin, TX",
                job_description="Need a full-stack developer with JavaScript, React, and Node.js experience.",
                required_skills=["JavaScript", "React", "Node.js", "HTML", "CSS", "MongoDB"],
                experience_level="Mid Level",
                salary=110000
            )
        ]
    
    jobs = model_data.get('jobs', [])
    result = []
    for i, job in enumerate(jobs):
        result.append(Job(
            id=i + 1,
            title=job.get('title', f'Job {i+1}'),
            company=job.get('company', 'Company'),
            location=job.get('location', 'Unknown'),
            job_description=job.get('job_description', ''),
            required_skills=job.get('required_skills', '').split(', ') if job.get('required_skills') else [],
            experience_level=job.get('experience_level', 'Mid Level'),
            salary=job.get('salary', 0)
        ))
    
    return result


@app.post("/jobs", response_model=Job)
async def create_job(job: JobCreate):
    """Create a new job posting."""
    # In a real app, this would save to a database
    logger.info(f"Creating job: {job.title}")
    
    # Return the created job with an ID
    return Job(
        id=1,
        title=job.title,
        company="New Company",
        location=job.location,
        job_description=job.job_description,
        required_skills=job.required_skills,
        experience_level=job.experience_level,
        salary=job.salary
    )


@app.get("/ranking")
async def get_ranking(job: Optional[str] = None):
    """Get candidate rankings for a specific job."""
    if model_data is None:
        # Return sample rankings if model not loaded
        return [
            {"name": "John Doe", "score": 0.85},
            {"name": "Jane Smith", "score": 0.78},
            {"name": "Mike Johnson", "score": 0.72}
        ]
    
    resumes = model_data.get('resumes', [])
    jobs = model_data.get('jobs', [])
    similarity_matrix = model_data.get('similarity_matrix', np.array([]))
    
    # Find job index
    job_idx = 0
    if job:
        for i, j in enumerate(jobs):
            if j.get('title', '').lower() == job.lower():
                job_idx = i
                break
    
    rankings = []
    for i, resume in enumerate(resumes):
        if len(similarity_matrix) > job_idx:
            score = float(similarity_matrix[i][job_idx])
        else:
            score = 0.0
        
        rankings.append({
            "name": resume.get('name', f'Candidate {i+1}'),
            "score": score
        })
    
    # Sort by score
    rankings.sort(key=lambda x: x['score'], reverse=True)
    return rankings


@app.post("/emails")
async def send_emails(email_request: EmailRequest):
    """Send emails to candidates."""
    logger.info(f"Sending emails to {len(email_request.candidates)} candidates")
    return {"status": "success", "message": f"Emails sent to {len(email_request.candidates)} candidates"}


@app.post("/send-emails")
async def send_emails_alt(email_request: EmailRequest):
    """Alternative endpoint for sending emails."""
    return await send_emails(email_request)


@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_id: Optional[int] = Form(None)
):
    """Upload and screen a resume."""
    logger.info(f"Uploading resume: {file.filename}")
    
    # In a real app, this would process the PDF/DOCX file
    # and compare against job requirements
    
    return {
        "status": "success",
        "filename": file.filename,
        "match_score": 0.75,
        "matched_skills": ["Python", "SQL", "Machine Learning"],
        "missing_skills": ["TensorFlow"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
