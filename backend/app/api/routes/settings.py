from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import get_users_collection
import re

settings_bp = Blueprint('settings', __name__)

def standardize_phone_number(phone_number):
    """Standardize phone number format."""
    if not phone_number.startswith('+'):
        phone_number = '+1' + re.sub(r'\D', '', phone_number)
    return phone_number

@settings_bp.route('/get', methods=['GET'])
@jwt_required()
def get_settings():
    """Get user settings."""
    phone_number = get_jwt_identity()
    phone_number = standardize_phone_number(phone_number)
    
    try:
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user or "settings" not in user:
            return jsonify({'error': 'User settings not found'}), 404
        
        # Return user settings
        return jsonify({
            'settings': user["settings"]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/update', methods=['POST'])
@jwt_required()
def update_settings():
    """Update user settings."""
    phone_number = get_jwt_identity()
    phone_number = standardize_phone_number(phone_number)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No settings provided'}), 400
    
    try:
        users_collection = get_users_collection()
        user = users_collection.find_one({"phone_number": phone_number})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get current settings or initialize if not present
        current_settings = user.get("settings", {})
        
        # Only update allowed settings
        allowed_settings = [
            'timezone', 
            'notification_time', 
            'model', 
            'temperature', 
            'financial_weekly_summary',
            'financial_weekly_summary_time',
            'stock_weekly_summary',
            'stock_weekly_summary_time'
        ]
        
        updated_settings = {}
        for key in allowed_settings:
            if key in data:
                updated_settings[key] = data[key]
        
        # Update settings in database
        if updated_settings:
            new_settings = {**current_settings, **updated_settings}
            users_collection.update_one(
                {"phone_number": phone_number},
                {"$set": {"settings": new_settings}}
            )
            
            return jsonify({
                'message': 'Settings updated successfully',
                'settings': new_settings
            })
        else:
            return jsonify({
                'message': 'No valid settings to update',
                'settings': current_settings
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
