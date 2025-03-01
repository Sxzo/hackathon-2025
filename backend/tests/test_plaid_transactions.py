import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:5001"  # Change this if your backend runs on a different port
API_ENDPOINT = f"{BASE_URL}/api/plaid/transactions"

# Get JWT token (you'll need to authenticate first)
def get_auth_token(phone_number, password="testpassword"):
    """Get JWT token by authenticating with the backend."""
    auth_url = f"{BASE_URL}/api/auth/login"
    response = requests.post(
        auth_url,
        json={"phone_number": phone_number}
    )
    
    if response.status_code != 200:
        print(f"Authentication failed: {response.text}")
        return None
    
    return response.json().get("access_token")

def test_get_transactions(phone_number):
    """Test fetching transactions from Plaid."""
    # Get auth token
    token = get_auth_token(phone_number)
    if not token:
        print("Failed to get authentication token. Exiting.")
        return
    
    # Set up headers with JWT token
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Make request to transactions endpoint
    response = requests.get(API_ENDPOINT, headers=headers)
    
    # Print results
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Print account information
        print("\n=== ACCOUNTS ===")
        for account in data.get("accounts", []):
            print(f"Account: {account.get('name')} ({account.get('mask')})")
            print(f"Type: {account.get('type')} - {account.get('subtype')}")
            print(f"Balance: ${account.get('balances', {}).get('current', 0):.2f}")
            print("-" * 40)
        
        # Print transaction information
        print("\n=== TRANSACTIONS ===")
        transactions = data.get("transactions", [])
        print(f"Found {len(transactions)} transactions")
        
        # Sort transactions by date (newest first)
        transactions.sort(key=lambda x: x.get("date"), reverse=True)
        
        for tx in transactions[:10]:  # Show only the 10 most recent transactions
            print(f"Date: {tx.get('date')} - ${tx.get('amount'):.2f}")
            print(f"Description: {tx.get('name')}")
            print(f"Category: {', '.join(tx.get('category', []))}")
            print("-" * 40)
            
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    # Replace with your phone number
    phone_number = "+1234567890"  # Update this with your actual test phone number
    
    print("Testing Plaid Transactions API...")
    test_get_transactions(phone_number) 