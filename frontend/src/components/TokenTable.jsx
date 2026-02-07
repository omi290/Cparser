import React from 'react';

const TokenTable = ({ tokens }) => {
    if (!tokens || tokens.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No tokens to display</p>
                <p className="text-sm mt-1">Write some C code and click "Visualize"</p>
            </div>
        );
    }

    return (
        <div className="overflow-auto max-h-96 fade-in">
            <table className="token-table">
                <thead>
                    <tr>
                        <th className="w-12">#</th>
                        <th>Token Type</th>
                        <th>Value</th>
                        <th className="w-20">Line</th>
                    </tr>
                </thead>
                <tbody>
                    {tokens.map((token, index) => (
                        <tr key={index} className="hover:bg-bg-tertiary transition-colors">
                            <td className="text-gray-500 font-mono text-sm">{index + 1}</td>
                            <td>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getTokenTypeClass(token.type)}`}>
                                    {token.type}
                                </span>
                            </td>
                            <td className={`font-mono font-semibold ${getTokenColorClass(token.type)}`}>
                                {token.value}
                            </td>
                            <td className="text-gray-400 font-mono text-sm">{token.line}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const getTokenTypeClass = (type) => {
    const classes = {
        'KEYWORD': 'bg-blue-500/20 text-blue-400',
        'IDENTIFIER': 'bg-gray-500/20 text-gray-300',
        'NUMBER': 'bg-green-500/20 text-green-400',
        'OPERATOR': 'bg-red-500/20 text-red-400',
        'SEPARATOR': 'bg-purple-500/20 text-purple-400',
        'UNKNOWN': 'bg-yellow-500/20 text-yellow-400'
    };
    return classes[type] || 'bg-gray-500/20 text-gray-400';
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

export default TokenTable;
