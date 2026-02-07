import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'lexical', label: 'Lexical Analysis', icon: '🔤' },
        { id: 'semantic', label: 'Semantic Analysis', icon: '🔍', comingSoon: true },
        { id: 'syntax', label: 'Syntax Analysis', icon: '🌳', comingSoon: true }
    ];

    return (
        <div className="flex space-x-2 border-b border-gray-700 mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                    disabled={tab.comingSoon}
                    className={`
            relative px-4 py-3 font-medium text-sm transition-all duration-200
            ${activeTab === tab.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400 hover:text-gray-300'
                        }
            ${tab.comingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
                >
                    <span className="flex items-center space-x-2">
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                Coming Soon
                            </span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default TabNavigation;
