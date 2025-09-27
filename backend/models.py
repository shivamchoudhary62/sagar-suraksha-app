# in backend/models.py
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Boolean, TIMESTAMP # Import TIMESTAMP
from sqlalchemy.orm import relationship
# Removed the old TIMESTAMPTZ import
from geoalchemy2 import Geometry
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False, default='user')
    is_email_verified = Column(Boolean, default=False)
    otp = Column(String(6), nullable=True)
    
    # CORRECTED: Use the generic TIMESTAMP type with timezone=True
    otp_expiry = Column(TIMESTAMP(timezone=True), nullable=True) 
    
    reports = relationship("Report", back_populates="owner")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    hazard_type = Column(String(50))
    description = Column(Text, nullable=True)
    status = Column(String(20), default='UNVERIFIED')
    media_url = Column(String(255), nullable=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="reports")

# (Your SocialMediaPost model if it exists)