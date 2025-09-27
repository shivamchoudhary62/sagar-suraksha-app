from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File, WebSocket
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
import os
import shutil
import json
import uuid
from websocket_manager import manager

# Imports for the custom encoder fix
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape

import crud, models, schemas, security, otp_utils
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Custom encoder for GeoAlchemy's WKBElement ---
custom_encoder = {
    WKBElement: lambda x: to_shape(x).wkt  # Converts the location object to a readable string
}

# --- CORS and Static files setup ---
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5000",
    "http://localhost:8080",
]
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

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except Exception:
        manager.disconnect(websocket)

# --- Authentication & Registration Endpoints ---
@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.phone_number and crud.get_user_by_phone(db, phone_number=user.phone_number):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_user = crud.create_user(db=db, user=user)
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
    
    user.is_email_verified = True
    user.otp = None
    user.otp_expiry = None
    db.commit()
    return {"message": "Account verified successfully. Please log in."}

@app.post("/user/token", response_model=schemas.Token)
def user_login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_email_verified:
        raise HTTPException(status_code=400, detail="Account not verified. Please check your email for an OTP.")
    
    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/admin/token", response_model=schemas.Token)
def admin_login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not an admin account.")
    
    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Public Report Endpoint ---
@app.post("/api/public/reports/", response_model=schemas.Report, status_code=status.HTTP_201_CREATED)
async def create_public_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    hazard_type: str = Form(...),
    description: str = Form(None),
    media: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    media_url = None
    if media:
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
    new_report = crud.create_report(db=db, report=report_data, owner_id=None)
    
    await manager.broadcast(jsonable_encoder(new_report, custom_encoder=custom_encoder))
    return new_report

# --- Protected Report Endpoints ---
@app.post("/api/reports/", response_model=schemas.Report)
async def create_new_report(
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
    new_report = crud.create_report(db=db, report=report_data, owner_id=current_user.id)
    
    await manager.broadcast(jsonable_encoder(new_report, custom_encoder=custom_encoder))
    return new_report

@app.get("/api/reports/", response_model=list[schemas.Report])
def read_reports(
    hazard_type: str | None = None, 
    status: str | None = None,
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view all reports")
    return crud.get_reports(db, hazard_type=hazard_type, status=status, skip=skip, limit=limit)

@app.patch("/api/reports/{report_id}", response_model=schemas.Report)
def update_report_status(
    report_id: int, 
    report_update: schemas.ReportStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update reports")
    updated_report = crud.update_report_status(db, report_id=report_id, status=report_update.status)
    if not updated_report:
        raise HTTPException(status_code=404, detail="Report not found")
    return updated_report

@app.get("/api/users/me/reports", response_model=list[schemas.Report])
def read_own_reports(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_reports_by_owner(db=db, owner_id=current_user.id)

@app.delete("/api/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_a_report(
    report_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete reports")
    report_to_delete = crud.delete_report(db, report_id=report_id)
    if not report_to_delete:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True}