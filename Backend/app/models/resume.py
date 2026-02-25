from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    extracted_text = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    candidate = relationship("Candidate", back_populates="resumes")
