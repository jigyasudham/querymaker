import React, { useState } from 'react';

/**
 * Query Template Manager
 * Save and load query patterns with variables
 */
const QueryTemplates = ({ onLoadTemplate, userTemplates = [], onSaveTemplate, onDeleteTemplate }) => {
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVariables, setTemplateVariables] = useState({});
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // Built-in templates
  const builtInTemplates = [
    {
      id: 'select-all',
      name: 'Select All from Table',
      description: 'Basic SELECT * query',
      sql: 'SELECT *\nFROM {table}\nLIMIT {limit};',
      variables: ['table', 'limit'],
      defaults: { limit: '100' },
      category: 'Basic'
    },
    {
      id: 'select-where',
      name: 'Select with WHERE',
      description: 'Filter records by condition',
      sql: 'SELECT {columns}\nFROM {table}\nWHERE {column} = {value}\nLIMIT {limit};',
      variables: ['columns', 'table', 'column', 'value', 'limit'],
      defaults: { columns: '*', limit: '100' },
      category: 'Basic'
    },
    {
      id: 'join-two-tables',
      name: 'Join Two Tables',
      description: 'Inner join between two tables',
      sql: 'SELECT {columns}\nFROM {table1} t1\nJOIN {table2} t2 ON t1.{join_column1} = t2.{join_column2}\nWHERE {condition}\nLIMIT {limit};',
      variables: ['columns', 'table1', 'table2', 'join_column1', 'join_column2', 'condition', 'limit'],
      defaults: { columns: '*', condition: '1=1', limit: '100' },
      category: 'Joins'
    },
    {
      id: 'aggregate-group',
      name: 'Aggregate with GROUP BY',
      description: 'Count/Sum with grouping',
      sql: 'SELECT\n  {group_column},\n  COUNT(*) as count,\n  SUM({sum_column}) as total\nFROM {table}\nGROUP BY {group_column}\nORDER BY count DESC\nLIMIT {limit};',
      variables: ['group_column', 'sum_column', 'table', 'limit'],
      defaults: { limit: '50' },
      category: 'Aggregates'
    },
    {
      id: 'date-range',
      name: 'Date Range Query',
      description: 'Filter by date range',
      sql: 'SELECT {columns}\nFROM {table}\nWHERE {date_column} >= \'{start_date}\'\n  AND {date_column} <= \'{end_date}\'\nORDER BY {date_column} DESC\nLIMIT {limit};',
      variables: ['columns', 'table', 'date_column', 'start_date', 'end_date', 'limit'],
      defaults: { columns: '*', start_date: '2024-01-01', end_date: '2024-12-31', limit: '100' },
      category: 'Filters'
    },
    {
      id: 'top-n',
      name: 'Top N Records',
      description: 'Get top records by column',
      sql: 'SELECT {columns}\nFROM {table}\nORDER BY {order_column} {direction}\nLIMIT {limit};',
      variables: ['columns', 'table', 'order_column', 'direction', 'limit'],
      defaults: { columns: '*', direction: 'DESC', limit: '10' },
      category: 'Analysis'
    },
    {
      id: 'cte-template',
      name: 'CTE Query',
      description: 'Query with Common Table Expression',
      sql: 'WITH {cte_name} AS (\n  SELECT {cte_columns}\n  FROM {cte_table}\n  WHERE {cte_condition}\n)\nSELECT {columns}\nFROM {cte_name}\nWHERE {condition}\nLIMIT {limit};',
      variables: ['cte_name', 'cte_columns', 'cte_table', 'cte_condition', 'columns', 'condition', 'limit'],
      defaults: { cte_columns: '*', cte_condition: '1=1', columns: '*', condition: '1=1', limit: '100' },
      category: 'Advanced'
    },
    {
      id: 'exists-subquery',
      name: 'EXISTS Subquery',
      description: 'Filter with EXISTS clause',
      sql: 'SELECT {columns}\nFROM {table1} t1\nWHERE EXISTS (\n  SELECT 1\n  FROM {table2} t2\n  WHERE t2.{foreign_key} = t1.{primary_key}\n    AND t2.{condition_column} = {condition_value}\n)\nLIMIT {limit};',
      variables: ['columns', 'table1', 'table2', 'foreign_key', 'primary_key', 'condition_column', 'condition_value', 'limit'],
      defaults: { columns: '*', limit: '100' },
      category: 'Advanced'
    }
  ];

  const allTemplates = [...builtInTemplates, ...userTemplates];

  // Group templates by category
  const templatesByCategory = allTemplates.reduce((acc, template) => {
    const category = template.category || 'User Templates';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // Initialize variables with defaults
    const vars = {};
    template.variables.forEach(v => {
      vars[v] = template.defaults?.[v] || '';
    });
    setTemplateVariables(vars);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    // Replace variables in SQL
    let sql = selectedTemplate.sql;
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      sql = sql.replace(regex, value);
    });

    onLoadTemplate(sql);
    setShowModal(false);
    setSelectedTemplate(null);
  };

  const handleSaveAsTemplate = (currentQuery) => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Extract variables from query (simple detection of {variable} patterns)
    const variables = [...new Set((currentQuery.match(/\{([^}]+)\}/g) || []).map(v => v.slice(1, -1)))];

    const newTemplate = {
      id: `user-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDesc,
      sql: currentQuery,
      variables: variables,
      defaults: {},
      category: 'User Templates',
      created: new Date().toISOString()
    };

    onSaveTemplate(newTemplate);
    setShowSaveModal(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  return (
    <>
      {/* Template Browser Button */}
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
      >
        <span>📋</span>
        <span>Load Template</span>
      </button>

      {/* Template Browser Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📋 Query Templates
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTemplate(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Template List */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-6">
                {Object.entries(templatesByCategory).map(([category, templates]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-400 uppercase mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`w-full text-left p-3 rounded transition-colors ${
                            selectedTemplate?.id === template.id
                              ? 'bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-600'
                              : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-800 dark:text-gray-400 mt-1">
                            {template.description}
                          </div>
                          {template.variables.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {template.variables.map(v => (
                                <span
                                  key={v}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Template Preview & Variables */}
              <div className="w-1/2 overflow-y-auto p-6">
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-400">
                        {selectedTemplate.description}
                      </p>
                    </div>

                    {/* Variables */}
                    {selectedTemplate.variables.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Fill in Variables:
                        </h4>
                        <div className="space-y-3">
                          {selectedTemplate.variables.map(variable => (
                            <div key={variable}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {variable}
                              </label>
                              <input
                                type="text"
                                value={templateVariables[variable] || ''}
                                onChange={(e) => setTemplateVariables({
                                  ...templateVariables,
                                  [variable]: e.target.value
                                })}
                                placeholder={`Enter ${variable}`}
                                className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Preview:
                      </h4>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {(() => {
                          let preview = selectedTemplate.sql;
                          Object.entries(templateVariables).forEach(([key, value]) => {
                            const regex = new RegExp(`\\{${key}\\}`, 'g');
                            preview = preview.replace(regex, value || `{${key}}`);
                          });
                          return preview;
                        })()}
                      </pre>
                    </div>

                    {/* User Template Actions */}
                    {selectedTemplate.category === 'User Templates' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this template?')) {
                            onDeleteTemplate(selectedTemplate.id);
                            setSelectedTemplate(null);
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        🗑️ Delete Template
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-lg">Select a template to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Save as Template
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Custom Query"
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Describe what this template does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{variable_name}'}</code> in your query to create fillable placeholders
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveAsTemplate('/* Current query will be here */')}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QueryTemplates;