import pandas as pd
import random

job_roles = [
    "Data Scientist", "Data Analyst", "ML Engineer", "AI Engineer",
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Developer", "Cloud Engineer"
]

skills_mapping = {
    "Data Scientist": ["Python", "Machine Learning", "SQL", "NLP", "Data Analysis"],
    "Data Analyst": ["SQL", "Excel", "Power BI", "Tableau", "Python"],
    "ML Engineer": ["Python", "Deep Learning", "TensorFlow", "Docker", "ML Ops"],
    "AI Engineer": ["Python", "NLP", "Computer Vision", "Deep Learning", "AWS"],
    "Software Engineer": ["Java", "C++", "Git", "Linux", "Problem Solving"],
    "Backend Developer": ["Python", "Java", "APIs", "SQL", "Docker"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "UI/UX"],
    "Full Stack Developer": ["React", "Node.js", "MongoDB", "SQL", "Git"],
    "Cloud Engineer": ["AWS", "Azure", "Docker", "Kubernetes", "Linux"]
}

locations = ["Remote", "Delhi", "Bangalore", "Hyderabad", "Pune"]
employment_types = ["Full-Time", "Internship", "Contract"]


def generate_job(job_id):
    role = random.choice(job_roles)
    skills = skills_mapping[role]
    exp_required = random.randint(0, 10)

    return {
        "job_id": job_id,
        "job_role": role,
        "required_skills": ", ".join(skills),
        "experience_required": exp_required,
        "job_location": random.choice(locations),
        "employment_type": random.choice(employment_types),
        "salary_range_lpa": f"{random.randint(4,10)}-{random.randint(12,35)}",
        "job_description": (
            f"We are hiring a {role} with {exp_required}+ years experience. "
            f"Required skills include {', '.join(skills)}."
        )
    }

data = []
TOTAL_JOBS = 4000

for i in range(1, TOTAL_JOBS + 1):
    data.append(generate_job(i))

df = pd.DataFrame(data)
df.to_csv("data/raw/job_description_dataset.csv", index=False)

print("Advanced job description dataset generated successfully!")