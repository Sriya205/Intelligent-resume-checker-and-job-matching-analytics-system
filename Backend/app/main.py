from fastapi import FastAPI
from .database import engine
from .models import Base
from . import jobs, resumes, ranking

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(jobs.router)
app.include_router(resumes.router)
app.include_router(ranking.router)