from pydantic import BaseModel
from datetime import datetime

# --- Report Schemas ---
class ReportBase(BaseModel):
    latitude: float
    longitude: float
    hazard_type: str
    description: str | None = None
    media_url: str | None = None

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    status: str
    owner_id: int | None = None # Now optional

    class Config:
        from_attributes = True

class ReportStatusUpdate(BaseModel):
    status: str

# --- User Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    phone_number: str | None = None # Add optional phone number
    role: str = 'user'

class User(UserBase):
    id: int
    role: str
    phone_number: str | None = None
    is_email_verified: bool

    class Config:
        from_attributes = True

# --- Token & OTP Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class OTPRequest(BaseModel):
    # Can be either email or phone, but not both
    email: str | None = None
    phone_number: str | None = None

class VerifyOTPRequest(BaseModel):
    email: str | None = None
    phone_number: str | None = None
    otp: str

# --- Resend OTP Schema ---
class ResendOTPRequest(BaseModel):
    email: str

# --- Social Media Schemas ---
class SocialMediaPostBase(BaseModel):
    platform: str
    username: str
    post_text: str
    timestamp: datetime
    latitude: float | None = None
    longitude: float | None = None
    hazard_type: str | None = None
    sentiment: str | None = None
    is_verified: bool = False
    associated_report_id: int | None = None

class SocialMediaPostCreate(SocialMediaPostBase):
    pass

class SocialMediaPost(SocialMediaPostBase):
    id: int

    class Config:
        from_attributes = True