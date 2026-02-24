from app.utils.helpers import clean_text


def find_skill_gap(resume_text: str, job_description: str):
    resume_words = set(clean_text(resume_text).split())
    job_words = set(clean_text(job_description).split())

    missing_skills = job_words - resume_words

    return list(missing_skills)