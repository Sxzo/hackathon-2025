from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize CORS
    CORS(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Import here to avoid circular imports
    from app.api.routes.auth import jwt_blocklist
    
    # JWT token callbacks
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        """Check if the token is in the blocklist."""
        jti = jwt_payload["jti"]
        return jti in jwt_blocklist
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Handle expired token."""
        return {"message": "The token has expired", "error": "token_expired"}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid token."""
        return {"message": "Signature verification failed", "error": "invalid_token"}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing token."""
        return {"message": "Request does not contain an access token", "error": "authorization_required"}, 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Handle revoked token."""
        return {"message": "The token has been revoked", "error": "token_revoked"}, 401
    
    # Register blueprints
    from app.api.routes.main import main_bp
    from app.api.routes.auth import auth_bp
    
    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app 