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

auth_bp = Blueprint('auth', __name__)

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
    """Send a verification code via Twilio Verify."""
    data = request.get_json()
    print(data)
    if not data or 'phone_number' not in data:
        return jsonify({'error': 'Phone number is required'}), 400
    
    phone_number = data['phone_number']
    
    # Validate phone number format (basic validation)
    if not phone_number.startswith('+'):
        phone_number = '+1' + phone_number
    
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
            tokens = generate_jwt_token(phone_number)
            
            return jsonify({
                'message': 'Verification successful',
                'authenticated': True,
                'tokens': tokens,
                'phone_number': phone_number,
                'plaid_enabled': True,  # Flag to indicate Plaid integration is available
                'next_step': 'link_bank_account'  # Suggest next step to client
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