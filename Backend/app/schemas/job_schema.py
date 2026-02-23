from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class JobBase(BaseModel):
    title: str
    company_name: str
    description: str
    required_skills: Optional[str] = None
    location: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True