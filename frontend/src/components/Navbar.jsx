import React from 'react';

const Navbar = () => {
    return (
        <nav className="bg-bg-secondary border-b border-gray-700 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">C</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">C Parser Visualizer</h1>
                        <p className="text-sm text-gray-400">Educational Compiler Tool</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                        Tokenizer
                    </span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
