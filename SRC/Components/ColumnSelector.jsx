// ============================================
// FILE: ColumnSelector.jsx
// COMPLETE UPDATED VERSION with Alias Support
// ============================================

import React from 'react';

export default function ColumnSelector({
    tableAlias,
    tableName,
    schemaName,
    visibleData,
    query,
    columnSearch,
    setColumnSearch,
    handleColumnToggle,
    toggleSelectAllColumns,
    handleColumnAliasChange,  // NEW PROP
    theme = 'dark'  // Theme prop
}) {
    // Ensure columns is always an array
    const rawColumns = visibleData?.[schemaName]?.[tableName];
    const columns = Array.isArray(rawColumns) ? rawColumns : [];
    const searchTerm = columnSearch[tableAlias] || '';
    
    // Convert to array format if needed
    const selectedColumnsArray = query.columns[tableAlias] || [];
    
    // Create a Set of selected column names for quick lookup
    const selectedColumnNames = new Set(
        selectedColumnsArray.map(col => 
            typeof col === 'string' ? col : col.name
        )
    );
    
    const filteredColumns = searchTerm
        ? columns.filter(col => col.toLowerCase().includes(searchTerm.toLowerCase()))
        : columns;

    const allSelected = filteredColumns.length > 0 && 
        filteredColumns.every(col => selectedColumnNames.has(col));

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    "{tableName}" ({tableAlias})
                </h4>
                <button
                    onClick={() => toggleSelectAllColumns(tableAlias, columns)}
                    className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                    {allSelected ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            <input
                type="text"
                placeholder="Search columns..."
                value={searchTerm}
                onChange={e => setColumnSearch({ ...columnSearch, [tableAlias]: e.target.value })}
                className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-500'} text-sm rounded-lg mb-2`}
            />

            {/* Selected Columns with Alias Inputs */}
            {selectedColumnsArray.length > 0 && (
                <div className={`mb-3 p-2 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} rounded space-y-2`}>
                    <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mb-1`}>
                        Selected Columns ({selectedColumnsArray.length})
                    </div>
                    {selectedColumnsArray.map((col, index) => {
                        const columnName = typeof col === 'string' ? col : col.name;
                        const columnAlias = typeof col === 'string' ? '' : col.alias;
                        
                        return (
                            <div key={index} className="flex items-center gap-2">
                                {/* Column name with remove button */}
                                <div className="flex items-center gap-2 flex-1">
                                    <button
                                        onClick={() => handleColumnToggle(tableAlias, columnName)}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                        title="Remove column"
                                    >
                                        ✕
                                    </button>
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                                        {columnName}
                                    </span>
                                </div>

                                {/* Alias input */}
                                <div className="flex items-center gap-1 flex-1">
                                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-800'}`}>AS</span>
                                    <input
                                        type="text"
                                        placeholder="alias (optional)"
                                        value={columnAlias}
                                        onChange={(e) => handleColumnAliasChange(
                                            tableAlias,
                                            columnName,
                                            e.target.value
                                        )}
                                        className={`flex-1 p-1 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-400'} text-xs rounded border focus:border-blue-500 focus:outline-none`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Available Columns Checkboxes */}
            <div className="max-h-40 overflow-y-auto scroll-container space-y-1">
                {columns.length === 0 ? (
                    <p className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'} italic p-2 bg-yellow-900/20 rounded`}>
                        ⚠️ No column data available for "{schemaName}.{tableName}". This schema/table may not be in your master schema file.
                    </p>
                ) : filteredColumns.length > 0 ? (
                    filteredColumns.map(column => (
                        <label
                            key={column}
                            className={`flex items-center space-x-2 cursor-pointer text-sm ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} p-1 rounded`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedColumnNames.has(column)}
                                onChange={() => handleColumnToggle(tableAlias, column)}
                                className={`h-4 w-4 ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-400'} rounded text-blue-500 focus:ring-blue-500`}
                            />
                            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{column}</span>
                        </label>
                    ))
                ) : (
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} italic`}>No columns match your search</p>
                )}
            </div>
        </div>
    );
}