from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import models, schemas, security
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

# --- User CRUD ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_phone(db: Session, phone_number: str):
    return db.query(models.User).filter(models.User.phone_number == phone_number).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        phone_number=user.phone_number,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def set_otp_for_user(db: Session, user: models.User, otp: str):
    expiry_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    user.otp = otp
    user.otp_expiry = expiry_time
    db.commit()
    db.refresh(user)
    return user

# --- Report CRUD ---
def create_report(db: Session, report: schemas.ReportCreate, owner_id: int | None = None):
    point = Point(report.longitude, report.latitude)
    db_report = models.Report(
        latitude=report.latitude,
        longitude=report.longitude,
        hazard_type=report.hazard_type,
        description=report.description,
        media_url=report.media_url,
        owner_id=owner_id,
        location=from_shape(point, srid=4326)
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports(db: Session, hazard_type: str | None = None, status: str | None = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Report)
    if hazard_type:
        query = query.filter(models.Report.hazard_type == hazard_type)
    if status:
        query = query.filter(models.Report.status == status)
    return query.offset(skip).limit(limit).all()

def update_report_status(db: Session, report_id: int, status: str):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if db_report:
        db_report.status = status
        db.commit()
        db.refresh(db_report)
    return db_report

def delete_report(db: Session, report_id: int):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if db_report:
        db.delete(db_report)
        db.commit()
    return db_report

def get_reports_by_owner(db: Session, owner_id: int):
    return db.query(models.Report).filter(models.Report.owner_id == owner_id).order_by(models.Report.id.desc()).all()