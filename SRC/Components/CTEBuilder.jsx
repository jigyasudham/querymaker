import React, { useState, useEffect } from 'react';
import CTEHelpModal from './CTEHelpModal';

const CTEBuilder = ({ ctes, onCTEsChange, allSchemas, userLevel }) => {
  const [expandedCTE, setExpandedCTE] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const createNewCTE = () => ({
    id: `cte-${Date.now()}`,
    name: '',
    query: {
      columns: {},  // Changed from Set to object: { tableAlias: [{name, alias}] }
      schema: '',
      table: '',
      tableAlias: 't1',
      joins: [],
      wheres: [],  // Renamed to match SchemaPanel convention
      groupBys: [],
      havings: [],
      orderBys: [],
      limit: '',
      distinct: false
    }
  });

  const addCTE = () => {
    const newCTE = createNewCTE();
    onCTEsChange([...ctes, newCTE]);
    setExpandedCTE(newCTE.id);
    setShowAddModal(false);
  };

  const updateCTE = (cteId, updates) => {
    onCTEsChange(ctes.map(cte => 
      cte.id === cteId ? { ...cte, ...updates } : cte
    ));
  };

  const deleteCTE = (cteId) => {
    onCTEsChange(ctes.filter(cte => cte.id !== cteId));
    if (expandedCTE === cteId) setExpandedCTE(null);
  };

  const moveCTE = (cteId, direction) => {
    const index = ctes.findIndex(cte => cte.id === cteId);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === ctes.length - 1)
    ) return;

    const newCTEs = [...ctes];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newCTEs[index], newCTEs[newIndex]] = [newCTEs[newIndex], newCTEs[index]];
    onCTEsChange(newCTEs);
  };

  const validateCTEName = (name, cteId) => {
    if (!name) return 'CTE name is required';
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return 'Invalid name. Use letters, numbers, and underscores only';
    }
    if (ctes.some(cte => cte.id !== cteId && cte.name === name)) {
      return 'CTE name must be unique';
    }
    return null;
  };

  const generateCTESQL = (cte) => {
    const query = cte.query;
    let sql = '';

    // Handle columns as object of arrays: { tableAlias: [{name, alias}] }
    const allColumns = [];
    if (query.columns && typeof query.columns === 'object') {
      for (const alias in query.columns) {
        const cols = query.columns[alias] || [];
        cols.forEach(col => {
          const colName = typeof col === 'string' ? col : col.name;
          const colAlias = typeof col === 'string' ? '' : col.alias;
          const fullName = `${alias}.${colName}`;
          allColumns.push(colAlias ? `${fullName} AS "${colAlias}"` : fullName);
        });
      }
    }

    sql += query.distinct ? 'SELECT DISTINCT ' : 'SELECT ';
    sql += allColumns.length > 0 ? allColumns.join(', ') : '*';

    if (query.table) {
      const schemaPrefix = query.schema ? `${query.schema}.` : '';
      sql += `\nFROM ${schemaPrefix}${query.table}`;
      if (query.tableAlias) sql += ` AS ${query.tableAlias}`;
    }

    if (query.joins && query.joins.length > 0) {
      query.joins.forEach(join => {
        sql += `\n${join.type} ${join.table}`;
        if (join.alias) sql += ` AS ${join.alias}`;
        if (join.on) sql += ` ON ${join.on}`;
      });
    }

    // Support both 'where' and 'wheres' property names
    const wheres = query.wheres || query.where || [];
    if (wheres.length > 0) {
      sql += '\nWHERE ' + wheres.map(w => {
        if (w.values && w.values.includes('\n')) {
          const vals = w.values.split('\n').filter(v => v.trim());
          return `${w.column} IN (${vals.map(v => `'${v.trim()}'`).join(', ')})`;
        }
        return `${w.column} ${w.operator} ${w.values || w.value}`;
      }).join(' AND ');
    }

    // Support both 'groupBy' and 'groupBys'
    const groupBys = query.groupBys || query.groupBy || [];
    if (groupBys.length > 0) {
      const cols = groupBys.map(g => typeof g === 'string' ? g : g.column).filter(Boolean);
      if (cols.length > 0) sql += '\nGROUP BY ' + cols.join(', ');
    }

    // Support both 'having' and 'havings'
    const havings = query.havings || query.having || [];
    if (havings.length > 0) {
      sql += '\nHAVING ' + havings.map(h =>
        `${h.column} ${h.operator} ${h.values || h.value}`
      ).join(' AND ');
    }

    // Support both 'orderBy' and 'orderBys'
    const orderBys = query.orderBys || query.orderBy || [];
    if (orderBys.length > 0) {
      sql += '\nORDER BY ' + orderBys.map(o =>
        `${o.column} ${o.direction}`
      ).join(', ');
    }

    if (query.limit) {
      sql += `\nLIMIT ${query.limit}`;
    }

    return sql;
  };

  const getAvailableTables = (currentCTEId) => {
    const currentIndex = ctes.findIndex(cte => cte.id === currentCTEId);
    const previousCTEs = ctes.slice(0, currentIndex).filter(cte => cte.name);
    
    return {
      actualTables: allSchemas || {},
      ctes: previousCTEs.map(cte => ({ name: cte.name, type: 'CTE' }))
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Common Table Expressions (CTEs)
            </h3>
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              📚 Learn About CTEs
            </button>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-400 mt-1">
            Define reusable subqueries with WITH clauses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={ctes.length >= 10}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add CTE
        </button>
      </div>

      {ctes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg">
          No CTEs defined. Click "Add CTE" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {ctes.map((cte, index) => {
            const nameError = validateCTEName(cte.name, cte.id);
            const isExpanded = expandedCTE === cte.id;

            return (
              <div
                key={cte.id}
                className="border border-gray-400 dark:border-gray-600 rounded-lg overflow-hidden"
              >
                <div className="bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={cte.name}
                      onChange={(e) => updateCTE(cte.id, { name: e.target.value })}
                      placeholder="cte_name"
                      className="px-2 py-1 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm flex-1 max-w-xs"
                    />
                    {nameError && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {nameError}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveCTE(cte.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCTE(cte.id, 'down')}
                      disabled={index === ctes.length - 1}
                      className="p-1 text-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setExpandedCTE(isExpanded ? null : cte.id)}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      onClick={() => deleteCTE(cte.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-100 dark:bg-gray-900 border-t border-gray-400 dark:border-gray-600">
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {cte.name ? `${cte.name} AS (\n  ${generateCTESQL(cte).split('\n').join('\n  ')}\n)` : 'Unnamed CTE'}
                  </pre>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-400 dark:border-gray-600">
                    <CTEQueryBuilder
                      key={cte.id}
                      cte={cte}
                      onUpdate={(updates) => updateCTE(cte.id, updates)}
                      availableTables={getAvailableTables(cte.id)}
                      userLevel={userLevel}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New CTE
            </h3>
            <p className="text-sm text-gray-800 dark:text-gray-400 mb-6">
              CTEs allow you to define temporary result sets that you can reference in your main query.
              They make complex queries more readable and maintainable.
            </p>
            <div className="flex gap-3">
              <button
                onClick={addCTE}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create CTE
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {ctes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> CTEs defined here can be used as tables in your main query and in subsequent CTEs.
            Reference them by name: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">FROM {ctes[0]?.name || 'cte_name'}</code>
          </p>
        </div>
      )}

      <CTEHelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </div>
  );
};

// 🔥 THE REAL FIX: Separate display state from parsed query state
const CTEQueryBuilder = ({ cte, onUpdate, availableTables, userLevel }) => {
  const query = cte.query;
  
  // Initialize display state from query ONCE on mount
  const [columnInput, setColumnInput] = useState('');
  const [whereText, setWhereText] = useState('');
  const [groupByText, setGroupByText] = useState('');
  const [orderByText, setOrderByText] = useState('');
  
  // Sync display state when CTE changes (switching between CTEs)
  useEffect(() => {
    // Support both old and new property names
    const wheres = query.wheres || query.where || [];
    const groupBys = query.groupBys || query.groupBy || [];
    const orderBys = query.orderBys || query.orderBy || [];

    setWhereText(wheres.map(w => `${w.column} ${w.operator} ${w.values || w.value}`).join('\n') || '');
    setGroupByText(groupBys.map(g => typeof g === 'string' ? g : g.column).filter(Boolean).join(', ') || '');
    setOrderByText(orderBys.map(o => `${o.column} ${o.direction}`).join(', ') || '');
  }, [cte.id, query.wheres, query.where, query.groupBys, query.groupBy, query.orderBys, query.orderBy]);

  const updateQuery = (updates) => {
    onUpdate({ query: { ...query, ...updates } });
  };

  const addColumn = (columnInput) => {
    const tableAlias = query.tableAlias || 't1';
    const newColumns = { ...query.columns };
    const tableColumns = newColumns[tableAlias] || [];

    // Check if column already exists
    if (!tableColumns.some(col => col.name === columnInput)) {
      newColumns[tableAlias] = [...tableColumns, { name: columnInput, alias: '' }];
      updateQuery({ columns: newColumns });
    }
  };

  const removeColumn = (tableAlias, columnName) => {
    const newColumns = { ...query.columns };
    const tableColumns = newColumns[tableAlias] || [];
    newColumns[tableAlias] = tableColumns.filter(col => col.name !== columnName);
    updateQuery({ columns: newColumns });
  };

  const updateColumnAlias = (tableAlias, columnName, newAlias) => {
    const newColumns = { ...query.columns };
    const tableColumns = newColumns[tableAlias] || [];
    newColumns[tableAlias] = tableColumns.map(col =>
      col.name === columnName ? { ...col, alias: newAlias } : col
    );
    updateQuery({ columns: newColumns });
  };

  // Get all columns as flat array for display
  const getAllColumns = () => {
    const result = [];
    for (const alias in query.columns) {
      const cols = query.columns[alias] || [];
      cols.forEach(col => {
        result.push({ tableAlias: alias, ...col });
      });
    }
    return result;
  };

  const allColumns = getAllColumns();

  return (
    <div className="space-y-4">
      {/* SELECT */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SELECT Columns
        </label>
        {allColumns.length > 0 && (
          <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-900 rounded space-y-2">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-1">
              Selected Columns ({allColumns.length})
            </div>
            {allColumns.map((col, index) => (
              <div key={`${col.tableAlias}-${col.name}-${index}`} className="flex items-center gap-2">
                <button
                  onClick={() => removeColumn(col.tableAlias, col.name)}
                  className="text-red-400 hover:text-red-300 text-xs"
                  title="Remove column"
                >
                  ✕
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                  {col.tableAlias}.{col.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">AS</span>
                <input
                  type="text"
                  placeholder="alias (optional)"
                  value={col.alias || ''}
                  onChange={(e) => updateColumnAlias(col.tableAlias, col.name, e.target.value)}
                  className="flex-1 p-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded border border-gray-400 dark:border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
        <input
          type="text"
          value={columnInput}
          onChange={(e) => setColumnInput(e.target.value)}
          placeholder="Type column name and press Enter (e.g., customer_id)"
          className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && columnInput.trim()) {
              e.preventDefault();
              addColumn(columnInput.trim());
              setColumnInput('');
            }
          }}
        />
      </div>

      {/* FROM */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          FROM Table
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query.schema || ''}
            onChange={(e) => updateQuery({ schema: e.target.value })}
            placeholder="schema"
            className="w-32 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={query.table || ''}
            onChange={(e) => updateQuery({ table: e.target.value })}
            placeholder="table_name or previous_cte"
            className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={query.tableAlias || ''}
            onChange={(e) => updateQuery({ tableAlias: e.target.value })}
            placeholder="alias"
            className="w-24 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        {availableTables.ctes.length > 0 && (
          <div className="mt-2 text-xs text-gray-800 dark:text-gray-400">
            Available CTEs: {availableTables.ctes.map(c => c.name).join(', ')}
          </div>
        )}
      </div>

      {/* WHERE - 🔥 FIXED: Uses whereText state, not derived value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          WHERE Conditions (one per line)
        </label>
        <textarea
          value={whereText}
          onChange={(e) => {
            setWhereText(e.target.value);
          }}
          onBlur={() => {
            const lines = whereText.split('\n').filter(l => l.trim());
            const conditions = lines.map(line => {
              const parts = line.match(/^(.+?)\s+(=|!=|>|<|>=|<=|LIKE|IN)\s+(.+)$/);
              return parts ? {
                column: parts[1].trim(),
                operator: parts[2],
                values: parts[3].trim()
              } : null;
            }).filter(Boolean);
            updateQuery({ wheres: conditions });
          }}
          placeholder="customer_id = 123&#10;total > 1000"
          rows={3}
          className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Format: column operator value (e.g., "id = 123")
        </p>
      </div>

      {/* GROUP BY - 🔥 FIXED: Uses groupByText state */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GROUP BY (comma-separated)
        </label>
        <input
          type="text"
          value={groupByText}
          onChange={(e) => {
            setGroupByText(e.target.value);
          }}
          onBlur={() => {
            updateQuery({
              groupBys: groupByText.split(',').map(s => s.trim()).filter(Boolean).map(col => ({ column: col, tableAlias: query.tableAlias || 't1' }))
            });
          }}
          placeholder="customer_id, order_date"
          className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* ORDER BY & LIMIT */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ORDER BY
          </label>
          {/* 🔥 FIXED: Uses orderByText state, not derived value */}
          <input
            type="text"
            value={orderByText}
            onChange={(e) => {
              setOrderByText(e.target.value);
            }}
            onBlur={() => {
              if (!orderByText.trim()) {
                updateQuery({ orderBys: [] });
                return;
              }

              const orders = orderByText.split(',').map(s => {
                const parts = s.trim().split(/\s+/);
                if (!parts[0]) return null;
                return {
                  column: parts[0],
                  direction: parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
                };
              }).filter(Boolean);
              updateQuery({ orderBys: orders });
            }}
            placeholder="total DESC, name ASC"
            className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Format: column ASC/DESC
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LIMIT
          </label>
          <input
            type="number"
            value={query.limit || ''}
            onChange={(e) => updateQuery({ limit: e.target.value })}
            placeholder="100"
            className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(CTEBuilder);