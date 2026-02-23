from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class CandidateBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True   # SQLAlchemy compatibility (Pydantic v2)