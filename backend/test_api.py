"""Quick API test for Phase 2 /parse endpoint"""
import urllib.request
import json

code = 'int a = 5;\nif (a > 3) {\n    printf("%d", a);\n}'
data = json.dumps({'code': code}).encode()
req = urllib.request.Request(
    'http://localhost:5000/parse',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
res = urllib.request.urlopen(req)
result = json.loads(res.read().decode())

print("=== TOKENS ===")
for tok in result['tokens']:
    print(f"  {tok['type']:12} | {tok['value']:20} | line {tok['line']}")

print("\n=== ERRORS ===")
print(result['errors'] if result['errors'] else "None (success)")

print("\n=== AST (type+label) ===")
def print_ast(node, indent=0):
    if not node:
        return
    print(' ' * indent + f"[{node.get('type','')}] {node.get('label','')}")
    for child in node.get('children', []):
        print_ast(child, indent + 2)

print_ast(result['ast'])

print("\nAPI test passed!")
