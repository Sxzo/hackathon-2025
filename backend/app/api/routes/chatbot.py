from flask import Blueprint, request, jsonify, current_app
import os
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import get_users_collection
from datetime import datetime, timedelta
from openai import OpenAI
from flask_cors import cross_origin
import requests
import time
from app.fetch import fetch

# Import Plaid client from plaid.py
from app.api.routes.plaid import client as plaid_client, TransactionsGetRequest, TransactionsGetRequestOptions, standardize_phone_number

chatbot_bp = Blueprint('chatbot', __name__)

# Initialize OpenAI client with the new format
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
NEWS_API_KEY = os.environ.get('NEWS_API_KEY')
ALPHA_VANTAGE_API_KEY = os.environ.get('ALPHA_VANTAGE_API_KEY', 'demo')  # Use 'demo' as fallback
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def fetch_ticker_list(phone_number):
    """Fetch the list of tickers from the database."""
    # users_collection = get_users_collection()
    # user = users_collection.find_one({"phone_number": phone_number})
    # return user.get("tickers", [])
    return ['AMD', 'TSLA', 'NVDA', 'META']

def fetch_stock_performance(tickers):
    """Fetch stock performance data for the given tickers using Alpha Vantage."""
    try:
        performance_data = {}
        
        for ticker in tickers:
            # Use Alpha Vantage's Global Quote API to get current stock data
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
            response = requests.get(url)
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
            
            data = response.json()
            
            if "Global Quote" not in data or not data["Global Quote"]:
                performance_data[ticker] = {
                    "error": f"No data available for {ticker}"
                }
                continue
            
            quote = data["Global Quote"]
            
            # Extract current price and change
            current_price = float(quote.get("05. price", 0))
            change_percent = float(quote.get("10. change percent", "0%").replace("%", ""))
            
            # Get weekly high/low from the daily adjusted API
            weekly_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol={ticker}&outputsize=compact&apikey={ALPHA_VANTAGE_API_KEY}"
            weekly_response = requests.get(weekly_url)
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
            
            weekly_data = weekly_response.json()
            
            # Extract weekly high/low if available
            weekly_high = current_price
            weekly_low = current_price
            weekly_volume = 0
            
            if "Time Series (Daily)" in weekly_data:
                # Get the last 5 trading days (approximately a week)
                time_series = weekly_data["Time Series (Daily)"]
                dates = list(time_series.keys())[:5]  # Last 5 trading days
                
                if dates:
                    highs = [float(time_series[date]["2. high"]) for date in dates]
                    lows = [float(time_series[date]["3. low"]) for date in dates]
                    volumes = [int(float(time_series[date]["6. volume"])) for date in dates]
                    
                    weekly_high = max(highs)
                    weekly_low = min(lows)
                    weekly_volume = sum(volumes) // len(volumes)  # Average volume
            
            performance_data[ticker] = {
                "current_price": round(current_price, 2),
                "percent_change": round(change_percent, 2),
                "high": round(weekly_high, 2),
                "low": round(weekly_low, 2),
                "volume_avg": weekly_volume
            }
            
        performance_data = fetch()
        return performance_data
    except Exception as e:
        print(f"Error fetching stock performance: {str(e)}")
        return {}

def fetch_market_indices():
    """Fetch performance data for major market indices using Alpha Vantage."""
    indices = {
        'SPY': 'S&P 500',
        'DIA': 'Dow Jones',
        'QQQ': 'NASDAQ',
        'IWM': 'Russell 2000'
    }
    
    try:
        indices_data = {}
        
        for symbol, name in indices.items():
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
            response = requests.get(url)
            
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
            
            data = response.json()
            
            if "Global Quote" not in data or not data["Global Quote"]:
                continue
                
            quote = data["Global Quote"]
            current_price = float(quote.get("05. price", 0))
            change_percent = float(quote.get("10. change percent", "0%").replace("%", ""))
            
            indices_data[name] = {
                "current_price": round(current_price, 2),
                "percent_change": round(change_percent, 2)
            }
            
        return indices_data
    except Exception as e:
        print(f"Error fetching market indices: {str(e)}")
        return {}

def fetch_news_for_ticker(ticker, limit=2):
    """Fetch news articles for a specific ticker."""
    try:
        url = f"https://newsapi.org/v2/everything?q={ticker}+stock&sortBy=publishedAt&pageSize={limit}&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200 or data.get('status') != 'ok':
            print(f"Error fetching news for {ticker}: {data.get('message', 'Unknown error')}")
            return []
        
        articles = data.get('articles', [])
        return [
            {
                'title': article.get('title'),
                'description': article.get('description'),
                'content': article.get('content'),
                'source': article.get('source', {}).get('name'),
                'published_at': article.get('publishedAt'),
                'url': article.get('url')
            }
            for article in articles[:limit]
        ]
    except Exception as e:
        print(f"Exception fetching news for {ticker}: {str(e)}")
        return []

