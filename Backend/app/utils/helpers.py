import re
import string
import uuid
from typing import List


def clean_text(text: str) -> str:
    """
    Clean text for processing
    """
    if not text:
        return ""

    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def calculate_keyword_score(resume_text: str, job_description: str) -> float:
    """
    Simple keyword-based matching score (without ML)
    """
    resume_words = set(clean_text(resume_text).split())
    job_words = set(clean_text(job_description).split())

    if not job_words:
        return 0.0

    matched = resume_words.intersection(job_words)

    score = (len(matched) / len(job_words)) * 100
    return round(score, 2)


def allowed_file(filename: str) -> bool:
    """
    Check allowed resume file types
    """
    allowed_extensions = {"pdf", "docx", "txt"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def generate_unique_filename(filename: str) -> str:
    """
    Generate unique filename to avoid overwrite
    """
    ext = filename.rsplit(".", 1)[1]
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    return unique_name