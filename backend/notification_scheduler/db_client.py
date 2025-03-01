from pymongo import MongoClient
from datetime import datetime, timedelta
import pytz
from config import MONGODB_URI

class DatabaseClient:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client['finn_ai']
        self.collection = self.db['users']
    
    def get_users_for_notification(self, reference_time=None):
        """
        Get users who should receive notifications at the current time,
        accounting for their individual timezones
        
        Args:
            reference_time (datetime, optional): Reference time to use (defaults to current UTC time)
            
        Returns:
            list: List of user documents
        """
        # Use current time if no reference time is provided
        if reference_time is None:
            reference_time = datetime.now(pytz.UTC)
        
        # Round the reference time to the nearest minute
        # This ensures we don't miss notifications due to seconds/microseconds
        seconds = reference_time.second
        microseconds = reference_time.microsecond
        
        # If seconds >= 30, round up to the next minute
        if seconds >= 30:
            rounded_time = reference_time + timedelta(seconds=60-seconds, microseconds=-microseconds)
        else:
            # Otherwise, round down to the current minute
            rounded_time = reference_time + timedelta(seconds=-seconds, microseconds=-microseconds)
        
        # Find all users with financial_weekly_summary enabled
        users_with_summary = list(self.collection.find({
            "settings.financial_weekly_summary": True
        }))
        
        users_to_notify = []
        print(f"Found {len(users_with_summary)} users with financial_weekly_summary enabled")
        # For each user, check if it's time to send a notification based on their timezone
        for user in users_with_summary:
            # Get user's timezone (default to UTC if not specified)
            user_timezone_str = user.get("settings", {}).get("timezone", "UTC")
            
            try:
                # Convert to pytz timezone
                user_timezone = pytz.timezone(user_timezone_str)
                
                # Convert rounded reference time to user's timezone
                user_local_time = rounded_time.astimezone(user_timezone)
                
                # Format current time in user's timezone as HH:MM
                current_time_str = user_local_time.strftime("%H:%M")
                
                # Get user's notification time
                notification_time = user.get("settings", {}).get("financial_weekly_summary_time")
                
                # If user's local time matches their notification time, add to list
                if notification_time == current_time_str:
                    users_to_notify.append(user)
            except Exception as e:
                print(f"Error processing timezone for user {user.get('_id')}: {str(e)}")
        
        return users_to_notify
    
    def get_user_by_id(self, user_id):
        """
        Get a user by their ID
        
        Args:
            user_id (str): User ID
            
        Returns:
            dict: User document
        """
        return self.collection.find_one({"_id": user_id})
    
    def close(self):
        """Close the MongoDB connection"""
        self.client.close() 