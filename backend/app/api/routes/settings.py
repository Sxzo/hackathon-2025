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
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get settings or return default if not present
        settings = user.get("settings", {})
        
        # Get budgets or return default if not present
        budgets = user.get("budgets", {})
        
        # Combine settings and budgets for the response
        response = {
            'settings': settings,
            'budgets': budgets
        }
        
        return jsonify({
            'message': 'Settings retrieved successfully',
            **response
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
        current_budgets = user.get("budgets", {})
        
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
        
        # Budget fields that can be updated
        allowed_budgets = [
            'shopping',
            'food',
            'entertainment',
            'target_balance'
        ]
        
        updated_settings = {}
        for key in allowed_settings:
            if key in data:
                updated_settings[key] = data[key]
        
        updated_budgets = {}
        for key in allowed_budgets:
            if key in data:
                updated_budgets[key] = data[key]
        
        # Update settings and budgets in database
        updates = {}
        
        if updated_settings:
            new_settings = {**current_settings, **updated_settings}
            updates["settings"] = new_settings
        
        if updated_budgets:
            new_budgets = {**current_budgets, **updated_budgets}
            updates["budgets"] = new_budgets
        
        if updates:
            users_collection.update_one(
                {"phone_number": phone_number},
                {"$set": updates}
            )
            
            response = {
                'settings': current_settings if 'settings' not in updates else updates['settings'],
                'budgets': current_budgets if 'budgets' not in updates else updates['budgets']
            }
            
            return jsonify({
                'message': 'Settings updated successfully',
                **response
            })
        else:
            return jsonify({
                'message': 'No valid settings to update',
                'settings': current_settings,
                'budgets': current_budgets
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
