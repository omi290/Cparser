"""
Phase 2 verification test — run from backend/ folder
"""
import json
import sys

sys.path.insert(0, '.')

from lexer.tokenizer import Tokenizer
from parser.parser import CParser

t = Tokenizer()

# ── Test 1: Full program ─────────────────────────────────────────────
code1 = '''int a = 10;
int b = 20;
if (a < b) {
    printf("%d", a);
}
while (b != 0) {
    b = b - 1;
}
scanf("%d", &a);
int result = a + b * 2;'''

print("=" * 60)
print("TEST 1: Full program — tokens")
print("=" * 60)
tokens1 = t.tokenize_to_dict(code1)
for tok in tokens1:
    print(f"{tok['type']:12} | {tok['value']:25} | Line {tok['line']}")

print()
print("=" * 60)
print("TEST 1: AST")
print("=" * 60)
p1 = CParser(tokens1)
r1 = p1.parse()
if 'error' in r1:
    print("ERROR:", r1['error'])
else:
    print(json.dumps(r1['ast'], indent=2))

# ── Test 2: Syntax error ─────────────────────────────────────────────
print()
print("=" * 60)
print("TEST 2: Syntax error (missing semicolon)")
print("=" * 60)
code2 = "int a = "
tokens2 = t.tokenize_to_dict(code2)
p2 = CParser(tokens2)
r2 = p2.parse()
print("Result:", r2)

# ── Test 3: New tokens ──────────────────────────────────────────────
print()
print("=" * 60)
print("TEST 3: New operators ++ -- != and string literal")
print("=" * 60)
code3 = '''int i = 0;
i++;
int x = i != 5;
printf("hello %d", i);'''
tokens3 = t.tokenize_to_dict(code3)
for tok in tokens3:
    print(f"{tok['type']:12} | {tok['value']:25} | Line {tok['line']}")

print()
print("All tests completed!")
