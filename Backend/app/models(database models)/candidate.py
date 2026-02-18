from sqlalchemy import Column, Integer, String, Float
from ..database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    score = Column(Float)
