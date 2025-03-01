from flask import Blueprint, request, jsonify, current_app
import os
from twilio.rest import Client
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from datetime import datetime, timezone
from functools import wraps
import re
from app.database import get_users_collection

auth_bp = Blueprint('auth', __name__)

IS_DEVELOPMENT = False
# In-memory blocklist for revoked tokens
# In a production environment, this should be stored in Redis or a database
jwt_blocklist = set()

# Twilio credentials should be stored in environment variables
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID')

# Initialize Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None

def generate_jwt_token(phone_number):
    """Generate JWT tokens for authentication."""
    # Create access token with phone number as identity
    access_token = create_access_token(identity=phone_number)
    
    # Create refresh token
    refresh_token = create_refresh_token(identity=phone_number)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    }

@auth_bp.route('/send-verification', methods=['POST'])
def send_verification():
    """Send a verification code to the user's phone number."""
    data = request.get_json()
    
    if not data or 'phone_number' not in data:
        return jsonify({'error': 'Phone number is required'}), 400
    
    phone_number = data['phone_number']
    print(f"Original phone number: {phone_number}")
    
    # Validate phone number format
    if not phone_number.startswith('+'):
        # Remove all non-digit characters using Python's re module
        phone_number = '+1' + re.sub(r'\D', '', phone_number)
    
    print(f"Formatted phone number: {phone_number}")
    
    try:
        # Check if this is a signup request (has first_name and last_name)
        is_signup = 'first_name' in data and 'last_name' in data
        print(f"Is signup request: {is_signup}")
        
        # Check if user exists
        print("Checking if user exists")
        
        # Check if MongoDB is properly configured
        if not MONGO_URI:
            print("WARNING: MONGO_URI is not set")
            return jsonify({'error': 'Database configuration error'}), 500
            
        # Check if Twilio is properly configured
        if not twilio_client and not IS_DEVELOPMENT:
            print("WARNING: Twilio client is not initialized")
            return jsonify({'error': 'Twilio configuration error'}), 500
            
        if not TWILIO_VERIFY_SERVICE_SID and not IS_DEVELOPMENT:
            print("WARNING: TWILIO_VERIFY_SERVICE_SID is not set")
            return jsonify({'error': 'Twilio service SID not configured'}), 500
        
        try:
            existing_user = get_users_collection().find_one({'phone_number': phone_number})
            print(f"Existing user: {existing_user}")
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
        
        # For signup: fail if user exists
        if is_signup and existing_user:
            return jsonify({'error': 'A user with this phone number already exists'}), 400
            
        # For login: fail if user doesn't exist
        if not is_signup and not existing_user:
            return jsonify({'error': 'No account found with this phone number'}), 404
        
        # Send verification code
        verification_status = 'pending'
        
        if IS_DEVELOPMENT:
            # Use mock verification in development
            verification = mock_send_verification(phone_number)
            verification_status = verification['status']
        else:
            # Use Twilio in production
            try:
                print(f"Sending verification to {phone_number} using service SID: {TWILIO_VERIFY_SERVICE_SID}")
                verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
                    .verifications.create(to=phone_number, channel='sms')
                
                print(f"Verification status: {verification.status}")
                verification_status = verification.status
            except Exception as twilio_error:
                print(f"Twilio error: {str(twilio_error)}")
                return jsonify({'error': f'Twilio error: {str(twilio_error)}'}), 500
        
        if verification_status != 'pending':
            return jsonify({'error': f'Failed to send verification code. Status: {verification_status}'}), 500
        
        return jsonify({
            'message': 'Verification code sent successfully',
            'status': 'pending'
        })
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': f'Failed to send verification: {str(e)}'}), 500

