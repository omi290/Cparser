import React from 'react';

const TokenStream = ({ tokens }) => {
    if (!tokens || tokens.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 fade-in">
            <h3 className="text-lg font-semibold text-white mb-3">Colored Token Stream</h3>
            <div className="bg-bg-tertiary border border-gray-700 rounded-lg p-4 font-mono text-sm leading-relaxed">
                {tokens.map((token, index) => (
                    <span
                        key={index}
                        className={`${getTokenColorClass(token.type)} mr-2 inline-block`}
                        title={`${token.type} (Line ${token.line})`}
                    >
                        {token.value}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-400">Keywords</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                    <span className="text-gray-400">Identifiers</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-400">Numbers</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-400">Operators</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span className="text-gray-400">Separators</span>
                </div>
            </div>
        </div>
    );
};

const getTokenColorClass = (type) => {
    const classes = {
        'KEYWORD': 'token-keyword',
        'IDENTIFIER': 'token-identifier',
        'NUMBER': 'token-number',
        'OPERATOR': 'token-operator',
        'SEPARATOR': 'token-separator',
        'UNKNOWN': 'token-unknown'
    };
    return classes[type] || 'text-gray-400';
};

export default TokenStream;
