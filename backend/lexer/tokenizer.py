"""
Lexical Analyzer (Tokenizer) for C Code
Supports: Keywords, Identifiers, Numbers, Operators, Separators
"""

import re
from .token_types import (
    KEYWORD, IDENTIFIER, NUMBER, OPERATOR, 
    SEPARATOR, WHITESPACE, COMMENT, UNKNOWN,
    KEYWORDS, OPERATORS, SEPARATORS
)


class Token:
    """Represents a single token"""
    def __init__(self, token_type, value, line):
        self.type = token_type
        self.value = value
        self.line = line
    
    def to_dict(self):
        """Convert token to dictionary for JSON serialization"""
        return {
            'type': self.type,
            'value': self.value,
            'line': self.line
        }


class Tokenizer:
    """Regex-based tokenizer for C code"""
    
    def __init__(self):
        # Token patterns (order matters - more specific patterns first)
        self.token_patterns = [
            # Multi-character operators (must come before single-char operators)
            (OPERATOR, r'==|<=|>='),
            
            # Keywords and Identifiers (keywords checked separately)
            (IDENTIFIER, r'[a-zA-Z_][a-zA-Z0-9_]*'),
            
            # Numbers (integers and floats)
            (NUMBER, r'\d+\.\d+|\d+'),
            
            # Single-character operators
            (OPERATOR, r'[+\-*/=<>]'),
            
            # Separators
            (SEPARATOR, r'[;{}()]'),
            
            # Whitespace (we'll skip these but need to recognize them)
            (WHITESPACE, r'[ \t]+'),
            
            # Single-line comments
            (COMMENT, r'//.*'),
            
            # Multi-line comments
            (COMMENT, r'/\*[\s\S]*?\*/'),
        ]
        
        # Compile all patterns into one master regex
        self.master_pattern = '|'.join(f'(?P<{name}{i}>{pattern})' 
                                       for i, (name, pattern) in enumerate(self.token_patterns))
        self.master_regex = re.compile(self.master_pattern)
    
    def tokenize(self, code):
        """
        Tokenize the input C code
        
        Args:
            code (str): C source code to tokenize
            
        Returns:
            list: List of Token objects
        """
        tokens = []
        lines = code.split('\n')
        
        for line_num, line in enumerate(lines, start=1):
            position = 0
            
            while position < len(line):
                # Try to match a token at current position
                match = self.master_regex.match(line, position)
                
                if match:
                    token_type = None
                    token_value = match.group()
                    
                    # Determine which pattern matched
                    for i, (pattern_type, _) in enumerate(self.token_patterns):
                        if match.group(f'{pattern_type}{i}'):
                            token_type = pattern_type
                            break
                    
                    # Skip whitespace and comments
                    if token_type not in [WHITESPACE, COMMENT]:
                        # Check if identifier is actually a keyword
                        if token_type == IDENTIFIER and token_value in KEYWORDS:
                            token_type = KEYWORD
                        
                        tokens.append(Token(token_type, token_value, line_num))
                    
                    position = match.end()
                else:
                    # Unknown character - skip it or report error
                    if line[position] not in [' ', '\t', '\n', '\r']:
                        tokens.append(Token(UNKNOWN, line[position], line_num))
                    position += 1
        
        return tokens
    
    def tokenize_to_dict(self, code):
        """
        Tokenize and return as list of dictionaries
        
        Args:
            code (str): C source code to tokenize
            
        Returns:
            list: List of token dictionaries
        """
        tokens = self.tokenize(code)
        return [token.to_dict() for token in tokens]
