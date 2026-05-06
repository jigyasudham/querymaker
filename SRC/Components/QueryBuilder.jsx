// QueryBuilder.jsx - Extracted from SchemaPanel.jsx
import React, { useState } from 'react';
import { PlusCircleIcon, TrashIcon } from './UI/Icons.jsx';
import { InfoTooltip, SearchableDropdown, GlassCard, GlassButton, GlassInput } from './UI/UIHelpers.jsx';
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
        <GlassCard theme={theme} className="p-4 space-y-4">
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                CASE Statement Builder
            </div>
            
            {conditions.map((cond, index) => (
                <div key={index} className="flex items-center space-x-3">
                    <span className="text-xs font-bold opacity-60 w-12">WHEN</span>
                    <GlassInput
                        theme={theme}
                        value={cond.when}
                        onChange={e => updateCondition(index, 'when', e.target.value)}
                        placeholder="condition (e.g., amount > 100)"
                        className="flex-1"
                    />
                    <span className="text-xs font-bold opacity-60">THEN</span>
                    <GlassInput
                        theme={theme}
                        value={cond.then}
                        onChange={e => updateCondition(index, 'then', e.target.value)}
                        placeholder="result (e.g., 'High')"
                        className="flex-1"
                    />
                    {conditions.length > 1 && (
                        <button
                            onClick={() => removeCondition(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove condition"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
            
            <button
                onClick={addCondition}
                className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline font-medium`}
            >
                + Add WHEN condition
            </button>
            
            <div className="flex items-center space-x-3 mt-4">
                <span className="text-xs font-bold opacity-60 w-12">ELSE</span>
                <GlassInput
                    theme={theme}
                    value={elseValue}
                    onChange={e => updateElse(e.target.value)}
                    placeholder="default value (optional)"
                    className="flex-1"
                />
            </div>
            
            <div className={`text-xs p-3 rounded-xl border backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/60 border-white/5 text-slate-400' : 'bg-slate-50/60 border-black/5 text-slate-600'}`}>
                <div className="font-bold mb-2">Preview:</div>
                <pre className="whitespace-pre-wrap font-mono">
                    {generateCaseSQL(conditions, elseValue)}
                </pre>
            </div>
        </GlassCard>
    );
}

export function generateConcatSQL(parts) {
    if (!parts || parts.length === 0) return '';
    const formattedParts = parts.map(part => {
        if (part.type === 'text') return `'${part.value.replace(/'/g, "''")}'`;
        return part.value;
    }).filter(Boolean);
    return formattedParts.join(' || ');
}

export function StringConcatBuilder({ concatData, onChange, theme, availableColumns }) {
    const [parts, setParts] = useState(concatData.parts || [
        { id: Date.now(), type: 'column', value: '' }
    ]);
    const [alias, setAlias] = useState(concatData.alias || '');

    const addPart = (type) => {
        const newParts = [...parts, { id: Date.now() + Math.random(), type, value: '' }];
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const removePart = (id) => {
        const newParts = parts.filter(p => p.id !== id);
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const updatePart = (id, field, value) => {
        const newParts = parts.map(p => p.id === id ? { ...p, [field]: value } : p);
        setParts(newParts);
        updateParent(newParts, alias);
    };

    const updateAlias = (newAlias) => {
        setAlias(newAlias);
        updateParent(parts, newAlias);
    };

    const updateParent = (newParts, newAlias) => {
        onChange({ parts: newParts, alias: newAlias });
    };

    return (
        <GlassCard theme={theme} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                    🔗 String Concatenation Builder
                </div>
                <div className="flex gap-2">
                    <GlassButton theme={theme} onClick={() => addPart('column')} className="text-xs px-3 py-1.5">📊 Column</GlassButton>
                    <GlassButton theme={theme} onClick={() => addPart('text')} className="text-xs px-3 py-1.5">📝 Text</GlassButton>
                    <GlassButton theme={theme} onClick={() => addPart('function')} className="text-xs px-3 py-1.5">⚙️ Function</GlassButton>
                </div>
            </div>
            
            {parts.map((part, index) => (
                <div key={part.id} className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <select
                            value={part.type}
                            onChange={(e) => updatePart(part.id, 'type', e.target.value)}
                            className={`p-2 rounded-xl border backdrop-blur-md text-xs focus:outline-none ${
                                theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900'
                            }`}
                        >
                            <option value="column">Column</option>
                            <option value="text">Text</option>
                            <option value="function">Function</option>
                        </select>
                        
                        <GlassInput
                            theme={theme}
                            value={part.value}
                            onChange={(e) => updatePart(part.id, 'value', e.target.value)}
                            placeholder="Enter column or text..."
                            className="flex-1 font-mono"
                        />
                        
                        {parts.length > 1 && (
                            <button onClick={() => removePart(part.id)} className="text-red-400 hover:text-red-300 transition-colors">✕</button>
                        )}
                    </div>
                    {index < parts.length - 1 && (
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">||</span>
                        </div>
                    )}
                </div>
            ))}
            
            <div className="flex items-center gap-3 mt-4">
                <label className="text-xs font-bold opacity-60 whitespace-nowrap">Alias:</label>
                <GlassInput
                    theme={theme}
                    value={alias}
                    onChange={(e) => updateAlias(e.target.value)}
                    placeholder="e.g., full_name"
                    className="flex-1"
                />
            </div>
            
            <div className={`text-xs p-3 rounded-xl border backdrop-blur-md ${theme === 'dark' ? 'bg-slate-900/60 border-white/5 text-green-400/80' : 'bg-slate-50/60 border-black/5 text-green-700'}`}>
                <div className="font-bold mb-2">Preview:</div>
                <pre className="font-mono">{generateConcatSQL(parts) || '(empty)'}{alias && ` AS ${alias}`}</pre>
            </div>
        </GlassCard>
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
  user,
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

  const userLevel = user?.isAdmin || userData?.isAdmin ? 'Advanced' : (user?.permissions?.level || userData?.permissions?.level || 'Beginner');

  const handleAddConcatenation = () => {
    setConcatBuilderData({ parts: [{ id: Date.now(), type: 'column', value: '' }], alias: '' });
    setShowConcatBuilder(true);
  };

  const handleSaveConcatenation = () => {
    const newFunc = {
      id: Date.now(),
      func: 'CONCAT',
      args: [],
      alias: concatBuilderData.alias,
      concatStatement: { parts: concatBuilderData.parts }
    };
    addSpecificClause('functions', newFunc);
    setShowConcatBuilder(false);
  };

  return (
    <GlassCard theme={theme} className="p-6 flex flex-col space-y-6 overflow-y-auto scroll-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold opacity-60 mb-2 block uppercase tracking-wider">1. Select Schema</label>
          <SearchableDropdown
            options={visibleData ? Object.keys(visibleData).filter(Boolean) : []}
            value={query.schema}
            onChange={val => handleQueryChange('schema', val)}
            placeholder="-- Select a Schema --"
            theme={theme}
          />
        </div>

        {query.schema && (
          <div>
            <label className="text-xs font-bold opacity-60 mb-2 block uppercase tracking-wider">2. Select Table</label>
            <SearchableDropdown
              options={query.schema && visibleData[query.schema] ? Object.keys(visibleData[query.schema]).filter(Boolean) : []}
              value={query.table}
              onChange={val => handleQueryChange('table', val)}
              placeholder="-- Select a Table --"
              theme={theme}
            />
          </div>
        )}
      </div>

      {query.table && (
        <>
          <div className="flex-grow flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">3. Select Columns</label>
              <GlassButton theme={theme} onClick={() => setShowFunctionBrowser(true)} className="text-xs py-1 px-3">
                <span>⚙️</span> Browse Functions
              </GlassButton>
            </div>
            
            {availableClauses.find(c => c.name === 'DISTINCT') && (
              <label className="flex items-center space-x-3 text-sm cursor-pointer group">
                <input
                  type="checkbox"
                  checked={query.distinct}
                  onChange={(e) => handleQueryChange('distinct', e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50 transition-all"
                />
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">DISTINCT</span>
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
          </div>

          <div className="border-t border-white/5 pt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider flex items-center gap-2">
                4. Add Query Clauses
                <InfoTooltip text="Select a clause from the dropdown and click Add." />
              </h3>
              
              <GlassButton theme={theme} onClick={handleAddConcatenation} variant="success" className="text-xs py-1.5 px-4 shadow-lg shadow-green-500/10">
                <span>🔗</span> Concatenate Strings
              </GlassButton>
            </div>
            
            {showConcatBuilder && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <StringConcatBuilder
                  theme={theme}
                  concatData={concatBuilderData}
                  onChange={setConcatBuilderData}
                  availableColumns={visibleData[query.schema]?.[query.table] || []}
                />
                <div className="flex justify-end gap-3 mt-4">
                  <GlassButton theme={theme} onClick={() => setShowConcatBuilder(false)} variant="secondary" className="text-xs">Cancel</GlassButton>
                  <GlassButton theme={theme} onClick={handleSaveConcatenation} variant="success" className="text-xs">Add to Query</GlassButton>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchableDropdown
                    options={availableClauses.map(c => c.name)}
                    value={clauseToAdd}
                    onChange={setClauseToAdd}
                    placeholder="Select Clause"
                    theme={theme}
                />
              </div>
              <GlassButton theme={theme} onClick={addClause} className="px-6">
                <PlusCircleIcon className="w-4 h-4" /> Add
              </GlassButton>
            </div>
            
            <div className="space-y-4">
              {(query.joins || []).map(j => (
                <GlassCard key={j.id} theme={theme} className="p-4 space-y-4 border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                      JOIN <InfoTooltip text="Join another table" />
                    </span>
                    <button onClick={() => removeClause('joins', j.id)} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={j.type} 
                      onChange={e => handleClauseChange('joins', j.id, 'type', e.target.value)} 
                      className={`w-full p-2.5 rounded-xl border backdrop-blur-md text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900'
                      }`}
                    >
                      <option>INNER JOIN</option><option>LEFT JOIN</option><option>RIGHT JOIN</option><option>FULL JOIN</option>
                    </select>
                    <SearchableDropdown options={visibleData ? Object.keys(visibleData).filter(Boolean) : []} value={j.targetSchema} onChange={val => handleClauseChange('joins', j.id, 'targetSchema', val)} placeholder="Target Schema" theme={theme} />
                  </div>
                  {j.targetSchema && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableDropdown options={visibleData[j.targetSchema] ? Object.keys(visibleData[j.targetSchema]).filter(Boolean) : []} value={j.targetTable} onChange={val => handleClauseChange('joins', j.id, 'targetTable', val)} placeholder="Target Table" theme={theme} />
                        {j.targetTable && (
                            <div className="grid grid-cols-2 gap-2">
                                <SearchableDropdown options={visibleData[query.schema]?.[query.table] || []} value={j.onLeft} onChange={val => handleClauseChange('joins', j.id, 'onLeft', val)} placeholder="Left Column" theme={theme} />
                                <SearchableDropdown options={visibleData[j.targetSchema]?.[j.targetTable] || []} value={j.onRight} onChange={val => handleClauseChange('joins', j.id, 'onRight', val)} placeholder="Right Column" theme={theme} />
                            </div>
                        )}
                    </div>
                  )}
                </GlassCard>
              ))}

              {(query.functions || []).map(f => (
                <GlassCard key={f.id} theme={theme} className="p-4 space-y-4 border-purple-500/20">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-widest">FUNCTION</span>
                        <button onClick={() => removeClause('functions', f.id)} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <select 
                            value={f.func} 
                            onChange={e => handleClauseChange('functions', f.id, 'func', e.target.value)} 
                            className={`w-full p-2.5 rounded-xl border backdrop-blur-md text-sm focus:outline-none ${
                                theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900'
                            }`}
                        >
                            {availableFunctions.map(fn => <option key={fn.name}>{fn.name}</option>)}
                            <option value="CONCAT">🔗 CONCATENATE</option>
                        </select>
                        <GlassInput theme={theme} value={f.alias} onChange={e => handleClauseChange('functions', f.id, 'alias', e.target.value)} placeholder="Alias (optional)" />
                    </div>
                    {f.func === 'CASE' && (
                        <CaseStatementBuilder theme={theme} caseData={f.caseStatement || { conditions: [{ when: '', then: '' }], else: '' }} onChange={config => handleClauseChange('functions', f.id, 'caseStatement', config)} />
                    )}
                    {f.func === 'CONCAT' && (
                        <StringConcatBuilder theme={theme} concatData={f.concatStatement || { parts: [{ id: Date.now(), type: 'column', value: '' }] }} onChange={config => handleClauseChange('functions', f.id, 'concatStatement', config)} availableColumns={visibleData[query.schema]?.[query.table] || []} />
                    )}
                </GlassCard>
              ))}

              <WhereDropZone conditions={(query.wheres || [])} onAddCondition={(cond) => addSpecificClause('wheres', { ...cond, tableAlias: 't1' })} />
              
              {(query.wheres || []).map(w => (
                <GlassCard key={w.id} theme={theme} className="p-4 space-y-4 border-orange-500/20">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">WHERE</span>
                        <button onClick={() => removeClause('wheres', w.id)} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchableDropdown options={visibleData[query.schema]?.[query.table] || []} value={w.column} onChange={val => handleClauseChange('wheres', w.id, 'column', val)} placeholder="Column" theme={theme} />
                        <div className="flex gap-2">
                            <select value={w.operator} onChange={e => handleClauseChange('wheres', w.id, 'operator', e.target.value)} className={`p-2.5 rounded-xl border backdrop-blur-md text-sm focus:outline-none ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900'}`}><option>=</option><option>!=</option><option>&gt;</option><option>&lt;</option><option>&gt;=</option><option>&lt;=</option><option>LIKE</option><option>IN</option></select>
                            <GlassInput theme={theme} value={w.value} onChange={e => handleClauseChange('wheres', w.id, 'value', e.target.value)} placeholder="Value..." className="flex-1" />
                        </div>
                    </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="text-xs font-bold opacity-60 mb-3 uppercase tracking-wider">5. LIMIT</h3>
            <GlassInput 
              theme={theme}
              value={query.limit} 
              placeholder="e.g., 100" 
              onChange={e => handleQueryChange('limit', e.target.value)} 
              className="max-w-[200px]"
            />
          </div>
        </>
      )}

      <FunctionBrowser
        isOpen={showFunctionBrowser}
        onClose={() => setShowFunctionBrowser(false)}
        onInsertFunction={(functionName) => {
          const funcInfo = availableFunctions.find(f => f.name === functionName);
          addSpecificClause('functions', {
            func: functionName,
            args: Array(funcInfo?.args || 0).fill(''),
            alias: '',
            caseStatement: functionName === 'CASE' ? { conditions: [{ when: '', then: '' }], else: '' } : undefined
          });
          setShowFunctionBrowser(false);
        }}
        userLevel={userLevel}
        theme={theme}
      />
    </GlassCard>
  );
};

export default React.memo(QueryBuilder);

