import React, { useState } from 'react';

const ValidationHelpModal = ({ theme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <h2 className="text-xl font-bold">Validation & Performance Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Performance Score Section */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              📊 Performance Score Guide
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-20 text-green-600 dark:text-green-400 font-bold">80-100</div>
                <div className="flex-1">
                  <span className="font-semibold">Excellent</span> - Query is well-optimized
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 text-yellow-600 dark:text-yellow-400 font-bold">60-79</div>
                <div className="flex-1">
                  <span className="font-semibold">Good</span> - Minor optimizations possible
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 text-orange-600 dark:text-orange-400 font-bold">40-59</div>
                <div className="flex-1">
                  <span className="font-semibold">Fair</span> - Consider optimizing
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 text-red-600 dark:text-red-400 font-bold">0-39</div>
                <div className="flex-1">
                  <span className="font-semibold">Needs Work</span> - Significant improvements needed
                </div>
              </div>
            </div>
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Validation Types */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              🚫 Error Types
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-red-600 dark:text-red-400">Syntax Errors</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Invalid SQL syntax - missing keywords, mismatched parentheses, incorrect operators
                </div>
              </div>
              <div>
                <div className="font-semibold text-red-600 dark:text-red-400">Security Issues</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Dangerous operations detected - DROP, DELETE, TRUNCATE without WHERE clause
                </div>
              </div>
              <div>
                <div className="font-semibold text-red-600 dark:text-red-400">Missing Required Fields</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Required clauses missing - SELECT without FROM, JOIN without ON condition
                </div>
              </div>
            </div>
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Warning Types */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
              ⚠️ Warning Types
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">Performance Warnings</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Query may be slow - SELECT *, missing indexes, cartesian products
                </div>
              </div>
              <div>
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">Best Practice Violations</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Not following SQL best practices - inconsistent naming, missing aliases
                </div>
              </div>
              <div>
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">Potential Issues</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  May cause problems - NULL handling, data type mismatches
                </div>
              </div>
            </div>
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Performance Hints */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              💡 Performance Hint Levels
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-red-600 dark:text-red-400">🔴 Critical</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Major performance issues - fix immediately (cartesian products, missing indexes on large tables)
                </div>
              </div>
              <div>
                <div className="font-semibold text-orange-600 dark:text-orange-400">🟠 High</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Significant impact - should fix soon (SELECT *, inefficient JOINs)
                </div>
              </div>
              <div>
                <div className="font-semibold text-yellow-600 dark:text-yellow-400">🟡 Medium</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Moderate impact - consider optimizing (missing LIMIT, complex subqueries)
                </div>
              </div>
              <div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">🔵 Low</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                  Minor improvements - nice to have (alias usage, formatting)
                </div>
              </div>
            </div>
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Common Fixes */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              🔧 Common Fixes
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span>•</span>
                <span><strong>SELECT *</strong> → Select only needed columns</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span><strong>Missing WHERE</strong> → Add conditions to filter data</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span><strong>No LIMIT</strong> → Add LIMIT for large result sets</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span><strong>Complex Subqueries</strong> → Consider using CTEs (WITH clause)</span>
              </div>
              <div className="flex gap-2">
                <span>•</span>
                <span><strong>Multiple JOINs</strong> → Ensure proper indexes on join columns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t px-6 py-4 rounded-b-lg`}>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationHelpModal;