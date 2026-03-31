# Lexical Analyzer (Tokenizer) for C Code — Phase 2

import re
from .token_types import (
    KEYWORD, IDENTIFIER, NUMBER, OPERATOR,
    SEPARATOR, STRING, WHITESPACE, COMMENT, UNKNOWN,
    KEYWORDS, OPERATORS, SEPARATORS
)


class Token:
    # Represents a single token
    def __init__(self, token_type, value, line):
        self.type  = token_type
        self.value = value
        self.line  = line

    def to_dict(self):
        # Convert token to dictionary for JSON serialization
        return {
            'type':  self.type,
            'value': self.value,
            'line':  self.line,
        }


class Tokenizer:
    # Regex-based tokenizer for C code (Phase 2)

    def __init__(self):
        # Token patterns — ORDER MATTERS (most specific first)
        self.token_patterns = [
            (STRING,     r'"(?:[^"\\]|\\.)*"'),
            (OPERATOR,   r'==|!=|<=|>=|\+\+|--'),
            (IDENTIFIER, r'[a-zA-Z_][a-zA-Z0-9_]*'),
            (NUMBER,     r'\d+\.\d+|\d+'),
            (OPERATOR,   r'[+\-*/=<>]'),
            (SEPARATOR,  r'[;{}(),&]'),
            (WHITESPACE, r'[ \t]+'),
            (COMMENT,    r'//.*'),
            (COMMENT,    r'/\*[\s\S]*?\*/'),
        ]

        # Build master regex with named groups
        self.master_pattern = '|'.join(
            f'(?P<{name}{i}>{pattern})'
            for i, (name, pattern) in enumerate(self.token_patterns)
        )
        self.master_regex = re.compile(self.master_pattern)

    def tokenize(self, code):
        # Tokenize the input C code, returns list of Token objects (whitespace/comments excluded)
        tokens    = []
        lines     = code.split('\n')

        for line_num, line in enumerate(lines, start=1):
            position = 0

            while position < len(line):
                match = self.master_regex.match(line, position)

                if match:
                    token_type  = None
                    token_value = match.group()

                    for i, (pattern_type, _) in enumerate(self.token_patterns):
                        if match.group(f'{pattern_type}{i}'):
                            token_type = pattern_type
                            break

                    if token_type not in (WHITESPACE, COMMENT):
                        if token_type == IDENTIFIER and token_value in KEYWORDS:
                            token_type = KEYWORD

                        tokens.append(Token(token_type, token_value, line_num))

                    position = match.end()

                else:
                    ch = line[position]
                    if ch not in (' ', '\t', '\n', '\r'):
                        tokens.append(Token(UNKNOWN, ch, line_num))
                    position += 1

        return tokens

    def tokenize_to_dict(self, code):
        # Tokenize and return list of plain dicts (JSON-ready)
        return [t.to_dict() for t in self.tokenize(code)]
