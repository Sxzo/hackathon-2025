import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Generate a secure random key if not provided in environment
    # This is critical for JWT security
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    
    # JWT configuration
    JWT_EXPIRATION_DELTA = int(os.environ.get('JWT_EXPIRATION_DELTA', 86400))  # 24 hours in seconds
    
    # Twilio configuration
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
    TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID')
    # Add other configuration variables as needed 