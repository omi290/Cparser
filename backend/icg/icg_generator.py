# Intermediate Code Generator — walks AST dict and produces Three-Address Code (Phase 4)
#
# Output formats:
#   • TAC list  — human-readable lines of three-address code
#   • Quadruples — (op, arg1, arg2, result) tuples for tabular display
#
# Supports: VarDecl, Assign, If, While, BinaryOp, UnaryOp, Printf, Scanf,
#           Return, PostfixStmt, PrefixStmt, Number, Identifier, String


class ICGGenerator:
    """Accepts an AST dict (from ast_node.to_dict()) and generates Three-Address Code."""

    def __init__(self):
        self._temp_counter = 0
        self._label_counter = 0
        self._tac = []          # list of TAC instruction strings
        self._quadruples = []   # list of (op, arg1, arg2, result) dicts

    # --- Public API ---

    def generate(self, ast_dict):
        """Entry point — returns { tac, quadruples }."""
        self._temp_counter = 0
        self._label_counter = 0
        self._tac = []
        self._quadruples = []

        if not ast_dict:
            return self._result()

        self._visit(ast_dict)
        return self._result()

    def _result(self):
        return {
            "tac": list(self._tac),
            "quadruples": list(self._quadruples),
        }

    # --- Temp / Label generators ---

    def _new_temp(self):
        self._temp_counter += 1
        return f"t{self._temp_counter}"

    def _new_label(self):
        self._label_counter += 1
        return f"L{self._label_counter}"

    # --- Emit helpers ---

    def _emit(self, code, op="", arg1="", arg2="", result=""):
        """Append a TAC line and its quadruple representation."""
        self._tac.append(code)
        self._quadruples.append({
            "op": op,
            "arg1": str(arg1),
            "arg2": str(arg2),
            "result": str(result),
        })

    # --- Visitor dispatch ---

    def _visit(self, node):
        if not node or not isinstance(node, dict):
            return None

        node_type = node.get("type", "")
        handler = getattr(self, f"_visit_{node_type}", None)

        if handler:
            return handler(node)
        else:
            # Generic: visit children
            for child in node.get("children", []):
                self._visit(child)
            return None

    # --- Statement visitors ---

    def _visit_Program(self, node):
        for child in node.get("children", []):
            self._visit(child)

    def _visit_VarDecl(self, node):
        name = node.get("name", "?")
        children = node.get("children", [])

        # Check for initializer (Assign child with label "= (init)")
        for child in children:
            if child.get("type") == "Assign" and child.get("label") == "= (init)":
                init_children = child.get("children", [])
                if init_children:
                    val = self._visit_expr(init_children[0])
                    self._emit(
                        f"{name} = {val}",
                        op="=", arg1=val, arg2="", result=name,
                    )
                    return

        # No initializer — just declare (emit nothing or a placeholder)
        # In TAC we typically don't emit for bare declarations

    def _visit_Assign(self, node):
        label = node.get("label", "")
        # Extract variable name from label "Assign (varname =)"
        name = None
        if label.startswith("Assign (") and label.endswith(" =)"):
            name = label[8:-3]

        if not name:
            name = "?"

        children = node.get("children", [])
        if children:
            val = self._visit_expr(children[0])
            self._emit(
                f"{name} = {val}",
                op="=", arg1=val, arg2="", result=name,
            )

    def _visit_If(self, node):
        children = node.get("children", [])
        cond_node = None
        then_stmts = []
        else_stmts = []

        for child in children:
            ctype = child.get("type")
            if ctype == "Condition":
                cond_children = child.get("children", [])
                if cond_children:
                    cond_node = cond_children[0]
            elif ctype == "Then":
                then_stmts = child.get("children", [])
            elif ctype == "Else":
                else_stmts = child.get("children", [])

        cond_result = self._visit_expr(cond_node) if cond_node else "true"

        if else_stmts:
            label_else = self._new_label()
            label_end = self._new_label()

            self._emit(
                f"ifFalse {cond_result} goto {label_else}",
                op="ifFalse", arg1=cond_result, arg2="", result=label_else,
            )

            for stmt in then_stmts:
                self._visit(stmt)

            self._emit(
                f"goto {label_end}",
                op="goto", arg1="", arg2="", result=label_end,
            )
            self._emit(
                f"{label_else}:",
                op="label", arg1=label_else, arg2="", result="",
            )

            for stmt in else_stmts:
                self._visit(stmt)

            self._emit(
                f"{label_end}:",
                op="label", arg1=label_end, arg2="", result="",
            )
        else:
            label_end = self._new_label()

            self._emit(
                f"ifFalse {cond_result} goto {label_end}",
                op="ifFalse", arg1=cond_result, arg2="", result=label_end,
            )

            for stmt in then_stmts:
                self._visit(stmt)

            self._emit(
                f"{label_end}:",
                op="label", arg1=label_end, arg2="", result="",
            )

    def _visit_While(self, node):
        children = node.get("children", [])
        cond_node = None
        body_stmts = []

        for child in children:
            ctype = child.get("type")
            if ctype == "Condition":
                cond_children = child.get("children", [])
                if cond_children:
                    cond_node = cond_children[0]
            elif ctype == "Body":
                body_stmts = child.get("children", [])

        label_start = self._new_label()
        label_end = self._new_label()

        self._emit(
            f"{label_start}:",
            op="label", arg1=label_start, arg2="", result="",
        )

        cond_result = self._visit_expr(cond_node) if cond_node else "true"

        self._emit(
            f"ifFalse {cond_result} goto {label_end}",
            op="ifFalse", arg1=cond_result, arg2="", result=label_end,
        )

        for stmt in body_stmts:
            self._visit(stmt)

        self._emit(
            f"goto {label_start}",
            op="goto", arg1="", arg2="", result=label_start,
        )
        self._emit(
            f"{label_end}:",
            op="label", arg1=label_end, arg2="", result="",
        )

    def _visit_Printf(self, node):
        children = node.get("children", [])
        fmt = ""
        args = []

        for child in children:
            if child.get("type") == "Format":
                fmt = child.get("label", "").replace("Format: ", "")
            else:
                val = self._visit_expr(child)
                args.append(val)

        if args:
            args_str = ", ".join(args)
            self._emit(
                f'call printf, "{fmt}", {args_str}',
                op="call", arg1="printf", arg2=f'"{fmt}", {args_str}', result="",
            )
        else:
            self._emit(
                f'call printf, "{fmt}"',
                op="call", arg1="printf", arg2=f'"{fmt}"', result="",
            )

    def _visit_Scanf(self, node):
        children = node.get("children", [])
        fmt = ""
        refs = []

        for child in children:
            if child.get("type") == "Format":
                fmt = child.get("label", "").replace("Format: ", "")
            elif child.get("type") == "Ref":
                label = child.get("label", "")
                refs.append(label)

        refs_str = ", ".join(refs) if refs else ""
        self._emit(
            f'call scanf, "{fmt}", {refs_str}',
            op="call", arg1="scanf", arg2=f'"{fmt}", {refs_str}', result="",
        )

    def _visit_Return(self, node):
        children = node.get("children", [])
        if children:
            val = self._visit_expr(children[0])
            self._emit(
                f"return {val}",
                op="return", arg1=val, arg2="", result="",
            )
        else:
            self._emit(
                "return",
                op="return", arg1="", arg2="", result="",
            )

    def _visit_PostfixStmt(self, node):
        label = node.get("label", "")
        # label format: "Postfix (name++)" or "Postfix (name--)"
        if label.startswith("Postfix (") and label.endswith(")"):
            inner = label[9:-1]
            if inner.endswith("++"):
                name = inner[:-2]
                t = self._new_temp()
                self._emit(
                    f"{t} = {name} + 1",
                    op="+", arg1=name, arg2="1", result=t,
                )
                self._emit(
                    f"{name} = {t}",
                    op="=", arg1=t, arg2="", result=name,
                )
            elif inner.endswith("--"):
                name = inner[:-2]
                t = self._new_temp()
                self._emit(
                    f"{t} = {name} - 1",
                    op="-", arg1=name, arg2="1", result=t,
                )
                self._emit(
                    f"{name} = {t}",
                    op="=", arg1=t, arg2="", result=name,
                )

    def _visit_PrefixStmt(self, node):
        label = node.get("label", "")
        # label format: "Prefix (++name)" or "Prefix (--name)"
        if label.startswith("Prefix (") and label.endswith(")"):
            inner = label[8:-1]
            if inner.startswith("++"):
                name = inner[2:]
                t = self._new_temp()
                self._emit(
                    f"{t} = {name} + 1",
                    op="+", arg1=name, arg2="1", result=t,
                )
                self._emit(
                    f"{name} = {t}",
                    op="=", arg1=t, arg2="", result=name,
                )
            elif inner.startswith("--"):
                name = inner[2:]
                t = self._new_temp()
                self._emit(
                    f"{t} = {name} - 1",
                    op="-", arg1=name, arg2="1", result=t,
                )
                self._emit(
                    f"{name} = {t}",
                    op="=", arg1=t, arg2="", result=name,
                )

    # --- Expression visitors (return the "place" holding the result) ---

    def _visit_expr(self, node):
        """Visit an expression node and return the temp/name holding its value."""
        if not node or not isinstance(node, dict):
            return "?"

        etype = node.get("type", "")

        if etype == "Number":
            return str(node.get("value", "0"))

        if etype == "Identifier":
            return str(node.get("name", "?"))

        if etype == "String":
            return f'"{node.get("value", "")}"'

        if etype == "BinaryOp":
            return self._visit_BinaryOp_expr(node)

        if etype == "UnaryOp":
            return self._visit_UnaryOp_expr(node)

        # Fallback — visit children and return last
        children = node.get("children", [])
        last = "?"
        for child in children:
            last = self._visit_expr(child)
        return last

    def _visit_BinaryOp_expr(self, node):
        op = node.get("op", "+")
        children = node.get("children", [])

        left_node = children[0] if len(children) > 0 else None
        right_node = children[1] if len(children) > 1 else None

        left = self._visit_expr(left_node)
        right = self._visit_expr(right_node)

        # Comparison operators produce a boolean temp used for branching
        t = self._new_temp()
        self._emit(
            f"{t} = {left} {op} {right}",
            op=op, arg1=left, arg2=right, result=t,
        )
        return t

    def _visit_UnaryOp_expr(self, node):
        op = node.get("op", "-")
        children = node.get("children", [])
        operand_node = children[0] if children else None
        operand = self._visit_expr(operand_node)

        if op in ("++", "post++"):
            t = self._new_temp()
            self._emit(
                f"{t} = {operand} + 1",
                op="+", arg1=operand, arg2="1", result=t,
            )
            if op == "++":
                # Prefix: update first, result is new value
                self._emit(
                    f"{operand} = {t}",
                    op="=", arg1=t, arg2="", result=operand,
                )
            return t

        if op in ("--", "post--"):
            t = self._new_temp()
            self._emit(
                f"{t} = {operand} - 1",
                op="-", arg1=operand, arg2="1", result=t,
            )
            if op == "--":
                self._emit(
                    f"{operand} = {t}",
                    op="=", arg1=t, arg2="", result=operand,
                )
            return t

        if op == "-":
            t = self._new_temp()
            self._emit(
                f"{t} = uminus {operand}",
                op="uminus", arg1=operand, arg2="", result=t,
            )
            return t

        # Fallback
        return operand
