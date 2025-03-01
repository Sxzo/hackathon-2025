import unittest
import json
import time
from datetime import timedelta
from app import create_app
from app.config import Config
from flask_jwt_extended import create_access_token

class TestExpiredTokenConfig(Config):
    """Test configuration with very short token expiration."""
    TESTING = True
    # Set token expiration to 1 second for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=1)

class JWTTokenExpirationTest(unittest.TestCase):
    """Test JWT token expiration."""
    
    def setUp(self):
        """Set up test client and create test tokens."""
        self.app = create_app(TestExpiredTokenConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Create test token with short expiration
        with self.app.app_context():
            self.test_phone = "+1234567890"
            self.access_token = create_access_token(identity=self.test_phone)
    
    def tearDown(self):
        """Clean up after tests."""
        self.app_context.pop()
    
    def test_token_expiration(self):
        """Test that tokens expire after the configured time."""
        # First, verify the token works
        response = self.client.get(
            '/api/auth/protected',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['phone_number'], self.test_phone)
        
        # Wait for token to expire (2 seconds to be safe)
        print("Waiting for token to expire...")
        time.sleep(2)
        
        # Try to use the expired token
        response = self.client.get(
            '/api/auth/protected',
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'token_expired')

if __name__ == '__main__':
    unittest.main() 