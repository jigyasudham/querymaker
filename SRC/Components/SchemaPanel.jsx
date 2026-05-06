import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PythonAPI } from '/SRC/Services/PythonAPI.js';
import { useDebounce } from '../Services/useDebounce.js';
import {
    SearchIcon, CodeIcon, LogoutIcon, CopyIcon, PlusCircleIcon,
    AdminIcon, SaveIcon, FeedbackIcon, PlayIcon, AlertTriangleIcon, HistoryIcon
} from './UI/Icons.jsx';
import { FeedbackModal } from './UI/Modals.jsx';
import { CollapsibleSection, InfoTooltip, Highlight, CodeBlock, SearchableDropdown, GlassCard, GlassButton, GlassInput } from './UI/UIHelpers.jsx';
import { ALL_CLAUSES, ALL_FUNCTIONS, FUNCTION_TYPES } from '../Services/ClauseDefinitions.js';
import ColumnSelector from './ColumnSelector.jsx';
import QueryBuilder from './QueryBuilder.jsx';
import EnhancedQueryHistory from './EnhancedQueryHistory.jsx';
import ThemeToggle from './UI/ThemeToggle.jsx';
import { VariableSizeList } from 'react-window';
import AutomationPanel from './AutomationPanel.jsx';
import { StateManager } from '../Services/StateManager.js';
import QueryValidationPanel from './UI/QueryValidationPanel';
import QueryValidator from '../Services/QueryValidator';
import CTEBuilder from './CTEBuilder';
import SubqueryBuilder from './SubqueryBuilder';
import { useKeyboardShortcuts } from '../Hooks/useKeyboardShortcuts';
import { ShortcutHelper, ShortcutIndicator } from './ShortcutHelpers';
import { DraggableColumnItem } from './DraggableColumn';
import QueryTemplates from './QueryTemplates';
import ExportImportQueries from './ExportImportQueries';
import SmartColumnSuggestions from './SmartColumnSuggestions';
import HelpSystem from './HelpSystem';
import RecentQueries from './RecentQueries';

const DEBUG = false;

