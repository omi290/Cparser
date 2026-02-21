"""
Recursive Descent Parser for C (Subset) — Phase 2

Supported grammar:
  program        → statement*
  statement      → var_decl | assign | if_stmt | while_stmt
                 | printf_stmt | scanf_stmt | block | return_stmt
  var_decl       → TYPE IDENT ('=' expr)? ';'
  assign         → IDENT '=' expr ';'
  if_stmt        → 'if' '(' expr ')' block ('else' block)?
  while_stmt     → 'while' '(' expr ')' block
  printf_stmt    → 'printf' '(' STRING (',' expr)* ')' ';'
  scanf_stmt     → 'scanf'  '(' STRING (',' '&' IDENT)* ')' ';'
  block          → '{' statement* '}'
  expr           → comparison
  comparison     → additive (('=='|'!='|'<'|'>'|'<='|'>=') additive)?
  additive       → term (('+' | '-') term)*
  term           → factor (('*' | '/') factor)*
  factor         → ('++'|'--') IDENT | NUMBER | STRING | IDENT
                 | '(' expr ')' | '-' factor
"""

from .ast_nodes import (
    ProgramNode, VarDeclNode, AssignNode, IfNode, WhileNode,
    PrintfNode, ScanfNode,
    BinaryOpNode, UnaryOpNode,
    NumberNode, IdentNode, StringNode,
)

# Token type constants (mirrors lexer.token_types)
KEYWORD    = "KEYWORD"
IDENTIFIER = "IDENTIFIER"
NUMBER     = "NUMBER"
OPERATOR   = "OPERATOR"
SEPARATOR  = "SEPARATOR"
STRING     = "STRING"

# Types we can declare variables with
VAR_TYPES = {'int', 'float', 'char', 'double', 'long'}

# Comparison operators
CMP_OPS = {'==', '!=', '<', '>', '<=', '>='}

# Human-friendly names for token types
FRIENDLY = {
    IDENTIFIER: "variable name",
    KEYWORD:    "keyword",
    NUMBER:     "number literal",
    STRING:     "string literal",
    OPERATOR:   "operator",
    SEPARATOR:  "symbol",
}


class ParseError(Exception):
    """Raised when the parser encounters a syntax error — carries structured info."""

    def __init__(self, message, line=None, expected=None, got=None):
        super().__init__(message)
        self.line     = line
        self.expected = expected
        self.got      = got

    def to_dict(self):
        return {
            "message":  str(self),
            "line":     self.line,
            "expected": self.expected,
            "got":      self.got,
        }


