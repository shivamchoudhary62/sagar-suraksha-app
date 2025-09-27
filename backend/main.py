from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import json
import uuid


import crud, models, schemas, security, otp_utils
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

# (Your one-time seeding scripts can be here)

app = FastAPI()

# CORS and Static files setup
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Dependency Functions ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # This URL is now conceptual

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# --- New Authentication Endpoints ---
#@app.post("/request-otp")
#def request_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
#    user = None
#    if request.email:
#        user = crud.get_user_by_email(db, email=request.email)
#    elif request.phone_number:
#        user = crud.get_user_by_phone(db, phone_number=request.phone_number)
#
#    if not user:
#        raise HTTPException(status_code=404, detail="User not found")
#
#    otp = otp_utils.generate_otp()
#    crud.set_otp_for_user(db, user=user, otp=otp)
#
#    if request.email:
#        otp_utils.send_otp_email(user.email, otp)
#    elif request.phone_number:
#        otp_utils.send_otp_sms(user.phone_number, otp)
#
#    return {"message": "OTP sent successfully"}

#@app.post("/verify-otp", response_model=schemas.Token)
#def verify_otp_and_login(request: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
#    user = None
#    if request.email:
#        user = crud.get_user_by_email(db, email=request.email)
#    elif request.phone_number:
#        user = crud.get_user_by_phone(db, phone_number=request.phone_number)
#
#    if not user:
#        raise HTTPException(status_code=404, detail="User not found")
#
#    if user.otp != request.otp or user.otp_expiry < datetime.now(timezone.utc):
#        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
#
#    # OTP is correct, log the user in
#    user.is_email_verified = True
#    user.otp = None
#    user.otp_expiry = None
#    db.commit()
#
#    access_token = security.create_access_token(
#        data={"sub": user.email, "role": user.role}
#    )
#    return {"access_token": access_token, "token_type": "bearer"}

# --- User Registration ---
@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.phone_number and crud.get_user_by_phone(db, phone_number=user.phone_number):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    new_user = crud.create_user(db=db, user=user)

    # After creating the user, generate and send OTP for verification
    otp = otp_utils.generate_otp()
    crud.set_otp_for_user(db, user=new_user, otp=otp)
    otp_utils.send_otp_email(new_user.email, otp)

    return new_user

@app.post("/verify-registration")
def verify_new_user(request: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=request.email)

    if not user or user.is_email_verified:
        raise HTTPException(status_code=404, detail="User not found or already verified")

    if user.otp != request.otp or user.otp_expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # OTP is correct, activate the account
    user.is_email_verified = True
    user.otp = None
    user.otp_expiry = None
    db.commit()

    return {"message": "Account verified successfully. Please log in."}

@app.post("/user/token", response_model=schemas.Token)
def user_login_for_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # IMPORTANT: Check if the user's account has been verified
    if not user.is_email_verified:
        raise HTTPException(status_code=400, detail="Account not verified. Please check your email for an OTP.")

    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Report Endpoints ---
# (Your existing protected endpoints remain here)
# in backend/main.py

@app.post("/admin/token", response_model=schemas.Token)
def admin_login_for_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # IMPORTANT: Check if the user is an admin
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Not an admin account.",
        )

    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# in backend/main.py

@app.post("/api/reports/", response_model=schemas.Report)
def create_new_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    hazard_type: str = Form(...),
    description: str = Form(None),
    media: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    media_url = None
    if media:
        # This creates a unique filename to prevent overwrites
        file_extension = os.path.splitext(media.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("static/uploads", unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)
        media_url = f"/static/uploads/{unique_filename}"

    report_data = schemas.ReportCreate(
        latitude=latitude, longitude=longitude, hazard_type=hazard_type, 
        description=description, media_url=media_url
    )
    # This links the report to the logged-in user
    return crud.create_report(db=db, report=report_data, owner_id=current_user.id)

# in backend/main.py

@app.get("/api/reports/", response_model=list[schemas.Report])
def read_reports(
    hazard_type: str | None = None, 
    status: str | None = None,
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    # Authorization: Only admins can see all reports
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view all reports")

    reports = crud.get_reports(db, hazard_type=hazard_type, status=status, skip=skip, limit=limit)
    return reports

# in backend/main.py

@app.get("/api/users/me/reports", response_model=list[schemas.Report])
def read_own_reports(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_reports_by_owner(db=db, owner_id=current_user.id)