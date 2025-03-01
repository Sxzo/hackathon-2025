"""
Manual testing script for Plaid integration.

This script provides a command-line interface to test the Plaid integration
without needing to set up a frontend application.

Usage:
    python manual_plaid_test.py

Requirements:
    - The Flask application must be running
    - You must have valid Plaid API credentials in your .env file
"""

import requests
import json
import os
import sys
from datetime import datetime

# Base URL for the API
BASE_URL = 'http://localhost:5001/api'

# Store tokens and other data
session_data = {
    'phone_number': None,
    'access_token': None,  # This is a JWT token for our API, not a Plaid token
    'refresh_token': None,  # This is a JWT refresh token for our API
    'plaid_link_token': None,  # This is a Plaid link token
    'plaid_access_token': None,  # This is a Plaid access token
    'plaid_item_id': None  # This is a Plaid item ID
}

def print_separator():
    """Print a separator line."""
    print('-' * 80)

def print_json(data):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=2))

def get_headers():
    """Get headers with authorization token if available."""
    headers = {'Content-Type': 'application/json'}
    if session_data['access_token']:
        # Add JWT token to headers for our backend API authentication
        headers['Authorization'] = f"Bearer {session_data['access_token']}"
    return headers

def send_verification_code():
    """Send a verification code to the user's phone."""
    phone_number = input("Enter your phone number (e.g., +11234567890): ")
    session_data['phone_number'] = phone_number
    
    url = f"{BASE_URL}/auth/send-verification"
    payload = {'phone_number': phone_number}
    
    print(f"\nSending verification code to {phone_number}...")
    response = requests.post(url, json=payload, headers=get_headers())
    
    if response.status_code == 200:
        print("Verification code sent successfully!")
        print_json(response.json())
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def verify_code():
    """Verify the code sent to the user's phone."""
    if not session_data['phone_number']:
        print("Please send a verification code first.")
        return
    
    code = input("Enter the verification code you received: ")
    
    url = f"{BASE_URL}/auth/verify-code"
    payload = {
        'phone_number': session_data['phone_number'],
        'code': code
    }
    
    print(f"\nVerifying code...")
    response = requests.post(url, json=payload, headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print("Verification successful!")
        print_json(data)
        
        # Store JWT tokens for our backend API authentication
        session_data['access_token'] = data['tokens']['access_token']
        session_data['refresh_token'] = data['tokens']['refresh_token']
        
        # Check if Plaid is enabled
        if data.get('plaid_enabled'):
            print("\nPlaid integration is enabled. You can now create a link token.")
            print("NOTE: The JWT token you received is only for authenticating with our backend API.")
            print("      It should NOT be sent to Plaid directly.")
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def create_link_token():
    """Create a Plaid link token."""
    if not session_data['access_token']:
        print("Please verify your phone number first.")
        return
    
    url = f"{BASE_URL}/plaid/create-link-token"
    
    print("\nCreating Plaid link token...")
    print("NOTE: We're using our JWT token to authenticate with our backend API,")
    print("      but the backend will NOT send this token to Plaid.")
    
    response = requests.post(url, headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print("Link token created successfully!")
        print_json(data)
        
        # Store Plaid link token
        session_data['plaid_link_token'] = data.get('link_token')
        
        print("\nUse this link token in the Plaid Link flow.")
        print("For testing in sandbox mode, you can use:")
        print("  Username: user_good")
        print("  Password: pass_good")
        print("  Any valid MFA code (e.g., 1234)")
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def exchange_public_token():
    """Exchange a public token for an access token."""
    if not session_data['access_token']:
        print("Please verify your phone number first.")
        return
    
    public_token = input("Enter the public token from Plaid Link: ")
    
    url = f"{BASE_URL}/plaid/exchange-public-token"
    payload = {'public_token': public_token}
    
    print("\nExchanging public token...")
    print("NOTE: We're using our JWT token to authenticate with our backend API,")
    print("      but the backend will exchange the public token with Plaid directly.")
    
    response = requests.post(url, json=payload, headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print("Public token exchanged successfully!")
        print_json(data)
        
        # Store Plaid access token and item ID
        session_data['plaid_access_token'] = data.get('access_token')
        session_data['plaid_item_id'] = data.get('item_id')
        
        print("\nNOTE: The access_token you received is a Plaid access token, not a JWT token.")
        print("      In production, this token should be stored securely on the server,")
        print("      and never exposed to the client.")
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def get_transactions():
    """Get transactions for the user."""
    if not session_data['access_token']:
        print("Please verify your phone number first.")
        return
    
    if not session_data['plaid_access_token']:
        print("Please exchange a public token first.")
        access_token = input("Or enter a Plaid access token manually: ")
        if access_token:
            session_data['plaid_access_token'] = access_token
        else:
            return
    
    url = f"{BASE_URL}/plaid/transactions"
    params = {'access_token': session_data['plaid_access_token']}
    
    print("\nGetting transactions...")
    print("NOTE: We're using our JWT token to authenticate with our backend API,")
    print("      and passing the Plaid access token as a parameter.")
    print("      The backend will use the Plaid access token to fetch transactions from Plaid.")
    
    response = requests.get(url, params=params, headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        print("Transactions retrieved successfully!")
        
        # Print summary
        print(f"\nAccounts: {len(data.get('accounts', []))}")
        print(f"Transactions: {len(data.get('transactions', []))}")
        
        # Print first few transactions
        if data.get('transactions'):
            print("\nRecent transactions:")
            for i, txn in enumerate(data['transactions'][:5]):
                print(f"{i+1}. {txn.get('date')} - {txn.get('name')}: ${txn.get('amount')}")
        
        # Ask if user wants to see all data
        if input("\nDo you want to see all transaction data? (y/n): ").lower() == 'y':
            print_json(data)
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def signup_with_transactions():
    """Test the signup with transactions flow."""
    if not session_data['phone_number']:
        phone_number = input("Enter your phone number (e.g., +11234567890): ")
        session_data['phone_number'] = phone_number
    
    public_token = input("Enter the public token from Plaid Link: ")
    
    url = f"{BASE_URL}/plaid/signup-transactions"
    payload = {
        'phone_number': session_data['phone_number'],
        'public_token': public_token
    }
    
    print("\nGetting transactions during signup...")
    print("NOTE: This endpoint doesn't require JWT authentication since it's part of the signup flow.")
    print("      The backend will exchange the public token with Plaid directly.")
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("Bank account linked successfully!")
        
        # Print summary
        print(f"\nAccounts: {len(data.get('accounts', []))}")
        print(f"Transactions: {len(data.get('transactions', []))}")
        
        # Print first few transactions
        if data.get('transactions'):
            print("\nRecent transactions:")
            for i, txn in enumerate(data['transactions'][:5]):
                print(f"{i+1}. {txn.get('date')} - {txn.get('name')}: ${txn.get('amount')}")
        
        # Ask if user wants to see all data
        if input("\nDo you want to see all transaction data? (y/n): ").lower() == 'y':
            print_json(data)
    else:
        print(f"Error: {response.status_code}")
        print_json(response.json())

def show_session_data():
    """Show current session data."""
    print("\nCurrent Session Data:")
    print("NOTE: The access_token and refresh_token are JWT tokens for our backend API.")
    print("      The plaid_access_token is a token from Plaid for accessing Plaid's API.")
    print("      These tokens serve different purposes and should not be confused.")
    
    # Mask sensitive data
    masked_data = session_data.copy()
    if masked_data['access_token']:
        masked_data['access_token'] = masked_data['access_token'][:10] + '...' + ' (JWT for our API)'
    if masked_data['refresh_token']:
        masked_data['refresh_token'] = masked_data['refresh_token'][:10] + '...' + ' (JWT refresh for our API)'
    if masked_data['plaid_access_token']:
        masked_data['plaid_access_token'] = masked_data['plaid_access_token'][:10] + '...' + ' (Plaid token)'
    if masked_data['plaid_link_token']:
        masked_data['plaid_link_token'] = masked_data['plaid_link_token'][:10] + '...' + ' (Plaid link token)'
    
    print_json(masked_data)

def main_menu():
    """Display the main menu and handle user input."""
    while True:
        print_separator()
        print("Plaid Integration Test Menu")
        print_separator()
        print("1. Send verification code")
        print("2. Verify code and get tokens")
        print("3. Create Plaid link token")
        print("4. Exchange public token")
        print("5. Get transactions")
        print("6. Test signup with transactions flow")
        print("7. Show current session data")
        print("8. Exit")
        print_separator()
        
        choice = input("Enter your choice (1-8): ")
        
        if choice == '1':
            send_verification_code()
        elif choice == '2':
            verify_code()
        elif choice == '3':
            create_link_token()
        elif choice == '4':
            exchange_public_token()
        elif choice == '5':
            get_transactions()
        elif choice == '6':
            signup_with_transactions()
        elif choice == '7':
            show_session_data()
        elif choice == '8':
            print("\nExiting. Goodbye!")
            sys.exit(0)
        else:
            print("\nInvalid choice. Please try again.")
        
        input("\nPress Enter to continue...")

if __name__ == '__main__':
    print("Plaid Integration Manual Test Script")
    print("===================================")
    print("This script helps you test the Plaid integration manually.")
    print("Make sure the Flask application is running before proceeding.")
    print("\nIMPORTANT: This script uses two types of tokens:")
    print("1. JWT tokens - Used to authenticate with our backend API")
    print("2. Plaid tokens - Used by our backend to communicate with Plaid")
    print("These tokens serve different purposes and should not be confused.")
    
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\nExiting. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        sys.exit(1) 