class CParser:
    """
    Recursive descent parser.

    Usage:
        parser = CParser(token_list)
        result = parser.parse()
        # result is {
        #   "ast":   {...},          # always present (may be partial on error)
        #   "error": {...} | None,   # None on full success
        #   "trace": [...]           # parser step log
        # }
    """

    def __init__(self, tokens):
        self._tokens      = tokens
        self._pos         = 0
        self._trace       = []
        self._parse_error = None  # stores first ParseError encountered

    # ── Trace helper ────────────────────────────────────────────────

    def _log(self, msg):
        self._trace.append(msg)

    # ── Internal helpers ────────────────────────────────────────────

    def _peek(self, offset=0):
        idx = self._pos + offset
        return self._tokens[idx] if idx < len(self._tokens) else None

    def _current(self):
        return self._peek(0)

    def _advance(self):
        tok = self._tokens[self._pos]
        self._pos += 1
        return tok

    def _at_end(self):
        return self._pos >= len(self._tokens)

    def _current_line(self):
        t = self._current()
        return t['line'] if t else None

    def _expect(self, tok_type, value=None):
        """
        Consume the current token if it matches; raise a human-friendly
        ParseError otherwise.
        """
        tok = self._current()

        if tok is None:
            exp_desc = f"`{value}`" if value else FRIENDLY.get(tok_type, tok_type)
            raise ParseError(
                f"Unexpected end of input — expected {exp_desc}",
                line=None,
                expected=value or tok_type,
                got="end of input",
            )

        if tok['type'] != tok_type:
            exp_desc = f"`{value}`" if value else FRIENDLY.get(tok_type, tok_type)
            raise ParseError(
                f"Expected {exp_desc}, but got `{tok['value']}` (line {tok['line']})",
                line=tok['line'],
                expected=value or tok_type,
                got=tok['value'],
            )

        if value is not None and tok['value'] != value:
            raise ParseError(
                f"Expected `{value}`, but got `{tok['value']}` (line {tok['line']})",
                line=tok['line'],
                expected=value,
                got=tok['value'],
            )

        return self._advance()

    def _match(self, tok_type, value=None):
        """Return True and advance if current token matches, else False."""
        tok = self._current()
        if tok is None:
            return False
        if tok['type'] != tok_type:
            return False
        if value is not None and tok['value'] != value:
            return False
        self._advance()
        return True

    # ── Public entry point ──────────────────────────────────────────

    def parse(self):
        """
        Parse the token stream.

        Returns:
            dict with keys:
              ast   – serialised AST dict (partial if error occurred)
              error – None on success, or {message, line, expected, got}
              trace – list of parser step strings
        """
        self._trace       = []
        self._parse_error = None

        self._log("▶ Parser started")

        try:
            program = self._parse_program()
        except Exception as e:
            # Catastrophic error — shouldn't normally happen
            return {
                "ast":   None,
                "error": {"message": f"Internal error: {e}", "line": None,
                          "expected": None, "got": None},
                "trace": self._trace,
            }

        ast_dict  = program.to_dict()
        error_obj = self._parse_error.to_dict() if self._parse_error else None

        if error_obj:
            self._log(f"✗ Parsing stopped — {error_obj['message']}")
        else:
            self._log("✔ Parsing complete — AST built successfully")

        return {
            "ast":   ast_dict,
            "error": error_obj,
            "trace": self._trace,
        }

    # ── Grammar rules ────────────────────────────────────────────────

    def _parse_program(self):
        self._log("→ Program")
        stmts = []
        while not self._at_end():
            try:
                stmt = self._parse_statement()
                if stmt:
                    stmts.append(stmt)
            except ParseError as e:
                self._parse_error = e
                # Append a visual error sentinel to the partial tree
                stmts.append(_ErrorSentinel(str(e), e.line))
                break   # stop — don't attempt to recover further
        return ProgramNode(stmts)

    def _parse_statement(self):
        tok = self._current()
        if tok is None:
            return None

        # Block
        if tok['type'] == SEPARATOR and tok['value'] == '{':
            return self._parse_block_as_node()

        # Variable declaration
        if tok['type'] == KEYWORD and tok['value'] in VAR_TYPES:
            return self._parse_var_decl()

        # if / while / printf / scanf / return
        if tok['type'] == KEYWORD:
            if tok['value'] == 'if':
                return self._parse_if()
            if tok['value'] == 'while':
                return self._parse_while()
            if tok['value'] == 'printf':
                return self._parse_printf()
            if tok['value'] == 'scanf':
                return self._parse_scanf()
            if tok['value'] == 'return':
                return self._parse_return()

        # Prefix ++ / --
        if tok['type'] == OPERATOR and tok['value'] in ('++', '--'):
            return self._parse_unary_stmt()

        # Assignment / postfix
        if tok['type'] == IDENTIFIER:
            return self._parse_assign_or_postfix()

        raise ParseError(
            f"Unrecognised statement starting with `{tok['value']}` (line {tok['line']})",
            line=tok['line'],
            expected="statement",
            got=tok['value'],
        )

    # ── Variable declaration ─────────────────────────────────────────

    def _parse_var_decl(self):
        type_tok = self._advance()           # consume type
        var_type = type_tok['value']
        line     = type_tok['line']

        self._log(f"  → VarDecl: type `{var_type}` (line {line})")

        name_tok = self._expect(IDENTIFIER)  # variable name
        name     = name_tok['value']
        self._log(f"    ✓ Identifier `{name}`")

        init_expr = None
        if self._current() and self._current()['type'] == OPERATOR \
                and self._current()['value'] == '=':
            self._advance()                  # consume '='
            self._log(f"    → Parsing initializer expression")
            init_expr = self._parse_expr()

        self._expect_semicolon()
        self._log(f"    ✓ VarDecl complete: {var_type} {name}")
        return VarDeclNode(var_type, name, init_expr, line)

    # ── Assignment / postfix ──────────────────────────────────────────

    def _parse_assign_or_postfix(self):
        name_tok = self._advance()
        name     = name_tok['value']
        line     = name_tok['line']

        tok = self._current()
        if tok is None:
            raise ParseError(
                f"Unexpected end of input after `{name}` (line {line})",
                line=line, expected="= or ++ or --", got="end of input",
            )

        if tok['type'] == OPERATOR and tok['value'] in ('++', '--'):
            op = self._advance()['value']
            self._expect_semicolon()
            self._log(f"  → PostfixStmt: {name}{op}")
            return _PostfixStmtNode(op, name, line)

        if tok['type'] == OPERATOR and tok['value'] == '=':
            self._advance()
            self._log(f"  → Assignment: {name} = ...")
            expr = self._parse_expr()
            self._expect_semicolon()
            self._log(f"    ✓ Assignment complete")
            return AssignNode(name, expr, line)

        raise ParseError(
            f"Expected `=`, `++` or `--` after `{name}` (line {line})",
            line=line, expected="= or ++ or --", got=tok['value'],
        )

    def _parse_unary_stmt(self):
        op_tok = self._advance()
        op     = op_tok['value']
        line   = op_tok['line']
        name_tok = self._expect(IDENTIFIER)
        self._expect_semicolon()
        self._log(f"  → PrefixStmt: {op}{name_tok['value']}")
        return _PrefixStmtNode(op, name_tok['value'], line)

    # ── If statement ─────────────────────────────────────────────────

    def _parse_if(self):
        line = self._current()['line']
        self._log(f"  → IfStatement (line {line})")
        self._advance()                      # consume 'if'
        self._expect(SEPARATOR, '(')
        self._log("    → Parsing condition")
        condition = self._parse_expr()
        self._expect(SEPARATOR, ')')
        self._log("    → Parsing then-block")
        then_body = self._parse_block()

        else_body = None
        tok = self._current()
        if tok and tok['type'] == KEYWORD and tok['value'] == 'else':
            self._advance()
            self._log("    → Parsing else-block")
            else_body = self._parse_block()

        self._log("    ✓ IfStatement complete")
        return IfNode(condition, then_body, else_body, line)

    # ── While statement ──────────────────────────────────────────────

    def _parse_while(self):
        line = self._current()['line']
        self._log(f"  → WhileStatement (line {line})")
        self._advance()                      # consume 'while'
        self._expect(SEPARATOR, '(')
        self._log("    → Parsing condition")
        condition = self._parse_expr()
        self._expect(SEPARATOR, ')')
        self._log("    → Parsing body")
        body = self._parse_block()
        self._log("    ✓ WhileStatement complete")
        return WhileNode(condition, body, line)

    # ── printf / scanf ─────────────────────────────────────────────

    def _parse_printf(self):
        line = self._current()['line']
        self._log(f"  → Printf (line {line})")
        self._advance()                      # consume 'printf'
        self._expect(SEPARATOR, '(')

        fmt_tok = self._expect(STRING)
        fmt     = fmt_tok['value']
        self._log(f"    ✓ Format string: {fmt}")

        args = []
        while self._current() and self._current()['value'] == ',':
            self._advance()
            args.append(self._parse_expr())

        self._expect(SEPARATOR, ')')
        self._expect_semicolon()
        self._log("    ✓ Printf complete")
        return PrintfNode(fmt, args, line)

    def _parse_scanf(self):
        line = self._current()['line']
        self._log(f"  → Scanf (line {line})")
        self._advance()                      # consume 'scanf'
        self._expect(SEPARATOR, '(')

        fmt_tok = self._expect(STRING)
        fmt     = fmt_tok['value']
        self._log(f"    ✓ Format string: {fmt}")

        vars_ = []
        while self._current() and self._current()['value'] == ',':
            self._advance()
            self._expect(SEPARATOR, '&')
            name_tok = self._expect(IDENTIFIER)
            vars_.append(name_tok['value'])
            self._log(f"    ✓ Variable: &{name_tok['value']}")

        self._expect(SEPARATOR, ')')
        self._expect_semicolon()
        self._log("    ✓ Scanf complete")
        return ScanfNode(fmt, vars_, line)

    # ── return statement ────────────────────────────────────────────

    def _parse_return(self):
        line = self._current()['line']
        self._log(f"  → Return (line {line})")
        self._advance()                      # consume 'return'
        expr = None
        if self._current() and self._current()['value'] != ';':
            expr = self._parse_expr()
        self._expect_semicolon()
        self._log("    ✓ Return complete")
        return _ReturnNode(expr, line)

    # ── Block ────────────────────────────────────────────────────────

    def _parse_block(self):
        """Parse { stmts } and return list of statement nodes"""
        self._expect(SEPARATOR, '{')
        stmts = []
        while self._current() and self._current()['value'] != '}':
            stmt = self._parse_statement()
            if stmt:
                stmts.append(stmt)
        self._expect(SEPARATOR, '}')
        return stmts

    def _parse_block_as_node(self):
        stmts = self._parse_block()
        return ProgramNode(stmts)

    # ── Expressions ──────────────────────────────────────────────────

    def _parse_expr(self):
        return self._parse_comparison()

    def _parse_comparison(self):
        left = self._parse_additive()
        tok  = self._current()
        if tok and tok['type'] == OPERATOR and tok['value'] in CMP_OPS:
            op = self._advance()['value']
            right = self._parse_additive()
            line  = left.to_dict().get('line', 0)
            self._log(f"    ✓ BinaryOp: {op}")
            return BinaryOpNode(op, left, right, line)
        return left

    def _parse_additive(self):
        left = self._parse_term()
        while True:
            tok = self._current()
            if tok and tok['type'] == OPERATOR and tok['value'] in ('+', '-'):
                op    = self._advance()['value']
                right = self._parse_term()
                line  = tok['line']
                left  = BinaryOpNode(op, left, right, line)
            else:
                break
        return left

    def _parse_term(self):
        left = self._parse_factor()
        while True:
            tok = self._current()
            if tok and tok['type'] == OPERATOR and tok['value'] in ('*', '/'):
                op    = self._advance()['value']
                right = self._parse_factor()
                line  = tok['line']
                left  = BinaryOpNode(op, left, right, line)
            else:
                break
        return left

    def _parse_factor(self):
        tok = self._current()
        if tok is None:
            raise ParseError(
                "Unexpected end of input inside expression",
                line=None, expected="expression", got="end of input",
            )

        if tok['type'] == OPERATOR and tok['value'] in ('++', '--'):
            op = self._advance()['value']
            line = tok['line']
            operand = self._parse_factor()
            return UnaryOpNode(op, operand, line)

        if tok['type'] == OPERATOR and tok['value'] == '-':
            op = self._advance()['value']
            line = tok['line']
            operand = self._parse_factor()
            return UnaryOpNode('-', operand, line)

        if tok['type'] == NUMBER:
            self._advance()
            return NumberNode(tok['value'], tok['line'])

        if tok['type'] == STRING:
            self._advance()
            return StringNode(tok['value'], tok['line'])

        if tok['type'] == IDENTIFIER:
            self._advance()
            node = IdentNode(tok['value'], tok['line'])
            nxt = self._current()
            if nxt and nxt['type'] == OPERATOR and nxt['value'] in ('++', '--'):
                op = self._advance()['value']
                return UnaryOpNode(f'post{op}', node, tok['line'])
            return node

        if tok['type'] == SEPARATOR and tok['value'] == '(':
            self._advance()
            expr = self._parse_expr()
            self._expect(SEPARATOR, ')')
            return expr

        raise ParseError(
            f"Unexpected `{tok['value']}` inside expression (line {tok['line']})",
            line=tok['line'], expected="expression", got=tok['value'],
        )

    # ── Utility ──────────────────────────────────────────────────────

    def _expect_semicolon(self):
        tok = self._current()
        if tok is None:
            raise ParseError(
                "Missing `;` at end of statement",
                line=None, expected=";", got="end of input",
            )
        if tok['type'] != SEPARATOR or tok['value'] != ';':
            raise ParseError(
                f"Missing `;` after statement (line {tok['line']}) — got `{tok['value']}`",
                line=tok['line'], expected=";", got=tok['value'],
            )
        self._advance()


