import unittest
import json
import os
from unittest.mock import patch, MagicMock
from app import create_app
from flask_jwt_extended import create_access_token

class TestPlaidRoutes(unittest.TestCase):
    def setUp(self):
        """Set up test client and authentication tokens."""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test-key'
        self.client = self.app.test_client()
        
        # Create a test user identity
        with self.app.app_context():
            self.test_phone = '+11234567890'
            # This JWT token is only for authenticating with our backend API
            self.access_token = create_access_token(identity=self.test_phone)
            self.headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
    
    @patch('app.api.routes.plaid.client.link_token_create')
    def test_create_link_token(self, mock_link_token_create):
        """Test creating a link token."""
        # Mock the Plaid API response
        mock_response = MagicMock()
        mock_response.to_dict.return_value = {
            'link_token': 'test-link-token',
            'expiration': '2023-01-01T00:00:00Z'
        }
        mock_link_token_create.return_value = mock_response
        
        # Make request to create link token
        # We use our JWT token to authenticate with our backend API
        response = self.client.post(
            '/api/plaid/create-link-token',
            headers=self.headers
        )
        
        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('link_token', data)
        self.assertEqual(data['link_token'], 'test-link-token')
        
        # Verify the mock was called with correct parameters
        # Ensure we're not passing our JWT token to Plaid
        mock_link_token_create.assert_called_once()
        # Check that the JWT token is not in the call arguments
        for call_args in mock_link_token_create.call_args:
            if isinstance(call_args, dict):
                self.assertNotIn('Authorization', call_args)
                self.assertNotIn('Bearer', str(call_args))
    
    @patch('app.api.routes.plaid.client.item_public_token_exchange')
    def test_exchange_public_token(self, mock_exchange):
        """Test exchanging a public token for an access token."""
        # Mock the Plaid API response
        mock_exchange.return_value = {
            'access_token': 'plaid-access-token',  # This is a Plaid access token, not a JWT
            'item_id': 'test-item-id'
        }
        
        # Make request to exchange public token
        # We use our JWT token to authenticate with our backend API
        response = self.client.post(
            '/api/plaid/exchange-public-token',
            headers=self.headers,
            json={'public_token': 'test-public-token'}
        )
        
        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertEqual(data['access_token'], 'plaid-access-token')
        self.assertIn('item_id', data)
        self.assertEqual(data['item_id'], 'test-item-id')
        
        # Verify the mock was called with correct parameters
        # Ensure we're not passing our JWT token to Plaid
        mock_exchange.assert_called_once()
        # Check that the JWT token is not in the call arguments
        for call_args in mock_exchange.call_args:
            if isinstance(call_args, dict):
                self.assertNotIn('Authorization', call_args)
                self.assertNotIn('Bearer', str(call_args))
    
    def test_exchange_public_token_missing_token(self):
        """Test exchanging a public token without providing the token."""
        # Make request without public token
        response = self.client.post(
            '/api/plaid/exchange-public-token',
            headers=self.headers,
            json={}
        )
        
        # Assert response
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Public token is required')
    
    @patch('app.api.routes.plaid.client.transactions_get')
    def test_get_transactions(self, mock_transactions_get):
        """Test getting transactions."""
        # Mock the Plaid API response
        mock_response = {
            'transactions': [
                MagicMock(to_dict=lambda: {
                    'transaction_id': 'txn1',
                    'amount': 100.0,
                    'date': '2023-01-01',
                    'name': 'Test Transaction'
                })
            ],
            'accounts': [
                MagicMock(to_dict=lambda: {
                    'account_id': 'acc1',
                    'name': 'Test Account',
                    'type': 'depository'
                })
            ]
        }
        mock_transactions_get.return_value = mock_response
        
        # Make request to get transactions
        # We use our JWT token to authenticate with our backend API
        # The Plaid access token is passed as a query parameter
        response = self.client.get(
            '/api/plaid/transactions?access_token=plaid-access-token',
            headers=self.headers
        )
        
        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('transactions', data)
        self.assertIn('accounts', data)
        self.assertEqual(len(data['transactions']), 1)
        self.assertEqual(data['transactions'][0]['transaction_id'], 'txn1')
        
        # Verify the mock was called with correct parameters
        # Ensure we're not passing our JWT token to Plaid
        mock_transactions_get.assert_called_once()
        # Check that the JWT token is not in the call arguments
        for call_args in mock_transactions_get.call_args:
            if isinstance(call_args, dict):
                self.assertNotIn('Authorization', call_args)
                self.assertNotIn('Bearer', str(call_args))
                
        # Verify that the Plaid access token is used correctly
        args, kwargs = mock_transactions_get.call_args
        if args and len(args) > 0:
            request_obj = args[0]
            self.assertEqual(request_obj.access_token, 'plaid-access-token')
    
    def test_get_transactions_missing_token(self):
        """Test getting transactions without providing an access token."""
        # Make request without access token
        response = self.client.get(
            '/api/plaid/transactions',
            headers=self.headers
        )
        
        # Assert response
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Access token is required')
    
    @patch('app.api.routes.plaid.client.item_public_token_exchange')
    @patch('app.api.routes.plaid.client.transactions_get')
    def test_signup_transactions(self, mock_transactions_get, mock_exchange):
        """Test getting transactions during signup."""
        # Mock the Plaid API responses
        mock_exchange.return_value = {
            'access_token': 'plaid-access-token',  # This is a Plaid access token, not a JWT
            'item_id': 'test-item-id'
        }
        
        mock_transactions_get.return_value = {
            'transactions': [
                MagicMock(to_dict=lambda: {
                    'transaction_id': 'txn1',
                    'amount': 100.0,
                    'date': '2023-01-01',
                    'name': 'Test Transaction'
                })
            ],
            'accounts': [
                MagicMock(to_dict=lambda: {
                    'account_id': 'acc1',
                    'name': 'Test Account',
                    'type': 'depository'
                })
            ]
        }
        
        # Make request to get transactions during signup
        # No JWT token needed for this endpoint as it's part of the signup flow
        response = self.client.post(
            '/api/plaid/signup-transactions',
            json={
                'public_token': 'test-public-token',
                'phone_number': self.test_phone
            }
        )
        
        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('transactions', data)
        self.assertIn('accounts', data)
        self.assertEqual(len(data['transactions']), 1)
        self.assertEqual(data['transactions'][0]['transaction_id'], 'txn1')
        
        # Verify the mocks were called with correct parameters
        # Ensure we're not passing our JWT token to Plaid
        mock_exchange.assert_called_once()
        mock_transactions_get.assert_called_once()
        
        # Check that the JWT token is not in the call arguments for either mock
        for mock in [mock_exchange, mock_transactions_get]:
            for call_args in mock.call_args:
                if isinstance(call_args, dict):
                    self.assertNotIn('Authorization', call_args)
                    self.assertNotIn('Bearer', str(call_args))
    
    def test_signup_transactions_missing_data(self):
        """Test getting transactions during signup without providing required data."""
        # Test missing public token
        response = self.client.post(
            '/api/plaid/signup-transactions',
            json={'phone_number': self.test_phone}
        )
        
        # Assert response
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Public token and phone number are required')
        
        # Test missing phone number
        response = self.client.post(
            '/api/plaid/signup-transactions',
            json={'public_token': 'test-public-token'}
        )
        
        # Assert response
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Public token and phone number are required')
    
    @patch('app.api.routes.plaid.client.item_public_token_exchange')
    def test_plaid_api_exception(self, mock_exchange):
        """Test handling of Plaid API exceptions."""
        # Mock a Plaid API exception
        import plaid
        mock_exchange.side_effect = plaid.ApiException(
            status=400,
            reason="Bad Request",
            body='{"error_code": "INVALID_PUBLIC_TOKEN", "error_message": "The public token is invalid"}'
        )
        
        # Make request to exchange public token
        response = self.client.post(
            '/api/plaid/exchange-public-token',
            headers=self.headers,
            json={'public_token': 'invalid-token'}
        )
        
        # Assert response
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.data)
        self.assertIn('error', data)
        
        # Verify the mock was called
        mock_exchange.assert_called_once()
        
        # Check that the JWT token is not in the call arguments
        for call_args in mock_exchange.call_args:
            if isinstance(call_args, dict):
                self.assertNotIn('Authorization', call_args)
                self.assertNotIn('Bearer', str(call_args))

if __name__ == '__main__':
    unittest.main() 