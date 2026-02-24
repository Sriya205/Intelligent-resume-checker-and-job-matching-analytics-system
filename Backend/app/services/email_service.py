import smtplib
from email.mime.text import MIMEText


SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "your_email@gmail.com"
SMTP_PASSWORD = "your_password"


def send_email(to_email: str, subject: str, body: str):
    """
    Send email using SMTP
    """

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()

        return {"status": "Email sent successfully"}

    except Exception as e:
        return {"status": "Failed", "error": str(e)}