from app.utils.helpers import clean_text


def calculate_score(resume_text: str, job_description: str) -> float:
    """
    Keyword matching score
    """

    resume_words = set(clean_text(resume_text).split())
    job_words = set(clean_text(job_description).split())

    if not job_words:
        return 0.0

    matched = resume_words.intersection(job_words)
    score = (len(matched) / len(job_words)) * 100

    return round(score, 2)