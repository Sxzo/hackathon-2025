from flask import Blueprint, request, jsonify, current_app
import os
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import get_users_collection

plaid_bp = Blueprint('plaid', __name__)

# Initialize Plaid client
PLAID_CLIENT_ID = os.environ.get('PLAID_CLIENT_ID')
PLAID_SECRET = os.environ.get('PLAID_SECRET')
PLAID_ENV = os.environ.get('PLAID_ENV', 'sandbox')
PLAID_PRODUCTS = os.environ.get('PLAID_PRODUCTS', 'transactions').split(',')
PLAID_COUNTRY_CODES = os.environ.get('PLAID_COUNTRY_CODES', 'US').split(',')

# Map environment to Plaid API environment
environment = {
    'sandbox': plaid.Environment.Sandbox,
    'development': plaid.Environment.Development,
    'production': plaid.Environment.Production
}

# Configure Plaid client
configuration = plaid.Configuration(
    host=environment.get(PLAID_ENV, plaid.Environment.Sandbox),
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

@plaid_bp.route('/create-link-token', methods=['POST'])
@jwt_required()
def create_link_token():
    """Create a link token for Plaid Link."""
    # Get the current user's phone number from JWT
    phone_number = get_jwt_identity()
    
    try:
        # Create a link token for the given user
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id=phone_number
            ),
            client_name="Finn AI",
            products=[Products(product) for product in PLAID_PRODUCTS],
            country_codes=[CountryCode(code) for code in PLAID_COUNTRY_CODES],
            language='en'
        )
        
        response = client.link_token_create(request)
        return jsonify(response.to_dict())
    
    except plaid.ApiException as e:
        return jsonify({'error': e.body}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/exchange-public-token', methods=['POST'])
@jwt_required()
def exchange_public_token():
    """Exchange a public token for an access token and item ID."""
    phone_number = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'public_token' not in data:
        return jsonify({'error': 'Public token is required'}), 400
    
    public_token = data['public_token']
    
    try:
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        exchange_response = client.item_public_token_exchange(exchange_request)
        
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        
        # Update user record to mark Plaid as connected
        try:
            users_collection = get_users_collection()
            
            current_app.logger.info(f"Updating Plaid connection for user {phone_number}")
            # Update the user record
            result = users_collection.update_one(
                {'phone_number': phone_number},
                {'$set': {
                    'plaid_connected': True,
                    'plaid_item_id': item_id,
                    'plaid_access_token': access_token,
                    'plaid_connected_at': datetime.now()
                }}
            )
            
            if result.modified_count == 0:
                current_app.logger.warning(f"Failed to update plaid connection status for user {phone_number}")
        except Exception as db_error:
            current_app.logger.error(f"Database error updating plaid connection: {str(db_error)}")
            raise
        
        # In a production app, you would store these tokens in a database
        # associated with the user's account
        # For this example, we'll just return them
        # You should NEVER return the access_token to the client in production
        
        return jsonify({
            'access_token': access_token,
            'item_id': item_id,
            'message': 'Public token exchanged successfully',
            'plaid_connected': True
        })
    
    except plaid.ApiException as e:
        return jsonify({'error': e.body}), 500
    except Exception as e:
        current_app.logger.error(f"Error in exchange_public_token: {str(e)}")
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get transactions for a user."""
    phone_number = get_jwt_identity()
    
    # In a production app, you would retrieve the access_token from your database
    # based on the user's identity
    access_token = request.args.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Access token is required'}), 400
    
    try:
        # Set date range for transactions (last 30 days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Create request for transactions
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=100,  # Number of transactions to return
                offset=0
            )
        )
        
        response = client.transactions_get(request)
        transactions = response['transactions']
        
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions],
            'accounts': [account.to_dict() for account in response['accounts']]
        })
    
    except plaid.ApiException as e:
        return jsonify({'error': e.body}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to get transactions during signup
@plaid_bp.route('/signup-transactions', methods=['POST'])
def signup_transactions():
    """Get transactions during the signup process."""
    data = request.get_json()
    
    if not data or 'public_token' not in data or 'phone_number' not in data:
        return jsonify({'error': 'Public token and phone number are required'}), 400
    
    public_token = data['public_token']
    phone_number = data['phone_number']
    
    try:
        # Exchange public token for access token
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        exchange_response = client.item_public_token_exchange(exchange_request)
        
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        
        # Set date range for transactions (last 30 days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Create request for transactions
        transactions_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=100,  # Number of transactions to return
                offset=0
            )
        )
        
        transactions_response = client.transactions_get(transactions_request)
        transactions = transactions_response['transactions']
        accounts = transactions_response['accounts']
        
        # Update user record to mark Plaid as connected
        try:
            users_collection = get_users_collection()
            
            current_app.logger.info(f"Updating Plaid connection for user {phone_number} during signup")
            # Update the user record
            result = users_collection.update_one(
                {'phone_number': phone_number},
                {'$set': {
                    'plaid_connected': True,
                    'plaid_item_id': item_id,
                    'plaid_access_token': access_token,
                    'plaid_connected_at': datetime.now()
                }}
            )
            
            if result.modified_count == 0:
                current_app.logger.warning(f"Failed to update plaid connection status for user {phone_number}")
        except Exception as db_error:
            current_app.logger.error(f"Database error updating plaid connection: {str(db_error)}")
            raise
                
        return jsonify({
            'message': 'Bank account linked successfully',
            'transactions': [transaction.to_dict() for transaction in transactions],
            'accounts': [account.to_dict() for account in accounts],
            'plaid_connected': True
        })
    
    except plaid.ApiException as e:
        return jsonify({'error': e.body}), 500
    except Exception as e:
        current_app.logger.error(f"Error in signup_transactions: {str(e)}")
        return jsonify({'error': str(e)}), 500 