def calculate_score(resume_text, job_description):
    common = set(resume_text.split()) & set(job_description.split())
    return len(common) / max(len(job_description.split()), 1)