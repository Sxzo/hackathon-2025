import schedule
import time
import pytz
from datetime import datetime, timedelta
import logging

from db_client import DatabaseClient
from plaid_client import PlaidClient
from telegram_client import TelegramClient
from config import CHANNEL_ID

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("notification_scheduler.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("notification_scheduler")

def round_to_nearest_minute(dt):
    """Round a datetime to the nearest minute"""
    seconds = dt.second
    microseconds = dt.microsecond
    
    # If seconds >= 30, round up to the next minute
    if seconds >= 30:
        return dt + timedelta(seconds=60-seconds, microseconds=-microseconds)
    else:
        # Otherwise, round down to the current minute
        return dt + timedelta(seconds=-seconds, microseconds=-microseconds)

class NotificationScheduler:
    def __init__(self):
        self.db_client = DatabaseClient()
        self.plaid_client = PlaidClient()
        self.telegram_client = TelegramClient()
    
    def check_notifications(self):
        """Check for users who should receive notifications at the current time"""
        try:
            # Get current time in UTC
            now = datetime.now(pytz.UTC)
            rounded_now = round_to_nearest_minute(now)
            
            logger.info(f"Checking for notifications at {now.strftime('%Y-%m-%d %H:%M:%S.%f %Z')}")
            logger.info(f"Rounded time: {rounded_now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
            
            # Get users who should receive notifications now (timezone-aware)
            users = self.db_client.get_users_for_notification(reference_time=now)
            
            if not users:
                logger.info("No users scheduled for notifications at this time")
                return
            
            logger.info(f"Found {len(users)} users scheduled for notifications")
            
            # Process each user
            for user in users:
                self.process_user_notification(user)
                
        except Exception as e:
            logger.error(f"Error in check_notifications: {str(e)}")
    
    def process_user_notification(self, user):
        """Process notification for a single user"""
        try:
            user_id = user.get("_id")
            # Use first_name and last_name instead of name
            first_name = user.get("first_name", "")
            last_name = user.get("last_name", "")
            user_name = f"{first_name} {last_name}".strip() or "User"
            
            # Get Telegram chat ID instead of phone number
            telegram_chat_id = CHANNEL_ID
            plaid_access_token = user.get("plaid_access_token")
            user_timezone = user.get("settings", {}).get("timezone", "UTC")
            
            logger.info(f"Processing notification for user: {user_id} in timezone {user_timezone}")
            
            # Validate required fields
            if not telegram_chat_id:
                logger.error(f"User {user_id} has no Telegram chat ID")
                return
                
            if not plaid_access_token:
                logger.error(f"User {user_id} has no Plaid access token")
                return
            
            # Get recent transactions
            transactions = self.plaid_client.get_recent_transactions(plaid_access_token)
            
            # Generate summary
            summary = self.plaid_client.generate_transaction_summary(transactions)
            summary["budget"] = user.get("budgets", {})
            
            # Fetch stock portfolio data
            logger.info("Fetching stock portfolio data")
            tickers = self.plaid_client.fetch_ticker_list(user_id)
            
            # Fetch stock performance data
            stock_performance = self.plaid_client.fetch_stock_performance(tickers)
            market_indices = self.plaid_client.fetch_market_indices()
            
            # Add stock data to summary
            summary["stock_performance"] = stock_performance
            summary["market_indices"] = market_indices
            
            # Fetch news articles
            ticker_news = {}
            for ticker in tickers:
                ticker_news[ticker] = self.plaid_client.fetch_news_for_ticker(ticker.strip())
            
            market_news = self.plaid_client.fetch_market_news(limit=2)  # Limit to 2 articles for brevity
            
            # Add news to summary
            summary["ticker_news"] = ticker_news
            summary["market_news"] = market_news
            
            # Format message
            message = self.telegram_client.format_transaction_summary(user_name, summary)
            
            # Send notification via Telegram
            success = self.telegram_client.send_message(telegram_chat_id, message)
            
            if success:
                logger.info(f"Successfully sent Telegram notification to user {user_id}")
            else:
                logger.error(f"Failed to send Telegram notification to user {user_id}")
                
        except Exception as e:
            logger.error(f"Error processing notification for user: {str(e)}")
    
    def run(self):
        """Run the scheduler"""
        logger.info("Starting notification scheduler")
        
        # Schedule the job to run every minute
        schedule.every().minute.do(self.check_notifications)
        
        # Run the scheduler
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    def cleanup(self):
        """Clean up resources"""
        self.db_client.close()
        logger.info("Notification scheduler stopped")


if __name__ == "__main__":
    scheduler = NotificationScheduler()
    try:
        scheduler.run()
    except KeyboardInterrupt:
        logger.info("Scheduler interrupted by user")
    finally:
        scheduler.cleanup() 