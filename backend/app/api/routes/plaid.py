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
from datetime import datetime, timedelta, date
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import get_users_collection
import re
import uuid

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
    
    # Get date range from query parameters (default to 30 days)
    days_back = request.args.get('days', '30')
    # Get pagination parameters
    count = request.args.get('count', '500')
    offset = request.args.get('offset', '0')
    
    # Flag to include custom demo transactions - default to true
    include_custom = request.args.get('include_custom', 'true').lower() == 'true'
    
    # Flag to filter for stock transactions only
    stock_only = request.args.get('stock_only', 'false').lower() == 'true'
    
    try:
        days_back = int(days_back)
        count = int(count)
        offset = int(offset)
        
        # Limit to reasonable values
        if days_back < 1:
            days_back = 30
        elif days_back > 365:
            days_back = 365
            
        # Limit count to reasonable values
        if count < 1:
            count = 500
        elif count > 500:
            count = 500
    except ValueError:
        days_back = 30
        count = 500
        offset = 0

    try:
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user or "plaid_access_token" not in user:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        access_token = user["plaid_access_token"]
        if not access_token:
            return jsonify({'error': 'No linked bank account found'}), 404
        
        # Date range based on requested days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)

        # Reconfigure a fresh client
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
            options=TransactionsGetRequestOptions(count=count, offset=offset)
        )
        
        response = plaid_client.transactions_get(transactions_request)
        
        # Process the Plaid response
        plaid_transactions = [tx.to_dict() for tx in response.transactions]
        accounts = [acct.to_dict() for acct in response.accounts]
        
        # Add custom transactions by default
        all_transactions = plaid_transactions
        if include_custom:
            custom_transactions = generate_custom_transactions(accounts)
            all_transactions = plaid_transactions + custom_transactions
            
            # Convert any date objects to ISO 8601 strings before sorting
            for tx in all_transactions:
                val = tx.get('date')
                # If it's a datetime or date object, convert to 'YYYY-MM-DD'
                if isinstance(val, (datetime, date)):
                    tx['date'] = val.isoformat()

            # Filter for stock transactions if requested
            if stock_only:
                # First filter for stock transactions
                stock_transactions = [tx for tx in all_transactions if tx.get('is_stock', False)]
                
                # Then filter by date range
                start_date_obj = datetime.strptime(start_date.isoformat(), '%Y-%m-%d').date()
                end_date_obj = datetime.strptime(end_date.isoformat(), '%Y-%m-%d').date()
                
                filtered_transactions = []
                for tx in stock_transactions:
                    # Convert transaction date string to date object for comparison
                    tx_date_str = tx.get('date')
                    try:
                        # Handle different date formats
                        if isinstance(tx_date_str, str):
                            if 'T' in tx_date_str:  # ISO format with time
                                tx_date = datetime.fromisoformat(tx_date_str.split('T')[0]).date()
                            else:  # ISO format date only
                                tx_date = datetime.strptime(tx_date_str, '%Y-%m-%d').date()
                        elif isinstance(tx_date_str, (datetime, date)):
                            tx_date = tx_date_str if isinstance(tx_date_str, date) else tx_date_str.date()
                        else:
                            # Skip transactions with invalid date format
                            continue
                            
                        # Include transaction if it falls within the date range
                        if start_date_obj <= tx_date <= end_date_obj:
                            filtered_transactions.append(tx)
                    except (ValueError, TypeError):
                        # Skip transactions with unparseable dates
                        continue
                
                all_transactions = filtered_transactions
            
            # Sort all transactions by date (newest first)
            all_transactions.sort(key=lambda tx: tx.get('date', ''), reverse=True)
        
        return jsonify({
            'transactions': all_transactions,
            'accounts': accounts,
            'total_transactions': len(all_transactions),
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days_back
            }
        })

    except plaid.ApiException as e:
        print(f"Plaid API Exception: {e.body}")
        return jsonify({'error': e.body}), 400
    except Exception as e:
        import traceback
        print(f"Exception in get_transactions: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

def generate_custom_transactions(accounts):
    """Generate custom transactions based on the provided format."""
    custom_transactions = []
    stock_transactions = []
    
    # Use the first account if available, otherwise create a dummy account ID
    account_id = accounts[0]['account_id'] if accounts else f"custom-{uuid.uuid4()}"
    
    # Stock transaction data
    stock_data = [
        {
            'date_transacted': '2025-02-27', 
            'date_posted': '2025-03-01', 
            'currency': 'USD', 
            'amount': -7149.47, 
            'description': 'Buy stock: 86 shares of META at $82.97 + $14.05 fees',
            'ticker': 'META',
            'shares': 86,
            'price_per_share': 82.97,
            'fees': 14.05,
            'transaction_type': 'buy'
        },
        {
            'date_transacted': '2025-02-18', 
            'date_posted': '2025-02-20', 
            'currency': 'USD', 
            'amount': 2492.76, 
            'description': 'Buy stock: 13 shares of NFLX at $190.09 + $21.59 fees',
            'ticker': 'NFLX',
            'shares': 13,
            'price_per_share': 190.09,
            'fees': 21.59,
            'transaction_type': 'buy'
        },
        {
            'date_transacted': '2025-02-10', 
            'date_posted': '2025-02-12', 
            'currency': 'USD', 
            'amount': -6598.96, 
            'description': 'Buy stock: 61 shares of AAPL at $108.16 + $1.2 fees',
            'ticker': 'AAPL',
            'shares': 61,
            'price_per_share': 108.16,
            'fees': 1.20,
            'transaction_type': 'buy'
        },
        {
            'date_transacted': '2024-01-17', 
            'date_posted': '2024-01-18', 
            'currency': 'USD', 
            'amount': 9372.86, 
            'description': 'Buy stock: 88 shares of MSFT at $106.26 + $21.98 fees',
            'ticker': 'MSFT',
            'shares': 88,
            'price_per_share': 106.26,
            'fees': 21.98,
            'transaction_type': 'buy'
        },
        {
            'date_transacted': '2024-11-04', 
            'date_posted': '2024-11-05', 
            'currency': 'USD', 
            'amount': -8878.28, 
            'description': 'Buy stock: 53 shares of MSFT at $167.13 + $20.39 fees',
            'ticker': 'MSFT',
            'shares': 53,
            'price_per_share': 167.13,
            'fees': 20.39,
            'transaction_type': 'buy'
        }
    ]
    
    # Other custom transaction data
    other_custom_data = [
        {
            "date_transacted": "2025-02-27",
            "date_posted": "2025-02-28",
            "currency": "USD",
            "amount": 100,
            "description": "1 year Netflix subscription"
        },
        {
            "date_transacted": "2025-02-15",
            "date_posted": "2025-02-20",
            "currency": "USD",
            "amount": 100,
            "description": "1 year mobile subscription"
        },
        {
            "date_transacted": "2025-01-31",
            "date_posted": "2025-02-02",
            "currency": "USD",
            "amount": 50.75,
            "description": "Grocery Store Purchase"
        },
        {
            "date_transacted": "2024-09-10",
            "date_posted": "2024-09-12",
            "currency": "USD",
            "amount": -1500,
            "description": "Payroll Deposit"
        },
        {
            "date_transacted": "2024-08-20",
            "date_posted": "2024-08-21",
            "currency": "USD",
            "amount": 75.50,
            "description": "Restaurant Dinner"
        },
        {
            "date_transacted": "2024-08-15",
            "date_posted": "2024-08-16",
            "currency": "USD",
            "amount": 120.30,
            "description": "Gas Station"
        }
    ]
    
    # Convert stock data to Plaid-like transaction format
    for idx, tx_data in enumerate(stock_data):
        plaid_formatted_tx = {
            'transaction_id': f"stock-{idx}-{uuid.uuid4()}",
            'account_id': account_id,
            'date': tx_data.get('date_posted'),
            'authorized_date': tx_data.get('date_transacted'),
            'name': tx_data.get('description'),
            'amount': tx_data.get('amount'),
            'currency': tx_data.get('currency'),
            'pending': False,
            'payment_channel': 'other',
            'category': ['Investment', 'Stock'],
            'is_custom': True,
            'is_stock': True,
            'ticker': tx_data.get('ticker'),
            'shares': tx_data.get('shares'),
            'price_per_share': tx_data.get('price_per_share'),
            'fees': tx_data.get('fees'),
            'transaction_type': tx_data.get('transaction_type')
        }
        stock_transactions.append(plaid_formatted_tx)
    
    # Convert other custom data to Plaid-like transaction format
    for idx, tx_data in enumerate(other_custom_data):
        plaid_formatted_tx = {
            'transaction_id': f"custom-{idx}-{uuid.uuid4()}",
            'account_id': account_id,
            'date': tx_data.get('date_posted'),
            'authorized_date': tx_data.get('date_transacted'),
            'name': tx_data.get('description'),
            'amount': tx_data.get('amount'),
            'currency': tx_data.get('currency'),
            'pending': False,
            'payment_channel': 'other',
            'category': ['Transfer', 'Custom'],
            'is_custom': True,
            'is_stock': False
        }
        custom_transactions.append(plaid_formatted_tx)
    
    # Combine both types of transactions
    return custom_transactions + stock_transactions

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
        # Set date range for transactions
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
            return jsonify({'plaid_connected': True})
        else:
            return jsonify({'plaid_connected': False})
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
        accounts_response = plaid_client.accounts_get({'access_token': access_token})
        
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
