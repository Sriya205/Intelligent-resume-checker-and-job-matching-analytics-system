from fastapi import FastAPI
from src.api.routes import router

app = FastAPI(title="Resume Matcher API")

app.include_router(router)