@auth_bp.route('/verify-code', methods=['POST'])
def verify_code():
    """Verify the code sent to the user and return a JWT if valid."""
    data = request.get_json()
    
    if not data or 'phone_number' not in data or 'code' not in data:
        return jsonify({'error': 'Phone number and verification code are required'}), 400
    
    phone_number = data['phone_number']
    print(f"Original phone number for verification: {phone_number}")
    
    # Validate phone number format
    if not phone_number.startswith('+'):
        # Remove all non-digit characters using Python's re module
        phone_number = '+1' + re.sub(r'\D', '', phone_number)
    
    print(f"Formatted phone number for verification: {phone_number}")
    
    code = data['code']
    is_signup = 'first_name' in data and 'last_name' in data
    
    try:
        # Check if MongoDB is properly configured
        if not MONGO_URI:
            print("WARNING: MONGO_URI is not set")
            return jsonify({'error': 'Database configuration error'}), 500
            
        # Check if Twilio is properly configured
        if not twilio_client and not IS_DEVELOPMENT:
            print("WARNING: Twilio client is not initialized")
            return jsonify({'error': 'Twilio configuration error'}), 500
            
        if not TWILIO_VERIFY_SERVICE_SID and not IS_DEVELOPMENT:
            print("WARNING: TWILIO_VERIFY_SERVICE_SID is not set")
            return jsonify({'error': 'Twilio service SID not configured'}), 500
    
        # Check if user exists for signup
        if is_signup:
            try:
                existing_user = get_users_collection().find_one({'phone_number': phone_number})
                if existing_user:
                    return jsonify({'error': 'A user with this phone number already exists'}), 400
            except Exception as db_error:
                print(f"Database error: {str(db_error)}")
                return jsonify({'error': f'Database error: {str(db_error)}'}), 500

        # Verify the code
        verification_status = 'approved'
        
        if IS_DEVELOPMENT:
            # Use mock verification in development
            verification = mock_check_verification(phone_number, code)
            verification_status = verification['status']
        else:
            # Use Twilio in production
            try:
                print(f"Verifying code for {phone_number} using service SID: {TWILIO_VERIFY_SERVICE_SID}")
                verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
                    .verification_checks.create(to=phone_number, code=code)
                
                print(f"Verification check status: {verification.status}")
                verification_status = verification.status
            except Exception as twilio_error:
                print(f"Twilio error during verification: {str(twilio_error)}")
                return jsonify({'error': f'Twilio error: {str(twilio_error)}'}), 500
            
        if verification_status == 'approved':
            if is_signup:
                # Create new user
                new_user = {
                    'phone_number': phone_number,
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'status': 'verified',
                    'created_at': datetime.now(timezone.utc),
                    'plaid_connected': False
                }
                
                try:
                    get_users_collection().insert_one(new_user)
                    user_data = new_user
                except Exception as db_error:
                    print(f"Database error during user creation: {str(db_error)}")
                    return jsonify({'error': f'Database error: {str(db_error)}'}), 500
            else:
                # Get existing user data
                try:
                    user_data = get_users_collection().find_one({'phone_number': phone_number})
                    if not user_data:
                        return jsonify({'error': 'User not found after verification'}), 404
                except Exception as db_error:
                    print(f"Database error retrieving user: {str(db_error)}")
                    return jsonify({'error': f'Database error: {str(db_error)}'}), 500
            
            # Generate JWT token
            tokens = generate_jwt_token(phone_number)
            
            # Add plaid_enabled flag for frontend
            return jsonify({
                'message': 'Verification successful',
                'authenticated': True,
                'tokens': tokens,
                'phone_number': phone_number,
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'plaid_enabled': True,
                'plaid_connected': user_data.get('plaid_connected', False),
                'next_step': 'link_bank_account'
            })
        else:
            return jsonify({
                'message': 'Invalid verification code',
                'authenticated': False,
                'status': 'failed',
                'error': verification_status
            }), 401
    
    except Exception as e:
        print(f"Unexpected error during verification: {str(e)}")
        return jsonify({'error': f'Failed to verify code: {str(e)}'}), 500

# Example of a protected route using flask_jwt_extended
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected_route():
    """Example of a protected route that requires authentication."""
    # Get the identity from the JWT token
    current_user = get_jwt_identity()
    
    return jsonify({
        'message': 'This is a protected route',
        'phone_number': current_user
    })

