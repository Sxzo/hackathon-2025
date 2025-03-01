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
import re

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

    # Validate phone number format
    if not phone_number.startswith('+'):
        # Remove all non-digit characters using Python's re module
        phone_number = '+1' + re.sub(r'\D', '', phone_number)

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
        users_collection = get_users_collection()
        users_collection.update_one(
            {"phone_number": phone_number},
            {"$set": {"plaid_access_token": access_token, "plaid_item_id": item_id}}
        )
        
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
    phone_number = standardize_phone_number(phone_number)

    try:
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user or "plaid_access_token" not in user:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        access_token = user["plaid_access_token"]
        if not access_token:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        # Date range: last 30 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        # Reconfigure a fresh client (sometimes necessary if headers get cached)
        local_config = plaid.Configuration(
            host=environment.get(PLAID_ENV, plaid.Environment.Sandbox),
            api_key={
                'clientId': PLAID_CLIENT_ID,
                'secret': PLAID_SECRET,
            }
        )
        local_api_client = plaid.ApiClient(local_config)
        plaid_client = plaid_api.PlaidApi(local_api_client)

        transactions_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(count=100, offset=0)
        )
        
        response = plaid_client.transactions_get(transactions_request)
        
        # Process the response
        transactions = [tx.to_dict() for tx in response.transactions]
        accounts = [acct.to_dict() for acct in response.accounts]
        
        return jsonify({
            'transactions': transactions,
            'accounts': accounts
        })

    except plaid.ApiException as e:
        print(f"Plaid API Exception: {e.body}")
        return jsonify({'error': e.body}), 400
    except Exception as e:
        import traceback
        print(f"Exception in get_transactions: {str(e)}")
        print(traceback.format_exc())
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
        # Standardize phone number format
        phone_number = standardize_phone_number(phone_number)
        
        # Exchange public token for access token
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        exchange_response = client.item_public_token_exchange(exchange_request)
        
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        print(access_token)
        
        users_collection = get_users_collection()
        existing_user = users_collection.find_one({"phone_number": phone_number})
        if existing_user:
            users_collection.update_one(
                {"phone_number": phone_number},
                {"$set": {"plaid_access_token": access_token, "plaid_item_id": item_id}}
            )
        else:
            users_collection.insert_one({
                "phone_number": phone_number,
                "plaid_access_token": access_token,
                "plaid_item_id": item_id
            })
        # Set date range for transactions (last 30 days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=365)
        
        # Create request for transactions
        transactions_request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date,
            options=TransactionsGetRequestOptions(
                count=500,  # Number of transactions to return
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

@plaid_bp.route('/account-status', methods=['GET'])
@jwt_required()
def get_account_status():
    """Check if the user has a linked bank account."""
    phone_number = get_jwt_identity()
    phone_number = standardize_phone_number(phone_number)
    
    try:
        # Check if the user has a stored access token
        users_collection = get_users_collection()
        
        user = users_collection.find_one({"phone_number": phone_number})
        
        if user and "plaid_access_token" in user:
            return jsonify({
                'plaid_connected': True
            })
        else:
            return jsonify({
                'plaid_connected': False
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@plaid_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_accounts():
    """Get connected bank accounts for a user."""
    phone_number = get_jwt_identity()
    phone_number = standardize_phone_number(phone_number)

    try:
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user or "plaid_access_token" not in user:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        access_token = user["plaid_access_token"]
        if not access_token:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        # Reconfigure a fresh client (sometimes necessary if headers get cached)
        local_config = plaid.Configuration(
            host=environment.get(PLAID_ENV, plaid.Environment.Sandbox),
            api_key={
                'clientId': PLAID_CLIENT_ID,
                'secret': PLAID_SECRET,
            }
        )
        local_api_client = plaid.ApiClient(local_config)
        plaid_client = plaid_api.PlaidApi(local_api_client)

        # Get accounts
        accounts_response = plaid_client.accounts_get({
            'access_token': access_token
        })
        
        # Process the response
        accounts = [acct.to_dict() for acct in accounts_response.accounts]
        
        return jsonify({
            'accounts': accounts
        })

    except plaid.ApiException as e:
        print(f"Plaid API Exception: {e.body}")
        return jsonify({'error': e.body}), 400
    except Exception as e:
        import traceback
        print(f"Exception in get_accounts: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

def standardize_phone_number(phone_number: str) -> str:
    """Standardize phone number to +1 format."""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone_number))
    
    # If number starts with 1, add +, otherwise add +1
    if digits.startswith('1'):
        return f'+{digits}'
    return f'+1{digits}' 