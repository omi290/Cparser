# Flask API for C Parser Visualizer — Phase 3: Lexical + Syntax + Semantic Analysis

import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from lexer.tokenizer import Tokenizer
from parser.parser import CParser
from semantic.semantic_analyzer import SemanticAnalyzer

load_dotenv()

app = Flask(__name__)

cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
cors_origins = [o.strip() for o in cors_origins]
CORS(app, origins=cors_origins, supports_credentials=False)

tokenizer = Tokenizer()


@app.route('/')
def home():
    return jsonify({
        'message': 'C Parser Visualizer API',
        'phase':   'Phase 3 — Semantic Analysis',
        'status':  'running',
        'endpoints': ['/tokenize', '/parse', '/analyze']
    })


@app.route('/tokenize', methods=['POST'])
def tokenize():
    # Tokenize C code (Phase 1 endpoint kept for backward compatibility)
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing "code" field'}), 400
        tokens = tokenizer.tokenize_to_dict(data['code'])
        return jsonify(tokens), 200
    except Exception as e:
        return jsonify({'error': f'Tokenization failed: {str(e)}'}), 500


@app.route('/parse', methods=['POST'])
def parse():
    # Lexical + Syntax analysis — returns tokens, AST, errors, and trace
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing "code" field'}), 400

        code = data['code']

        token_dicts = tokenizer.tokenize_to_dict(code)

        parser_result = CParser(token_dicts).parse()

        ast        = parser_result.get('ast')
        parse_err  = parser_result.get('error')
        trace      = parser_result.get('trace', [])

        errors = [parse_err['message']] if parse_err else []

        return jsonify({
            'tokens':     token_dicts,
            'ast':        ast,
            'parseError': parse_err,
            'errors':     errors,
            'trace':      trace,
        }), 200

    except Exception as e:
        return jsonify({'error': f'Parse failed: {str(e)}'}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    # Full pipeline: Lexical + Syntax + Semantic analysis
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing "code" field'}), 400

        code = data['code']

        # Phase 1: Lexical analysis
        token_dicts = tokenizer.tokenize_to_dict(code)

        # Phase 2: Syntax analysis
        parser_result = CParser(token_dicts).parse()
        ast       = parser_result.get('ast')
        parse_err = parser_result.get('error')
        trace     = parser_result.get('trace', [])

        syntax_errors = [parse_err['message']] if parse_err else []

        # Phase 3: Semantic analysis (only if AST was produced)
        symbol_table = []
        semantic_errors = []

        if ast:
            analyzer = SemanticAnalyzer()
            sem_result = analyzer.analyze(ast)
            symbol_table = sem_result.get('symbol_table', [])
            semantic_errors = sem_result.get('semantic_errors', [])

        return jsonify({
            'tokens':          token_dicts,
            'ast':             ast,
            'parseError':      parse_err if parse_err else None,
            'syntax_errors':   syntax_errors,
            'symbol_table':    symbol_table,
            'semantic_errors': semantic_errors,
            'trace':           trace,
        }), 200

    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


if __name__ == '__main__':
    host  = os.getenv('HOST', 'localhost')
    port  = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    print("🚀 Starting C Parser Visualizer API — Phase 3")
    print(f"📍 Running on http://{host}:{port}")
    print("📝 Endpoints: /tokenize  /parse  /analyze")
    app.run(debug=debug, host=host, port=port)
