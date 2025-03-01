from flask import Flask
import pymongo
from pymongo.collection import Collection
import os

# Initialize MongoDB client
client = None
db = None

def init_db(app: Flask) -> None:
    """Initialize the database connection."""
    global client, db
    
    # Get MongoDB URI from environment variable
    mongo_uri = os.environ.get("MONGO_URI")
    
    if not mongo_uri:
        app.logger.warning("MONGO_URI not set, database functionality will be limited")
        return
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient(mongo_uri)
        
        # Test the connection
        client.admin.command('ping')
        app.logger.info("MongoDB connection successful")
        
        # Get the database name from the URI
        db_name = mongo_uri.split('/')[-1].split('?')[0]
        if not db_name:
            db_name = 'finn_ai'  # Default database name
        
        # Get the database
        db = client[db_name]
        
        # Create indexes if needed
        db.users.create_index("phone_number", unique=True)
        
    except Exception as e:
        app.logger.error(f"Failed to connect to MongoDB: {e}")
        client = None
        db = None

def get_users_collection() -> Collection:
    """Get the users collection."""
    if db is not None:
        return db.users
    else:
        # Return a simple in-memory implementation if MongoDB is not available
        return SimpleUsersCollection()

# Simple in-memory storage as fallback
users_db = {}

class SimpleUsersCollection:
    """A simple in-memory collection for users."""
    
    def find_one(self, query):
        """Find a user by phone number."""
        if 'phone_number' in query:
            return users_db.get(query['phone_number'])
        return None
    
    def insert_one(self, document):
        """Insert a user document."""
        if 'phone_number' in document:
            users_db[document['phone_number']] = document
            return True
        return False
    
    def update_one(self, query, update):
        """Update a user document."""
        if 'phone_number' in query:
            phone_number = query['phone_number']
            if phone_number in users_db:
                if '$set' in update:
                    for key, value in update['$set'].items():
                        users_db[phone_number][key] = value
                return True
        return False
    
    def count_documents(self, query):
        """Count documents."""
        return len(users_db) 