def fetch_market_news(limit=4):
    """Fetch general market news."""
    try:
        url = f"https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize={limit}&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code != 200 or data.get('status') != 'ok':
            print(f"Error fetching market news: {data.get('message', 'Unknown error')}")
            return []
        
        articles = data.get('articles', [])
        return [
            {
                'title': article.get('title'),
                'description': article.get('description'),
                'content': article.get('content'),
                'source': article.get('source', {}).get('name'),
                'published_at': article.get('publishedAt'),
                'url': article.get('url')
            }
            for article in articles[:limit]
        ]
    except Exception as e:
        print(f"Exception fetching market news: {str(e)}")
        return []

def format_stock_performance(performance_data, indices_data):
    """Format stock performance data for inclusion in the prompt."""
    prompt_text = "Weekly Stock Performance:\n\n"
    
    # Add market indices
    if indices_data:
        prompt_text += "Market Indices:\n"
        for index_name, data in indices_data.items():
            change_symbol = "↑" if data["percent_change"] >= 0 else "↓"
            prompt_text += f"{index_name}: {data['current_price']} ({change_symbol}{abs(data['percent_change'])}%)\n"
        prompt_text += "\n"
    
    # Add individual stocks
    if performance_data:
        prompt_text += "Portfolio Stocks:\n"
        for ticker, data in performance_data.items():
            if "error" in data:
                prompt_text += f"{ticker}: {data['error']}\n"
                continue
                
            prompt_text += f"{ticker}: {data["percent_change"]}\n"
    
    return prompt_text

def format_news_for_prompt(ticker_news, market_news):
    """Format news articles for inclusion in the prompt."""
    prompt_text = "Recent Market News:\n\n"
    
    # Add market news
    if market_news:
        for i, article in enumerate(market_news, 1):
            prompt_text += f"{i}. {article['title']} - {article['source']}\n"
            if article.get('description'):
                prompt_text += f"   {article['description']}\n"
            if article.get('content'):
                content = article.get('content', '')
                # Some APIs limit content with a character count and "[+chars]" suffix
                if "[+" in content:
                    content = content.split("[+")[0]
                prompt_text += f"   Content: {content}\n"
            prompt_text += f"   Published: {article['published_at']}\n\n"
    else:
        prompt_text += "No recent market news available.\n\n"
    
    # Add ticker-specific news
    if ticker_news:
        prompt_text += "Recent Stock News:\n"
        for ticker, articles in ticker_news.items():
            if articles:
                prompt_text += f"\n{ticker} News:\n"
                for i, article in enumerate(articles, 1):
                    prompt_text += f"{i}. {article['title']} - {article['source']}\n"
                    if article.get('description'):
                        prompt_text += f"   {article['description']}\n"
                    prompt_text += f"   Published: {article['published_at']}\n\n"
    
    return prompt_text

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
        start_date = end_date - timedelta(days=120)
        
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
        
        # Get user's budget data
        budget_data = user.get("budgets", {})
        
        # Format budget data for the prompt
        budget_info = "Budget Information:\n"
        if budget_data:
            budget_info += f"Shopping Budget: ${budget_data.get('shopping', 0):.2f}/month\n"
            budget_info += f"Food Budget: ${budget_data.get('food', 0):.2f}/month\n"
            budget_info += f"Entertainment Budget: ${budget_data.get('entertainment', 0):.2f}/month\n"
            budget_info += f"Target Account Balance: ${budget_data.get('target_balance', 0):.2f}\n"
        else:
            budget_info += "No budget information available.\n"
        
        # Fetch news for tickers and market
        tickers = fetch_ticker_list(phone_number)
        
        # Fetch stock performance data
        stock_performance = fetch_stock_performance(tickers)
        market_indices = fetch_market_indices()
        performance_info = format_stock_performance(stock_performance, market_indices)
        
        # Fetch news articles
        ticker_news = {}
        for ticker in tickers:
            ticker_news[ticker] = fetch_news_for_ticker(ticker.strip())
        
        market_news = fetch_market_news(limit=4)  # Increased to 4 articles
        
        # Format news for the prompt
        news_info = format_news_for_prompt(ticker_news, market_news)
        
        # Get chat history from the database or initialize if not exists
        chat_history = user.get("chat_history", [])
        
        # Get model settings from the database or use defaults
        model = user.get("settings", {}).get("model", "gpt-4o-mini")
        temperature = user.get("settings", {}).get("temperature", 0.7)
        
        # Prepare messages for OpenAI
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful financial assistant that helps users understand their transaction history and finances.
You have access to the user's transaction history from their bank account and their budget settings.
You also have access to recent news about the stock market and specific stocks the user is interested in, as well as weekly stock performance data.
Use this information to provide personalized financial advice and answer questions.
Be concise, helpful, and accurate. If you don't know something, say so.
Do not make up information that is not in the transaction history.
Some transactions are positive, and some are negative. Positive transactions should be shown as a loss in money, and negative transactions should be shown as a gain in money. AKA a negative transaction is a refund.

{budget_info}

{performance_info}

{news_info}

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
            model=model,
            messages=messages,
            temperature=temperature,
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