import plaid
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
from config import PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV

class PlaidClient:
    def __init__(self):
        # Configure Plaid client
        configuration = plaid.Configuration(
            host=self._get_plaid_host(),
            api_key={
                'clientId': PLAID_CLIENT_ID,
                'secret': PLAID_SECRET,
            }
        )
        api_client = plaid.ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
    def _get_plaid_host(self):
        """Get the appropriate Plaid API host based on environment"""
        if PLAID_ENV == "sandbox":
            return plaid.Environment.Sandbox
        elif PLAID_ENV == "development":
            return plaid.Environment.Development
        elif PLAID_ENV == "production":
            return plaid.Environment.Production
        else:
            return plaid.Environment.Sandbox  # Default to sandbox
    
    def get_recent_transactions(self, access_token, days=7):
        """
        Get recent transactions for a user
        
        Args:
            access_token (str): Plaid access token for the user
            days (int): Number of days to look back
            
        Returns:
            list: List of transactions
        """
        try:
            # Calculate date range
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days)
            
            # Create request
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(
                    count=100  # Limit to 100 transactions
                )
            )
            
            # Get transactions
            response = self.client.transactions_get(request)
            return response['transactions']
        except Exception as e:
            print(f"Error fetching transactions: {str(e)}")
            return []
    
    def generate_transaction_summary(self, transactions):
        """
        Generate a summary of transactions
        
        Args:
            transactions (list): List of transaction objects
            
        Returns:
            dict: Summary of transactions
        """
        if not transactions:
            return {
                "total_count": 0,
                "total_spent": 0,
                "categories": {},
                "largest_transaction": None
            }
        
        total_spent = 0
        categories = {}
        largest_transaction = None
        largest_amount = 0
        
        for transaction in transactions:
            # Skip pending transactions
            if transaction.get('pending', False):
                continue
                
            amount = transaction.get('amount', 0)
            category = transaction.get('category', ['Uncategorized'])[0]
            
            # Track total spent (negative amounts are deposits)
            if amount > 0:
                total_spent += amount
                
                # Track spending by category
                if category in categories:
                    categories[category] += amount
                else:
                    categories[category] = amount
                
                # Track largest transaction
                if amount > largest_amount:
                    largest_amount = amount
                    largest_transaction = {
                        'name': transaction.get('name', 'Unknown'),
                        'amount': amount,
                        'date': transaction.get('date', 'Unknown'),
                        'category': category
                    }
        
        return {
            "total_count": len(transactions),
            "total_spent": round(total_spent, 2),
            "categories": {k: round(v, 2) for k, v in categories.items()},
            "largest_transaction": largest_transaction,
            "transactions": transactions
        } 