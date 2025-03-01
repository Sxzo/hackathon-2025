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
        print(access_token)
        # In a production app, you would store these tokens in a database
        # associated with the user's account
        # For this example, we'll just return them
        
        return jsonify({
            'access_token': access_token,
            'item_id': item_id,
            'message': 'Public token exchanged successfully',
            'plaid_connected': True
        })
    except plaid.ApiException as e:
        error_response = e.body
        return jsonify({'error': error_response}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get transactions for a user."""
    phone_number = get_jwt_identity()
    
    # Get access token from query parameter
    access_token = request.args.get('access_token')
    
    if not access_token:
        return jsonify({'error': 'Access token is required'}), 400
    
    try:
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
        
        return jsonify({
            'transactions': transactions,
            'accounts': accounts
        })
    except plaid.ApiException as e:
        error_response = e.body
        return jsonify({'error': error_response}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        print(access_token)
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
        
        return jsonify({
            'access_token': access_token,
            'item_id': item_id,
            'transactions': transactions,
            'accounts': accounts,
            'message': 'Bank account linked successfully',
            'plaid_connected': True
        })
    except plaid.ApiException as e:
        error_response = e.body
        return jsonify({'error': error_response}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500 