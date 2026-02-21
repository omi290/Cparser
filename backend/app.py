"""
Flask API for C Parser Visualizer — Phase 2: Lexical + Syntax Analysis
Endpoints:
  GET  /          — Health check
  POST /tokenize  — Lexical analysis only (backwards compat)
  POST /parse     — Lexical + Syntax analysis → tokens + AST + errors
"""

import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from lexer.tokenizer import Tokenizer
from parser.parser import CParser

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
cors_origins = [o.strip() for o in cors_origins]
CORS(app, origins=cors_origins, supports_credentials=False)

# Shared tokenizer instance
tokenizer = Tokenizer()


# ─── Health check ────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        'message': 'C Parser Visualizer API',
        'phase':   'Phase 2 — Syntax Analysis',
        'status':  'running',
        'endpoints': ['/tokenize', '/parse']
    })


# ─── Legacy: tokenize only ───────────────────────────────────────────
@app.route('/tokenize', methods=['POST'])
def tokenize():
    """
    Tokenize C code (Phase 1 endpoint kept for backward compatibility).

    Body:  { "code": "..." }
    Returns: [ { "type", "value", "line" }, ... ]
    """
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing "code" field'}), 400
        tokens = tokenizer.tokenize_to_dict(data['code'])
        return jsonify(tokens), 200
    except Exception as e:
        return jsonify({'error': f'Tokenization failed: {str(e)}'}), 500


# ─── Phase 2: full parse ─────────────────────────────────────────────
@app.route('/parse', methods=['POST'])
def parse():
    """
    Lexical + Syntax analysis.

    Body:  { "code": "..." }
    Returns:
    {
        "tokens":     [ { "type", "value", "line" }, ... ],
        "ast":        { ... },       // partial tree even on error
        "parseError": { "message", "line", "expected", "got" } | null,
        "errors":     [ "msg" ],     // string list kept for banner compat
        "trace":      [ "step", ... ]
    }
    """
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'Missing "code" field'}), 400

        code = data['code']

        # ── Lexical analysis ──────────────────────────────────────
        token_dicts = tokenizer.tokenize_to_dict(code)

        # ── Syntax analysis ───────────────────────────────────────
        parser_result = CParser(token_dicts).parse()

        ast        = parser_result.get('ast')
        parse_err  = parser_result.get('error')   # dict or None
        trace      = parser_result.get('trace', [])

        # String errors list for backward-compat banner display
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


# ─── Entry point ─────────────────────────────────────────────────────
if __name__ == '__main__':
    host  = os.getenv('HOST', 'localhost')
    port  = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    print("🚀 Starting C Parser Visualizer API — Phase 2")
    print(f"📍 Running on http://{host}:{port}")
    print("📝 Endpoints: /tokenize  /parse")
    app.run(debug=debug, host=host, port=port)
