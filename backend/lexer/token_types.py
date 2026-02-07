# Token Types for C Lexical Analyzer

# Token type constants
KEYWORD = "KEYWORD"
IDENTIFIER = "IDENTIFIER"
NUMBER = "NUMBER"
OPERATOR = "OPERATOR"
SEPARATOR = "SEPARATOR"
WHITESPACE = "WHITESPACE"
COMMENT = "COMMENT"
UNKNOWN = "UNKNOWN"

# C Keywords (subset for Phase 1)
KEYWORDS = {
    'int', 'float', 'char', 'if', 'else', 
    'while', 'for', 'return'
}

# Operators
OPERATORS = {
    '+', '-', '*', '/', '=', '==', 
    '<', '>', '<=', '>='
}

# Separators
SEPARATORS = {
    ';', '{', '}', '(', ')'
}
