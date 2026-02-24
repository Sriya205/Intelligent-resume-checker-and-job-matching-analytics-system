from app.utils.helpers import clean_text


def generate_explanation(resume_text: str, job_description: str):
    resume_words = set(clean_text(resume_text).split())
    job_words = set(clean_text(job_description).split())

    matched = resume_words.intersection(job_words)
    missing = job_words - resume_words

    return {
        "matched_skills": list(matched),
        "missing_skills": list(missing),
        "match_percentage": round((len(matched) / len(job_words)) * 100, 2) if job_words else 0
    }