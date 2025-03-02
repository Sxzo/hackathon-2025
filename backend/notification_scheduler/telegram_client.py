import requests
import logging
import json
from config import TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, OPENAI_MODEL

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
    
    def _generate_ai_insights(self, user_name, summary):
        """
        Generate AI-powered insights based on transaction data
        
        Args:
            user_name (str): User's name
            summary (dict): Transaction summary
            
        Returns:
            str: AI-generated insights
        """
        try:
            if not OPENAI_API_KEY:
                logger.warning("OpenAI API key not set, skipping AI insights")
                return None
                
            # Prepare the prompt with transaction data
            prompt = self._create_openai_prompt(user_name, summary)
            print(prompt)
            
            # Call OpenAI API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
            
            payload = {
                "model": OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a helpful financial assistant that provides concise, personalized insights about spending habits. Focus on actionable advice, budget alignment, and notable patterns. Keep your response under 100 words and use a friendly, conversational tone."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 10000
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            print(response.text)
            if response.status_code == 200:
                response_json = response.json()
                insights = response_json["choices"][0]["message"]["content"].strip()
                return insights
            else:
                logger.error(f"OpenAI API error: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating AI insights: {str(e)}")
            return None
    
    def _create_openai_prompt(self, user_name, summary):
        """
        Create a prompt for OpenAI based on transaction data
        
        Args:
            user_name (str): User's name
            summary (dict): Transaction summary
            
        Returns:
            str: Formatted prompt
        """
        prompt = f"Generate a personalized financial summary and insights for {user_name} based on the following transaction data:\n\n"
        
        if summary["total_count"] == 0:
            prompt += "No transactions recorded in the past week.\n"
            return prompt
            
        prompt += f"Total spent: ${summary['total_spent']:.2f}\n"
        prompt += f"Number of transactions: {summary['total_count']}\n\n"
        
        if summary["categories"]:
            prompt += "Spending by category:\n"
            for category, amount in summary["categories"].items():
                prompt += f"- {category}: ${amount:.2f}\n"
            prompt += "\n"
        
        if summary["largest_transaction"]:
            lt = summary["largest_transaction"]
            prompt += f"Largest transaction: {lt['name']} (${lt['amount']:.2f}) on {lt['date']} in category {lt['category']}\n\n"

        for transaction in summary["transactions"]:
            prompt += f"\n💳 <b>{transaction['name']}</b> (${transaction['amount']:.2f}) on {transaction['date']}"

        for category, amount in summary["budget"].items():
            prompt += f"- {category} budget: ${amount:.2f}\n"
        
        # Add stock portfolio information if it exists in the summary
        if "stock_performance" in summary and summary["stock_performance"]:
            prompt += "\nWeekly Stock Performance:\n\n"
            
            # Add market indices if they exist
            if "market_indices" in summary and summary["market_indices"]:
                prompt += "Market Indices:\n"
                for index_name, data in summary["market_indices"].items():
                    prompt += f"{index_name}: {data['percent_change']}\n"
                prompt += "\n"
            
            # Add individual stocks
            prompt += "Portfolio Stocks:\n"
            for ticker, data in summary["stock_performance"].items():
                if "error" in data:
                    prompt += f"{ticker}: {data['error']}\n"
                    continue
                    
                prompt += f"{ticker}: {data['percent_change']}\n"
            prompt += "\n"
        
        # Add stock news if it exists
        if "ticker_news" in summary and summary["ticker_news"]:
            prompt += "Recent Stock News:\n"
            for ticker, articles in summary["ticker_news"].items():
                if articles:
                    prompt += f"\n{ticker} News:\n"
                    for i, article in enumerate(articles, 1):
                        prompt += f"{i}. {article['title']} - {article['source']}\n"
                        if article.get('description'):
                            prompt += f"   {article['description']}\n"
                        prompt += f"   Published: {article['published_at']}\n\n"
        
        # Add market news if it exists
        if "market_news" in summary and summary["market_news"]:
            prompt += "Recent Market News:\n\n"
            for i, article in enumerate(summary["market_news"], 1):
                prompt += f"{i}. {article['title']} - {article['source']}\n"
                if article.get('description'):
                    prompt += f"   {article['description']}\n"
                if article.get('content'):
                    content = article.get('content', '')
                    # Some APIs limit content with a character count and "[+chars]" suffix
                    if "[+" in content:
                        content = content.split("[+")[0]
                    prompt += f"   Content: {content}\n"
                prompt += f"   Published: {article['published_at']}\n\n"
        
        prompt += "Please provide a brief analysis of this spending pattern, including:\n"
        prompt += "1. Notable insights about spending habits\n"
        prompt += "2. Suggestions for budget improvements\n"
        prompt += "3. Any unusual transactions or patterns\n"
        prompt += "4. A positive encouragement about financial habits\n\n"
        prompt += "Be sure to include a mention to the user's budget and how they are doing with it. Format your response in a conversational, friendly tone. Keep it concise (under 200 words) and make it feel personalized."

        # Add instructions for stock portfolio analysis
        if "stock_performance" in summary and summary["stock_performance"]:
            prompt += "\nPlease also provide a brief analysis of their stock portfolio, including:\n"
            prompt += "1. Notable performance of individual stocks\n"
            prompt += "2. Overall portfolio performance compared to market indices\n"
            prompt += "3. Any significant news that might impact their holdings\n"
            prompt += "4. Suggestions for portfolio adjustments if appropriate\n"
        
        # Format message
        prompt += "Format the message using HTML to be sent through Telegram. Only use HTML tags that are for formatting, not for structure. Do not start your message with grave accents to signal a block."
        return prompt
    
    def format_transaction_summary(self, user_name, summary):
        """
        Format a transaction summary into a readable Telegram message with AI insights
        
        Args:
            user_name (str): User's name
            summary (dict): Transaction summary
            
        Returns:
            str: Formatted message
        """
        if summary["total_count"] == 0:
            return f"Hi {user_name}, you have no transactions in the past week."
        
        # Generate the basic summary
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
 
        # Generate and add AI insights
        ai_insights = self._generate_ai_insights(user_name, summary)
        if ai_insights:
            message += f"\n\n✨ <b>AI Insights:</b>\n{ai_insights}"
        
        print(message)
        return message 