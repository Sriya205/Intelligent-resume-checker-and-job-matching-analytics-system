"""
Model training script for the Intelligent Resume Screening System.
Trains a resume-job matching model using the datasets.
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import joblib

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_data():
    """Load resume and job description datasets."""
    try:
        resume_path = os.path.join(PROJECT_ROOT, 'data', 'raw', 'resume_dataset.csv')
        job_path = os.path.join(PROJECT_ROOT, 'data', 'raw', 'job_description_dataset.csv')
        
        logger.info(f"Loading resumes from {resume_path}")
        resumes_df = pd.read_csv(resume_path)
        
        logger.info(f"Loading job descriptions from {job_path}")
        jobs_df = pd.read_csv(job_path)
        
        logger.info(f"Loaded {len(resumes_df)} resumes and {len(jobs_df)} job descriptions")
        return resumes_df, jobs_df
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        # Create sample data if files don't exist
        logger.info("Creating sample data...")
        return create_sample_data()


def create_sample_data():
    """Create sample data if datasets don't exist."""
    # Sample resumes
    resumes_data = {
        'id': [1, 2, 3, 4, 5],
        'name': ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'David Brown'],
        'email': ['john@example.com', 'jane@example.com', 'mike@example.com', 'sarah@example.com', 'david@example.com'],
        'phone': ['555-0101', '555-0102', '555-0103', '555-0104', '555-0105'],
        'skills': [
            'Python, SQL, Machine Learning, Data Analysis, TensorFlow',
            'Java, Spring Boot, Microservices, Docker, Kubernetes',
            'Python, Django, React, JavaScript, HTML, CSS',
            'Data Science, Python, R, Statistics, Machine Learning',
            'JavaScript, Node.js, Express, MongoDB, React'
        ],
        'experience': [
            '5 years in data science and machine learning',
            '7 years in Java development and microservices',
            '3 years in full-stack web development',
            '4 years in data analysis and statistics',
            '5 years in full-stack JavaScript development'
        ],
        'education': [
            'MS in Computer Science',
            'BS in Software Engineering',
            'BS in Computer Science',
            'MS in Statistics',
            'BS in Computer Science'
        ]
    }
    
    # Sample job descriptions
    jobs_data = {
        'id': [1, 2, 3],
        'title': ['Data Scientist', 'Java Developer', 'Full Stack Developer'],
        'company': ['Tech Corp', 'Software Inc', 'Web Solutions'],
        'location': ['New York, NY', 'San Francisco, CA', 'Austin, TX'],
        'job_description': [
            'Looking for a data scientist with Python, machine learning, and data analysis skills.',
            'Seeking a Java developer with experience in Spring Boot and microservices.',
            'Need a full-stack developer with JavaScript, React, and Node.js experience.'
        ],
        'required_skills': [
            'Python, Machine Learning, Data Analysis, SQL, TensorFlow',
            'Java, Spring Boot, Microservices, Docker, SQL',
            'JavaScript, React, Node.js, HTML, CSS, MongoDB'
        ],
        'experience_level': ['Mid Level', 'Senior Level', 'Mid Level'],
        'salary': [120000, 130000, 110000]
    }
    
    resumes_df = pd.DataFrame(resumes_data)
    jobs_df = pd.DataFrame(jobs_data)
    
    # Save sample data
    os.makedirs(os.path.join(PROJECT_ROOT, 'data', 'raw'), exist_ok=True)
    resumes_df.to_csv(os.path.join(PROJECT_ROOT, 'data', 'raw', 'resume_dataset.csv'), index=False)
    jobs_df.to_csv(os.path.join(PROJECT_ROOT, 'data', 'raw', 'job_description_dataset.csv'), index=False)
    
    logger.info("Sample data created successfully")
    return resumes_df, jobs_df


def preprocess_text(text):
    """Preprocess text for the model."""
    if pd.isna(text):
        return ""
    return str(text).lower()


def train_model():
    """Train the resume-job matching model."""
    logger.info("Starting model training...")
    
    # Load data
    resumes_df, jobs_df = load_data()
    
    # Combine resume features - use correct column names from the CSV
    resumes_df['combined_features'] = (
        resumes_df['skills'].fillna('') + ' ' +
        resumes_df['current_role'].fillna('') + ' ' +
        resumes_df['target_role'].fillna('') + ' ' +
        resumes_df['resume_summary'].fillna('') + ' ' +
        resumes_df['education'].fillna('')
    )
    resumes_df['combined_features'] = resumes_df['combined_features'].apply(preprocess_text)
    
    # Combine job features
    jobs_df['combined_features'] = (
        jobs_df['job_description'].fillna('') + ' ' +
        jobs_df['required_skills'].fillna('')
    )
    jobs_df['combined_features'] = jobs_df['combined_features'].apply(preprocess_text)
    
    # Create TF-IDF vectorizer
    logger.info("Creating TF-IDF vectors...")
    vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
    
    # Fit on all text
    all_text = pd.concat([resumes_df['combined_features'], jobs_df['combined_features']])
    vectorizer.fit(all_text)
    
    # Transform resumes and jobs
    resume_vectors = vectorizer.transform(resumes_df['combined_features'])
    job_vectors = vectorizer.transform(jobs_df['combined_features'])
    
    # Calculate similarity matrix
    logger.info("Calculating similarity scores...")
    similarity_matrix = cosine_similarity(resume_vectors, job_vectors)
    
    # Prepare model data
    model_data = {
        'vectorizer': vectorizer,
        'resumes': resumes_df.to_dict('records'),
        'jobs': jobs_df.to_dict('records'),
        'similarity_matrix': similarity_matrix
    }
    
    # Save model
    model_dir = os.path.join(PROJECT_ROOT, 'src', 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'resume_matcher.pkl')
    
    joblib.dump(model_data, model_path)
    logger.info(f"Model saved to {model_path}")
    
    return model_data


if __name__ == "__main__":
    train_model()
