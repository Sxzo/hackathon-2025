#!/usr/bin/env python
import pytest
import jwt
import json
from unittest.mock import patch, MagicMock
from app import create_app
from datetime import datetime, timedelta

@pytest.fixture
def client():
    """Create a test client for the app."""
    app = create_app()
    app.config['TESTING'] = True
    
    # Use a fixed secret key for testing
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_twilio_verify():
    """Mock the Twilio Verify API responses."""
    # Create a mock for the verification creation
    verification_mock = MagicMock()
    verification_mock.status = 'pending'
    
    # Create a mock for the verification check
    verification_check_mock = MagicMock()
    verification_check_mock.status = 'approved'
    
    # Create a mock for the Twilio client
    with patch('app.api.routes.auth.twilio_client') as mock_client:
        # Set up the mock for the verification service
        mock_verify_service = MagicMock()
        mock_client.verify.services.return_value = mock_verify_service
        
        # Set up the mock for the verifications
        mock_verifications = MagicMock()
        mock_verify_service.verifications = mock_verifications
        mock_verifications.create.return_value = verification_mock
        
        # Set up the mock for the verification checks
        mock_verification_checks = MagicMock()
        mock_verify_service.verification_checks = mock_verification_checks
        mock_verification_checks.create.return_value = verification_check_mock
        
        yield mock_client

def test_send_verification(client, mock_twilio_verify):
    """Test sending a verification code."""
    # Send a verification code
    response = client.post(
        '/api/auth/send-verification',
        json={'phone_number': '+1234567890'}
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Verification code sent successfully'
    assert data['status'] == 'pending'
    
    # Verify the Twilio API was called correctly
    mock_twilio_verify.verify.services.assert_called_once()
    mock_twilio_verify.verify.services().verifications.create.assert_called_once_with(
        to='+1234567890', channel='sms'
    )

def test_verify_code_success(client, mock_twilio_verify):
    """Test verifying a code successfully."""
    # Verify a code
    response = client.post(
        '/api/auth/verify-code',
        json={'phone_number': '+1234567890', 'code': '123456'}
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Verification successful'
    assert data['authenticated'] is True
    assert 'token' in data
    assert data['phone_number'] == '+1234567890'
    
    # Verify the Twilio API was called correctly
    mock_twilio_verify.verify.services.assert_called_once()
    mock_twilio_verify.verify.services().verification_checks.create.assert_called_once_with(
        to='+1234567890', code='123456'
    )
    
    # Verify the JWT token
    token = data['token']
    decoded = jwt.decode(token, 'test-secret-key', algorithms=['HS256'])
    assert decoded['sub'] == '+1234567890'
    assert 'exp' in decoded
    assert 'iat' in decoded

def test_verify_code_failure(client, mock_twilio_verify):
    """Test verifying a code with failure."""
    # Set the verification check to fail
    mock_twilio_verify.verify.services().verification_checks.create.return_value.status = 'pending'
    
    # Verify a code
    response = client.post(
        '/api/auth/verify-code',
        json={'phone_number': '+1234567890', 'code': 'wrong-code'}
    )
    
    # Check the response
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data['message'] == 'Invalid verification code'
    assert data['authenticated'] is False
    assert data['status'] == 'pending'

def test_protected_route(client):
    """Test accessing a protected route with a valid token."""
    # Create a valid token
    payload = {
        'sub': '+1234567890',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, 'test-secret-key', algorithm='HS256')
    
    # Access the protected route
    response = client.get(
        '/api/auth/protected',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'This is a protected route'
    assert data['phone_number'] == '+1234567890'

def test_protected_route_invalid_token(client):
    """Test accessing a protected route with an invalid token."""
    # Access the protected route with an invalid token
    response = client.get(
        '/api/auth/protected',
        headers={'Authorization': 'Bearer invalid-token'}
    )
    
    # Check the response
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_protected_route_missing_token(client):
    """Test accessing a protected route without a token."""
    # Access the protected route without a token
    response = client.get('/api/auth/protected')
    
    # Check the response
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data['error'] == 'Token is missing'

def test_protected_route_expired_token(client):
    """Test accessing a protected route with an expired token."""
    # Create an expired token
    payload = {
        'sub': '+1234567890',
        'iat': datetime.utcnow() - timedelta(days=2),
        'exp': datetime.utcnow() - timedelta(days=1)
    }
    token = jwt.encode(payload, 'test-secret-key', algorithm='HS256')
    
    # Access the protected route
    response = client.get(
        '/api/auth/protected',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    # Check the response
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data['error'] == 'Token has expired' 