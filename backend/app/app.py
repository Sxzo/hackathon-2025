from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

# Import blueprints
from app.api.routes.auth import auth_bp
from app.api.routes.plaid import plaid_bp
from app.api.routes.settings import settings_bp

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app)
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(plaid_bp, url_prefix='/api/plaid')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
    @app.route('/')
    def index():
        return {'message': 'API is running'}
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 