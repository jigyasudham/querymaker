import React, { useState, useEffect, useMemo } from 'react';

/**
 * Smart Column Suggestions Component
 * Provides AI-powered column recommendations based on context
 */
const SmartColumnSuggestions = ({ 
  selectedColumns = new Set(),
  selectedTable = '',
  selectedSchema = '',
  joinedTables = [],
  schemaData = {},
  queryHistory = [],
  onAddColumn,
  onAddJoin
}) => {

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // FIX: Convert columns to Set - handle Array, Set, or Object formats
  const columnsSet = useMemo(() => {
    // If selectedColumns is already a Set
    if (selectedColumns instanceof Set) {
      return selectedColumns;
    }

    // If it's an Array of strings (current format from SchemaPanel)
    if (Array.isArray(selectedColumns)) {
      return new Set(selectedColumns.filter(Boolean));
    }

    // If it's an object like { t1: [{name, alias}], t2: [...] }
    if (typeof selectedColumns === 'object' && selectedColumns !== null) {
      const allColumns = new Set();
      Object.values(selectedColumns).forEach(columnSet => {
        if (columnSet instanceof Set) {
          columnSet.forEach(col => allColumns.add(col));
        } else if (Array.isArray(columnSet)) {
          columnSet.forEach(col => {
            const colName = typeof col === 'string' ? col : col.name;
            if (colName) allColumns.add(colName);
          });
        }
      });
      return allColumns;
    }

    // Fallback
    return new Set();
  }, [selectedColumns]);

  // Analyze query history to find patterns
  const columnPatterns = useMemo(() => {
    const patterns = new Map();

    if (!Array.isArray(queryHistory)) return patterns;

    queryHistory.forEach(query => {
      const sql = (query.sql || query.queryText || '').toLowerCase().replace(/\s+/g, ' ');

      // Extract column patterns from SELECT (handles multi-line)
      const selectMatch = sql.match(/select\s+(?:distinct\s+)?(.*?)\s+from\s/i);
      if (selectMatch && selectMatch[1]) {
        const columns = selectMatch[1]
          .split(',')
          .map(col => {
            // Remove alias, functions, and clean up
            let cleaned = col.trim()
              .split(/\s+as\s+/i)[0]  // Remove AS alias
              .replace(/^.*\(([^)]+)\).*$/, '$1')  // Extract from functions like COUNT(col)
              .trim();
            // Remove table alias prefix (t1., t2., etc.)
            if (cleaned.includes('.')) {
              cleaned = cleaned.split('.').pop();
            }
            return cleaned;
          })
          .filter(col => col && col !== '*' && !col.includes('('));

        // Build co-occurrence patterns
        for (let i = 0; i < columns.length; i++) {
          for (let j = i + 1; j < columns.length; j++) {
            const key = [columns[i], columns[j]].sort().join('::');
            patterns.set(key, (patterns.get(key) || 0) + 1);
          }
        }
      }
    });

    return patterns;
  }, [queryHistory]);

  // Generate suggestions based on current context
  useEffect(() => {
    const generateSuggestions = () => {
      const newSuggestions = [];
      
      // 1. Frequently used with current columns
      if (columnsSet.size > 0) {
        const relatedColumns = findRelatedColumns(columnsSet, columnPatterns);
        relatedColumns.forEach(col => {
          newSuggestions.push({
            type: 'related',
            column: col.name,
            table: col.table,
            reason: `Often used with ${col.relatedTo}`,
            confidence: col.confidence,
            icon: '⚙️'
          });
        });
      }
      
      // 2. Common columns for selected table
      if (selectedTable) {
        const commonColumns = findCommonColumns(selectedTable, queryHistory);
        commonColumns.forEach(col => {
          if (!Array.from(columnsSet).includes(`${selectedTable}.${col.name}`)) {
            newSuggestions.push({
              type: 'common',
              column: col.name,
              table: selectedTable,
              reason: `Popular in ${selectedTable} queries (${col.frequency}%)`,
              confidence: col.frequency / 100,
              icon: 'â­'
            });
          }
        });
      }
      
      // 3. JOIN suggestions based on foreign keys
      if (selectedTable) {
        const joinSuggestions = findJoinSuggestions(selectedTable, schemaData, joinedTables);
        joinSuggestions.forEach(join => {
          newSuggestions.push({
            type: 'join',
            column: join.column,
            table: join.targetTable,
            reason: `Join ${selectedTable} with ${join.targetTable}`,
            confidence: join.confidence,
            icon: '⚙️',
            joinDetails: join
          });
        });
      }
      
      // 4. Complementary columns (if selecting certain types)
      const complementary = findComplementaryColumns(columnsSet, schemaData);
      complementary.forEach(col => {
        newSuggestions.push({
          type: 'complementary',
          column: col.name,
          table: col.table,
          reason: col.reason,
          confidence: col.confidence,
          icon: '💡'
        });
      });
      
      // Sort by confidence
      newSuggestions.sort((a, b) => b.confidence - a.confidence);
      
      // Take top 10
      setSuggestions(newSuggestions.slice(0, 10));
    };
    
    generateSuggestions();
  }, [columnsSet, selectedTable, joinedTables, schemaData, queryHistory, columnPatterns]);

  // Find columns frequently used together
  const findRelatedColumns = (currentColumns, patterns) => {
    const related = new Map();
    
    Array.from(currentColumns).forEach(currentCol => {
      patterns.forEach((count, key) => {
        const [col1, col2] = key.split('::');
        if (col1 === currentCol && !currentColumns.has(col2)) {
          related.set(col2, {
            name: col2.split('.')[1] || col2,
            table: col2.split('.')[0] || selectedTable,
            relatedTo: currentCol.split('.')[1] || currentCol,
            confidence: Math.min(count / 10, 0.95),
            count
          });
        } else if (col2 === currentCol && !currentColumns.has(col1)) {
          related.set(col1, {
            name: col1.split('.')[1] || col1,
            table: col1.split('.')[0] || selectedTable,
            relatedTo: currentCol.split('.')[1] || currentCol,
            confidence: Math.min(count / 10, 0.95),
            count
          });
        }
      });
    });
    
    return Array.from(related.values()).sort((a, b) => b.count - a.count);
  };

  // Find most common columns in a table
  const findCommonColumns = (table, history) => {
    if (!Array.isArray(history) || !table) return [];

    const columnCounts = new Map();
    let totalQueries = 0;
    const tableLower = table.toLowerCase();

    history.forEach(query => {
      const sql = (query.sql || query.queryText || '').toLowerCase().replace(/\s+/g, ' ');
      if (!sql) return;

      // Check if this query uses the table (handle schema.table format)
      const fromMatch = sql.match(/from\s+([^\s,]+)/i);
      if (!fromMatch) return;

      const fromTable = fromMatch[1].split('.').pop(); // Get table name without schema
      if (fromTable !== tableLower && !sql.includes(tableLower)) return;

      totalQueries++;

      const selectMatch = sql.match(/select\s+(?:distinct\s+)?(.*?)\s+from\s/i);
      if (selectMatch && selectMatch[1]) {
        const columns = selectMatch[1]
          .split(',')
          .map(col => {
            let cleaned = col.trim()
              .split(/\s+as\s+/i)[0]
              .replace(/^.*\(([^)]+)\).*$/, '$1')
              .trim();
            // Remove table alias prefix
            if (cleaned.includes('.')) {
              cleaned = cleaned.split('.').pop();
            }
            return cleaned;
          })
          .filter(col => col && col !== '*' && !col.includes('('));

        columns.forEach(col => {
          columnCounts.set(col, (columnCounts.get(col) || 0) + 1);
        });
      }
    });

    if (totalQueries === 0) return [];

    return Array.from(columnCounts.entries())
      .map(([name, count]) => ({
        name,
        frequency: Math.round((count / Math.max(totalQueries, 1)) * 100)
      }))
      .filter(col => col.frequency >= 10)  // Lowered threshold from 20% to 10%
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);  // Limit to top 10 common columns
  };

  // Suggest JOINs based on schema relationships
  const findJoinSuggestions = (currentTable, schema, existingJoins) => {
    const suggestions = [];
    const existingTables = new Set([currentTable, ...(existingJoins || []).map(j => j.table)]);
    
    // Look for foreign key patterns
    Object.keys(schema).forEach(targetTable => {
      if (existingTables.has(targetTable)) return;
      
      const currentColumns = schema[currentTable] || [];
      const targetColumns = schema[targetTable] || [];
      
      // Check for ID/foreign key relationships
      currentColumns.forEach(col => {
        // Pattern: user_id in current table â†’ id in users table
        if (col.includes('_id')) {
          const referencedTable = col.replace('_id', '') + 's';
          if (referencedTable === targetTable && targetColumns.includes('id')) {
            suggestions.push({
              targetTable,
              column: col,
              joinOn: `${currentTable}.${col} = ${targetTable}.id`,
              confidence: 0.9,
              type: 'foreign_key'
            });
          }
        }
        
        // Pattern: same column name in both tables
        if (targetColumns.includes(col) && col.endsWith('_id')) {
          suggestions.push({
            targetTable,
            column: col,
            joinOn: `${currentTable}.${col} = ${targetTable}.${col}`,
            confidence: 0.7,
            type: 'common_column'
          });
        }
      });
    });
    
    return suggestions;
  };

  // Find complementary columns
  const findComplementaryColumns = (selectedCols, schema) => {
    const suggestions = [];
    const selectedArray = Array.from(selectedCols);
    
    // If selecting ID columns, suggest name/description columns
    selectedArray.forEach(col => {
      const colName = col.split('.')[1] || col;
      const tableName = col.split('.')[0] || selectedTable;
      const tableColumns = schema[tableName] || [];
      
      if (colName.includes('_id') || colName === 'id') {
        const nameVariants = ['name', 'title', 'description', 'label'];
        nameVariants.forEach(variant => {
          if (tableColumns.includes(variant) && !selectedCols.has(`${tableName}.${variant}`)) {
            suggestions.push({
              name: variant,
              table: tableName,
              reason: `Add ${variant} for readability`,
              confidence: 0.8
            });
          }
        });
      }
      
      // If selecting timestamp columns, suggest other time fields
      if (colName.includes('created') || colName.includes('updated')) {
        const timeFields = ['created_at', 'updated_at', 'deleted_at'];
        timeFields.forEach(field => {
          if (tableColumns.includes(field) && !selectedCols.has(`${tableName}.${field}`)) {
            suggestions.push({
              name: field,
              table: tableName,
              reason: 'Complete timestamp audit trail',
              confidence: 0.7
            });
          }
        });
      }
    });
    
    return suggestions;
  };

  // Handle adding suggested column
  const handleAddSuggestion = (suggestion) => {
    console.log('⚙️⚙️⚙️ CLICKED SUGGESTION:', JSON.stringify(suggestion, null, 2));
    
    if (suggestion.type === 'join') {
        console.log('⚙️ JOIN suggestion - calling onAddJoin');
        if (onAddJoin) {
            onAddJoin({
                type: 'INNER JOIN',
                table: suggestion.table,
                schema: selectedSchema,
                onLeft: suggestion.joinDetails?.onLeft || `${selectedTable}.id`,
                onRight: suggestion.joinDetails?.onRight || `${suggestion.table}.id`,
                joinOn: suggestion.joinDetails?.joinOn
            });
        }
    } else {
        console.log('⚙️ COLUMN suggestion - calling onAddColumn');
        onAddColumn(suggestion.column);
    }
};

  if (suggestions.length === 0) return null;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg"
      >
        <span>✨</span>
        <span>Smart Suggestions</span>
        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {suggestions.length}
        </span>
      </button>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="font-semibold">Smart Suggestions</h3>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              ×
            </button>
          </div>

          {/* Suggestions List */}
          <div className="p-2 space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAddSuggestion(suggestion)}
                className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <span className="text-2xl">{suggestion.icon}</span>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {suggestion.table}.{suggestion.column}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        suggestion.type === 'related' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        suggestion.type === 'common' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        suggestion.type === 'join' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                        'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      }`}>
                        {suggestion.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 dark:text-gray-400">
                      {suggestion.reason}
                    </p>
                    
                    {/* Confidence Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            suggestion.confidence >= 0.8 ? 'bg-green-500' :
                            suggestion.confidence >= 0.6 ? 'bg-yellow-500' :
                            'bg-orange-500'
                          }`}
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-600 dark:text-blue-400 text-xl">+</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="space-y-2">
              <p className="text-xs text-gray-800 dark:text-gray-400">
                💡 Suggestions based on query history and schema relationships
              </p>
              
              {/* How It Works */}
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                  How do suggestions work?
                </summary>
                <div className="mt-2 space-y-2 text-gray-800 dark:text-gray-400 pl-2">
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400">⚙️ Related:</strong> Columns frequently used together in past queries
                  </div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">⭐ Common:</strong> Popular columns for this table based on usage patterns
                  </div>
                  <div>
                    <strong className="text-purple-600 dark:text-purple-400">⚙️ JOIN:</strong> Detected foreign key relationships between tables
                  </div>
                  <div>
                    <strong className="text-orange-600 dark:text-orange-400">💡 Complementary:</strong> Useful additions (e.g., name fields for IDs)
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-400 dark:border-gray-600">
                    <strong>Confidence Score:</strong> Higher % = stronger pattern match from your query history
                  </div>
                  <div className="italic text-gray-500 dark:text-gray-500">
                    ✅ 100% offline - no AI services, just pattern matching
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SmartColumnSuggestions);