# Route to refresh tokens
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh the access token using a valid refresh token."""
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user)
    
    return jsonify({
        'access_token': new_access_token,
        'token_type': 'Bearer'
    })

# Route to logout (revoke token)
@auth_bp.route('/logout', methods=['DELETE'])
@jwt_required()
def logout():
    """Revoke the current access token."""
    jti = get_jwt()["jti"]
    jwt_blocklist.add(jti)
    return jsonify(message="Successfully logged out"), 200

# Route to logout from all devices (revoke all tokens)
@auth_bp.route('/logout-all', methods=['DELETE'])
@jwt_required()
def logout_all():
    """Revoke all tokens for the current user."""
    # In a real application, you would query the database for all tokens
    # belonging to the current user and add them to the blocklist
    current_user = get_jwt_identity()
    # For demonstration, we're just revoking the current token
    jti = get_jwt()["jti"]
    jwt_blocklist.add(jti)
    return jsonify(message=f"Successfully logged out from all devices for {current_user}"), 200

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.get_json()
    
    if not data or 'phone_number' not in data or 'first_name' not in data or 'last_name' not in data:
        return jsonify({'error': 'Phone number and name are required'}), 400
    
    phone_number = data['phone_number']
    first_name = data['first_name']
    last_name = data['last_name']
    
    print(f"Signup request for: {first_name} {last_name}, phone: {phone_number}")
    
    # Validate phone number format
    if not phone_number.startswith('+'):
        # Remove all non-digit characters using Python's re module
        phone_number = '+1' + re.sub(r'\D', '', phone_number)
    
    print(f"Formatted phone number for signup: {phone_number}")
    
    try:
        # Check if MongoDB is properly configured
        if not MONGO_URI:
            print("WARNING: MONGO_URI is not set")
            return jsonify({'error': 'Database configuration error'}), 500
            
        # Check if Twilio is properly configured
        if not twilio_client and not IS_DEVELOPMENT:
            print("WARNING: Twilio client is not initialized")
            return jsonify({'error': 'Twilio configuration error'}), 500
            
        if not TWILIO_VERIFY_SERVICE_SID and not IS_DEVELOPMENT:
            print("WARNING: TWILIO_VERIFY_SERVICE_SID is not set")
            return jsonify({'error': 'Twilio service SID not configured'}), 500
        
        # Check if user already exists
        try:
            existing_user = get_users_collection().find_one({'phone_number': phone_number})
            if existing_user:
                print(f"User with phone {phone_number} already exists")
                return jsonify({'error': 'A user with this phone number already exists'}), 400
        except Exception as db_error:
            print(f"Database error checking existing user: {str(db_error)}")
            return jsonify({'error': f'Database error: {str(db_error)}'}), 500
        
        # Send verification code
        verification_status = 'pending'
        
        if IS_DEVELOPMENT:
            # Use mock verification in development
            verification = mock_send_verification(phone_number)
            verification_status = verification['status']
        else:
            # Use Twilio in production
            try:
                print(f"Sending verification to {phone_number} for signup using service SID: {TWILIO_VERIFY_SERVICE_SID}")
                verification = twilio_client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID) \
                    .verifications.create(to=phone_number, channel='sms')
                
                print(f"Signup verification status: {verification.status}")
                verification_status = verification.status
            except Exception as twilio_error:
                print(f"Twilio error during signup: {str(twilio_error)}")
                return jsonify({'error': f'Twilio error: {str(twilio_error)}'}), 500
        
        if verification_status != 'pending':
            return jsonify({'error': f'Failed to send verification code. Status: {verification_status}'}), 500
        
        return jsonify({
            'message': 'Verification code sent successfully',
            'status': 'pending'
        })
    
    except Exception as e:
        print(f"Unexpected error during signup: {str(e)}")
        return jsonify({'error': f'Failed to send verification: {str(e)}'}), 500 