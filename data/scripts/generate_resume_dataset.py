import pandas as pd
import random
from faker import Faker

fake = Faker()

skills_list = [
    # Programming
    "Python", "Java", "C++", "C", "R", "Go",
    # Web
    "HTML", "CSS", "JavaScript", "React", "Angular", "Node.js",
    # Data & AI
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Analysis", "Data Mining",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB",
    # Tools
    "Git", "GitHub", "Linux", "Docker", "Kubernetes",
    # Cloud
    "AWS", "Azure", "GCP",
    # Visualization
    "Power BI", "Tableau", "Matplotlib", "Seaborn",
    # Soft skills
    "Communication", "Problem Solving", "Leadership", "Teamwork"
]

roles = [
    "Data Scientist", "Data Analyst", "ML Engineer", "AI Engineer",
    "Software Engineer", "Backend Developer", "Frontend Developer",
    "Full Stack Developer", "Cloud Engineer"
]

education_levels = ["B.Tech", "M.Tech", "B.Sc", "M.Sc", "MBA", "PhD"]
locations = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai"]
certifications = ["None", "AWS Certified", "Google Data Engineer", "Azure AI", "Coursera ML"]

def generate_resume(resume_id):
    skills = random.sample(skills_list, random.randint(6, 12))
    experience = random.randint(0, 12)

    return {
        "resume_id": resume_id,
        "candidate_name": fake.name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "location": random.choice(locations),
        "education": random.choice(education_levels),
        "experience_years": experience,
        "current_role": random.choice(roles),
        "target_role": random.choice(roles),
        "skills": ", ".join(skills),
        "certifications": random.choice(certifications),
        "expected_salary_lpa": random.randint(3, 30),
        "resume_summary": f"{experience} years experienced professional skilled in {', '.join(skills[:4])}."
    }

data = []
TOTAL_RESUMES = 10000

for i in range(1, TOTAL_RESUMES + 1):
    data.append(generate_resume(i))

df = pd.DataFrame(data)
df.to_csv("data/raw/resume_dataset.csv", index=False)

print("Advanced resume dataset generated successfully!")