# Semantic Analyzer — walks AST dict and performs logical validation (Phase 3)

from .symbol_table import SymbolTable


class SemanticAnalyzer:
    # Accepts an AST dict (from ast_node.to_dict()) and runs semantic checks
    def __init__(self):
        self.symbol_table = SymbolTable()
        self.errors = []

    def analyze(self, ast_dict):
        # Entry point — returns { symbol_table, semantic_errors }
        self.symbol_table = SymbolTable()
        self.errors = []
        self._is_root = True

        if not ast_dict:
            return self._result()

        self.symbol_table.push_scope("global")
        self._visit(ast_dict)
        self.symbol_table.pop_scope()

        return self._result()

    def _result(self):
        return {
            "symbol_table": self.symbol_table.all_symbols(),
            "semantic_errors": [e for e in self.errors],
        }

    def _error(self, message, line=None):
        self.errors.append({"message": message, "line": line})

    # --- Visitor dispatch ---

    def _visit(self, node):
        # Dispatch to handler based on node 'type' field
        if not node or not isinstance(node, dict):
            return

        node_type = node.get("type", "")
        handler = getattr(self, f"_visit_{node_type}", None)

        if handler:
            handler(node)
        else:
            self._visit_children(node)

    def _visit_children(self, node):
        # Visit all children of a generic node
        for child in node.get("children", []):
            self._visit(child)

    # --- Node handlers ---

    def _visit_Program(self, node):
        # Root Program just visits children (global scope managed by analyze())
        # Nested Program nodes (standalone { } blocks) get their own block scope
        if self._is_root:
            self._is_root = False
            for child in node.get("children", []):
                self._visit(child)
        else:
            self.symbol_table.push_scope("block")
            for child in node.get("children", []):
                self._visit(child)
            self.symbol_table.pop_scope()

    def _visit_VarDecl(self, node):
        # Variable declaration — declare in symbol table + type-check initializer
        name = node.get("name")
        var_type = node.get("varType")
        line = node.get("line")

        if name and var_type:
            err = self.symbol_table.declare(name, var_type, line)
            if err:
                self._error(err, line)

        # Check initializer expression for type mismatch
        children = node.get("children", [])
        for child in children:
            if child.get("type") == "Assign" and child.get("label") == "= (init)":
                init_children = child.get("children", [])
                if init_children:
                    self._check_type_mismatch(name, var_type, init_children[0], line)
                    self._check_used_variables(init_children[0])

    def _visit_Assign(self, node):
        # Assignment — check variable is declared + type-check RHS
        label = node.get("label", "")
        line = node.get("line")

        # Extract variable name from label "Assign (varname =)"
        name = None
        if label.startswith("Assign (") and label.endswith(" =)"):
            name = label[8:-3]

        if name:
            sym = self.symbol_table.lookup(name)
            if sym is None:
                self._error(f"Variable '{name}' used without declaration", line)
            else:
                # Type-check RHS
                children = node.get("children", [])
                if children:
                    self._check_type_mismatch(name, sym.var_type, children[0], line)
                    self._check_used_variables(children[0])

    def _visit_If(self, node):
        # If statement — check condition variables, then visit scoped blocks
        children = node.get("children", [])
        for child in children:
            ctype = child.get("type")
            if ctype == "Condition":
                for c in child.get("children", []):
                    self._check_used_variables(c)
            elif ctype == "Then":
                self.symbol_table.push_scope("if")
                for stmt in child.get("children", []):
                    self._visit(stmt)
                self.symbol_table.pop_scope()
            elif ctype == "Else":
                self.symbol_table.push_scope("else")
                for stmt in child.get("children", []):
                    self._visit(stmt)
                self.symbol_table.pop_scope()

    def _visit_While(self, node):
        # While loop — check condition variables, then visit scoped body
        children = node.get("children", [])
        for child in children:
            ctype = child.get("type")
            if ctype == "Condition":
                for c in child.get("children", []):
                    self._check_used_variables(c)
            elif ctype == "Body":
                self.symbol_table.push_scope("while")
                for stmt in child.get("children", []):
                    self._visit(stmt)
                self.symbol_table.pop_scope()

    def _visit_Printf(self, node):
        # Printf — check that all argument identifiers are declared
        for child in node.get("children", []):
            if child.get("type") != "Format":
                self._check_used_variables(child)

    def _visit_Scanf(self, node):
        # Scanf — check that all referenced variables are declared
        for child in node.get("children", []):
            if child.get("type") == "Ref":
                label = child.get("label", "")
                if label.startswith("&"):
                    var_name = label[1:]
                    if not self.symbol_table.lookup(var_name):
                        line = node.get("line")
                        self._error(f"Variable '{var_name}' used without declaration", line)

    def _visit_Return(self, node):
        # Return — check that any returned identifiers are declared
        for child in node.get("children", []):
            self._check_used_variables(child)

    def _visit_PostfixStmt(self, node):
        # Postfix e.g. i++ — check identifier is declared
        label = node.get("label", "")
        line = node.get("line")
        # label format: "Postfix (name++)" or "Postfix (name--)"
        if label.startswith("Postfix (") and label.endswith(")"):
            inner = label[9:-1]
            name = inner.rstrip("+-")
            if name and not self.symbol_table.lookup(name):
                self._error(f"Variable '{name}' used without declaration", line)

    def _visit_PrefixStmt(self, node):
        # Prefix e.g. ++i — check identifier is declared
        label = node.get("label", "")
        line = node.get("line")
        if label.startswith("Prefix (") and label.endswith(")"):
            inner = label[8:-1]
            name = inner.lstrip("+-")
            if name and not self.symbol_table.lookup(name):
                self._error(f"Variable '{name}' used without declaration", line)

    # --- Helper: check identifiers used in expressions ---

    def _check_used_variables(self, expr):
        # Recursively check that all identifiers in an expression are declared
        if not expr or not isinstance(expr, dict):
            return

        if expr.get("type") == "Identifier":
            name = expr.get("name")
            line = expr.get("line")
            if name and not self.symbol_table.lookup(name):
                self._error(f"Variable '{name}' used without declaration", line)
            return

        for child in expr.get("children", []):
            self._check_used_variables(child)

    # --- Helper: type mismatch detection ---

    def _check_type_mismatch(self, var_name, var_type, expr, line):
        # Check if the RHS expression type conflicts with the declared type
        if not expr or not isinstance(expr, dict):
            return

        rhs_type = self._infer_expr_type(expr)
        if rhs_type is None:
            return

        if var_type in ("int", "char") and rhs_type == "float":
            self._error(
                f"Type mismatch: cannot assign float value to '{var_name}' (declared as {var_type})",
                line,
            )
        elif var_type == "char" and rhs_type == "int":
            pass  # Allow int-to-char in subset C

    def _infer_expr_type(self, expr):
        # Infer the type of a simple expression — returns 'int', 'float', or None
        if not expr or not isinstance(expr, dict):
            return None

        etype = expr.get("type")

        if etype == "Number":
            val = str(expr.get("value", ""))
            return "float" if "." in val else "int"

        if etype == "String":
            return "string"

        if etype == "Identifier":
            name = expr.get("name")
            sym = self.symbol_table.lookup(name)
            return sym.var_type if sym else None

        if etype == "BinaryOp":
            left_t = self._infer_expr_type(expr.get("children", [None])[0] if expr.get("children") else None)
            right_t = self._infer_expr_type(expr.get("children", [None, None])[1] if len(expr.get("children", [])) > 1 else None)
            if left_t == "float" or right_t == "float":
                return "float"
            if left_t == "int" or right_t == "int":
                return "int"
            return left_t or right_t

        if etype == "UnaryOp":
            children = expr.get("children", [])
            if children:
                return self._infer_expr_type(children[0])

        return None
