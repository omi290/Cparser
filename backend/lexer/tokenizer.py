"""
Lexical Analyzer (Tokenizer) for C Code — Phase 2
Supports: Keywords, Identifiers, Numbers, Operators,
          Separators, String Literals, Comments
"""

import re
from .token_types import (
    KEYWORD, IDENTIFIER, NUMBER, OPERATOR,
    SEPARATOR, STRING, WHITESPACE, COMMENT, UNKNOWN,
    KEYWORDS, OPERATORS, SEPARATORS
)


class Token:
    """Represents a single token"""
    def __init__(self, token_type, value, line):
        self.type  = token_type
        self.value = value
        self.line  = line

    def to_dict(self):
        """Convert token to dictionary for JSON serialization"""
        return {
            'type':  self.type,
            'value': self.value,
            'line':  self.line,
        }


class Tokenizer:
    """Regex-based tokenizer for C code (Phase 2)"""

    def __init__(self):
        # Token patterns — ORDER MATTERS (most specific first)
        self.token_patterns = [
            # String literals  "..."  (handles escape sequences)
            (STRING,     r'"(?:[^"\\]|\\.)*"'),

            # Multi-character operators (must beat single-char operators)
            (OPERATOR,   r'==|!=|<=|>=|\+\+|--'),

            # Keywords and Identifiers (keywords checked separately)
            (IDENTIFIER, r'[a-zA-Z_][a-zA-Z0-9_]*'),

            # Numbers (floats before ints)
            (NUMBER,     r'\d+\.\d+|\d+'),

            # Single-character operators
            (OPERATOR,   r'[+\-*/=<>]'),

            # Separators  ; { } ( ) , &
            (SEPARATOR,  r'[;{}(),&]'),

            # Whitespace (skip)
            (WHITESPACE, r'[ \t]+'),

            # Single-line comments
            (COMMENT,    r'//.*'),

            # Multi-line comments
            (COMMENT,    r'/\*[\s\S]*?\*/'),
        ]

        # Build master regex with named groups
        self.master_pattern = '|'.join(
            f'(?P<{name}{i}>{pattern})'
            for i, (name, pattern) in enumerate(self.token_patterns)
        )
        self.master_regex = re.compile(self.master_pattern)

    # ------------------------------------------------------------------
    def tokenize(self, code):
        """
        Tokenize the input C code.

        Args:
            code (str): C source code

        Returns:
            list[Token]: ordered token list (whitespace/comments excluded)
        """
        tokens    = []
        lines     = code.split('\n')

        for line_num, line in enumerate(lines, start=1):
            position = 0

            while position < len(line):
                match = self.master_regex.match(line, position)

                if match:
                    token_type  = None
                    token_value = match.group()

                    # Identify which named group matched
                    for i, (pattern_type, _) in enumerate(self.token_patterns):
                        if match.group(f'{pattern_type}{i}'):
                            token_type = pattern_type
                            break

                    # Skip whitespace and comments
                    if token_type not in (WHITESPACE, COMMENT):
                        # Promote identifier → keyword if in keyword set
                        if token_type == IDENTIFIER and token_value in KEYWORDS:
                            token_type = KEYWORD

                        tokens.append(Token(token_type, token_value, line_num))

                    position = match.end()

                else:
                    # Unknown character — record and advance
                    ch = line[position]
                    if ch not in (' ', '\t', '\n', '\r'):
                        tokens.append(Token(UNKNOWN, ch, line_num))
                    position += 1

        return tokens

    # ------------------------------------------------------------------
    def tokenize_to_dict(self, code):
        """
        Tokenize and return list of plain dicts (JSON-ready).

        Args:
            code (str): C source code

        Returns:
            list[dict]: each dict has 'type', 'value', 'line'
        """
        return [t.to_dict() for t in self.tokenize(code)]
