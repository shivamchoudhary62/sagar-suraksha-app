import random
import string

def generate_otp(length: int = 6) -> str:
    """Generate a random 6-digit OTP."""
    return "".join(random.choices(string.digits, k=length))

def send_otp_email(email: str, otp: str):
    """
    Placeholder for sending OTP via email.
    In a real app, you would integrate a service like SendGrid here.
    """
    print("--- SENDING OTP EMAIL ---")
    print(f"To: {email}")
    print(f"OTP: {otp}")
    print("-------------------------")

def send_otp_sms(phone_number: str, otp: str):
    """
    Placeholder for sending OTP via SMS.
    In a real app, you would integrate a service like Twilio or MSG91 here.
    """
    print("--- SENDING OTP SMS ---")
    print(f"To: {phone_number}")
    print("-----------------------")