from flask import Blueprint, request, jsonify, current_app
import os
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import get_users_collection
from datetime import datetime, timedelta
from openai import OpenAI
from flask_cors import cross_origin

# Import Plaid client from plaid.py
from app.api.routes.plaid import client as plaid_client, TransactionsGetRequest, TransactionsGetRequestOptions, standardize_phone_number

chatbot_bp = Blueprint('chatbot', __name__)

# Initialize OpenAI client with the new format
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

@chatbot_bp.route('/chat', methods=['POST'])
@jwt_required()
@cross_origin()
def chat():
    """Handle chat requests from users."""
    phone_number = get_jwt_identity()
    phone_number = standardize_phone_number(phone_number)
    
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    user_message = data['message']
    print(f"\n\n===== USER QUESTION =====\nPhone: {phone_number}\nQuestion: {user_message}\n==========================\n")
    
    try:
        # Get user from database
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user or "plaid_access_token" not in user:
            print(f"No plaid_access_token found for user {phone_number}")
            return jsonify({
                'response': "I don't have access to your transaction history. Please link your bank account first."
            })
        
        # Get transactions from Plaid
        access_token = user["plaid_access_token"]
        
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
        
        transactions_response = plaid_client.transactions_get(transactions_request)
        transactions = transactions_response['transactions']
        print(f"Retrieved {len(transactions)} transactions from Plaid")
        
        # Format transactions for the LLM
        formatted_transactions = []
        for tx in transactions:
            formatted_tx = {
                'date': tx['date'],
                'name': tx['name'],
                'amount': tx['amount'],
                'category': tx['category'] if 'category' in tx and tx['category'] else ['Uncategorized']
            }
            formatted_transactions.append(formatted_tx)
        
        # Convert to string for the prompt
        transaction_history = "\n".join([
            f"Date: {tx['date']}, Merchant: {tx['name']}, Amount: ${tx['amount']:.2f}, Category: {', '.join(tx['category'])}"
            for tx in formatted_transactions
        ])
        
        # Get chat history from the database or initialize if not exists
        chat_history = user.get("chat_history", [])
        
        # Prepare messages for OpenAI
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful financial assistant that helps users understand their transaction history and finances.
You have access to the user's transaction history from their bank account.
Use this information to provide personalized financial advice and answer questions.
Be concise, helpful, and accurate. If you don't know something, say so.
Do not make up information that is not in the transaction history.

Transaction history:
{transaction_history}"""
            }
        ]
        
        # Add chat history to messages
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        
        print("Calling OpenAI API...")
        # Call OpenAI API with the new format
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        # Extract the response text with the new format
        assistant_response = response.choices[0].message.content
        print(f"\n\n===== MODEL RESPONSE =====\n{assistant_response}\n===========================\n")
        
        # Update chat history
        chat_history.append({"role": "user", "content": user_message})
        chat_history.append({"role": "assistant", "content": assistant_response})
        
        # Keep only the last 20 messages to avoid memory issues
        if len(chat_history) > 30:
            chat_history = chat_history[-30:]
        
        # Update user in database
        users_collection.update_one(
            {"phone_number": phone_number},
            {"$set": {"chat_history": chat_history}}
        )
        
        return jsonify({
            'response': assistant_response
        })
    
    except Exception as e:
        current_app.logger.error(f"Error in chatbot: {str(e)}")
        print(f"\n\n===== ERROR =====\n{str(e)}\n=================\n")
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/test', methods=['GET'])
def test():
    """Test route to check if the chatbot API is working."""
    return jsonify({
        'status': 'success',
        'message': 'Chatbot API is working!'
    }) 