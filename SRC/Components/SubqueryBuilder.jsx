import React, { useState } from 'react';

const SubqueryBuilder = ({ subquery, onChange, onClose, allSchemas, userLevel, existingCTEs = [] }) => {
  const [query, setQuery] = useState({
    columns: new Set(),
    table: '',
    tableAlias: '',
    joins: [],
    where: [],
    groupBy: [],
    having: [],
    orderBy: [],
    limit: '',
    distinct: false,
    ...(subquery.query || {})
  });

  // Controlled inputs state
  const [columnInput, setColumnInput] = useState('');
  const [groupByText, setGroupByText] = useState(query.groupBy?.join(', ') || '');
  const [orderByText, setOrderByText] = useState(
    query.orderBy?.map(o => `${o.column} ${o.direction}`).join(', ') || ''
  );

  const updateQuery = (updates) => {
    const newQuery = { ...query, ...updates };
    setQuery(newQuery);
    onChange({ ...subquery, query: newQuery });
  };

  const addColumn = (column) => {
    const newColumns = new Set(query.columns);
    newColumns.add(column);
    updateQuery({ columns: newColumns });
  };

  const removeColumn = (column) => {
    const newColumns = new Set(query.columns);
    newColumns.delete(column);
    updateQuery({ columns: newColumns });
  };

  const addWhereCondition = () => {
    updateQuery({ 
      where: [...query.where, { column: '', operator: '=', values: '' }] 
    });
  };

  const updateWhereCondition = (index, updates) => {
    const newWhere = [...query.where];
    newWhere[index] = { ...newWhere[index], ...updates };
    updateQuery({ where: newWhere });
  };

  const removeWhereCondition = (index) => {
    updateQuery({ where: query.where.filter((_, i) => i !== index) });
  };

  const addHavingCondition = () => {
    updateQuery({ 
      having: [...(query.having || []), { column: '', operator: '=', values: '' }] 
    });
  };

  const updateHavingCondition = (index, updates) => {
    const newHaving = [...(query.having || [])];
    newHaving[index] = { ...newHaving[index], ...updates };
    updateQuery({ having: newHaving });
  };

  const removeHavingCondition = (index) => {
    updateQuery({ having: (query.having || []).filter((_, i) => i !== index) });
  };

  // Generate SQL preview
  const generateSQL = () => {
    let sql = '';

    // SELECT
    if (query.columns.size === 0) {
      sql += query.distinct ? 'SELECT DISTINCT *' : 'SELECT *';
    } else {
      sql += query.distinct ? 'SELECT DISTINCT ' : 'SELECT ';
      sql += Array.from(query.columns).join(', ');
    }

    // FROM
    if (query.table) {
      sql += `\nFROM ${query.table}`;
      if (query.tableAlias) sql += ` AS ${query.tableAlias}`;
    }

    // JOINs
    if (query.joins && query.joins.length > 0) {
      query.joins.forEach(join => {
        sql += `\n${join.type} ${join.table}`;
        if (join.alias) sql += ` AS ${join.alias}`;
        if (join.on) sql += ` ON ${join.on}`;
      });
    }

    // WHERE
    if (query.where && query.where.length > 0) {
      const validConditions = query.where.filter(w => w.column && w.values);
      if (validConditions.length > 0) {
        sql += '\nWHERE ' + validConditions.map(w => 
          `${w.column} ${w.operator} ${w.values}`
        ).join(' AND ');
      }
    }

    // GROUP BY
    if (query.groupBy && query.groupBy.length > 0) {
      sql += '\nGROUP BY ' + query.groupBy.join(', ');
    }

    // HAVING
    if (query.having && Array.isArray(query.having) && query.having.length > 0) {
      const validConditions = query.having.filter(h => h && h.column && h.values);
      if (validConditions.length > 0) {
        sql += '\nHAVING ' + validConditions.map(h => 
          `${h.column} ${h.operator} ${h.values}`
        ).join(' AND ');
      }
    }

    // ORDER BY
    if (query.orderBy && query.orderBy.length > 0) {
      sql += '\nORDER BY ' + query.orderBy.map(o => 
        `${o.column} ${o.direction}`
      ).join(', ');
    }

    // LIMIT
    if (query.limit) {
      sql += `\nLIMIT ${query.limit}`;
    }

    return sql;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Build Subquery
            </h3>
            <p className="text-sm text-gray-800 dark:text-gray-400 mt-1">
              Type: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {subquery.type}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* SELECT Columns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SELECT Columns {query.distinct && <span className="text-blue-600">(DISTINCT)</span>}
            </label>
            
            {/* Selected Columns */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from(query.columns).map(col => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {col}
                  <button
                    onClick={() => removeColumn(col)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {query.columns.size === 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No columns selected (will use *)
                </span>
              )}
            </div>

            {/* Add Column */}
            <div className="flex gap-2">
              <input
                type="text"
                value={columnInput}
                onChange={(e) => setColumnInput(e.target.value)}
                placeholder="Add column (e.g., customer_id, COUNT(*))"
                className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && columnInput.trim()) {
                    e.preventDefault();
                    addColumn(columnInput.trim());
                    setColumnInput('');
                  }
                }}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={query.distinct}
                  onChange={(e) => updateQuery({ distinct: e.target.checked })}
                  className="rounded"
                />
                DISTINCT
              </label>
            </div>
          </div>

          {/* FROM Table */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              FROM Table
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query.table || ''}
                onChange={(e) => updateQuery({ table: e.target.value })}
                placeholder="table_name"
                className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                value={query.tableAlias || ''}
                onChange={(e) => updateQuery({ tableAlias: e.target.value })}
                placeholder="alias (optional)"
                className="w-32 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            {existingCTEs.length > 0 && (
              <div className="mt-2 text-xs text-gray-800 dark:text-gray-400">
                Available CTEs: {existingCTEs.map(cte => cte.name).join(', ')}
              </div>
            )}
          </div>

          {/* WHERE Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                WHERE Conditions
              </label>
              <button
                onClick={addWhereCondition}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Condition
              </button>
            </div>

            {query.where.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded text-sm">
                No WHERE conditions
              </div>
            ) : (
              <div className="space-y-2">
                {query.where.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={condition.column}
                      onChange={(e) => updateWhereCondition(index, { column: e.target.value })}
                      placeholder="column"
                      className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <select
                      value={condition.operator}
                      onChange={(e) => updateWhereCondition(index, { operator: e.target.value })}
                      className="px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                      <option value="LIKE">LIKE</option>
                      <option value="IN">IN</option>
                    </select>
                    <input
                      type="text"
                      value={condition.values}
                      onChange={(e) => updateWhereCondition(index, { values: e.target.value })}
                      placeholder="value"
                      className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => removeWhereCondition(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUP BY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GROUP BY (comma-separated)
            </label>
            <input
              type="text"
              value={groupByText}
              onChange={(e) => setGroupByText(e.target.value)}
              onBlur={() => {
                updateQuery({ 
                  groupBy: groupByText.split(',').map(s => s.trim()).filter(Boolean)
                });
              }}
              placeholder="column1, column2"
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* HAVING */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                HAVING Conditions
              </label>
              <button
                onClick={addHavingCondition}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                + Add HAVING
              </button>
            </div>

            {(!query.having || query.having.length === 0) ? (
              <div className="text-center py-3 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded text-sm">
                No HAVING conditions (used with GROUP BY for aggregate filtering)
              </div>
            ) : (
              <div className="space-y-2">
                {(query.having || []).map((condition, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={condition.column}
                      onChange={(e) => updateHavingCondition(index, { column: e.target.value })}
                      placeholder="e.g., COUNT(*), SUM(total)"
                      className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <select
                      value={condition.operator}
                      onChange={(e) => updateHavingCondition(index, { operator: e.target.value })}
                      className="px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                    </select>
                    <input
                      type="text"
                      value={condition.values}
                      onChange={(e) => updateHavingCondition(index, { values: e.target.value })}
                      placeholder="value (e.g., 5)"
                      className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => removeHavingCondition(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ORDER BY & LIMIT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ORDER BY
              </label>
              <input
                type="text"
                value={orderByText}
                onChange={(e) => setOrderByText(e.target.value)}
                onBlur={() => {
                  if (!orderByText.trim()) {
                    updateQuery({ orderBy: [] }); // Clear when empty
                    return;
                  }
                  const orders = orderByText.split(',').map(s => {
                    const trimmed = s.trim();
                    if (!trimmed) return null;
                    const parts = trimmed.split(/\s+/);
                    return {
                      column: parts[0],
                      direction: parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
                    };
                  }).filter(Boolean);
                  updateQuery({ orderBy: orders });
                }}
                placeholder="column DESC"
                className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
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

          {/* SQL Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SQL Preview
            </label>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto border border-gray-400 dark:border-gray-600">
              {generateSQL()}
            </pre>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> This subquery will be used in your {subquery.type} clause. 
              {subquery.type === 'WHERE_IN' && ' It should return a single column.'}
              {subquery.type === 'WHERE_EXISTS' && ' The actual columns selected don\'t matter (often use SELECT 1).'}
              {subquery.type === 'SELECT' && ' It must return exactly one row and one column (scalar subquery).'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onChange({ ...subquery, query });
              onClose();
            }}
            disabled={!query.table}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Subquery
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubqueryBuilder);