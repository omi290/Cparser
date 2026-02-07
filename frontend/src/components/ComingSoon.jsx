import React from 'react';

const ComingSoon = ({ phase, icon, description }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6 opacity-50">{icon}</div>
            <h3 className="text-2xl font-bold text-white mb-3">{phase}</h3>
            <p className="text-gray-400 mb-6 max-w-md">{description}</p>
            <div className="px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 font-semibold">
                🚧 Coming Soon
            </div>
            <p className="text-sm text-gray-500 mt-4">This feature is under development</p>
        </div>
    );
};

export default ComingSoon;
