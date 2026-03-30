import re
import base64
import pdfplumber
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
import os
import json
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

url = "https://nfkypjunrwaoezrukusp.supabase.co"
key = "sb_publishable_hQDMDFTnzRB9cbYyVVsNcA_IhVs0K5i"
supabase = create_client(url, key)

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gmail credentials — .env mein daalo ya yahan directly likho
GMAIL_USER = os.getenv("GMAIL_USER", "your_gmail@gmail.com")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "your_app_password_here")


def clean_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()
    return json.loads(raw)


# ─── Email Models ────────────────────────────────────────────────────────────

class AttachmentModel(BaseModel):
    filename: str
    content: str   # base64 encoded
    mimeType: str

class SendEmailRequest(BaseModel):
    to_email: str
    to_name: str
    subject: str
    message: str
    attachments: Optional[List[AttachmentModel]] = []


# ─── Send Email Route ─────────────────────────────────────────────────────────

@app.post("/send-email")
async def send_email(data: SendEmailRequest):
    try:
        msg = MIMEMultipart()
        msg["From"] = f"TalentAI HR <{GMAIL_USER}>"
        msg["To"] = data.to_email
        msg["Subject"] = data.subject

        # Plain text body — sirf ek baar
        msg.attach(MIMEText(data.message, "plain"))

        # Real attachments add karo
        for attachment in data.attachments:
            file_data = base64.b64decode(attachment.content)
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file_data)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={attachment.filename}"
            )
            msg.attach(part)

        # Gmail SMTP se bhejo
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, data.to_email, msg.as_string())

        return {"success": True, "message": f"Email sent to {data.to_email}"}

    except Exception as e:
        print(f"EMAIL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Existing Routes ──────────────────────────────────────────────────────────

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = ""

        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": """You are a resume parser. Return ONLY a valid JSON object with:
- name (string)
- email (string)
- phone (string)
- skills (array of strings)
- experience (string: brief summary)
- education (string: brief summary)
No markdown, no extra text. Only raw JSON."""
                },
                {
                    "role": "user",
                    "content": f"Parse this resume:\n\n{text[:3000]}"
                }
            ]
        )

        result = clean_json(response.choices[0].message.content)
        result["raw_text"] = text[:3000]
        return result

    except Exception as e:
        print(f"PARSE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai-analysis")
async def ai_analysis(data: dict):
    try:
        resume_text = data.get("resume", "")
        job_desc = data.get("job", "")
        candidate_name = data.get("candidate_name", "Candidate")
        candidate_skills = data.get("candidate_skills", [])

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert AI recruiter. Analyze the resume against the job description.
Return ONLY a valid JSON object with these exact fields:
- matchScore (integer 0-100)
- skillMatch (array of objects, each with: skill string, required boolean, matched boolean, proficiency integer 0-100)
- skillGaps (array of strings)
- experienceScore (integer 0-100)
- educationScore (integer 0-100)
- overallFit (string: exactly one of "Excellent", "Good", "Fair", "Poor")
- strengths (array of 3-5 strings)
- weaknesses (array of 2-4 strings)
- flags (array of strings, can be empty)
- aiExplanation (object with: summary string, confidence integer 0-100, recommendation string exactly one of "Shortlist"/"Review"/"Reject")
No markdown, no extra text. Only raw JSON."""
                },
                {
                    "role": "user",
                    "content": f"Job Description:\n{job_desc}\n\nCandidate: {candidate_name}\nSkills: {', '.join(candidate_skills)}\n\nResume:\n{resume_text[:3000]}"
                }
            ]
        )

        return clean_json(response.choices[0].message.content)

    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/parse-resume-text")
async def parse_resume_text(data: dict):
    try:
        text = data.get("resume_text", "")

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "Parse resume, return ONLY JSON with: name, email, phone, skills (array), experience, education. No markdown, only raw JSON."
                },
                {
                    "role": "user",
                    "content": f"Parse:\n\n{text[:3000]}"
                }
            ]
        )

        return clean_json(response.choices[0].message.content)

    except Exception as e:
        print(f"PARSE TEXT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))