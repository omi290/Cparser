import React from 'react';

const CodeEditor = ({ code, setCode }) => {
    const handleChange = (e) => {
        setCode(e.target.value);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Code Editor</h2>
                <span className="text-xs text-gray-400 font-mono">C Language</span>
            </div>

            <div className="flex-1 relative">
                <textarea
                    className="code-editor"
                    value={code}
                    onChange={handleChange}
                    placeholder="// Enter your C code here...
int main() {
    int a = 5;
    float b = 3.14;
    return 0;
}"
                    spellCheck="false"
                />
            </div>

            <div className="mt-3 text-xs text-gray-400">
                <p>Supported: Keywords, Identifiers, Numbers, Operators (+, -, *, /, =, ==, &lt;, &gt;, &lt;=, &gt;=), Separators</p>
            </div>
        </div>
    );
};

export default CodeEditor;
