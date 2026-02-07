"""
Test script for the tokenizer
"""

from lexer.tokenizer import Tokenizer

def test_tokenizer():
    tokenizer = Tokenizer()
    
    # Test 1: Simple variable declaration
    print("=" * 50)
    print("Test 1: Simple variable declaration")
    print("=" * 50)
    code1 = "int a = 5;"
    tokens1 = tokenizer.tokenize_to_dict(code1)
    for token in tokens1:
        print(f"{token['type']:12} | {token['value']:10} | Line {token['line']}")
    
    # Test 2: Multiple statements
    print("\n" + "=" * 50)
    print("Test 2: Multiple statements with operators")
    print("=" * 50)
    code2 = """int a = 10;
float b = 3.14;
if (a == 10) {
    return 0;
}"""
    tokens2 = tokenizer.tokenize_to_dict(code2)
    for token in tokens2:
        print(f"{token['type']:12} | {token['value']:10} | Line {token['line']}")
    
    # Test 3: Complex expression
    print("\n" + "=" * 50)
    print("Test 3: Complex expression")
    print("=" * 50)
    code3 = "int result = a + b * c - d / e;"
    tokens3 = tokenizer.tokenize_to_dict(code3)
    for token in tokens3:
        print(f"{token['type']:12} | {token['value']:10} | Line {token['line']}")
    
    # Test 4: Control flow
    print("\n" + "=" * 50)
    print("Test 4: Control flow structures")
    print("=" * 50)
    code4 = """for (int i = 0; i < 10; i = i + 1) {
    while (i >= 5) {
        char c = a;
    }
}"""
    tokens4 = tokenizer.tokenize_to_dict(code4)
    for token in tokens4:
        print(f"{token['type']:12} | {token['value']:10} | Line {token['line']}")
    
    print("\n" + "=" * 50)
    print("All tests completed successfully! ✓")
    print("=" * 50)

if __name__ == "__main__":
    test_tokenizer()
