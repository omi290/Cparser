# Token Types for C Lexical Analyzer

# Token type constants
KEYWORD    = "KEYWORD"
IDENTIFIER = "IDENTIFIER"
NUMBER     = "NUMBER"
OPERATOR   = "OPERATOR"
SEPARATOR  = "SEPARATOR"
STRING     = "STRING"
WHITESPACE = "WHITESPACE"
COMMENT    = "COMMENT"
UNKNOWN    = "UNKNOWN"

# C Keywords (Phase 2 — includes printf / scanf)
KEYWORDS = {
    'int', 'float', 'char', 'if', 'else',
    'while', 'for', 'return', 'printf', 'scanf'
}

# Operators  (multi-char first, then single-char)
OPERATORS = {
    '+', '-', '*', '/', '=', '==', '!=',
    '<', '>', '<=', '>=', '++', '--'
}

# Separators
SEPARATORS = {
    ';', '{', '}', '(', ')', ',', '&'
}
