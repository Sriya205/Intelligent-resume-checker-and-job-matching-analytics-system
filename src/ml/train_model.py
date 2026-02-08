import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Dummy training data (minimum 2 classes REQUIRED)
data = {
    "text": [
        "Python developer with machine learning experience",
        "Data scientist skilled in NLP and ML",
        "Sales executive with marketing skills",
        "Digital marketing specialist and SEO expert"
    ],
    "label": [1, 1, 0, 0]   # ⚠️ IMPORTANT: at least 2 classes
}

df = pd.DataFrame(data)

X = df["text"]
y = df["label"]

# Pipeline (TF-IDF + Model)
model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression())
])

# Train model
model.fit(X, y)

# Save model
joblib.dump(model, "models/resume_matcher.pkl")

print("Model trained & resume_matcher.pkl saved successfully")
