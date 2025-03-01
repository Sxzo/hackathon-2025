#!/usr/bin/env python
import requests
import json
import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:5000/api/auth"
SECRET_KEY = os.environ.get('SECRET_KEY')

def test_auth_flow():
    """
    Test the complete authentication flow:
    1. Send verification code to a phone number
    2. Enter the code received via SMS
    3. Verify the JWT token received
    """
    print("\n===== Testing Twilio Verify Authentication Flow =====\n")
    
    # Step 1: Get phone number from user
    phone_number = input("Enter your phone number (with country code, e.g., +1234567890): ")
    
    # Step 2: Send verification code
    print(f"\nSending verification code to {phone_number}...")
    try:
        response = requests.post(
            f"{BASE_URL}/send-verification",
            json={"phone_number": phone_number}
        )
        
        print(f"Status code: {response.status_code}")
        
        # Try to parse the response as JSON
        try:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code != 200:
                print(f"Error: {result.get('error', 'Unknown error')}")
                return False
                
            print("Verification code sent successfully!")
            print(f"Status: {result.get('status', 'unknown')}")
            
        except json.JSONDecodeError:
            print(f"Response is not valid JSON: {response.text}")
            if response.status_code != 200:
                return False
    
    except requests.RequestException as e:
        print(f"Request error: {str(e)}")
        print("Is the Flask server running at the correct URL?")
        return False
    
    # Step 3: Get verification code from user
    verification_code = input("\nEnter the verification code you received: ")
    
    # Step 4: Verify the code
    print("\nVerifying code...")
    try:
        response = requests.post(
            f"{BASE_URL}/verify-code",
            json={"phone_number": phone_number, "code": verification_code}
        )
        
        print(f"Status code: {response.status_code}")
        
        # Try to parse the response as JSON
        try:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code != 200:
                print(f"Error: {result.get('error', 'Unknown error')}")
                return False
            
            if not result.get('authenticated', False):
                print(f"Authentication failed: {result.get('message', 'Unknown reason')}")
                return False
            
            token = result.get('token')
            print("\nAuthentication successful!")
            print(f"Phone number: {result.get('phone_number')}")
            
        except json.JSONDecodeError:
            print(f"Response is not valid JSON: {response.text}")
            return False
        
    except requests.RequestException as e:
        print(f"Request error: {str(e)}")
        return False
    
    # Step 5: Validate JWT token
    try:
        # Decode the token without verification (just to show contents)
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        print("\nJWT Token Contents:")
        print(json.dumps(decoded_token, indent=2))
        
        # Verify the token signature if SECRET_KEY is available
        if SECRET_KEY:
            verified_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            print("\nToken signature verified successfully!")
        else:
            print("\nWARNING: SECRET_KEY not available, token signature not verified")
        
        # Test protected route
        print("\nTesting protected route...")
        try:
            response = requests.get(
                f"{BASE_URL}/protected",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            print(f"Status code: {response.status_code}")
            
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
                
                if response.status_code == 200:
                    print("Protected route accessed successfully!")
                else:
                    print(f"Error accessing protected route: {result.get('error', 'Unknown error')}")
                    return False
                
            except json.JSONDecodeError:
                print(f"Response is not valid JSON: {response.text}")
                return False
            
        except requests.RequestException as e:
            print(f"Request error: {str(e)}")
            return False
        
        return True
    
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return False

if __name__ == "__main__":
    # Run the test
    success = test_auth_flow()
    
    if success:
        print("\n✅ Authentication test passed successfully!")
    else:
        print("\n❌ Authentication test failed!") 