# ── Internal helper nodes ────────────────────────────────────────────

class _ErrorSentinel:
    """Displayed as an ❌ leaf in the partial AST when parsing stops."""
    def __init__(self, message, line=None):
        self.message = message
        self.line = line

    def to_dict(self):
        return {
            "type":     "SyntaxError",
            "label":    f"❌ Syntax Error — {self.message}",
            "line":     self.line,
            "children": [],
            "isError":  True,
        }


class _ReturnNode:
    node_type = "Return"

    def __init__(self, expr, line):
        self.expr = expr
        self.line = line

    def to_dict(self):
        return {
            "type":     "Return",
            "label":    "return",
            "line":     self.line,
            "children": [self.expr.to_dict()] if self.expr else [],
        }


class _PostfixStmtNode:
    node_type = "PostfixStmt"

    def __init__(self, op, name, line):
        self.op   = op
        self.name = name
        self.line = line

    def to_dict(self):
        return {
            "type":     "PostfixStmt",
            "label":    f"Postfix ({self.name}{self.op})",
            "line":     self.line,
            "children": [],
        }


class _PrefixStmtNode:
    node_type = "PrefixStmt"

    def __init__(self, op, name, line):
        self.op   = op
        self.name = name
        self.line = line

    def to_dict(self):
        return {
            "type":     "PrefixStmt",
            "label":    f"Prefix ({self.op}{self.name})",
            "line":     self.line,
            "children": [],
        }
