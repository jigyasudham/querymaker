import React, { useState } from 'react';
import { ALL_FUNCTIONS } from '../Services/ClauseDefinitions';

/**
 * Function Browser Modal
 * Shows available SQL functions organized by category
 */
const FunctionBrowser = ({ isOpen, onClose, onInsertFunction, userLevel = 'Beginner', theme }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter functions by user level
  const availableFunctions = ALL_FUNCTIONS.filter(fn => {
    if (userLevel === 'Advanced') return true;
    if (userLevel === 'Intermediate') return fn.type !== 'Window';
    return fn.type !== 'Window' && fn.type !== 'Aggregate';
  });

  // Get unique categories
  const categories = ['All', ...new Set(availableFunctions.map(fn => fn.type))];

  // Filter functions by category and search
  const filteredFunctions = availableFunctions.filter(fn => {
    const matchesCategory = selectedCategory === 'All' || fn.type === selectedCategory;
    const matchesSearch = fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (fn.description && fn.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleInsert = (func) => {
    onInsertFunction(func.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col m-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>SQL Functions Library</h2>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-2xl leading-none`}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <input
            type="text"
            placeholder="Search functions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            autoFocus
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className={`w-48 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} overflow-y-auto`}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Functions List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredFunctions.length > 0 ? (
              <div className="grid gap-3">
                {filteredFunctions.map(func => (
                  <div
                    key={func.name}
                    className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg p-3 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} font-mono`}>
                            {func.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'} rounded`}>
                            {func.type}
                          </span>
                        </div>

                        {func.description && (
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            {func.description}
                          </p>
                        )}

                        {func.example && (
                          <div className="mt-2">
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Example:</div>
                            <code className={`text-xs ${theme === 'dark' ? 'bg-gray-800 text-green-300' : 'bg-gray-200 text-green-700'} px-2 py-1 rounded block`}>
                              {func.example}
                            </code>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleInsert(func)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors whitespace-nowrap"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} py-8`}>
                No functions found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-100'} rounded-b-lg`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {filteredFunctions.length} of {availableFunctions.length} functions
            </span>
            <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              User Level: <span className="text-blue-400 font-semibold">{userLevel}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionBrowser;