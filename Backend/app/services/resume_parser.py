import os
import pdfplumber
from docx import Document


def parse_resume(file_path: str) -> str:
    """
    Extract text from resume file (PDF, DOCX, TXT)
    """

    if not os.path.exists(file_path):
        return ""

    if file_path.endswith(".pdf"):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    elif file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    return ""