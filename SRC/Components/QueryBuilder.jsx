// QueryBuilder.jsx - Extracted from SchemaPanel.jsx
import React, { useState } from 'react';
import { PlusCircleIcon, TrashIcon } from './UI/Icons.jsx';
import { InfoTooltip, SearchableDropdown } from './UI/UIHelpers.jsx';
import { ALL_CLAUSES, ALL_FUNCTIONS } from '../Services/ClauseDefinitions.js';
import ColumnSelector from './ColumnSelector.jsx';
import FunctionBrowser from './FunctionBrowser';
import { SelectDropZone, WhereDropZone, GroupByDropZone, OrderByDropZone } from './DraggableColumn';

// Helper function to generate CASE SQL
export function generateCaseSQL(conditions, elseValue) {
    let sql = 'CASE\n';
    
    conditions.forEach(cond => {
        if (cond.when && cond.then) {
            const thenValue = isNaN(cond.then) || cond.then === '' ? `'${cond.then.replace(/'/g, "''")}'` : cond.then;
            sql += `  WHEN ${cond.when} THEN ${thenValue}\n`;
        }
    });
    
    if (elseValue) {
        const elseFormatted = isNaN(elseValue) || elseValue === '' ? `'${elseValue.replace(/'/g, "''")}'` : elseValue;
        sql += `  ELSE ${elseFormatted}\n`;
    }
    
    sql += 'END';
    return sql;
}

export function CaseStatementBuilder({ caseData, onChange, theme }) {
    const [conditions, setConditions] = useState(caseData.conditions || [
        { when: '', then: '' }
    ]);
    const [elseValue, setElseValue] = useState(caseData.else || '');

    const addCondition = () => {
        const newConditions = [...conditions, { when: '', then: '' }];
        setConditions(newConditions);
        updateParent(newConditions, elseValue);
    };

    const removeCondition = (index) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        setConditions(newConditions);
        updateParent(newConditions, elseValue);
    };

    const updateCondition = (index, field, value) => {
        const newConditions = [...conditions];
        newConditions[index][field] = value;
        setConditions(newConditions);
        updateParent(newConditions, elseValue);
    };

    const updateElse = (value) => {
        setElseValue(value);
        updateParent(conditions, value);
    };

    const updateParent = (conds, elseVal) => {
        onChange({
            conditions: conds,
            else: elseVal
        });
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100 border border-gray-400'} p-3 rounded-lg space-y-2`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
                CASE Statement Builder
            </div>
            
            {conditions.map((cond, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} w-12`}>
                        {index === 0 ? 'WHEN' : 'WHEN'}
                    </span>
                    <input
                        type="text"
                        value={cond.when}
                        onChange={e => updateCondition(index, 'when', e.target.value)}
                        placeholder="condition (e.g., amount > 100)"
                        className={`flex-1 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                    />
                    <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                        THEN
                    </span>
                    <input
                        type="text"
                        value={cond.then}
                        onChange={e => updateCondition(index, 'then', e.target.value)}
                        placeholder="result (e.g., 'High')"
                        className={`flex-1 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                    />
                    {conditions.length > 1 && (
                        <button
                            onClick={() => removeCondition(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                            title="Remove condition"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
            
            <button
                onClick={addCondition}
                className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
            >
                + Add WHEN condition
            </button>
            
            <div className="flex items-center space-x-2 mt-2">
                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} w-12`}>
                    ELSE
                </span>
                <input
                    type="text"
                    value={elseValue}
                    onChange={e => updateElse(e.target.value)}
                    placeholder="default value (optional)"
                    className={`flex-1 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                />
            </div>
            
            <div className={`text-xs mt-2 p-2 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Preview:</strong>
                <pre className={`mt-1 whitespace-pre-wrap font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                    {generateCaseSQL(conditions, elseValue)}
                </pre>
            </div>
        </div>
    );
}

// Helper function to generate concatenation SQL
export function generateConcatSQL(parts) {
    if (!parts || parts.length === 0) return '';
    
    const formattedParts = parts.map(part => {
        if (part.type === 'text') {
            // Escape single quotes and wrap in quotes
            return `'${part.value.replace(/'/g, "''")}'`;
        } else if (part.type === 'column') {
            // Column reference - keep as is
            return part.value;
        } else if (part.type === 'function') {
            // Function call - keep as is
            return part.value;
        }
        return part.value;
    }).filter(Boolean);
    
    return formattedParts.join(' || ');
}

