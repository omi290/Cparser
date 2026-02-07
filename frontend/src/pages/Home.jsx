import React, { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import TokenTable from '../components/TokenTable';
import TokenStream from '../components/TokenStream';
import TabNavigation from '../components/TabNavigation';
import ComingSoon from '../components/ComingSoon';
import api from '../services/api';

const Home = () => {
    const [code, setCode] = useState('');
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('lexical');

    const handleVisualize = async () => {
        if (!code.trim()) {
            setError('Please enter some C code first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await api.tokenize(code);
            setTokens(result);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to connect to backend. Make sure the Flask server is running on port 5000.');
            console.error('Tokenization error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel - Code Editor */}
                    <div className="card">
                        <CodeEditor code={code} setCode={setCode} />

                        <div className="mt-6">
                            <button
                                onClick={handleVisualize}
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Visualize Tokens
                                    </span>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm fade-in">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Token Visualization */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-white mb-4">Visualization</h2>

                        {/* Tab Navigation */}
                        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                        {/* Tab Content */}
                        {activeTab === 'lexical' && (
                            <>
                                {tokens.length > 0 && (
                                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm fade-in">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Successfully tokenized {tokens.length} token{tokens.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                )}

                                <TokenTable tokens={tokens} />
                                <TokenStream tokens={tokens} />
                            </>
                        )}

                        {activeTab === 'semantic' && (
                            <ComingSoon
                                phase="Semantic Analysis"
                                icon="🔍"
                                description="Symbol table generation, variable tracking, scope management, and type checking will be available in Phase 2."
                            />
                        )}

                        {activeTab === 'syntax' && (
                            <ComingSoon
                                phase="Syntax Analysis"
                                icon="🌳"
                                description="Parse tree visualization, AST generation, and syntax error reporting will be available in Phase 3."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
