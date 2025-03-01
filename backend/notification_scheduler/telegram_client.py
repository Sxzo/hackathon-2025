import requests
import logging
from config import TELEGRAM_BOT_TOKEN

logger = logging.getLogger("notification_scheduler")

class TelegramClient:
    def __init__(self):
        self.bot_token = TELEGRAM_BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    def send_message(self, chat_id, message):
        """
        Send a message via Telegram
        
        Args:
            chat_id (str): Telegram chat ID of the recipient
            message (str): Message content
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            url = f"{self.base_url}/sendMessage"
            data = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"  # Enable HTML formatting
            }
            
            response = requests.post(url, data=data)
            response_json = response.json()
            
            if response.status_code == 200 and response_json.get("ok"):
                return True
            else:
                error_msg = response_json.get("description", "Unknown error")
                logger.error(f"Telegram API error: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending Telegram message: {str(e)}")
            return False
    
    def format_transaction_summary(self, user_name, summary):
        """
        Format a transaction summary into a readable Telegram message
        
        Args:
            user_name (str): User's name
            summary (dict): Transaction summary
            
        Returns:
            str: Formatted message
        """
        if summary["total_count"] == 0:
            return f"Hi {user_name}, you have no transactions in the past week."
        
        message = f"<b>Hi {user_name}, here's your weekly financial summary:</b>\n\n"
        
        # Add total spent
        message += f"💰 <b>Total spent:</b> ${summary['total_spent']:.2f}\n"
        
        # Add top 3 categories
        if summary["categories"]:
            message += "\n📊 <b>Top spending categories:</b>\n"
            sorted_categories = sorted(summary["categories"].items(), key=lambda x: x[1], reverse=True)
            for category, amount in sorted_categories[:3]:
                message += f"- {category}: ${amount:.2f}\n"
        
        # Add largest transaction
        if summary["largest_transaction"]:
            lt = summary["largest_transaction"]
            message += f"\n🔍 <b>Largest transaction:</b>\n{lt['name']} (${lt['amount']:.2f}) on {lt['date']}"
        
        return message 