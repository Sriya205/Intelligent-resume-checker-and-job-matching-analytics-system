from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)

    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=True)

    location = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    email_logs = relationship(
        "EmailLog",
        back_populates="job",
        cascade="all, delete-orphan"
    )
