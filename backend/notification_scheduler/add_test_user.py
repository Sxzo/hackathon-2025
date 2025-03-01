import pymongo
import datetime
import pytz
from bson import ObjectId
from config import MONGODB_URI, MONGODB_DB_NAME

def add_test_user():
    """Add a test user to the database"""
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        users_collection = db['users']
        
        # Get current time
        now = datetime.datetime.now()
        # Set notification time to 2 minutes from now
        notification_time = (now + datetime.timedelta(minutes=2)).strftime("%H:%M")
        
        # Create test user
        test_user = {
            "_id": ObjectId(),
            "phone_number": "+1234567890",  # Kept for backward compatibility
            "telegram_chat_id": "your_telegram_chat_id",  # Replace with your actual Telegram chat ID
            "first_name": "Test",
            "last_name": "User",
            "timezone": "America/New_York",  # Replace with your timezone if needed
            "status": "verified",
            "created_at": datetime.datetime.now(),
            "plaid_connected": True,
            "plaid_access_token": "access-sandbox-385a86b7-1637-454d-b072-7fa28bea32b8",  # This is a sample token
            "settings": {
                "timezone": "America/New_York",  # Replace with your timezone if needed
                "notification_time": notification_time,
                "model": "gpt-4o-mini",
                "temperature": 0.7,
                "financial_weekly_summary": True,
                "financial_weekly_summary_time": notification_time,
                "stock_weekly_summary": True,
                "stock_weekly_summary_time": "09:00"
            }
        }
        
        # Insert the user
        result = users_collection.insert_one(test_user)
        
        print(f"✅ Test user added with ID: {result.inserted_id}")
        print(f"Notification time set to: {notification_time}")
        print(f"Make sure to update the 'telegram_chat_id' field with your actual Telegram chat ID")
        
        # Verify the user was added
        user = users_collection.find_one({"_id": result.inserted_id})
        print("\nUser document:")
        print(user)
        
        return True
    except Exception as e:
        print(f"❌ Error adding test user: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Adding test user to database...")
    add_test_user() 