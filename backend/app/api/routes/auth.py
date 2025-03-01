from flask import Blueprint, request, jsonify, current_app
import os
import jwt
import requests
from datetime import datetime, timedelta
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

auth_bp = Blueprint('auth', __name__)

# Twilio credentials should be stored in environment variables
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID')

# Initialize Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None

def generate_jwt_token(phone_number):
    """Generate a JWT token with the phone number as the identity."""
    payload = {
        'sub': phone_number,  # Subject (identity)
        'iat': datetime.utcnow(),  # Issued at
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config['JWT_EXPIRATION_DELTA'])  # Expiration
    }
    
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    return token

@auth_bp.route('/send-verification', methods=['POST'])
def send_verification():
    """Send a verification code via Twilio Verify."""
    data = request.get_json()
    
    if not data or 'phone_number' not in data:
        return jsonify({'error': 'Phone number is required'}), 400
    
    phone_number = data['phone_number']
    
    # Validate phone number format (basic validation)
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
    
    # Check if Twilio is configured
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        return jsonify({'error': 'Twilio Verify is not configured'}), 500
    
    try:
        # Use direct API call to Twilio Verify
        verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create(to=phone_number, channel='sms')
        
        if verification.status != 'pending':
            return verification
        
        return jsonify({
            'message': 'Verification code sent successfully',
            'status': 'pending'
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to send verification: {str(e)}'}), 500

@auth_bp.route('/verify-code', methods=['POST'])
def verify_code():
    """Verify the code sent to the user and return a JWT if valid."""
    data = request.get_json()
    
    if not data or 'phone_number' not in data or 'code' not in data:
        return jsonify({'error': 'Phone number and verification code are required'}), 400
    
    phone_number = data['phone_number']
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
    
    code = data['code']
    
    # Check if Twilio is configured
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_VERIFY_SERVICE_SID:
        return jsonify({'error': 'Twilio Verify is not configured'}), 500
    
    try:
        # Use direct API call to Twilio Verify
        verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verification_checks.create(to=phone_number, code=code)
        
        if verification.status == 'approved':
            # Generate JWT token with phone number as identity
            token = generate_jwt_token(phone_number)
            
            return jsonify({
                'message': 'Verification successful',
                'authenticated': True,
                'token': token,
                'phone_number': phone_number
            })
        else:
            return jsonify({
                'message': 'Invalid verification code',
                'authenticated': False,
                'status': 'failed',
                'error': verification.status
            }), 401
    
    except Exception as e:
        return jsonify({'error': f'Failed to verify code: {str(e)}'}), 500

# Create a decorator for protected routes
def token_required(f):
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in the headers
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode the token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Extract phone number from token
            phone_number = payload['sub']
            
            # Add phone_number to kwargs for the route function
            kwargs['phone_number'] = phone_number
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# Example of a protected route
@auth_bp.route('/protected', methods=['GET'])
@token_required
def protected_route(phone_number):
    """Example of a protected route that requires authentication."""
    return jsonify({
        'message': 'This is a protected route',
        'phone_number': phone_number
    }) 