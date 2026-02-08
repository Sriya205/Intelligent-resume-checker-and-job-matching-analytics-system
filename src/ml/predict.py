import joblib
import os

MODEL_PATH = os.path.join("models", "resume_matcher.pkl")

# model load
model = joblib.load(MODEL_PATH)

def predict_match(resume_text: str, job_description: str) -> float:
    text = resume_text + " " + job_description
    score = model.predict_proba([text])[0][1]
    return float(score)
