from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'API is running'
    })

@main_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({
        'message': 'Test route working successfully'
    }) 