from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    description: str

class JobResponse(JobCreate):
    id: int

    class Config:
        from_attributes = True