// String Concatenation Builder Component
export function StringConcatBuilder({ concatData, onChange, theme, availableColumns }) {
    const [parts, setParts] = useState(concatData.parts || [
        { id: Date.now(), type: 'column', value: '' }
    ]);
    const [alias, setAlias] = useState(concatData.alias || '');

    const addPart = (type) => {
        const newPart = {
            id: Date.now() + Math.random(),
            type: type,
            value: ''
        };
        const newParts = [...parts, newPart];
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const removePart = (id) => {
        const newParts = parts.filter(p => p.id !== id);
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const updatePart = (id, field, value) => {
        const newParts = parts.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        );
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const updateAlias = (newAlias) => {
        setAlias(newAlias);
        updateParent(parts, newAlias);
    };

    const updateParent = (newParts, newAlias) => {
        onChange({
            parts: newParts,
            alias: newAlias
        });
    };

    const getPartIcon = (type) => {
        switch(type) {
            case 'column': return '📊';
            case 'text': return '📝';
            case 'function': return '⚙️';
            default: return '•';
        }
    };

    const getPartPlaceholder = (type) => {
        switch(type) {
            case 'column': return 't1.column_name';
            case 'text': return 'Enter text...';
            case 'function': return 'CAST(column AS VARCHAR)';
            default: return '';
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100 border border-gray-400'} p-3 rounded-lg space-y-3`}>
            <div className="flex justify-between items-center">
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                    🔗 String Concatenation Builder
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => addPart('column')}
                        className={`text-xs ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-2 py-1 rounded`}
                        title="Add Column"
                    >
                        📊 Column
                    </button>
                    <button
                        onClick={() => addPart('text')}
                        className={`text-xs ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white px-2 py-1 rounded`}
                        title="Add Text"
                    >
                        📝 Text
                    </button>
                    <button
                        onClick={() => addPart('function')}
                        className={`text-xs ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-2 py-1 rounded`}
                        title="Add Function"
                    >
                        ⚙️ Function
                    </button>
                </div>
            </div>
            
            {parts.map((part, index) => (
                <div key={part.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-lg">{getPartIcon(part.type)}</span>
                            <select
                                value={part.type}
                                onChange={(e) => updatePart(part.id, 'type', e.target.value)}
                                className={`p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-xs rounded-lg`}
                            >
                                <option value="column">Column</option>
                                <option value="text">Text</option>
                                <option value="function">Function</option>
                            </select>
                        </div>
                        
                        <input
                            type="text"
                            value={part.value}
                            onChange={(e) => updatePart(part.id, 'value', e.target.value)}
                            placeholder={getPartPlaceholder(part.type)}
                            className={`flex-1 p-2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg font-mono`}
                        />
                        
                        {parts.length > 1 && (
                            <button
                                onClick={() => removePart(part.id)}
                                className="text-red-400 hover:text-red-300 text-sm flex-shrink-0"
                                title="Remove part"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {index < parts.length - 1 && (
                        <div className="flex items-center justify-center">
                            <div className={`text-xs font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} bg-gray-800 px-3 py-1 rounded`}>
                                ||
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {/* Alias Input Field */}
            <div className={`flex items-center gap-2 mt-2 p-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded`}>
                <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} whitespace-nowrap`}>
                    Column Alias:
                </label>
                <input
                    type="text"
                    value={alias}
                    onChange={(e) => updateAlias(e.target.value)}
                    placeholder="e.g., full_name, custom_id (optional)"
                    className={`flex-1 p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                />
            </div>
            
            <div className={`text-xs mt-3 p-2 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800'}`}>
                <strong>Preview:</strong>
                <pre className={`mt-1 whitespace-pre-wrap font-mono ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                    {generateConcatSQL(parts) || '(empty)'}
                    {alias && ` AS ${alias}`}
                </pre>
            </div>
            
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-800'} mt-2`}>
                <strong>💡 Tips:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li><strong>Column:</strong> Use table alias (e.g., t1.column_name)</li>
                    <li><strong>Text:</strong> Enter plain text (quotes added automatically)</li>
                    <li><strong>Function:</strong> Enter complete function (e.g., SUBSTR(t1.col, 1, 3))</li>
                </ul>
            </div>
        </div>
    );
}

const QueryBuilder = ({
  query,
  visibleData,
  handleQueryChange,
  availableClauses,
  availableFunctions,
  clauseToAdd,
  setClauseToAdd,
  addClause,
  removeClause,
  handleClauseChange,
  handleColumnToggle,
  toggleSelectAllColumns,
  columnSearch,
  setColumnSearch,
  theme,
  userData,
  addSpecificClause,
  handleAddColumn,
  handleRemoveColumn,
  handleColumnAliasChange
}) => {
  const [showFunctionBrowser, setShowFunctionBrowser] = useState(false);
  const [showConcatBuilder, setShowConcatBuilder] = useState(false);
  const [concatBuilderData, setConcatBuilderData] = useState({
    parts: [{ id: Date.now(), type: 'column', value: '' }],
    alias: ''
  });

  // Handler for adding concatenation to functions
  const handleAddConcatenation = () => {
    // Reset state when opening
    setConcatBuilderData({
      parts: [{ id: Date.now(), type: 'column', value: '' }],
      alias: ''
    });
    setShowConcatBuilder(true);
  };

  // Handler to actually add concatenation to query
  const handleSaveConcatenation = () => {
    // Create new function with current concat data
    const newFunc = {
      id: Date.now(),
      func: 'CONCAT',
      args: [],
      alias: concatBuilderData.alias,
      concatStatement: {
        parts: concatBuilderData.parts
      }
    };
    
    // Call addSpecificClause to add to query
    addSpecificClause('functions', newFunc);
    
    // Close builder
    setShowConcatBuilder(false);
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-400'} rounded-lg p-4 shadow-sm flex flex-col space-y-4 scroll-container overflow-y-auto`}>
      <div>
        <label className="text-sm font-semibold mb-2 block">1. Select Schema</label>
        <SearchableDropdown
          options={visibleData ? Object.keys(visibleData).filter(Boolean) : []}
          value={query.schema}
          onChange={val => handleQueryChange('schema', val)}
          placeholder="-- Select a Schema --"
        />
      </div>

      {query.schema && (
        <div>
          <label className="text-sm font-semibold mb-2 block">2. Select Table</label>
          <SearchableDropdown
            options={query.schema && visibleData[query.schema] ? Object.keys(visibleData[query.schema]).filter(Boolean) : []}
            value={query.table}
            onChange={val => handleQueryChange('table', val)}
            placeholder="-- Select a Table --"
          />
        </div>
      )}

      {query.table && (
        <>
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">3. Select Columns</label>
              <button 
                onClick={() => setShowFunctionBrowser(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
              >
                <span>⚙️</span> Browse Functions
              </button>
            </div>
            {availableClauses.find(c => c.name === 'DISTINCT') && (
              <label className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} my-2`}>
                <input
                  type="checkbox"
                  checked={query.distinct}
                  onChange={(e) => handleQueryChange('distinct', e.target.checked)}
                  className={`h-4 w-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-400'} rounded text-blue-500 focus:ring-blue-500`}
                />
                <span>DISTINCT</span>
              </label>
            )}
            
            <SelectDropZone
              columns={query.columns['t1'] || new Set()}
              onAddColumn={(col) => handleAddColumn('t1', col.split('.').pop())}
              onRemoveColumn={(col) => handleRemoveColumn('t1', col)}
            />

            <ColumnSelector
              tableAlias="t1"
              tableName={query.table}
              schemaName={query.schema}
              visibleData={visibleData}
              query={query}
              columnSearch={columnSearch}
              setColumnSearch={setColumnSearch}
              handleColumnToggle={handleColumnToggle}
              toggleSelectAllColumns={toggleSelectAllColumns}
              handleColumnAliasChange={handleColumnAliasChange}
              theme={theme}
            />
            
            {(query.joins || []).map(j => j.targetTable && (
              <ColumnSelector
                key={j.id}
                tableAlias={j.alias}
                tableName={j.targetTable}
                schemaName={j.targetSchema}
                visibleData={visibleData}
                query={query}
                columnSearch={columnSearch}
                setColumnSearch={setColumnSearch}
                handleColumnToggle={handleColumnToggle}
                toggleSelectAllColumns={toggleSelectAllColumns}
                handleColumnAliasChange={handleColumnAliasChange}
                theme={theme}
              />
            ))}
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} pt-4`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold flex items-center">
                4. Add Query Clauses
                <InfoTooltip text="Select a clause from the dropdown and click Add. Each clause has specific options to build your query." />
              </h3>
              
              {/* STRING CONCATENATION BUTTON - Prominent placement */}
              <button 
                onClick={handleAddConcatenation}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg inline-flex items-center text-sm shadow-lg"
                title="Build string concatenation using || operator"
              >
                <span className="mr-1">🔗</span>
                <span className="hidden md:inline">Concatenate Strings</span>
                <span className="md:hidden">Concat</span>
              </button>
            </div>
            
            {/* Concatenation Builder Panel */}
            {showConcatBuilder && (
              <div className="mb-3">
                <StringConcatBuilder
                  theme={theme}
                  concatData={concatBuilderData}
                  onChange={(newData) => setConcatBuilderData(newData)}
                  availableColumns={visibleData[query.schema]?.[query.table] || []}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setShowConcatBuilder(false)}
                    className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConcatenation}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Add to Query
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <select 
                value={clauseToAdd} 
                onChange={e => setClauseToAdd(e.target.value)} 
                className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
              >
                {availableClauses.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
              <button 
                onClick={addClause} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center text-sm"
              >
                <PlusCircleIcon className="mr-0 md:mr-2"/>
                <span className="hidden md:inline">Add</span>
              </button>
            </div>
            
            <div className="space-y-3 mt-3">
              {/* JOIN clauses */}
              {(query.joins || []).map(j => (
                <div key={j.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                      JOIN <InfoTooltip text="Join another table to combine data from multiple tables" />
                    </span>
                    <button 
                      onClick={() => removeClause('joins', j.id)} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={j.type} 
                      onChange={e => handleClauseChange('joins', j.id, 'type', e.target.value)} 
                      className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                    >
                      <option>INNER JOIN</option>
                      <option>LEFT JOIN</option>
                      <option>RIGHT JOIN</option>
                      <option>FULL JOIN</option>
                    </select>
                    <SearchableDropdown
                      options={visibleData ? Object.keys(visibleData).filter(Boolean) : []}
                      value={j.targetSchema}
                      onChange={val => handleClauseChange('joins', j.id, 'targetSchema', val)}
                      placeholder="Target Schema"
                    />
                  </div>
                  {j.targetSchema && (
                    <>
                      <SearchableDropdown
                        options={j.targetSchema && visibleData[j.targetSchema] ? Object.keys(visibleData[j.targetSchema]).filter(Boolean) : []}
                        value={j.targetTable}
                        onChange={val => handleClauseChange('joins', j.id, 'targetTable', val)}
                        placeholder="Target Table"
                      />
                      {j.targetTable && (
                        <div className="grid grid-cols-2 gap-2">
                          <SearchableDropdown
                            options={query.schema && query.table && visibleData[query.schema]?.[query.table] ? visibleData[query.schema][query.table].filter(Boolean) : []}
                            value={j.onLeft}
                            onChange={val => handleClauseChange('joins', j.id, 'onLeft', val)}
                            placeholder="Left Column (t1)"
                          />
                          <SearchableDropdown
                            options={j.targetSchema && j.targetTable && visibleData[j.targetSchema]?.[j.targetTable] ? visibleData[j.targetSchema][j.targetTable].filter(Boolean) : []}
                            value={j.onRight}
                            onChange={val => handleClauseChange('joins', j.id, 'onRight', val)}
                            placeholder={`Right Column (${j.alias})`}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Function clauses */}
              {(query.functions || []).map((f, index) => {
                const funcInfo = ALL_FUNCTIONS.find(info => info.name === f.func);
                const handleArgChange = (i, val) => {
                  const newArgs = [...f.args];
                  newArgs[i] = val;
                  handleClauseChange('functions', f.id, 'args', newArgs);
                };

                return (
                  <div key={f.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                        FUNCTION <InfoTooltip text={funcInfo?.description || ''} />
                      </span>
                      <button 
                        onClick={() => removeClause('functions', f.id)} 
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={f.func} 
                        onChange={e => handleClauseChange('functions', f.id, 'func', e.target.value)} 
                        className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                      >
                        {availableFunctions.map(fn => <option key={fn.name}>{fn.name}</option>)}
                        <option value="CONCAT">🔗 CONCATENATE</option>
                      </select>
                      <input 
                        type="text" 
                        value={f.alias} 
                        placeholder="Alias (optional)" 
                        onChange={e => handleClauseChange('functions', f.id, 'alias', e.target.value)} 
                        className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                      />
                    </div>
                    {funcInfo && !funcInfo.special && funcInfo.args > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: funcInfo.args }).map((_, i) => (
                          <input 
                            key={i}
                            type="text" 
                            value={f.args[i]} 
                            placeholder={`Argument ${i+1}`} 
                            onChange={e => handleArgChange(i, e.target.value)} 
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                          />
                        ))}
                      </div>
                    )}
                    {funcInfo?.name === 'CASE' && (
                      <CaseStatementBuilder
                        theme={theme}
                        caseData={f.caseStatement || { conditions: [{ when: '', then: '' }], else: '' }}
                        onChange={(caseConfig) => {
                          const updatedFunc = { ...f, caseStatement: caseConfig };
                          // Directly update the function clause in the main query state
                          handleClauseChange('functions', f.id, 'caseStatement', caseConfig);
                        }}
                      />
                    )}
                    {f.func === 'CONCAT' && (
                      <StringConcatBuilder
                        theme={theme}
                        concatData={f.concatStatement || { parts: [{ id: Date.now(), type: 'column', value: '' }] }}
                        onChange={(concatConfig) => {
                          handleClauseChange('functions', f.id, 'concatStatement', concatConfig);
                        }}
                        availableColumns={visibleData[query.schema]?.[query.table] || []}
                      />
                    )}
                  </div>
                );
              })}

              {/* WHERE clauses */}
              {(query.wheres || []).map(w => (
                <React.Fragment key={w.id}>
                {/* Only show DropZone at the top or if list is empty? No, maybe just one at top of section */}
                </React.Fragment>
              ))}
              
              <WhereDropZone conditions={(query.wheres || [])} onAddCondition={(cond) => addSpecificClause('wheres', { ...cond, tableAlias: 't1' })} />

              {(query.wheres || []).map(w => (
                <div key={w.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                      WHERE <InfoTooltip text="Filter rows based on conditions" />
                    </span>
                    <button 
                      onClick={() => removeClause('wheres', w.id)} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                    <SearchableDropdown
                      options={query.schema && query.table && visibleData[query.schema]?.[query.table] ? visibleData[query.schema][query.table].filter(Boolean) : []}
                      value={w.column}
                      onChange={val => handleClauseChange('wheres', w.id, 'column', val)}
                      placeholder="Select Column"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <select 
                        value={w.operator} 
                        onChange={e => handleClauseChange('wheres', w.id, 'operator', e.target.value)} 
                        className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                      >
                        <option>=</option>
                        <option>!=</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                        <option>&gt;=</option>
                        <option>&lt;=</option>
                        <option>LIKE</option>
                        <option>IN</option>
                      </select>
                      <div className="flex-1 flex flex-col">
                          <input
                              type="text"
                              value={w.value}
                              onChange={e => handleClauseChange('wheres', w.id, 'value', e.target.value)}
                              placeholder="Value or multiple: val1, val2, val3"
                              className={`p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                          />
                          {(w.value.includes(',') || w.value.includes(';') || w.value.includes('\n') || /\s+/.test(w.value)) && (
                              <span className="text-xs text-green-400 mt-1">
                                  ✓ Multiple values detected - will use IN clause
                              </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* GROUP BY clauses */}
              <GroupByDropZone groupBy={(query.groupBys || []).map(g => g.column)} onAddGroupBy={(col) => addSpecificClause('groupBys', { tableAlias: 't1', column: col.split('.').pop() })} onRemoveGroupBy={() => {}} />

              {(query.groupBys || []).map(g => (
                <div key={g.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                      GROUP BY <InfoTooltip text="Group rows that have the same values" />
                    </span>
                    <button 
                      onClick={() => removeClause('groupBys', g.id)} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                  <SearchableDropdown
                    options={query.schema && query.table && visibleData[query.schema]?.[query.table] ? visibleData[query.schema][query.table].filter(Boolean) : []}
                    value={g.column}
                    onChange={val => handleClauseChange('groupBys', g.id, 'column', val)}
                    placeholder="Select Column"
                  />
                </div>
              ))}

              {/* HAVING clauses */}
              {(query.havings || []).map(h => (
                <div key={h.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                      HAVING <InfoTooltip text="Filter groups based on aggregate conditions" />
                    </span>
                    <button 
                      onClick={() => removeClause('havings', h.id)} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                    <input 
                      type="text" 
                      value={h.column} 
                      placeholder="Aggregate Function (e.g., COUNT(*))" 
                      onChange={e => handleClauseChange('havings', h.id, 'column', e.target.value)} 
                      className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <select 
                        value={h.operator} 
                        onChange={e => handleClauseChange('havings', h.id, 'operator', e.target.value)} 
                        className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                      >
                        <option>=</option>
                        <option>!=</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                        <option>&gt;=</option>
                        <option>&lt;=</option>
                      </select>
                      <div className="flex-1 flex flex-col">
                        <input
                          type="text"
                          value={h.value}
                          onChange={e => handleClauseChange('havings', h.id, 'value', e.target.value)}
                          placeholder="Value or multiple: val1, val2"
                          className={`p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg`}
                        />
                        {(h.value.includes(',') || h.value.includes(';') || h.value.includes('\n')) && (
                            <span className="text-xs text-green-400 mt-1">
                                ✓ Multiple values detected - will use IN clause
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ORDER BY clauses */}
              {(query.orderBys || []).map(o => (
                <div key={o.id} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100 border border-gray-400'} p-2 rounded-lg space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} flex items-center`}>
                      ORDER BY <InfoTooltip text="Sort the result set" />
                    </span>
                    <button 
                      onClick={() => removeClause('orderBys', o.id)} 
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SearchableDropdown
                      options={query.schema && query.table && visibleData[query.schema]?.[query.table] ? visibleData[query.schema][query.table].filter(Boolean) : []}
                      value={o.column}
                      onChange={val => handleClauseChange('orderBys', o.id, 'column', val)}
                      placeholder="Select Column"
                    />
                    <select 
                      value={o.direction} 
                      onChange={e => handleClauseChange('orderBys', o.id, 'direction', e.target.value)} 
                      className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
                    >
                      <option>ASC</option>
                      <option>DESC</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} pt-4`}>
            <h3 className="text-sm font-semibold mb-2">5. LIMIT</h3>
            <input 
              type="text" 
              value={query.limit} 
              placeholder="e.g., 100" 
              onChange={e => handleQueryChange('limit', e.target.value)} 
              className={`w-full md:w-1/3 p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-400'} text-sm rounded-lg focus:outline-none`}
            />
          </div>
        </>
      )}

      <FunctionBrowser
        isOpen={showFunctionBrowser}
        onClose={() => setShowFunctionBrowser(false)}
        onInsertFunction={(functionName) => {
          // Add function to functions array
          const funcInfo = availableFunctions.find(f => f.name === functionName);
          addSpecificClause('functions', {
            func: functionName,
            args: Array(funcInfo?.args || 0).fill(''),
            alias: '',
            caseStatement: functionName === 'CASE' 
              ? { conditions: [{ when: '', then: '' }], else: '' }
              : undefined
          });
          setShowFunctionBrowser(false);
        }}
        userLevel={userData?.isAdmin ? 'Advanced' : (userData?.permissions?.level || 'Beginner')}
        theme={theme}
      />
    </div>
  );
};

export default React.memo(QueryBuilder);
