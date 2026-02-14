import pandas as pd
import random
import os

# Skills and experiences
skills_pool = [
    "Python", "Java", "JavaScript", "C++", "SQL", "Machine Learning", "Data Analysis",
    "Web Development", "React", "Node.js", "AWS", "Docker", "Git", "Agile", "Scrum",
    "Project Management", "Marketing", "SEO", "Sales", "Customer Service", "UI/UX Design",
    "Figma", "Adobe XD", "Prototyping", "User Research", "Business Analysis", "Excel",
    "Requirements Gathering", "Reporting", "Communication", "Negotiation", "CRM"
]

experience_levels = ["Entry Level", "Mid Level", "Senior Level", "Lead", "Principal"]

job_titles = [
    "Software Engineer", "Data Scientist", "Web Developer", "Product Manager",
    "Marketing Specialist", "Sales Representative", "UI/UX Designer", "Business Analyst",
    "DevOps Engineer", "Machine Learning Engineer"
]

# Generate synthetic resumes
def generate_resume_dataset(num_samples=100):
    resumes = []
    for i in range(num_samples):
        name = f"Candidate {i+1}"
        title = random.choice(job_titles)
        experience = random.choice(experience_levels)

        # Generate skills (5-10 skills)
        num_skills = random.randint(5, 10)
        skills = random.sample(skills_pool, num_skills)

        # Generate education
        education = random.choice([
            "Bachelor's in Computer Science",
            "Master's in Data Science",
            "Bachelor's in Business Administration",
            "Master's in Engineering",
            "Bachelor's in Marketing"
        ])

        # Generate experience description
        experience_years = random.randint(1, 15)
        experience_desc = f"{experience_years} years of experience in {title} role."

        # Create resume text
        resume_text = f"Name: {name}. Job Title: {title}. Experience: {experience_desc}. Skills: {', '.join(skills)}. Education: {education}."

        resumes.append({
            "id": i+1,
            "name": name,
            "resume_text": resume_text,
            "skills": skills,
            "experience_level": experience,
            "education": education,
            "experience_years": experience_years
        })

    return pd.DataFrame(resumes)

if __name__ == "__main__":
    df = generate_resume_dataset(100)
    os.makedirs("data/raw", exist_ok=True)
    df.to_csv("data/raw/resume_dataset.csv", index=False)
    print("Resume dataset generated and saved to data/raw/resume_dataset.csv")
