"""
Flask API for C Parser Visualizer - Phase 1: Lexical Analysis
Provides /tokenize endpoint for lexical analysis
"""

import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from lexer.tokenizer import Tokenizer

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS with environment variable
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=cors_origins)

# Initialize tokenizer
tokenizer = Tokenizer()


@app.route('/')
def home():
    """API health check"""
    return jsonify({
        'message': 'C Parser Visualizer API',
        'phase': 'Phase 1 - Lexical Analysis',
        'status': 'running'
    })


@app.route('/tokenize', methods=['POST'])
def tokenize():
    """
    Tokenize C code
    
    Request body:
        {
            "code": "int a = 5;"
        }
    
    Response:
        [
            {"type": "KEYWORD", "value": "int", "line": 1},
            {"type": "IDENTIFIER", "value": "a", "line": 1},
            {"type": "OPERATOR", "value": "=", "line": 1},
            {"type": "NUMBER", "value": "5", "line": 1},
            {"type": "SEPARATOR", "value": ";", "line": 1}
        ]
    """
    try:
        # Get code from request
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                'error': 'Missing "code" field in request body'
            }), 400
        
        code = data['code']
        
        # Tokenize the code
        tokens = tokenizer.tokenize_to_dict(code)
        
        return jsonify(tokens), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Tokenization failed: {str(e)}'
        }), 500


if __name__ == '__main__':
    host = os.getenv('HOST', 'localhost')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print("🚀 Starting C Parser Visualizer API...")
    print(f"📍 Server running on http://{host}:{port}")
    print("📝 Phase 1: Lexical Analysis")
    app.run(debug=debug, host=host, port=port)
