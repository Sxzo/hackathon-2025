import unittest
import json
import os
from app import create_app
from app.config import Config
from flask_jwt_extended import create_access_token, create_refresh_token

class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    # Use in-memory database for testing
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False

class JWTProtectedRoutesTest(unittest.TestCase):
    """Test JWT protected routes."""
    
    def setUp(self):
        """Set up test client and create test tokens."""
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Create test tokens
        with self.app.app_context():
            self.test_phone = "+1234567890"
            self.access_token = create_access_token(identity=self.test_phone)
            self.refresh_token = create_refresh_token(identity=self.test_phone)
            self.expired_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MTY3NjA0MDAsIm5iZiI6MTYxNjc2MDQwMCwianRpIjoiZmFrZS1qdGkiLCJleHAiOjE2MTY3NjA0MDEsImlkZW50aXR5IjoiKzEyMzQ1Njc4OTAiLCJmcmVzaCI6ZmFsc2UsInR5cGUiOiJhY2Nlc3MifQ.fake-signature"
    
    def tearDown(self):
        """Clean up after tests."""
        self.app_context.pop()
    
    def test_protected_route_with_valid_token(self):
        """Test accessing protected route with a valid token."""
        response = self.client.get(
            '/api/auth/protected',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['phone_number'], self.test_phone)
        self.assertEqual(data['message'], 'This is a protected route')
    
    def test_protected_route_without_token(self):
        """Test accessing protected route without a token."""
        response = self.client.get('/api/auth/protected')
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'authorization_required')
    
    def test_protected_route_with_invalid_token(self):
        """Test accessing protected route with an invalid token."""
        response = self.client.get(
            '/api/auth/protected',
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'invalid_token')
    
    def test_refresh_token_endpoint(self):
        """Test refreshing an access token with a valid refresh token."""
        response = self.client.post(
            '/api/auth/refresh',
            headers={"Authorization": f"Bearer {self.refresh_token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertEqual(data['token_type'], 'Bearer')
    
    def test_logout_endpoint(self):
        """Test logging out (revoking a token)."""
        response = self.client.delete(
            '/api/auth/logout',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Successfully logged out')
        
        # Try to use the token after logout
        response = self.client.get(
            '/api/auth/protected',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'token_revoked')
    
    def test_logout_all_endpoint(self):
        """Test logging out from all devices."""
        response = self.client.delete(
            '/api/auth/logout-all',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('Successfully logged out from all devices', data['message'])

if __name__ == '__main__':
    unittest.main() 