import unittest
import json
import os
from unittest.mock import patch, MagicMock
from app import create_app

class TestPlaidIntegration(unittest.TestCase):
    def setUp(self):
        """Set up test client and test data."""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['JWT_SECRET_KEY'] = 'test-key'
        self.client = self.app.test_client()
        
        # Test user data
        self.test_phone = '+11234567890'
        self.test_code = '123456'
        self.test_public_token = 'test-public-token'
        
        # Store tokens for later use
        self.access_token = None  # This will be a JWT token for our API
        self.refresh_token = None
    
    @patch('app.api.routes.auth.twilio_client.verify.v2.services')
    def test_full_signup_and_plaid_flow(self, mock_twilio_services):
        """Test the full flow from signup to Plaid integration."""
        # Step 1: Mock Twilio verification
        mock_verification_checks = MagicMock()
        mock_verification_checks.create.return_value = MagicMock(status='approved')
        
        mock_service = MagicMock()
        mock_service.verification_checks = mock_verification_checks
        
        mock_twilio_services.return_value = mock_service
        
        # Step 2: Verify phone and get tokens
        response = self.client.post(
            '/api/auth/verify-code',
            json={
                'phone_number': self.test_phone,
                'code': self.test_code
            }
        )
        
        # Assert verification response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['authenticated'])
        self.assertTrue(data['plaid_enabled'])
        self.assertEqual(data['next_step'], 'link_bank_account')
        
        # Store tokens for later use - these are JWT tokens for our API, not Plaid tokens
        self.access_token = data['tokens']['access_token']
        self.refresh_token = data['tokens']['refresh_token']
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        # Step 3: Create Plaid link token
        with patch('app.api.routes.plaid.client.link_token_create') as mock_link_token_create:
            # Mock link token creation
            mock_response = MagicMock()
            mock_response.to_dict.return_value = {
                'link_token': 'test-link-token',
                'expiration': '2023-01-01T00:00:00Z'
            }
            mock_link_token_create.return_value = mock_response
            
            # Request link token - we use our JWT token to authenticate with our backend API
            response = self.client.post(
                '/api/plaid/create-link-token',
                headers=self.headers
            )
            
            # Assert link token response
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertIn('link_token', data)
            self.assertEqual(data['link_token'], 'test-link-token')
            
            # Verify that we're not passing our JWT token to Plaid
            for call_args in mock_link_token_create.call_args:
                if isinstance(call_args, dict):
                    self.assertNotIn('Authorization', call_args)
                    self.assertNotIn('Bearer', str(call_args))
        
        # Step 4: Exchange public token (simulating frontend sending token after user bank selection)
        with patch('app.api.routes.plaid.client.item_public_token_exchange') as mock_exchange:
            # Mock token exchange
            mock_exchange.return_value = {
                'access_token': 'plaid-access-token',  # This is a Plaid access token, not a JWT
                'item_id': 'plaid-item-id'
            }
            
            # Exchange public token - we use our JWT token to authenticate with our backend API
            response = self.client.post(
                '/api/plaid/exchange-public-token',
                headers=self.headers,
                json={'public_token': self.test_public_token}
            )
            
            # Assert exchange response
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertIn('access_token', data)
            self.assertEqual(data['access_token'], 'plaid-access-token')
            self.assertIn('item_id', data)
            self.assertEqual(data['item_id'], 'plaid-item-id')
            
            # Verify that we're not passing our JWT token to Plaid
            for call_args in mock_exchange.call_args:
                if isinstance(call_args, dict):
                    self.assertNotIn('Authorization', call_args)
                    self.assertNotIn('Bearer', str(call_args))
        
        # Step 5: Get transactions
        with patch('app.api.routes.plaid.client.transactions_get') as mock_transactions_get:
            # Mock transactions response
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
            
            # Get transactions - we use our JWT token to authenticate with our backend API
            # The Plaid access token is passed as a query parameter
            response = self.client.get(
                '/api/plaid/transactions?access_token=plaid-access-token',
                headers=self.headers
            )
            
            # Assert transactions response
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertIn('transactions', data)
            self.assertIn('accounts', data)
            self.assertEqual(len(data['transactions']), 1)
            self.assertEqual(data['transactions'][0]['transaction_id'], 'txn1')
            
            # Verify that we're not passing our JWT token to Plaid
            for call_args in mock_transactions_get.call_args:
                if isinstance(call_args, dict):
                    self.assertNotIn('Authorization', call_args)
                    self.assertNotIn('Bearer', str(call_args))
            
            # Verify that the Plaid access token is used correctly
            args, kwargs = mock_transactions_get.call_args
            if args and len(args) > 0:
                request_obj = args[0]
                self.assertEqual(request_obj.access_token, 'plaid-access-token')
    
    @patch('app.api.routes.plaid.client.item_public_token_exchange')
    @patch('app.api.routes.plaid.client.transactions_get')
    def test_signup_with_transactions(self, mock_transactions_get, mock_exchange):
        """Test getting transactions during the signup process."""
        # Mock token exchange
        mock_exchange.return_value = {
            'access_token': 'plaid-access-token',  # This is a Plaid access token, not a JWT
            'item_id': 'plaid-item-id'
        }
        
        # Mock transactions response
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
        
        # Get transactions during signup - no JWT token needed for this endpoint
        response = self.client.post(
            '/api/plaid/signup-transactions',
            json={
                'public_token': self.test_public_token,
                'phone_number': self.test_phone
            }
        )
        
        # Assert response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'Bank account linked successfully')
        self.assertIn('transactions', data)
        self.assertIn('accounts', data)
        self.assertEqual(len(data['transactions']), 1)
        self.assertEqual(data['transactions'][0]['transaction_id'], 'txn1')
        
        # Verify that we're not passing any JWT token to Plaid
        for mock in [mock_exchange, mock_transactions_get]:
            for call_args in mock.call_args:
                if isinstance(call_args, dict):
                    self.assertNotIn('Authorization', call_args)
                    self.assertNotIn('Bearer', str(call_args))

if __name__ == '__main__':
    unittest.main() 