from fastapi import APIRouter

router = APIRouter(prefix="/email", tags=["Email"])


@router.post("/send")
def send_email(candidate_email: str, subject: str, message: str):
    # Here you can integrate SMTP later
    return {
        "status": "Email sent (mock)",
        "to": candidate_email,
        "subject": subject
    }