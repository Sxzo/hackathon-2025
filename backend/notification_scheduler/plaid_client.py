import plaid
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
import requests
import time
from config import PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV, NEWS_API_KEY, ALPHA_VANTAGE_API_KEY
import logging

logger = logging.getLogger("notification_scheduler")

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
            logger.error(f"Error fetching transactions: {str(e)}")
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
    
    def fetch_ticker_list(self, user_id=None):
        """
        Fetch the list of tickers to track
        
        Args:
            user_id (str): User ID to fetch tickers for (not used currently)
            
        Returns:
            list: List of ticker symbols
        """
        # In a real implementation, this would fetch from the database
        # For now, return a default list
        return ['AMD', 'TSLA', 'NVDA', 'META']
    
    def fetch_stock_performance(self, tickers):
        """
        Fetch stock performance data for the given tickers using Alpha Vantage
        
        Args:
            tickers (list): List of ticker symbols
            
        Returns:
            dict: Performance data for each ticker
        """
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
                
            return performance_data
        except Exception as e:
            logger.error(f"Error fetching stock performance: {str(e)}")
            return {}
    
    def fetch_market_indices(self):
        """
        Fetch performance data for major market indices using Alpha Vantage
        
        Returns:
            dict: Performance data for major market indices
        """
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
            logger.error(f"Error fetching market indices: {str(e)}")
            return {}
    
    def fetch_news_for_ticker(self, ticker, limit=2):
        """
        Fetch news articles for a specific ticker
        
        Args:
            ticker (str): Ticker symbol
            limit (int): Maximum number of articles to return
            
        Returns:
            list: List of news articles
        """
        try:
            if not NEWS_API_KEY:
                logger.warning("NEWS_API_KEY not set, skipping news fetch")
                return []
                
            url = f"https://newsapi.org/v2/everything?q={ticker}+stock&sortBy=publishedAt&pageSize={limit}&apiKey={NEWS_API_KEY}"
            response = requests.get(url)
            data = response.json()
            
            if response.status_code != 200 or data.get('status') != 'ok':
                logger.error(f"Error fetching news for {ticker}: {data.get('message', 'Unknown error')}")
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
            logger.error(f"Exception fetching news for {ticker}: {str(e)}")
            return []
    
    def fetch_market_news(self, limit=4):
        """
        Fetch general market news
        
        Args:
            limit (int): Maximum number of articles to return
            
        Returns:
            list: List of news articles
        """
        try:
            if not NEWS_API_KEY:
                logger.warning("NEWS_API_KEY not set, skipping market news fetch")
                return []
                
            url = f"https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize={limit}&apiKey={NEWS_API_KEY}"
            response = requests.get(url)
            data = response.json()
            
            if response.status_code != 200 or data.get('status') != 'ok':
                logger.error(f"Error fetching market news: {data.get('message', 'Unknown error')}")
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
            logger.error(f"Exception fetching market news: {str(e)}")
            return [] 