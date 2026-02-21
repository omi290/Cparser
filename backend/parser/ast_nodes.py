"""
AST Node Classes for C Parser — Phase 2

Each node serializes to a dict via .to_dict() for JSON responses.
"""


class ASTNode:
    """Base class for all AST nodes"""
    node_type = "Node"

    def to_dict(self):
        raise NotImplementedError


# ─────────────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────────────

class ProgramNode(ASTNode):
    """Root of the program — holds a list of statements"""
    node_type = "Program"

    def __init__(self, statements):
        self.statements = statements  # list[ASTNode]

    def to_dict(self):
        return {
            "type":       self.node_type,
            "label":      "Program",
            "children":   [s.to_dict() for s in self.statements],
        }


# ─────────────────────────────────────────────────────────────────────
# Statements
# ─────────────────────────────────────────────────────────────────────

class VarDeclNode(ASTNode):
    """Variable declaration: int a = expr;   or   int a;"""
    node_type = "VarDecl"

    def __init__(self, var_type, name, init_expr=None, line=0):
        self.var_type  = var_type    # 'int' | 'float' | 'char'
        self.name      = name        # identifier string
        self.init_expr = init_expr   # ASTNode | None
        self.line      = line

    def to_dict(self):
        d = {
            "type":    self.node_type,
            "label":   f"VarDecl ({self.var_type} {self.name})",
            "varType": self.var_type,
            "name":    self.name,
            "line":    self.line,
            "children": [],
        }
        if self.init_expr:
            d["children"].append({
                "type": "Assign",
                "label": "= (init)",
                "children": [self.init_expr.to_dict()],
            })
        return d


class AssignNode(ASTNode):
    """Assignment: a = expr;"""
    node_type = "Assign"

    def __init__(self, name, expr, line=0):
        self.name = name   # identifier string
        self.expr = expr   # ASTNode
        self.line = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"Assign ({self.name} =)",
            "line":     self.line,
            "children": [self.expr.to_dict()],
        }


class IfNode(ASTNode):
    """if (cond) { body } [else { else_body }]"""
    node_type = "If"

    def __init__(self, condition, then_body, else_body=None, line=0):
        self.condition = condition   # ASTNode
        self.then_body = then_body   # list[ASTNode]
        self.else_body = else_body   # list[ASTNode] | None
        self.line      = line

    def to_dict(self):
        children = [
            {
                "type":     "Condition",
                "label":    "Condition",
                "children": [self.condition.to_dict()],
            },
            {
                "type":     "Then",
                "label":    "Then",
                "children": [s.to_dict() for s in self.then_body],
            },
        ]
        if self.else_body:
            children.append({
                "type":     "Else",
                "label":    "Else",
                "children": [s.to_dict() for s in self.else_body],
            })
        return {
            "type":     self.node_type,
            "label":    "If Statement",
            "line":     self.line,
            "children": children,
        }


class WhileNode(ASTNode):
    """while (cond) { body }"""
    node_type = "While"

    def __init__(self, condition, body, line=0):
        self.condition = condition   # ASTNode
        self.body      = body        # list[ASTNode]
        self.line      = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    "While Loop",
            "line":     self.line,
            "children": [
                {
                    "type":     "Condition",
                    "label":    "Condition",
                    "children": [self.condition.to_dict()],
                },
                {
                    "type":     "Body",
                    "label":    "Body",
                    "children": [s.to_dict() for s in self.body],
                },
            ],
        }


class PrintfNode(ASTNode):
    """printf("fmt", args...);"""
    node_type = "Printf"

    def __init__(self, fmt_string, args, line=0):
        self.fmt_string = fmt_string  # string value
        self.args       = args        # list[ASTNode]
        self.line       = line

    def to_dict(self):
        children = [{"type": "Format", "label": f"Format: {self.fmt_string}", "children": []}]
        children += [a.to_dict() for a in self.args]
        return {
            "type":     self.node_type,
            "label":    "printf()",
            "line":     self.line,
            "children": children,
        }


class ScanfNode(ASTNode):
    """scanf("fmt", &var, ...);"""
    node_type = "Scanf"

    def __init__(self, fmt_string, vars_, line=0):
        self.fmt_string = fmt_string   # string value
        self.vars_      = vars_        # list of identifier strings
        self.line       = line

    def to_dict(self):
        children = [{"type": "Format", "label": f"Format: {self.fmt_string}", "children": []}]
        children += [{"type": "Ref", "label": f"&{v}", "children": []} for v in self.vars_]
        return {
            "type":     self.node_type,
            "label":    "scanf()",
            "line":     self.line,
            "children": children,
        }


# ─────────────────────────────────────────────────────────────────────
# Expressions
# ─────────────────────────────────────────────────────────────────────

class BinaryOpNode(ASTNode):
    """Binary operation: left op right"""
    node_type = "BinaryOp"

    def __init__(self, op, left, right, line=0):
        self.op    = op
        self.left  = left
        self.right = right
        self.line  = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"BinaryOp ({self.op})",
            "op":       self.op,
            "line":     self.line,
            "children": [self.left.to_dict(), self.right.to_dict()],
        }


class UnaryOpNode(ASTNode):
    """Unary operation: op operand"""
    node_type = "UnaryOp"

    def __init__(self, op, operand, line=0):
        self.op      = op
        self.operand = operand
        self.line    = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"UnaryOp ({self.op})",
            "op":       self.op,
            "line":     self.line,
            "children": [self.operand.to_dict()],
        }


class NumberNode(ASTNode):
    """Numeric literal"""
    node_type = "Number"

    def __init__(self, value, line=0):
        self.value = value
        self.line  = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"Number ({self.value})",
            "value":    self.value,
            "line":     self.line,
            "children": [],
        }


class IdentNode(ASTNode):
    """Identifier reference"""
    node_type = "Identifier"

    def __init__(self, name, line=0):
        self.name = name
        self.line = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"Ident ({self.name})",
            "name":     self.name,
            "line":     self.line,
            "children": [],
        }


class StringNode(ASTNode):
    """String literal"""
    node_type = "String"

    def __init__(self, value, line=0):
        self.value = value
        self.line  = line

    def to_dict(self):
        return {
            "type":     self.node_type,
            "label":    f"String ({self.value})",
            "value":    self.value,
            "line":     self.line,
            "children": [],
        }
