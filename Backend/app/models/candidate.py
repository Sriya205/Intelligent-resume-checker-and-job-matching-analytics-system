from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resumes = relationship(
        "Resume",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )

    email_logs = relationship(
        "EmailLog",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