export default function SchemaPanel({ user, userData, setUserData, onLogout, onAdminView, theme, setTheme }) {
    // --- STATE MANAGEMENT START ---
    const savedState = StateManager.loadBuilderState(user.email);
    const [activeView, setActiveView] = useState(savedState?.activeView || 'explorer');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const [query, setQuery] = useState(() => {
        if (savedState?.query) {
            const restoredQuery = { ...savedState.query };
            if (restoredQuery.columns && typeof restoredQuery.columns === 'object') {
                const properColumns = {};
                for (const [alias, cols] of Object.entries(restoredQuery.columns)) {
                    let colsArray = Array.isArray(cols) ? cols : (cols instanceof Set ? Array.from(cols) : []);
                    properColumns[alias] = colsArray.map(col => typeof col === 'string' ? { name: col, alias: '' } : { name: col.name || '', alias: col.alias || '' });
                }
                restoredQuery.columns = properColumns;
            } else {
                restoredQuery.columns = {};
            }
            if (!restoredQuery.subqueries) restoredQuery.subqueries = [];
            if (!restoredQuery.ctes) restoredQuery.ctes = [];
            restoredQuery.functions = Array.isArray(restoredQuery.functions) ? restoredQuery.functions : [];
            restoredQuery.joins = Array.isArray(restoredQuery.joins) ? restoredQuery.joins : [];
            restoredQuery.wheres = Array.isArray(restoredQuery.wheres) ? restoredQuery.wheres : [];
            restoredQuery.groupBys = Array.isArray(restoredQuery.groupBys) ? restoredQuery.groupBys : [];
            restoredQuery.havings = Array.isArray(restoredQuery.havings) ? restoredQuery.havings : [];
            restoredQuery.orderBys = Array.isArray(restoredQuery.orderBys) ? restoredQuery.orderBys : [];
            return restoredQuery;
        }
        return { schema: '', table: '', tableAlias: 't1', columns: {}, distinct: false, functions: [], joins: [], wheres: [], groupBys: [], havings: [], orderBys: [], limit: '', ctes: [], subqueries: [] };
    });

    const [runQueryText, setRunQueryText] = useState(savedState?.runQueryText || '');
    const saveTimerRef = useRef(null);
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            StateManager.saveBuilderState({ query, runQueryText, activeView }, user.email);
        }, 500);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [query, runQueryText, activeView, user.email]);

    const handleViewChange = (newView) => {
        StateManager.saveBuilderState({ query, runQueryText, activeView: newView }, user.email);
        setActiveView(newView);
    };

    const [toast, setToast] = useState(null);
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const [copySuccess, setCopySuccess] = useState('');
    const [clauseToAdd, setClauseToAdd] = useState('WHERE');
    const [showCTEs, setShowCTEs] = useState(false);
    const [myQueries, setMyQueries] = useState([]);
    const [saveQueryName, setSaveQueryName] = useState('');
    const [columnSearch, setColumnSearch] = useState({});
    const [queryKey, setQueryKey] = useState(Date.now());
    const [validationResult, setValidationResult] = useState(null);
    const [showValidation, setShowValidation] = useState(false);
    const [queryHistory, setQueryHistory] = useState([]);

    // Load queries from Python backend on mount
    useEffect(() => {
        const loadUserQueries = async () => {
            try {
                const response = await PythonAPI.loadQueries(user.email, 'my_queries');
                if (response.status === 'success') {
                    setMyQueries(response.queries || []);
                }
                const historyResponse = await PythonAPI.loadQueries(user.email, 'recent');
                if (historyResponse.status === 'success') {
                    setQueryHistory(historyResponse.queries || []);
                }
            } catch (error) {
                console.error('Failed to load user queries:', error);
            }
        };
        loadUserQueries();
    }, [user.email]);

    const userLevel = user?.isAdmin || userData?.isAdmin ? 'Advanced' : (user?.permissions?.level || userData?.permissions?.level || 'Beginner');

    const listRef = useRef(null);
    const [expandedSchemas, setExpandedSchemas] = useState({});
    const [expandedTables, setExpandedTables] = useState({});

    // Handlers
    const handleAddColumn = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];
            if (!tableColumns.find(col => col.name === columnName)) {
                newColumns[tableAlias] = [...tableColumns, { name: columnName, alias: '' }];
            }
            return { ...prev, columns: newColumns };
        });
    };

    const handleRemoveColumn = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            newColumns[tableAlias] = (newColumns[tableAlias] || []).filter(col => col.name !== columnName);
            return { ...prev, columns: newColumns };
        });
    };

    const handleColumnToggle = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];
            const idx = tableColumns.findIndex(col => col.name === columnName);
            if (idx >= 0) newColumns[tableAlias] = tableColumns.filter((_, i) => i !== idx);
            else newColumns[tableAlias] = [...tableColumns, { name: columnName, alias: '' }];
            return { ...prev, columns: newColumns };
        });
    };

    const toggleSelectAllColumns = (tableAlias, columns) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];
            if (tableColumns.length === columns.length) newColumns[tableAlias] = [];
            else newColumns[tableAlias] = columns.map(col => ({ name: col, alias: '' }));
            return { ...prev, columns: newColumns };
        });
    };

    const handleColumnAliasChange = (tableAlias, columnName, newAlias) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            newColumns[tableAlias] = (newColumns[tableAlias] || []).map(col => col.name === columnName ? { ...col, alias: newAlias } : col);
            return { ...prev, columns: newColumns };
        });
    };

    const handleQueryChange = (field, value) => {
        if (field === 'schema') setQuery({ ...resetQueryState(), schema: value });
        else if (field === 'table') setQuery(prev => ({ ...prev, table: value, columns: { t1: [] }, functions: [], joins: [], wheres: [], groupBys: [], havings: [], orderBys: [] }));
        else if (field === 'limit') setQuery(prev => ({ ...prev, limit: value.replace(/[^0-9]/g, '') }));
        else if (field === 'distinct') setQuery(prev => ({ ...prev, distinct: value }));
    };

    const addSpecificClause = (type, data) => {
        setQuery(prev => ({ ...prev, [type]: [...(prev[type] || []), { ...data, id: Date.now() }] }));
    };

    const handleClauseChange = (type, id, field, value) => {
        setQuery(prev => ({ ...prev, [type]: (prev[type] || []).map(c => c.id === id ? { ...c, [field]: value } : c) }));
    };

    const removeClause = (type, id) => {
        setQuery(prev => ({ ...prev, [type]: (prev[type] || []).filter(c => c.id !== id) }));
    };

    const addClause = () => {
        if (!clauseToAdd) return;
        setQuery(prev => {
            let type, newClause;
            if (clauseToAdd === 'JOIN') {
                const existingAliases = (prev.joins || []).map(j => j.alias).filter(Boolean);
                const usedAliases = new Set(['t1', ...existingAliases]);
                let i = 2; while (usedAliases.has(`t${i}`)) i++;
                type = 'joins';
                newClause = { id: Date.now(), type: 'INNER JOIN', targetSchema: prev.schema, targetTable: '', onLeft: '', onRight: '', alias: `t${i}` };
            } else if (clauseToAdd === 'WHERE') {
                type = 'wheres';
                newClause = { id: Date.now(), tableAlias: 't1', column: '', operator: '=', value: '' };
            } else if (clauseToAdd === 'ORDER BY') {
                type = 'orderBys';
                newClause = { id: Date.now(), tableAlias: 't1', column: '', direction: 'ASC' };
            } else {
                return prev;
            }
            return { ...prev, [type]: [...(prev[type] || []), newClause] };
        });
    };

    const resetQueryState = () => ({ schema: '', table: '', tableAlias: 't1', columns: {}, distinct: false, functions: [], joins: [], wheres: [], groupBys: [], havings: [], orderBys: [], limit: '', ctes: [], subqueries: [] });

    const visibleData = useMemo(() => {
        if (!userData.schemaData) return null;
        if (user.isAdmin) return userData.schemaData;
        const userPermissions = new Set(user.permissions?.schemas || []);
        const filtered = {};
        for (const schemaName of userPermissions) { if (userData.schemaData[schemaName]) filtered[schemaName] = userData.schemaData[schemaName]; }
        return filtered;
    }, [userData.schemaData, user]);

    const searchedData = useMemo(() => {
        if (!visibleData) return null;
        if (!debouncedSearchTerm) return visibleData;
        const queryLc = debouncedSearchTerm.toLowerCase();
        const filtered = {};
        for (const schemaName in visibleData) {
            const schemaLc = schemaName.toLowerCase();
            const tables = visibleData[schemaName];
            const filteredTables = {};
            let schemaMatches = schemaLc.includes(queryLc);
            for (const tableName in tables) {
                const tableLc = tableName.toLowerCase();
                const columns = tables[tableName];
                let tableMatches = tableLc.includes(queryLc);
                const matchingColumns = columns.filter(col => col.toLowerCase().includes(queryLc));
                if (tableMatches || matchingColumns.length > 0) filteredTables[tableName] = tableMatches ? columns : matchingColumns;
            }
            if (schemaMatches || Object.keys(filteredTables).length > 0) filtered[schemaName] = schemaMatches ? tables : filteredTables;
        }
        return filtered;
    }, [visibleData, debouncedSearchTerm]);

    const getItemSize = (index) => {
        const schemaNames = Object.keys(searchedData || {});
        const schemaName = schemaNames[index];
        if (!expandedSchemas[schemaName]) return 55;
        const tables = searchedData[schemaName];
        let height = 55;
        Object.keys(tables).forEach(tableName => {
            height += 40;
            if (expandedTables[`${schemaName}-${tableName}`]) height += tables[tableName].length * 42;
        });
        return height;
    };

    const toggleSchema = (schemaName, index) => {
        setExpandedSchemas(prev => ({ ...prev, [schemaName]: !prev[schemaName] }));
        if (listRef.current) listRef.current.resetAfterIndex(index);
    };

    const toggleTable = (schemaName, tableName, index) => {
        const key = `${schemaName}-${tableName}`;
        setExpandedTables(prev => ({ ...prev, [key]: !prev[key] }));
        if (listRef.current) listRef.current.resetAfterIndex(index);
    };

    const handleAddSuggestedColumn = (columnName) => {
        handleAddColumn('t1', columnName);
        showToast(`Added suggested column: ${columnName}`);
    };

    const handleAddSuggestedJoin = (joinDetails) => {
        setQuery(prev => {
            const existingAliases = (prev.joins || []).map(j => j.alias).filter(Boolean);
            const usedAliases = new Set(['t1', ...existingAliases]);
            let i = 2; while (usedAliases.has(`t${i}`)) i++;
            const nextAlias = `t${i}`;
            const joinOnParts = joinDetails.joinOn?.split('=') || [];
            const newJoin = { id: Date.now(), type: joinDetails.type || 'INNER JOIN', targetSchema: joinDetails.schema || prev.schema, targetTable: joinDetails.table, onLeft: joinOnParts[0]?.trim() || '', onRight: joinOnParts[1]?.trim() || '', alias: nextAlias };
            return { ...prev, columns: { ...(prev.columns || {}), [nextAlias]: [] }, joins: [...(prev.joins || []), newJoin] };
        });
        showToast(`Added suggested join: ${joinDetails.table}`);
    };

    const handleValidateQuery = () => {
        if (!generatedQuery || generatedQuery.includes('/* Select')) { alert('Build a query first'); return; }
        const res = QueryValidator.validate(generatedQuery, null);
        setValidationResult(res);
        setShowValidation(true);
    };

    const handleSaveQuery = async () => {
        if (!saveQueryName) { alert('Please enter a name for the query'); return; }
        const newSavedQuery = {
            id: Date.now(),
            name: saveQueryName,
            sql: generatedQuery,
            queryState: query,
            timestamp: new Date().toISOString()
        };
        try {
            const response = await PythonAPI.saveQuery(user.email, 'my_queries', newSavedQuery);
            if (response.status === 'success') {
                setMyQueries([newSavedQuery, ...myQueries]);
                setSaveQueryName('');
                showToast('Query saved successfully!');
            }
        } catch (error) {
            console.error('Error saving query:', error);
            showToast('Failed to save query');
        }
    };

    const handleImportQueries = async (importedData) => {
        const merged = [...importedData, ...myQueries];
        try {
            const response = await PythonAPI.updateQueries(user.email, 'my_queries', merged);
            if (response.status === 'success') {
                setMyQueries(merged);
                showToast('Queries imported successfully!');
            }
        } catch (error) {
            console.error('Error importing queries:', error);
        }
    };

    const handleSaveAsTemplate = (sql) => {
        setRunQueryText(sql);
        handleViewChange('builder');
        // Logic to extract state from SQL could go here if implemented in QueryValidator
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => { setCopySuccess('Copied!'); setTimeout(() => setCopySuccess(''), 2000); });
    };

    const generatedQuery = useMemo(() => {
        if (!query.table) return '/* Select a schema and table to begin */';
        let sql = 'SELECT ';
        if (query.distinct) sql += 'DISTINCT ';
        const cols = [];
        for (const alias in query.columns) {
            (query.columns[alias] || []).forEach(col => cols.push(`${alias}.${col.name}${col.alias ? ` AS "${col.alias}"` : ''}`));
        }
        sql += cols.length > 0 ? cols.join(',\n  ') : 't1.*';
        sql += `\nFROM\n  ${query.schema}.${query.table} AS t1`;
        if (query.joins?.length > 0) {
            sql += '\n' + query.joins.map(j => `${j.type} ${j.targetSchema}.${j.targetTable} AS ${j.alias} ON t1.${j.onLeft} = ${j.alias}.${j.onRight}`).join('\n');
        }
        if (query.wheres?.length > 0) {
            sql += '\nWHERE\n  ' + query.wheres.map(w => `${w.tableAlias}.${w.column} ${w.operator} ${isNaN(w.value) ? `'${w.value}'` : w.value}`).join('\n  AND ');
        }
        if (query.limit) sql += `\nLIMIT ${query.limit}`;
        return sql + ';';
    }, [query]);

    const renderSchemaExplorer = () => {
        const schemaNames = Object.keys(searchedData || {});
        return (
            <GlassCard theme={theme} className="flex-grow flex flex-col overflow-hidden shadow-2xl">
                <div className={`p-6 border-b border-white/5`}>
                    <GlassInput theme={theme} icon={SearchIcon} placeholder="Search schemas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex-grow overflow-y-auto scroll-container p-2">
                    {searchedData && schemaNames.length > 0 ? (
                        <VariableSizeList ref={listRef} height={600} itemCount={schemaNames.length} itemSize={getItemSize} width="100%">
                            {({ index, style }) => {
                                const schemaName = schemaNames[index];
                                const tables = searchedData[schemaName];
                                const isSchemaExpanded = expandedSchemas[schemaName];
                                return (
                                    <div style={style} className="px-2">
                                        <div onClick={() => toggleSchema(schemaName, index)} className={`cursor-pointer p-3 mb-1 rounded-xl font-bold transition-all duration-200 ${theme === 'dark' ? 'text-blue-300 hover:bg-white/5' : 'text-blue-700 hover:bg-black/5'} flex items-center justify-between`}>
                                            <span className="flex items-center gap-3"><span className="text-lg opacity-70">{isSchemaExpanded ? '📂' : '📁'}</span>{schemaName}</span>
                                            <span className="text-[10px] uppercase tracking-widest opacity-40">{Object.keys(tables).length} tables</span>
                                        </div>
                                        {isSchemaExpanded && (
                                            <div className="ml-6 space-y-1">
                                                {Object.keys(tables).map(tableName => {
                                                    const isTableExpanded = expandedTables[`${schemaName}-${tableName}`];
                                                    return (
                                                        <div key={tableName}>
                                                            <div onClick={() => toggleTable(schemaName, tableName, index)} className={`cursor-pointer p-2 rounded-lg font-semibold transition-all duration-200 ${theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-black/5'} flex items-center gap-2`}>
                                                                <span className="text-blue-500/40">{isTableExpanded ? '▾' : '▸'}</span><span className="opacity-60">📊</span>{tableName}
                                                            </div>
                                                            {isTableExpanded && (
                                                                <ul className="pl-6 mt-1 space-y-1">
                                                                    {tables[tableName].map((column, colIdx) => (
                                                                        <DraggableColumnItem key={`${tableName}-${column}-${colIdx}`} column={column} table={tableName} schema={schemaName} onAddToQuery={() => handleAddColumn('t1', column)} />
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        </VariableSizeList>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8"><SearchIcon className="w-12 h-12 mb-4" /><p className="text-sm font-medium">No results found</p></div>
                    )}
                </div>
            </GlassCard>
        );
    };

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Background Mesh */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <GlassCard theme={theme} className="px-6 py-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20"><CodeIcon className="text-white w-6 h-6" /></div>
                    <div><h1 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Querry<span className="text-blue-500 font-extrabold">Hub</span></h1><p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Professional SQL Architect</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                    <div className={`h-8 w-px ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}></div>
                    {(user.isAdmin || userData.isAdmin) && <GlassButton theme={theme} variant="secondary" onClick={onAdminView} className="p-2"><AdminIcon className="w-5 h-5" /></GlassButton>}
                    <GlassButton theme={theme} variant="danger" onClick={onLogout} className="px-4 py-2 text-sm"><LogoutIcon className="w-4 h-4" /> Sign Out</GlassButton>
                </div>
            </GlassCard>

            <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
                <div className="lg:w-80 flex flex-col gap-6">
                    <GlassCard theme={theme} className="p-2 shadow-lg">
                        <div className="flex flex-col gap-1">
                            {[
                                { id: 'explorer', label: 'Explorer', icon: SearchIcon },
                                { id: 'builder', label: 'Builder', icon: PlusCircleIcon },
                                { id: 'saved', label: 'Saved', icon: SaveIcon },
                                { id: 'run', label: 'Editor', icon: PlayIcon },
                                { id: 'history', label: 'History', icon: HistoryIcon },
                                { id: 'automation', label: 'Automation', icon: AdminIcon }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => handleViewChange(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === tab.id ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20') : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}>
                                    <tab.icon className="w-5 h-5" /><span className="font-semibold text-sm">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                    {activeView === 'builder' && renderSchemaExplorer()}
                </div>

                <main className="flex-grow flex flex-col gap-6 min-w-0">
                    <div className="flex-grow flex flex-col min-h-0">
                        {activeView === 'explorer' && renderSchemaExplorer()}
                        {activeView === 'builder' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
                                <QueryBuilder 
                                    key={queryKey} 
                                    query={query} 
                                    visibleData={visibleData} 
                                    handleQueryChange={handleQueryChange} 
                                    availableClauses={ALL_CLAUSES} 
                                    availableFunctions={ALL_FUNCTIONS} 
                                    clauseToAdd={clauseToAdd} 
                                    setClauseToAdd={setClauseToAdd} 
                                    addClause={addClause} 
                                    removeClause={removeClause} 
                                    handleClauseChange={handleClauseChange} 
                                    handleColumnToggle={handleColumnToggle} 
                                    toggleSelectAllColumns={toggleSelectAllColumns} 
                                    columnSearch={columnSearch} 
                                    setColumnSearch={setColumnSearch} 
                                    theme={theme} 
                                    user={user}
                                    userData={userData}
                                    addSpecificClause={addSpecificClause} 
                                    handleAddColumn={handleAddColumn} 
                                    handleRemoveColumn={handleRemoveColumn} 
                                    handleColumnAliasChange={handleColumnAliasChange} 
                                />
                                <div className="relative">
                                    <div className={`sticky top-6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-[calc(100vh-200px)] shadow-2xl ${theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white/40 border-white/20'}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Generated SQL</h3>
                                            <div className="flex gap-2">
                                                <GlassButton theme={theme} onClick={handleValidateQuery} className="text-xs px-3">Validate</GlassButton>
                                                <GlassButton theme={theme} onClick={() => copyToClipboard(generatedQuery)} variant="secondary" className="text-xs px-3">{copySuccess || 'Copy'}</GlassButton>
                                            </div>
                                        </div>
                                        <div className="flex-grow overflow-hidden flex flex-col relative">
                                            <CodeBlock theme={theme} code={generatedQuery} />
                                            {showValidation && validationResult && <div className="absolute inset-0 bg-black/40 backdrop-blur-md p-4 rounded-xl animate-in fade-in duration-300"><QueryValidationPanel result={validationResult} onClose={() => setShowValidation(false)} theme={theme} /></div>}
                                        </div>
                                        <div className="mt-6 flex flex-col gap-4">
                                            <GlassButton theme={theme} onClick={() => { handleViewChange('run'); setRunQueryText(generatedQuery); }} className="w-full py-4 text-lg shadow-xl shadow-blue-500/20">Run Query</GlassButton>
                                            <div className="flex gap-2">
                                                <GlassInput theme={theme} value={saveQueryName} onChange={e => setSaveQueryName(e.target.value)} placeholder="Query name..." className="flex-1" />
                                                <GlassButton theme={theme} variant="secondary" onClick={handleSaveQuery}>Save</GlassButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeView === 'saved' && (
                            <GlassCard theme={theme} className="flex-grow p-8 space-y-6 shadow-2xl">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Saved Queries</h2>
                                    <ExportImportQueries queries={myQueries} onImport={handleImportQueries} userData={userData} queryType="saved" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto scroll-container">
                                    {myQueries.map(q => (
                                        <GlassCard key={q.id} className="p-6 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => { setQuery(q.queryState); handleViewChange('builder'); }}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{q.name}</h3>
                                                <span className="text-[10px] uppercase font-black opacity-30">SQL TEMPLATE</span>
                                            </div>
                                            <pre className="text-xs opacity-50 truncate font-mono bg-black/20 p-2 rounded-lg">{q.sql}</pre>
                                        </GlassCard>
                                    ))}
                                    {myQueries.length === 0 && <div className="col-span-2 text-center py-20 opacity-30 font-bold uppercase tracking-widest">No saved queries yet</div>}
                                </div>
                            </GlassCard>
                        )}

                        {activeView === 'run' && (
                            <GlassCard theme={theme} className="flex-grow p-8 flex flex-col gap-6 shadow-2xl">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Query Editor</h2>
                                    <div className="flex gap-3">
                                        <GlassButton theme={theme} variant="secondary" onClick={() => setRunQueryText('')}>Clear</GlassButton>
                                        <GlassButton theme={theme} variant="primary" className="px-8 shadow-lg shadow-blue-500/20">Execute SQL</GlassButton>
                                    </div>
                                </div>
                                <textarea value={runQueryText} onChange={e => setRunQueryText(e.target.value)} className="flex-grow w-full p-6 bg-black/30 border border-white/5 rounded-2xl font-mono text-blue-100 focus:outline-none focus:border-blue-500/50 resize-none shadow-inner" placeholder="-- Enter your custom SQL here..." />
                            </GlassCard>
                        )}

                        {activeView === 'history' && (
                            <RecentQueries queryHistory={queryHistory} onSaveTemplate={handleSaveAsTemplate} theme={theme} user={user} />
                        )}

                        {activeView === 'automation' && (
                            <AutomationPanel theme={theme} currentUser={user.email} availablePortals={userData.portals || []} query={generatedQuery} />
                        )}
                    </div>
                </main>
            </div>
            
            <GlassCard theme={theme} className="px-6 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-40">
                <div className="flex gap-4"><span>Ready</span><span className="text-blue-500">{user.email}</span></div>
                <div>v0.1.0-alpha</div>
            </GlassCard>

            {toast && <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right duration-300"><GlassCard theme={theme} className="px-6 py-4 bg-blue-600 text-white border-blue-400/30 shadow-2xl shadow-blue-500/40">{toast}</GlassCard></div>}
        </div>
    );
}
