# Scope-aware Symbol Table for Semantic Analysis — Phase 3


class Symbol:
    # Represents a single declared variable
    def __init__(self, name, var_type, scope, line):
        self.name = name
        self.var_type = var_type
        self.scope = scope
        self.line = line

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.var_type,
            "scope": self.scope,
            "line": self.line,
        }


class Scope:
    # A single scope level — holds its own symbol dict
    def __init__(self, name):
        self.name = name
        self.symbols = {}

    def has(self, name):
        return name in self.symbols

    def get(self, name):
        return self.symbols.get(name)

    def add(self, symbol):
        self.symbols[symbol.name] = symbol


class SymbolTable:
    # Stack-based symbol table — push on '{', pop on '}'
    def __init__(self):
        self._stack = []
        self._all_symbols = []

    def push_scope(self, name="block"):
        # Push a new scope onto the stack
        self._stack.append(Scope(name))

    def pop_scope(self):
        # Pop the top scope off the stack
        if self._stack:
            self._stack.pop()

    def current_scope_name(self):
        # Return label of the current (top) scope
        return self._stack[-1].name if self._stack else "unknown"

    def declare(self, name, var_type, line):
        # Declare a variable in the current scope; returns error string or None
        if not self._stack:
            return f"Internal error: no active scope for '{name}'"

        top = self._stack[-1]
        if top.has(name):
            existing = top.get(name)
            return f"Variable '{name}' already declared in {top.name} scope (first declared at line {existing.line})"

        sym = Symbol(name, var_type, top.name, line)
        top.add(sym)
        self._all_symbols.append(sym)
        return None

    def lookup(self, name):
        # Walk the scope stack top→bottom; return Symbol or None
        for scope in reversed(self._stack):
            sym = scope.get(name)
            if sym is not None:
                return sym
        return None

    def all_symbols(self):
        # Return flat list of all declared symbols as dicts
        return [s.to_dict() for s in self._all_symbols]
