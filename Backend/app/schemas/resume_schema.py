from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ResumeBase(BaseModel):
    candidate_id: int
    file_path: str
    content: Optional[str] = None


class ResumeCreate(ResumeBase):
    pass


class ResumeResponse(ResumeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True