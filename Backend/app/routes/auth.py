from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.config import get_db
from app.models.user import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register")
def register(username: str, password: str, db: Session = Depends(get_db)):
    hashed_password = pwd_context.hash(password)

    user = User(username=username, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()

    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {"sub": user.username, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": token}