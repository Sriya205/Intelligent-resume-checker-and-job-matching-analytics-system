import pandas as pd
import random
import os

# Job titles and requirements
job_titles = [
    "Data Scientist", "Machine Learning Engineer", "Software Developer",
    "Web Developer", "DevOps Engineer", "Product Manager", "Marketing Specialist",
    "Sales Representative", "UI/UX Designer", "Business Analyst"
]

required_skills = {
    "Data Scientist": ["Python", "Machine Learning", "SQL", "Data Analysis", "Statistics"],
    "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "ML", "Computer Vision"],
    "Software Developer": ["Java", "Python", "JavaScript", "SQL", "Git"],
    "Web Developer": ["JavaScript", "React", "Node.js", "HTML", "CSS"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD"],
    "Product Manager": ["Agile", "Scrum", "Project Management", "Analytics", "Communication"],
    "Marketing Specialist": ["SEO", "Content Creation", "Social Media", "Analytics", "Marketing"],
    "Sales Representative": ["Sales", "CRM", "Communication", "Negotiation", "Customer Service"],
    "UI/UX Designer": ["UI/UX Design", "Figma", "Adobe XD", "Prototyping", "User Research"],
    "Business Analyst": ["SQL", "Excel", "Data Analysis", "Requirements Gathering", "Reporting"]
}

experience_levels = ["Entry Level", "Mid Level", "Senior Level", "Lead"]

# Generate synthetic job descriptions
def generate_job_description_dataset(num_samples=100):
    jobs = []
    for i in range(num_samples):
        title = random.choice(job_titles)
        skills = required_skills[title] + random.sample(list(set(sum(required_skills.values(), [])) - set(required_skills[title])), random.randint(0, 3))
        experience = random.choice(experience_levels)
        salary = random.randint(50000, 150000)
        location = random.choice(["Remote", "New York", "San Francisco", "London", "Berlin"])

        # Create job description text
        job_text = f"Job Title: {title}. Required Skills: {', '.join(skills)}. Experience Level: {experience}. Salary: ${salary}. Location: {location}."

        jobs.append({
            "id": i+1,
            "title": title,
            "job_description": job_text,
            "required_skills": skills,
            "experience_level": experience,
            "salary": salary,
            "location": location
        })

    return pd.DataFrame(jobs)

if __name__ == "__main__":
    df = generate_job_description_dataset(100)
    os.makedirs("data/raw", exist_ok=True)
    df.to_csv("data/raw/job_description_dataset.csv", index=False)
    print("Job description dataset generated and saved to data/raw/job_description_dataset.csv")
