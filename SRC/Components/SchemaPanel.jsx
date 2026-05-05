// SRC/Components/SchemaPanel.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PythonAPI } from '/SRC/Services/PythonAPI.js';
import { useDebounce } from '../Services/useDebounce.js';
import {
    SearchIcon, CodeIcon, LogoutIcon, CopyIcon, PlusCircleIcon,
    AdminIcon, SaveIcon, FeedbackIcon, PlayIcon, AlertTriangleIcon, HistoryIcon
} from './UI/Icons.jsx';
import { FeedbackModal } from './UI/Modals.jsx';
import { CollapsibleSection, InfoTooltip, Highlight, CodeBlock, SearchableDropdown } from './UI/UIHelpers.jsx';
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

// FIX: Moved PasteQueryModal outside of SchemaPanel to prevent re-rendering on every keystroke.
function PasteQueryModal({ theme, pasteQueryName, setPasteQueryName, pasteQuerySQL, setPasteQuerySQL, handlePasteQuery, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full mx-4`}>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Paste Custom Query
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Query Name
                        </label>
                        <input
                            type="text"
                            value={pasteQueryName}
                            onChange={e => setPasteQueryName(e.target.value)}
                            placeholder="e.g., Sales Report Q4"
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-400'} rounded-lg`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            SQL Query
                        </label>
                        <textarea
                            value={pasteQuerySQL}
                            onChange={e => setPasteQuerySQL(e.target.value)}
                            placeholder="SELECT * FROM schema.table WHERE..."
                            rows="10"
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-400'} rounded-lg font-mono text-sm`}
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        Cancel
                    </button>
                    <button onClick={handlePasteQuery} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        Save Query
                    </button>
                </div>
            </div>
        </div>
    );
}

// Edit Query Modal Component
function EditQueryModal({ theme, query, onSave, onClose }) {
    const [editedName, setEditedName] = React.useState(query.name);
    const [editedSQL, setEditedSQL] = React.useState(query.sql);

    const handleSave = () => {
        if (!editedName.trim() || !editedSQL.trim()) {
            alert('Query name and SQL cannot be empty');
            return;
        }
        onSave(query.id, editedName, editedSQL);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full mx-4`}>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Edit Query
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Query Name
                        </label>
                        <input
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-400'} rounded-lg`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            SQL Query
                        </label>
                        <textarea
                            value={editedSQL}
                            onChange={e => setEditedSQL(e.target.value)}
                            rows="10"
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-400'} rounded-lg font-mono text-sm`}
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

const DEBUG = false; // Set to true for development logging

export default function SchemaPanel({ user, userData, onLogout, onAdminView, theme, setTheme }) {
    // --- STATE MANAGEMENT START ---

    // Load saved state on mount
    const savedState = StateManager.loadBuilderState(user.email);
    
    // FIX: Load activeView from saved state too
    const [activeView, setActiveView] = useState(savedState?.activeView || 'explorer');

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const [query, setQuery] = useState(() => {
        if (savedState?.query) {
            const restoredQuery = { ...savedState.query };
            
            // FIX: Better conversion logic
            if (restoredQuery.columns && typeof restoredQuery.columns === 'object') {
                const properColumns = {};
                
                for (const [alias, cols] of Object.entries(restoredQuery.columns)) {
                    // Normalize to array first to handle Set, Array, or other iterables
                    let colsArray = [];
                    if (Array.isArray(cols)) {
                        colsArray = cols;
                    } else if (cols instanceof Set) {
                        colsArray = Array.from(cols);
                    } else if (cols && typeof cols === 'object') {
                        try {
                            colsArray = Array.from(cols);
                        } catch (e) {
                            colsArray = [];
                        }
                    }

                    // Map to proper structure
                    properColumns[alias] = colsArray.map(col => {
                        if (typeof col === 'string') {
                            return { name: col, alias: '' };
                        } else if (col && typeof col === 'object') {
                            return { name: col.name || '', alias: col.alias || '' };
                        }
                        return { name: '', alias: '' };
                    });
                }
                
                restoredQuery.columns = properColumns;
            } else {
                // No columns at all
                restoredQuery.columns = {};
            }
            
            if (DEBUG) console.log("🔍 Pre-validation joins type:", typeof restoredQuery.joins, "isArray:", Array.isArray(restoredQuery.joins));
            // Ensure all required properties exist with correct defaults
            if (!restoredQuery.subqueries) restoredQuery.subqueries = [];
            if (!restoredQuery.ctes) restoredQuery.ctes = [];
            restoredQuery.functions = Array.isArray(restoredQuery.functions) ? restoredQuery.functions : [];
            restoredQuery.joins = Array.isArray(restoredQuery.joins) ? restoredQuery.joins : [];
            restoredQuery.wheres = Array.isArray(restoredQuery.wheres) ? restoredQuery.wheres : [];
            restoredQuery.groupBys = Array.isArray(restoredQuery.groupBys) ? restoredQuery.groupBys : [];
            restoredQuery.havings = Array.isArray(restoredQuery.havings) ? restoredQuery.havings : [];
            restoredQuery.orderBys = Array.isArray(restoredQuery.orderBys) ? restoredQuery.orderBys : [];

            // Fix duplicate JOIN aliases from previously saved state
            const seenAliases = new Set(['t1']);
            restoredQuery.joins = restoredQuery.joins.map(join => {
                if (!join.alias || seenAliases.has(join.alias)) {
                    // Generate new unique alias
                    let i = 2;
                    while (seenAliases.has(`t${i}`)) i++;
                    join.alias = `t${i}`;
                }
                seenAliases.add(join.alias);
                return join;
            });

            // Ensure scalar properties have defaults
            if (!restoredQuery.schema) restoredQuery.schema = '';
            if (!restoredQuery.table) restoredQuery.table = '';
            if (!restoredQuery.tableAlias) restoredQuery.tableAlias = 't1';
            if (!restoredQuery.limit) restoredQuery.limit = '';
            if (typeof restoredQuery.distinct !== 'boolean') restoredQuery.distinct = false;

            return restoredQuery;
        }

        // Default initial state
        return {
            schema: '',
            table: '',
            tableAlias: 't1',
            columns: {},
            distinct: false,
            functions: [],
            joins: [],
            wheres: [],
            groupBys: [],
            havings: [],
            orderBys: [],
            limit: '',
            ctes: [],
            subqueries: []
        };
    });

    const [runQueryText, setRunQueryText] = useState(savedState?.runQueryText || '');

    // FIX: Save state whenever query, runQueryText, OR activeView changes (debounced for performance)
    const saveTimerRef = useRef(null);
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            const state = {
                query,
                runQueryText,
                activeView
            };
            StateManager.saveBuilderState(state, user.email);
        }, 500); // Save after 500ms of no changes
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [query, runQueryText, activeView, user.email]);

    // FIX: Wrapper for setActiveView that ensures state is saved before switching
    const handleViewChange = (newView) => {
        // Save current state before switching
        const state = {
            query,
            runQueryText,
            activeView: newView
        };
        StateManager.saveBuilderState(state, user.email);

        // Then switch view
        setActiveView(newView);
    };

    // --- STATE MANAGEMENT END ---

    // Helper function to generate unique table alias for JOINs
    const getNextAlias = (joins) => {
        // t1 is always the main table, so start checking from t2
        const existingAliases = (joins || []).map(j => j.alias).filter(Boolean);
        const usedAliases = new Set(['t1', ...existingAliases]);

        let i = 2;
        while (usedAliases.has(`t${i}`)) {
            i++;
        }
        return `t${i}`;
    };

    const [copySuccess, setCopySuccess] = useState('');
    const [clauseToAdd, setClauseToAdd] = useState('WHERE');
    const [showCTEs, setShowCTEs] = useState(false);
    const [myQueries, setMyQueries] = useState([]);
    const [saveQueryName, setSaveQueryName] = useState('');
    const [columnSearch, setColumnSearch] = useState({});
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [sqlError, setSqlError] = useState('');
    const [pasteQueryName, setPasteQueryName] = useState('');
    const [pasteQuerySQL, setPasteQuerySQL] = useState('');
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [editQueryModal, setEditQueryModal] = useState(null);
    const [queryKey, setQueryKey] = useState(Date.now());
    const [showValidation, setShowValidation] = useState(false);
    const [showExportImport, setShowExportImport] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [editingSubquery, setEditingSubquery] = useState(null);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [hideQuickActions, setHideQuickActions] = useState(false);
    const [savedQueriesSearch, setSavedQueriesSearch] = useState('');
    const [premadeQueriesSearch, setPremadeQueriesSearch] = useState('');
    const [showHelpSystem, setShowHelpSystem] = useState(false);

    useEffect(() => {
        const showOnStartup = localStorage.getItem('helpShowOnStartup');
        if (showOnStartup === 'true') {
            setShowHelpSystem(true);
        }
    }, []);

    const listRef = useRef(null);
    const [expandedSchemas, setExpandedSchemas] = useState({});
    const [expandedTables, setExpandedTables] = useState({});

    const [queryHistory, setQueryHistory] = useState([]);
    
    const [userTemplates, setUserTemplates] = useState([]);

    // --- DRAG & DROP TAB SWITCHING ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragHoverTab, setDragHoverTab] = useState(null);
    const tabSwitchTimeoutRef = useRef(null);

    // Handle drag start (when user starts dragging a column)
    const handleGlobalDragStart = (e) => {
        setIsDragging(true);
    };

    // Handle drag end (when user drops or cancels)
    const handleGlobalDragEnd = (e) => {
        setIsDragging(false);
        setDragHoverTab(null);
        if (tabSwitchTimeoutRef.current) {
            clearTimeout(tabSwitchTimeoutRef.current);
        }
    };

    // Setup global drag listeners
    useEffect(() => {
        document.addEventListener('dragstart', handleGlobalDragStart);
        document.addEventListener('dragend', handleGlobalDragEnd);
        
        return () => {
            document.removeEventListener('dragstart', handleGlobalDragStart);
            document.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    // Handle tab button drag over
    const handleTabDragOver = (e, tabName) => {
        if (!isDragging) return;
        e.preventDefault();
        
        if (tabName === activeView) return;
        if (dragHoverTab === tabName) return; // Already waiting to switch

        setDragHoverTab(tabName);
        
        if (tabSwitchTimeoutRef.current) {
            clearTimeout(tabSwitchTimeoutRef.current);
        }
        
        tabSwitchTimeoutRef.current = setTimeout(() => {
            handleViewChange(tabName);
            setDragHoverTab(null);
        }, 500);
    };

    const handleTabDragLeave = () => {
        setDragHoverTab(null);
        if (tabSwitchTimeoutRef.current) {
            clearTimeout(tabSwitchTimeoutRef.current);
        }
    };
    // --------------------------------

    // --- FLOATING DROP ZONES HANDLERS ---
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddSuggestedColumn = (columnName) => {
        // Column name comes without table prefix now
        handleAddColumn('t1', columnName);
        showToast(`Added suggested column: ${columnName}`);
    };

    const handleAddSuggestedJoin = (joinDetails) => {
        if (DEBUG) console.log(' Adding suggested join:', joinDetails);
        if (DEBUG) console.log(' Current query.joins:', query.joins);

        setQuery(prev => {
            const nextAlias = getNextAlias(prev.joins);
            
            // Parse the joinOn string (e.g., "builder_rootdata._id = auditlog._id")
            const joinOnParts = joinDetails.joinOn?.split('=') || [];
            const onLeft = joinOnParts[0]?.trim() || '';
            const onRight = joinOnParts[1]?.trim() || '';
            
            const newJoin = {
                id: Date.now(),
                type: joinDetails.type || 'INNER JOIN',
                targetSchema: joinDetails.schema || prev.schema,
                targetTable: joinDetails.table,
                onLeft: onLeft,  // Ã¢Å“â€¦ Parsed from joinOn
                onRight: onRight, // Ã¢Å“â€¦ Parsed from joinOn
                alias: nextAlias
            };

            if (DEBUG) console.log('⚙️ Creating new join:', newJoin);

            const newState = {
                ...prev,
                columns: {
                    ...(prev.columns || {}), // ✅ Add safety check
                    [nextAlias]: []
                },
                joins: [...(prev.joins || []), newJoin]
            };

            if (DEBUG) console.log('⚙️ New state:', newState);
            return newState;
        });
        showToast(`Added suggested join: ${joinDetails.table}`);
    };

    const refreshMyQueries = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/load-queries?userEmail=${user.email}&type=my_queries`);
            const result = await response.json();
            if (DEBUG) console.log('⚙️ Backend response:', result);
            // FIX: Backend returns 'data', not 'queries'
            setMyQueries(result.data || []);
        } catch (error) {
            console.error('Failed to refresh queries:', error);
        }
    };

    const handleImportQueries = async (importedQueries, options) => {
        try {
            // Handle duplicates
            let queriesToAdd = importedQueries;
            if (options.mergeDuplicates) {
                const existingSQL = new Set(myQueries.map(q => q.sql || q.queryText));
                queriesToAdd = importedQueries.filter(q => !existingSQL.has(q.sql || q.queryText));
            }

            if (queriesToAdd.length === 0) {
                alert('No new queries to import (all duplicates).');
                return;
            }

            // Process imported queries
            const processedQueries = queriesToAdd.map(q => ({
                ...q,
                id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                user: user.email,
                timestamp: options.updateTimestamp ? new Date().toISOString() : q.timestamp
            }));

            setQueryHistory(prev => [...processedQueries, ...prev]); // This is for the recent history tab
            // Ã¢Å“â€¦ FIX: Save to myQueries instead of queryHistory
            setMyQueries(prev => [...processedQueries, ...prev]);

            // Save to backend
            await fetch('http://localhost:5000/api/import-queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.email,
                    queries: processedQueries,
                    options
                })
            });

            await refreshMyQueries(); // Ã¢Å“â€¦ Refresh from backend
            alert(`Successfully imported ${processedQueries.length} queries!`);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import queries: ' + error.message);
        }
    };

    const addQueryToHistory = async (sql, success = true, executionTime = null, rowsReturned = null) => {
        if (!sql || !user?.email) return;

        // Prevent duplicate saves within 10 seconds
        const recentDuplicate = queryHistory.find(q =>
            q.sql === sql &&
            Date.now() - new Date(q.timestamp).getTime() < 10000
        );
        if (recentDuplicate) {
            if (DEBUG) console.log('⚠️ Skipping duplicate query save');
            return;
        }

        const entry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sql: sql,
            queryText: sql,
            name: 'Query Run',
            timestamp: new Date().toISOString(),
            time: new Date().toISOString(),
            user: user.email,
            success,
            favorite: false,
            tags: [],
            executionTime,
            rowsReturned
        };
    
        try {
            await PythonAPI.saveQuery(user.email, 'recent', entry);
            setQueryHistory(prev => [entry, ...prev].slice(0, 50));
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    };

    const handleUpdateQuery = async (queryId, updates) => {
        // Update local state
        setQueryHistory(prev => prev.map(q => q.id === queryId ? { ...q, ...updates } : q));
        
        // Save to backend
        try {
            await PythonAPI.updateQuery(user.email, 'recent', queryId, updates);
        } catch (error) {
            console.error('Failed to update query:', error);
        }
    };

    const handleDeleteHistoryQuery = async (queryId) => {
        if (!confirm('Delete this query?')) return;
        
        setQueryHistory(prev => prev.filter(q => q.id !== queryId));
        await PythonAPI.deleteQuery(user.email, 'recent', queryId);
    };

    useEffect(() => {
        if (runQueryText) {
            const parenCount = (runQueryText.match(/\(/g) || []).length - (runQueryText.match(/\)/g) || []).length;
            const quoteCount = (runQueryText.match(/'/g) || []).length % 2;
            let errorMsg = '';
            if (parenCount > 0) errorMsg = 'Warning: Mismatched opening parenthesis.';
            if (parenCount < 0) errorMsg = 'Warning: Mismatched closing parenthesis.';
            if (quoteCount !== 0) errorMsg = 'Warning: Unclosed single quote.';
            setSqlError(errorMsg);
        } else {
            setSqlError('');
        }
    }, [runQueryText]);

    useEffect(() => {
        const loadMyQueries = async () => {
            if (!user?.email) return;
            try {
                const result = await PythonAPI.loadQueries(user.email, 'my_queries');
                if (result.status === 'success') setMyQueries(result.data || []);
            } catch (error) {
                console.error('Error loading queries:', error);
            }
        };
        loadMyQueries();
    }, [user?.email]);

    useEffect(() => {
        const loadQueryHistory = async () => {
            if (!user?.email) return;
            try {
                const result = await PythonAPI.loadQueries(user.email, 'recent');
                if (result.status === 'success') {
                    setQueryHistory(Array.isArray(result.data) ? result.data : []);
                }
            } catch (error) {
                console.error('Error loading history:', error);
            }
        };
        loadQueryHistory();
    }, [user?.email]);

    // Load templates from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('user_query_templates');
        if (saved) {
            try {
                setUserTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing templates', e);
            }
        }
    }, []);

    const saveTemplatesToStorage = (templates) => {
        localStorage.setItem('user_query_templates', JSON.stringify(templates));
        setUserTemplates(templates);
    };

    const handleLoadTemplate = (sql) => {
        setRunQueryText(sql);
        handleViewChange('run');
    };

    const handleSaveTemplate = (template) => {
        const newTemplates = [...userTemplates, template];
        saveTemplatesToStorage(newTemplates);
    };

    const handleDeleteTemplate = (templateId) => {
        const newTemplates = userTemplates.filter(t => t.id !== templateId);
        saveTemplatesToStorage(newTemplates);
    };

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        'ctrl+enter': () => {
            handleViewChange('run');
            setRunQueryText(generatedQuery);
        },
        'ctrl+s': (e) => {
            e.preventDefault();
            if (activeView !== 'saved') handleViewChange('saved');
            // Focus save input if possible, or just switch view
        },
        'ctrl+k': (e) => {
            e.preventDefault();
            copyToClipboard(generatedQuery);
        },
        'escape': () => {
            setShowFeedbackModal(false);
            setShowPasteModal(false);
            setEditQueryModal(null);
            setEditingSubquery(null);
            setShowValidation(false);
            setShowShortcuts(false);
        },
        'ctrl+/': (e) => {
            e.preventDefault();
            setShowShortcuts(true);
        },
        'ctrl+1': () => handleViewChange('explorer'),
        'ctrl+2': () => handleViewChange('builder'),
        'ctrl+3': () => handleViewChange('saved'),
        'ctrl+4': () => handleViewChange('run'),
        'ctrl+shift+v': () => handleValidateQuery(),
        'ctrl+shift+c': () => {
            if (confirm('Clear all query fields?')) {
                setQuery(resetQueryState());
                setRunQueryText('');
                StateManager.clearBuilderState(user.email);
                setValidationResult(null);
                setShowValidation(false);
            }
        }
    }, true);

    
    const handleSaveMyQuery = async () => {
        if (!saveQueryName) {
            alert('Please enter a name for your query.');
            return;
        }
        const newQuery = { 
            id: `my-query-${Date.now()}`, 
            name: saveQueryName, 
            sql: generatedQuery, 
            queryState: query 
        };
        
        try {
            await PythonAPI.saveQuery(user.email, 'my_queries', newQuery);
            setMyQueries(prev => [...prev, newQuery]);
            setSaveQueryName('');
            await addQueryToHistory(generatedQuery);
        } catch (error) {
            console.error('Error saving query:', error);
            alert('Failed to save query. Please try again.');
        }
    };

    const handleEditQuery = async (queryId, newName, newSQL) => {
        try {
            const updatedQueries = myQueries.map(q => 
                q.id === queryId 
                    ? { ...q, name: newName, sql: newSQL }
                    : q
            );
            
            // Save all queries back
            for (const q of updatedQueries) {
                await PythonAPI.saveQuery(user.email, 'my_queries', q);
            }
            
            setMyQueries(updatedQueries);
            setEditQueryModal(null);
        } catch (error) {
            console.error('Error editing query:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    const handleDeleteMyQuery = async (id) => {
        try {
            await PythonAPI.deleteQuery(user.email, 'my_queries', id);
            
            // Ã¢Å“â€¦ Immediate state update + backend refresh
            setMyQueries(prev => prev.filter(q => q.id !== id)); // This updates the UI immediately
            
            // Then refresh from backend to sync
            setTimeout(() => refreshMyQueries(), 100);
            
            showToast('Query deleted successfully');
        } catch (error) {
            console.error('Error deleting query:', error);
            alert('Failed to delete query. Please try again.');
        }
    };

    const handleLoadQuery = (savedQuery) => {
        if (savedQuery.queryState) {
            setQuery(savedQuery.queryState);
            setQueryKey(savedQuery.id || Date.now());
            // Use handleViewChange for consistent state saving
            handleViewChange('builder');
        } else {
            setRunQueryText(savedQuery.sql);
            handleViewChange('run');
        }
    };

    const handleCopyToBuilder = (savedQuery) => {
        if (savedQuery.queryState) {
            // Has full builder state - restore it
            setQuery(savedQuery.queryState);
            setQueryKey(savedQuery.id || Date.now());
            handleViewChange('builder');
        } else {
            // Just has SQL - copy to run query
            setRunQueryText(savedQuery.sql);
            handleViewChange('run');
        }
    };

    const handlePasteQuery = async () => {
        if (!pasteQueryName || !pasteQuerySQL) {
            alert('Please enter both a name and SQL query.');
            return;
        }
        
        const newQuery = {
            id: `pasted-query-${Date.now()}`,
            name: pasteQueryName,
            sql: pasteQuerySQL,
            queryState: null
        };
        
        try {
            await PythonAPI.saveQuery(user.email, 'my_queries', newQuery);
            setMyQueries(prev => [...prev, newQuery]);
            setPasteQueryName('');
            setPasteQuerySQL('');
            setShowPasteModal(false);
        } catch (error) {
            console.error('Error saving pasted query:', error);
            alert('Failed to save query. Please try again.');
        }
    };

    const handleSuggestQuery = (query) => {
        const text = `[Query Suggestion]\nName: ${query.name}\n\nSQL:\n${query.sql}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Query suggestion copied to clipboard! Please paste it into an email to the administrator.');
        });
    };

    const userLevel = user.isAdmin ? 'Advanced' : user.permissions?.level || 'Beginner';

    const resetQueryState = () => ({ 
        schema: '', 
        table: '',
        tableAlias: 't1',
        columns: {},  // Empty object
        distinct: false, 
        functions: [], 
        joins: [], 
        wheres: [], 
        groupBys: [], 
        havings: [], 
        orderBys: [],
        limit: '',
        ctes: [],
        subqueries: []
    });

    // Helper to detect and format multiple values
    const parseMultipleValues = (value) => {
        if (!value) return value;
        
        // Normalize value by replacing newlines with spaces for easier separation detection
        value = value.replace(/\n/g, ' ');

        let separatorRegex;
        
        // 1. Prioritize semicolon (;) as the separator for robustness
        if (value.includes(';')) {
            separatorRegex = /;/;
        } 
        // 2. Fall back to comma (,) as the separator
        else if (value.includes(',')) {
            separatorRegex = /,/;
        }
        // 3. Fall back to whitespace (space, tab, etc.)
        else if (/\s+/.test(value)) {
            separatorRegex = /\s+/;
        } else {
            return value; // Single value or empty
        }

        // Split based on the determined separator
        let values = value.split(separatorRegex).map(v => v.trim()).filter(Boolean);

        if (values.length <= 1) {
            return value; // Only one value after splitting
        }
        
        // Format values (wrap in single quotes)
        const formattedValues = values.map(v => {
            // Remove existing quotes if present and re-quote
            v = v.replace(/^['"]|['"]$/g, '');
            return `'${v}'`;
        });
        
        return formattedValues.join(', ');
    };

    const handleQueryChange = (field, value) => {
        if (field === 'schema') {
            setQuery({ ...resetQueryState(), schema: value });
        } else if (field === 'table') {
            // Initialize with t1 alias when table is selected
            setQuery(prev => ({
                ...prev,
                table: value,
                columns: { t1: [] },  // Initialize t1 with empty array
                functions: [],
                joins: [],
                wheres: [],
                groupBys: [],
                havings: [],
                orderBys: []
            })); // ctes are preserved
        } else if (field === 'limit') {
            const num = value.replace(/[^0-9]/g, '');
            setQuery(prev => ({ ...prev, limit: num }));
        } else if (field === 'distinct') {
            setQuery(prev => ({ ...prev, distinct: value }));
        }
    };

    const addSpecificClause = (type, data) => {
        setQuery(prev => {
            const newClause = { ...data, id: Date.now() };
            return { ...prev, [type]: [...prev[type], newClause] };
        });
    };

    const handleAddColumn = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];

            // Check if column already exists
            if (!tableColumns.find(col => col.name === columnName)) {
                newColumns[tableAlias] = [
                    ...tableColumns,
                    { name: columnName, alias: '' }
                ];
            }

            return { ...prev, columns: newColumns };
        });
    };

    const handleRemoveColumn = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];
            newColumns[tableAlias] = tableColumns.filter(col => col.name !== columnName);
            return { ...prev, columns: newColumns };
        });
    };

    const handleColumnToggle = (tableAlias, columnName) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];

            const existingIndex = tableColumns.findIndex(col => col.name === columnName);
            if (existingIndex >= 0) {
                // Remove column
                newColumns[tableAlias] = tableColumns.filter((_, i) => i !== existingIndex);
            } else {
                // Add column
                newColumns[tableAlias] = [...tableColumns, { name: columnName, alias: '' }];
            }

            return { ...prev, columns: newColumns };
        });
    };

    const toggleSelectAllColumns = (tableAlias, columns) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];

            if (tableColumns.length === columns.length) {
                // Deselect all
                newColumns[tableAlias] = [];
            } else {
                // Select all
                newColumns[tableAlias] = columns.map(col => ({ name: col, alias: '' }));
            }

            return { ...prev, columns: newColumns };
        });
    };

    const handleColumnAliasChange = (tableAlias, columnName, newAlias) => {
        setQuery(prev => {
            const newColumns = { ...prev.columns };
            const tableColumns = newColumns[tableAlias] || [];

            newColumns[tableAlias] = tableColumns.map(col =>
                col.name === columnName
                    ? { ...col, alias: newAlias }
                    : col
            );

            return { ...prev, columns: newColumns };
        });
    };

    // Subquery Helpers
    const addWhereInSubquery = (column) => {
        const newSubquery = {
            id: `sub-${Date.now()}`,
            type: 'WHERE_IN',
            targetColumn: column,
            query: {
                columns: [],
                table: '',
                where: [],
                groupBy: [],
                orderBy: [],
                limit: '',
                distinct: false
            }
        };
        setEditingSubquery(newSubquery);
    };

    const addWhereExistsSubquery = () => {
        const newSubquery = {
            id: `sub-${Date.now()}`,
            type: 'WHERE_EXISTS',
            query: {
                columns: new Set(['1']),
                table: '',
                where: [],
                groupBy: [],
                orderBy: [],
                limit: '',
                distinct: false
            }
        };
        setEditingSubquery(newSubquery);
    };

    const saveSubquery = (subquery) => {
        const existingIndex = query.subqueries.findIndex(s => s.id === subquery.id);
        let newSubqueries;
        
        if (existingIndex >= 0) {
            newSubqueries = [...query.subqueries];
            newSubqueries[existingIndex] = subquery;
        } else {
            newSubqueries = [...query.subqueries, subquery];
        }
        
        setQuery({ ...query, subqueries: newSubqueries });
    };

    const deleteSubquery = (subqueryId) => {
        setQuery({
            ...query,
            subqueries: query.subqueries.filter(s => s.id !== subqueryId)
        });
    };

    const generateSubquerySQL = (subquery) => {
        const q = subquery.query;
        let sql = '';

        // SELECT
        if (q.columns.size === 0) {
            sql += q.distinct ? 'SELECT DISTINCT *' : 'SELECT *';
        } else {
            sql += q.distinct ? 'SELECT DISTINCT ' : 'SELECT ';
            sql += Array.from(q.columns).join(', ');
        }

        // FROM
        if (q.table) {
            sql += ` FROM ${q.table}`;
            if (q.tableAlias) sql += ` AS ${q.tableAlias}`;
        }

        // WHERE
        if (q.where && q.where.length > 0) {
            const validConditions = q.where.filter(w => w.column && w.values);
            if (validConditions.length > 0) {
                sql += ' WHERE ' + validConditions.map(w => 
                    `${w.column} ${w.operator} ${w.values}`
                ).join(' AND ');
            }
        }

        // GROUP BY
        if (q.groupBy && q.groupBy.length > 0) {
            sql += ' GROUP BY ' + q.groupBy.join(', ');
        }

        // HAVING
        if (q.having && q.having.length > 0) {
            const validConditions = q.having.filter(h => h.column && h.values);
            if (validConditions.length > 0) {
                sql += ' HAVING ' + validConditions.map(h => 
                    `${h.column} ${h.operator} ${h.values}`
                ).join(' AND ');
            }
        }

        // ORDER BY
        if (q.orderBy && q.orderBy.length > 0) {
            sql += ' ORDER BY ' + q.orderBy.map(o => 
                `${o.column} ${o.direction}`
            ).join(', ');
        }

        // LIMIT
        if (q.limit) {
            sql += ` LIMIT ${q.limit}`;
        }

        return sql;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const handleClauseChange = (type, id, field, value) => {
        setQuery(prev => {
            const updatedClauses = (prev[type] || []).map(clause => {
                if (clause.id === id) {
                    const newClause = { ...clause, [field]: value };
                    // If changing function to CASE, initialize its builder state
                    if (type === 'functions' && field === 'func' && value === 'CASE') {
                        newClause.caseStatement = { conditions: [{ when: '', then: '' }], else: '' };
                    }
                    return newClause;
                }
                return clause;
            });
            return { ...prev, [type]: updatedClauses };
        });
    };

    const addClause = () => {
        // Special handling for JOIN
        if (clauseToAdd === 'JOIN') {
            setQuery(prev => {
                const nextAlias = getNextAlias(prev.joins);
                const newJoin = {
                    id: Date.now(),
                    type: 'INNER JOIN',
                    targetSchema: prev.schema,
                    targetTable: '',
                    onLeft: '',
                    onRight: '',
                    alias: nextAlias
                };

                return {
                    ...prev,
                    columns: {
                        ...prev.columns,
                        [nextAlias]: []
                    },
                    joins: [...(prev.joins || []), newJoin]
                };
            });
            setClauseToAdd('');
            return;
        }

        setQuery(prev => {
            let newClause;
            let type;
            
            // All other clause types
            switch (clauseToAdd) {
                case 'WHERE':
                    type = 'wheres';
                    newClause = { id: Date.now(), tableAlias: 't1', column: '', operator: '=', value: '' };
                    break;
                case 'GROUP BY':
                    type = 'groupBys';
                    newClause = { id: Date.now(), tableAlias: 't1', column: '' };
                    break;
                case 'HAVING':
                    type = 'havings';
                    newClause = { id: Date.now(), column: '', operator: '=', value: '' };
                    break;
                case 'ORDER BY':
                    type = 'orderBys';
                    newClause = { id: Date.now(), tableAlias: 't1', column: '', direction: 'ASC' };
                    break;
                case 'FUNCTION':
                    type = 'functions';
                    newClause = { id: Date.now(), func: 'UPPER', args: [''], alias: '', window: { partitionBy: [], orderBy: [] } };
                    break;
                default:
                    if (DEBUG) console.log('Unknown clause type:', clauseToAdd);
                    return prev;
            }
            
            const newState = { 
                ...prev, 
                [type]: [...prev[type], newClause] 
            };
            return newState;
        });
    };

    const removeClause = (type, id) => {
        if (type === 'joins') {
            const joinToRemove = query.joins?.find(j => j.id === id);
            if (joinToRemove) {
                setQuery(prev => {
                    const newColumns = { ...prev.columns };
                    delete newColumns[joinToRemove.alias];
                    return { 
                        ...prev, 
                        columns: newColumns, 
                        [type]: (prev[type] || []).filter(c => c.id !== id) 
                    };
                });
            }
        } else {
            setQuery(prev => ({ 
                ...prev, 
                [type]: (prev[type] || []).filter(c => c.id !== id) 
            }));
        }
    };

    const visibleData = useMemo(() => {
        if (!userData.schemaData) return null;
        if (user.isAdmin) return userData.schemaData;
        const userPermissions = new Set(user.permissions?.schemas || []);
        const filtered = {};
        for (const schemaName of userPermissions) {
            if (userData.schemaData[schemaName]) {
                filtered[schemaName] = userData.schemaData[schemaName];
            }
        }
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

                if (tableMatches || matchingColumns.length > 0) {
                    filteredTables[tableName] = tableMatches ? columns : matchingColumns;
                }
            }

            if (schemaMatches || Object.keys(filteredTables).length > 0) {
                filtered[schemaName] = schemaMatches ? tables : filteredTables;
            }
        }
        return filtered;
    }, [visibleData, debouncedSearchTerm]);

    const flattenedSchemaData = useMemo(() => {
        const tables = {};
        Object.values(visibleData || {}).forEach(schema => {
            Object.entries(schema).forEach(([tableName, columns]) => {
                tables[tableName] = columns.map(col => col.name || col);
            });
        });
        return tables;
    }, [visibleData]);

    // Check for CTE dependencies and validate
    const validateCTEDependencies = () => {
        const errors = [];
        const warnings = [];
        
        if (!query.ctes) return { errors, warnings };

        query.ctes.forEach((cte, index) => {
            // Check for empty names
            if (!cte.name || cte.name.trim() === '') {
                errors.push(`CTE #${index + 1} has no name`);
                return; // Skip other checks for this CTE
            }

            // Check for duplicate names (only report once)
            if (index === 0 || !query.ctes.slice(0, index).some(c => c.name === cte.name)) {
                const duplicates = query.ctes.filter(c => c.name === cte.name);
                if (duplicates.length > 1) {
                    errors.push(`Duplicate CTE name: "${cte.name}"`);
                }
            }
            
            // Check if CTE references future CTEs (circular dependency)
            const laterCTENames = query.ctes.slice(index + 1).map(c => c.name);
            if (cte.query && cte.query.table && laterCTENames.includes(cte.query.table)) {
                errors.push(`CTE "${cte.name}" references a CTE defined after it: "${cte.query.table}"`);
            }
            
            // Check if CTE is used
            const isUsedInMainQuery = query.table === cte.name || 
                (query.joins || []).some(j => j.targetTable === cte.name);
            const isUsedInOtherCTEs = query.ctes.some((otherCTE, i) => 
                i !== index && otherCTE.query && (
                    otherCTE.query.table === cte.name ||
                    (otherCTE.query.joins && otherCTE.query.joins.some(j => j.targetTable === cte.name))
                )
            );
            
            if (!isUsedInMainQuery && !isUsedInOtherCTEs) {
                warnings.push(`CTE "${cte.name}" is defined but not used`);
            }
        });
        
        return { errors, warnings };
    };

    // On-demand validation function
    const handleValidateQuery = () => {
        if (!generatedQuery || generatedQuery.trim() === '' || generatedQuery.includes('/* Select a schema')) {
            alert('Please build a query first before validating.');
            return;
        }
        
        try {
            const baseValidation = QueryValidator.validate(generatedQuery, null);
            const cteValidation = validateCTEDependencies();

            const finalResult = {
                isValid: baseValidation.isValid && cteValidation.errors.length === 0,
                errors: [...baseValidation.errors, ...cteValidation.errors],
                warnings: [...baseValidation.warnings, ...cteValidation.warnings]
            };

            setValidationResult(finalResult);
            setShowValidation(true);
        } catch (error) {
            console.error('Validation error:', error);
            alert('Error validating query. Please check console for details.');
        }
    };

    const levelMap = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    const availableClauses = useMemo(() => {
        const userLevelIndex = levelMap[userLevel];
        return ALL_CLAUSES.filter(clause => levelMap[clause.level] <= userLevelIndex);
    }, [userLevel]);

    const availableFunctions = useMemo(() => {
        if (user.isAdmin) return ALL_FUNCTIONS;
        const level = user.permissions?.level || 'Beginner';
        if (level === 'Advanced') return ALL_FUNCTIONS;
        if (level === 'Intermediate') return ALL_FUNCTIONS.filter(f => f.type !== 'Window');
        return ALL_FUNCTIONS.filter(f => f.type !== 'Window' && f.type !== 'Aggregate');
    }, [user]);

    useEffect(() => {
        if (availableClauses.length > 0) {
            setClauseToAdd(availableClauses[0].name);
        }
    }, [availableClauses]);

    const generatedQuery = useMemo(() => {
        // Helper function to generate SQL for an individual CTE's subquery
        const generateCTESQL = (cteQuery) => {
            if (!cteQuery || !cteQuery.table) return '/* Incomplete CTE */';

            const plainCTEColumns = [];
            for (const alias in cteQuery.columns) {
                const columns = cteQuery.columns[alias] || [];
                columns.forEach(col => {
                    const colName = typeof col === 'string' ? col : col.name;
                    const colAlias = typeof col === 'string' ? '' : col.alias;
                    const fullColName = `${alias}.${colName}`;
                    const colWithAlias = colAlias
                        ? `${fullColName} AS "${colAlias}"`
                        : fullColName;
                    plainCTEColumns.push(colWithAlias);
                });
            }

            let selectedCTEColumns = plainCTEColumns.length > 0 ? plainCTEColumns.join(',\n    ') : 't1.*';
            const distinctCTEClause = cteQuery.distinct ? 'DISTINCT ' : '';

            let sql = `SELECT ${distinctCTEClause}\n    ${selectedCTEColumns}`;
            
            // FROM
            sql += `\n  FROM\n    ${cteQuery.schema}.${cteQuery.table}`;
            if (cteQuery.tableAlias) sql += ` AS ${cteQuery.tableAlias}`;
            else sql += ` AS t1`; // Default alias for CTEs

            // JOIN
            if (cteQuery.joins && cteQuery.joins.length > 0) {
                cteQuery.joins.forEach(j => {
                   if (j.targetTable && j.onLeft && j.onRight) {
                        sql += `\n  ${j.type} ${j.targetSchema}.${j.targetTable} AS ${j.alias} ON t1.${j.onLeft} = ${j.alias}.${j.onRight}`;
                   }
                });
            }

            // WHERE
            if (cteQuery.wheres && cteQuery.wheres.length > 0) {
                const conditions = cteQuery.wheres.map(w => {
                    if (w.column && w.value) {
                         const alias = `${w.tableAlias}.`;
                         
                         // Check for multiple values (newlines, commas, semi-colons)
                         if (w.value.includes(',') || w.value.includes(';') || w.value.includes('\n')) {
                            const parsedValues = parseMultipleValues(w.value);
                            return `${alias}${w.column} IN (${parsedValues})`;
                         }

                         const formattedValue = isNaN(w.value) ? `'${w.value.replace(/'/g, "''")}'` : w.value;
                         return `${alias}${w.column} ${w.operator} ${formattedValue}`;
                    }
                    return null;
                }).filter(Boolean);

                if (conditions.length > 0) {
                    sql += `\n  WHERE\n    ` + conditions.join('\n    AND ');
                }
            }

            // GROUP BY
            if (cteQuery.groupBys && cteQuery.groupBys.length > 0) {
                const columns = cteQuery.groupBys.map(g => g.column && `${g.tableAlias}.${g.column}`).filter(Boolean);
                if (columns.length > 0) {
                    sql += `\n  GROUP BY\n    ` + columns.join(',\n    ');
                }
            }

            // HAVING
            if (cteQuery.havings && cteQuery.havings.length > 0) {
                 const conditions = cteQuery.havings.map(h => {
                    if (h.column && h.value) {
                        // Check for multiple values
                        if (h.value.includes(',') || h.value.includes(';') || h.value.includes('\n')) {
                             const parsedValues = parseMultipleValues(h.value);
                             return `${h.column} IN (${parsedValues})`;
                        }
                        const formattedValue = isNaN(h.value) ? `'${h.value.replace(/'/g, "''")}'` : h.value;
                        return `${h.column} ${h.operator} ${formattedValue}`;
                    }
                    return null;
                 }).filter(Boolean);
                 if (conditions.length > 0) {
                     sql += `\n  HAVING\n    ` + conditions.join('\n    AND ');
                 }
            }
            
            // ORDER BY
            if (cteQuery.orderBys && cteQuery.orderBys.length > 0) {
                const columns = cteQuery.orderBys.map(o => o.column && `${o.tableAlias}.${o.column} ${o.direction}`).filter(Boolean);
                if (columns.length > 0) {
                    sql += `\n  ORDER BY\n    ` + columns.join(', ');
                }
            }
            
            // LIMIT
            if (cteQuery.limit) {
                sql += `\n  LIMIT ${cteQuery.limit}`;
            }

            return sql;
        };

        // --- MAIN QUERY GENERATION ---
        let sql = '';
        
        // 1. WITH Clause
        if (query.ctes && query.ctes.length > 0) {
            const validCTEs = query.ctes.filter(cte => cte.name && cte.query && cte.query.table);
            if (validCTEs.length > 0) {
                sql += 'WITH\n';
                const cteStrings = validCTEs.map(cte => {
                    const cteSQL = generateCTESQL(cte.query);
                    // Indent the CTE body
                    const indentedSQL = cteSQL.split('\n').map(line => `  ${line}`).join('\n');
                    return `  ${cte.name} AS (\n${indentedSQL}\n  )`;
                });
                sql += cteStrings.join(',\n') + '\n\n';
            }
        }

        if (!query.table && !query.subqueries?.some(s => s.type === 'FROM')) return sql + '/* Select a schema and table to begin */';

        // 2. SELECT
        const functionColumns = (query.functions || []).map(f => {
            const funcInfo = ALL_FUNCTIONS.find(info => info.name === f.func);
            if (!funcInfo) return null;
            const alias = f.alias ? ` AS ${f.alias}` : '';
            const processArg = (arg) => {
                const parts = arg.split('.');
                return parts.length > 1 ? arg : (arg.startsWith("'") || !isNaN(arg) ? arg : `t1.${arg}`);
            };
            let funcCall;
            if (funcInfo.args === 0) funcCall = `${f.func}()`;
            else {
                const args = f.args.map(processArg).join(', ');
                funcCall = `${f.func}(${args})`;
            }
            // Handle special CASE logic
            if (f.func === 'CASE' && f.caseStatement) {
                // Placeholder for case logic if needed inside generatedQuery
                // funcCall = generateCaseSQL(f.caseStatement.conditions, f.caseStatement.else);
            }
            return `${funcCall}${alias}`;
        }).filter(Boolean);

        const plainColumns = [];
        for (const alias in query.columns) {
            const columns = query.columns[alias] || [];
            columns.forEach(col => {
                const colName = `${alias}.${col.name}`;
                const colWithAlias = col.alias
                    ? `${colName} AS "${col.alias}"`
                    : colName;
                plainColumns.push(colWithAlias);
            });
        }

        // Select Subqueries
        const selectSubqueries = query.subqueries?.filter(s => s.type === 'SELECT') || [];
        const subqueryColumns = selectSubqueries.map(sub => {
            const subSQL = generateSubquerySQL(sub);
            return `(${subSQL}) AS ${sub.alias}`;
        });

        const allSelectedColumns = [...plainColumns, ...functionColumns, ...subqueryColumns];
        const useAliases = true; 
        
        let selectedColumns = allSelectedColumns.length > 0
            ? allSelectedColumns.join(',\n  ')
            : (useAliases ? 't1.*' : '*');

        if (allSelectedColumns.length === 0 && useAliases && query.joins && Array.isArray(query.joins) && query.joins.length > 0) {
            selectedColumns += ', ' + query.joins.map(j => `${j.alias}.*`).join(', ');
        }

        const distinctClause = query.distinct ? 'SELECT DISTINCT' : 'SELECT';
        sql += `${distinctClause}\n  ${selectedColumns}`;

        // 3. FROM
        const fromSubquery = query.subqueries?.find(s => s.type === 'FROM');
        if (fromSubquery) {
             const subSQL = generateSubquerySQL(fromSubquery);
             const indentedSubSQL = subSQL.split('\n').map(line => `  ${line}`).join('\n');
             sql += `\nFROM (\n${indentedSubSQL}\n) AS ${fromSubquery.alias}`;
        } else {
             sql += `\nFROM\n  ${query.schema}.${query.table} AS t1`;
        }

        // 4. JOIN
        if (query.joins && Array.isArray(query.joins) && query.joins.length > 0) {
            sql += '\n' + query.joins.map(j => {
                if (j.targetTable && j.onLeft && j.onRight) {
                    return `${j.type} ${j.targetSchema}.${j.targetTable} AS ${j.alias} ON t1.${j.onLeft} = ${j.alias}.${j.onRight}`;
                }
                return null;
            }).filter(Boolean).join('\n');
        }

        // 5. WHERE
        let whereStrings = [];
        
        if (query.wheres && Array.isArray(query.wheres) && query.wheres.length > 0) {
            const existingConditions = query.wheres.map(w => {
                if (w.column && w.value) {
                    const alias = useAliases ? `${w.tableAlias}.` : '';
                    
                    // Handle multiple values (newlines, commas, semi-colons)
                    if (w.value.includes(',') || w.value.includes(';') || w.value.includes('\n') || /\s+/.test(w.value.trim())) {
                         const parsedValues = parseMultipleValues(w.value);
                         // If parseMultipleValues returns a string with commas, it implies multiple values
                         if (parsedValues.includes(',')) {
                            return `${alias}${w.column} IN (${parsedValues})`;
                         }
                    }

                    const formattedValue = isNaN(w.value) ? `'${w.value.replace(/'/g, "''")}'` : w.value;
                    return `${alias}${w.column} ${w.operator} ${formattedValue}`;
                }
                return null;
            }).filter(Boolean);
            whereStrings = [...whereStrings, ...existingConditions];
        }

        // Subquery WHEREs
        const whereSubqueries = query.subqueries?.filter(s => 
            s.type === 'WHERE_IN' || s.type === 'WHERE_EXISTS'
        ) || [];
        
        whereSubqueries.forEach(sub => {
            const subSQL = generateSubquerySQL(sub);
            if (sub.type === 'WHERE_IN') {
                whereStrings.push(`${sub.targetColumn} IN (${subSQL})`);
            } else if (sub.type === 'WHERE_EXISTS') {
                whereStrings.push(`EXISTS (${subSQL})`);
            }
        });

        if (whereStrings.length > 0) {
            sql += '\nWHERE\n  ' + whereStrings.join('\n  AND ');
        }

        // 6. GROUP BY
        if (query.groupBys && Array.isArray(query.groupBys) && query.groupBys.length > 0) {
            const columns = query.groupBys.map(g => g.column && (useAliases ? `${g.tableAlias}.${g.column}` : g.column)).filter(Boolean);
            if (columns.length > 0) {
                sql += `\nGROUP BY\n  ` + columns.join(',\n  ');
            }
        }

        // 7. HAVING
        if (query.havings && Array.isArray(query.havings) && query.havings.length > 0) {
             const conditions = query.havings.map(h => {
                if (h.column && h.value) {
                    // Check for multiple values
                    if (h.value.includes(',') || h.value.includes(';') || h.value.includes('\n')) {
                         const parsedValues = parseMultipleValues(h.value);
                         return `${h.column} IN (${parsedValues})`;
                    }
                    const formattedValue = isNaN(h.value) ? `'${h.value.replace(/'/g, "''")}'` : h.value;
                    return `${h.column} ${h.operator} ${formattedValue}`;
                }
                return null;
             }).filter(Boolean);
             if (conditions.length > 0) {
                 sql += `\nHAVING\n  ` + conditions.join('\n  AND ');
             }
        }

        // 8. ORDER BY
        if (query.orderBys && Array.isArray(query.orderBys) && query.orderBys.length > 0) {
            const columns = query.orderBys.map(o => o.column && (useAliases ? `${o.tableAlias}.${o.column}` : o.column) + ` ${o.direction}`).filter(Boolean);
            if (columns.length > 0) {
                sql += `\nORDER BY\n  ` + columns.join(',\n  ');
            }
        }

        // 9. LIMIT
        if (query.limit) {
            sql += `\nLIMIT ${query.limit}`;
        }

        return sql + ';';
    }, [query]);

    const getItemSize = (index) => {
        const schemaNames = Object.keys(searchedData || {});
        const schemaName = schemaNames[index];
        if (!expandedSchemas[schemaName]) return 55;

        const tables = searchedData[schemaName];
        let height = 55;
        Object.keys(tables).forEach(tableName => {
            height += 40;
            if (expandedTables[`${schemaName}-${tableName}`]) {
                height += tables[tableName].length * 42; // Increased height for DraggableColumnItem
            }
        });
        return height;
    };

    const toggleSchema = (schemaName, index) => {
        setExpandedSchemas(prev => ({
            ...prev,
            [schemaName]: !prev[schemaName]
        }));
        if (listRef.current) {
            listRef.current.resetAfterIndex(index);
        }
    };

    const toggleTable = (schemaName, tableName, index) => {
        const key = `${schemaName}-${tableName}`;
        setExpandedTables(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        if (listRef.current) {
            listRef.current.resetAfterIndex(index);
        }
    };

    const renderSchemaExplorer = () => {
        const schemaNames = Object.keys(searchedData || {});

        return (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg flex-grow flex flex-col`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search schemas, tables, or columns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} p-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon theme={theme} />
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto scroll-container">
                    {searchedData && schemaNames.length > 0 ? (
                        <VariableSizeList
                            ref={listRef}
                            height={500}
                            itemCount={schemaNames.length}
                            itemSize={getItemSize}
                            width="100%"
                        >
                            {({ index, style }) => {
                                const schemaName = schemaNames[index];
                                const tables = searchedData[schemaName];
                                const isSchemaExpanded = expandedSchemas[schemaName];

                                return (
                                    <div style={style}>
                                        <div onClick={() => toggleSchema(schemaName, index)} className={`cursor-pointer p-2 font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                            {schemaName} ({Object.keys(tables).length} tables)
                                        </div>
                                        {isSchemaExpanded && (
                                            <div className="ml-6">
                                                {Object.keys(tables).map(tableName => {
                                                    const isTableExpanded = expandedTables[`${schemaName}-${tableName}`];
                                                    return (
                                                        <div key={tableName}>
                                                            <div onClick={() => toggleTable(schemaName, tableName, index)} className={`cursor-pointer p-2 font-semibold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
                                                                {tableName} ({tables[tableName].length} columns)
                                                            </div>
                                                            {isTableExpanded && (
                                                                <ul className="pl-4 space-y-1">
                                                                    {tables[tableName].map((column, colIdx) => (
                                                                        <DraggableColumnItem
                                                                            key={`${tableName}-${column}-${colIdx}`}
                                                                            column={column}
                                                                            table={tableName}
                                                                            schema={schemaName}
                                                                            onAddToQuery={() => handleAddColumn('t1', column)}
                                                                        />
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
                        <p className={`p-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No schemas found or match your search.</p>
                    )}
                </div>
            </div>
        );
    };

    const SubqueryManager = () => {
        const whereSubqueries = query.subqueries?.filter(s => 
            s.type === 'WHERE_IN' || s.type === 'WHERE_EXISTS'
        ) || [];

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Subquery Conditions
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const column = prompt('Enter column name for IN clause:');
                                if (column) addWhereInSubquery(column);
                            }}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            + IN Subquery
                        </button>
                        <button
                            onClick={addWhereExistsSubquery}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            + EXISTS Subquery
                        </button>
                    </div>
                </div>

                {whereSubqueries.map(sub => (
                    <div
                        key={sub.id}
                        className={`${theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'} border rounded p-3`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'} mb-1`}>
                                    {sub.type === 'WHERE_IN' 
                                        ? `WHERE ${sub.targetColumn} IN (...)`
                                        : 'WHERE EXISTS (...)'}
                                </div>
                                <pre className={`text-xs font-mono ${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800 border border-gray-300'} p-2 rounded overflow-x-auto`}>
                                    {generateSubquerySQL(sub)}
                                </pre>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingSubquery(sub)}
                                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteSubquery(sub.id)}
                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderQueryBuilder = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
            <div className="lg:col-span-2">
                {/* Updated CTE Builder Section Layout */}
                <div className="space-y-6">
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg shadow p-4`}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Common Table Expressions (WITH Clause)
                            </h3>
                            <button
                                onClick={() => setShowCTEs(!showCTEs)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                {showCTEs ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        {showCTEs && (
                            <CTEBuilder
                                ctes={query.ctes || []}
                                onCTEsChange={(newCTEs) => setQuery(prev => ({ ...prev, ctes: newCTEs }))}
                                allSchemas={visibleData}
                                userLevel={userLevel}
                                theme={theme}
                            />
                        )}
                    </div>
                
                    {query.ctes && query.ctes.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Main Query
                            </span>
                            <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>
                    )}

                    {/* Smart Suggestions */}
                    <div className="flex justify-end mb-4">
                        <SmartColumnSuggestions
                            selectedColumns={(() => {
                                const cols = query.columns?.t1 || [];
                                if (Array.isArray(cols)) {
                                    return cols.map(c => typeof c === 'string' ? c : c.name);
                                }
                                if (cols instanceof Set) {
                                    return Array.from(cols).map(c => typeof c === 'string' ? c : c.name);
                                }
                                return [];
                            })()}
                            selectedTable={query.table}
                            selectedSchema={query.schema}
                            joinedTables={Array.isArray(query.joins) ? query.joins : []}
                            schemaData={(() => {
                                // Flatten nested schema structure
                                const tables = {};
                                if (!visibleData) return tables;

                                try {
                                    Object.values(visibleData).forEach(schema => {
                                        if (!schema || typeof schema !== 'object') return;
                                        Object.entries(schema).forEach(([tableName, columns]) => {
                                            tables[tableName] = Array.isArray(columns)
                                                ? columns.map(col => col.name || col)
                                                : [];
                                        });
                                    });
                                } catch (error) {
                                    console.error('Error flattening schema data:', error);
                                }
                                return tables;
                            })()}
                            queryHistory={Array.isArray(queryHistory) ? queryHistory : []}
                            onAddColumn={handleAddSuggestedColumn}
                            onAddJoin={handleAddSuggestedJoin}
                        />
                    </div>

                    {/* Existing Query Builder wrapped in this section */}
                     <QueryBuilder
                        key={queryKey}
                        query={query}
                        visibleData={visibleData}
                        handleQueryChange={handleQueryChange}
                        availableClauses={availableClauses}
                        availableFunctions={availableFunctions}
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
                        addSpecificClause={addSpecificClause}
                        handleAddColumn={handleAddColumn}
                        handleRemoveColumn={handleRemoveColumn}
                        handleColumnAliasChange={handleColumnAliasChange}
                    />

                    {/* Subquery Manager */}
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg shadow p-6`}>
                         <SubqueryManager />
                    </div>
                </div>
            </div>

            {/* This closes the left side grid area, Right side follows */}
            <div className="relative">
                <div className={`sticky top-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg p-4 flex flex-col h-[calc(100vh-200px)]`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Generated Query
                            </h3>
                            
                            {/* Validation Status Badge (only show if validated) */}
                            {validationResult && (
                                <span
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                                        validationResult.isValid
                                            ? validationResult.warnings.length > 0
                                                ? theme === 'dark' 
                                                    ? 'bg-yellow-900 text-yellow-300' 
                                                    : 'bg-yellow-100 text-yellow-700'
                                                : theme === 'dark'
                                                    ? 'bg-green-900 text-green-300'
                                                    : 'bg-green-100 text-green-700'
                                            : theme === 'dark'
                                                ? 'bg-red-900 text-red-300'
                                                : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                    <span>
                                        {validationResult.isValid 
                                            ? validationResult.warnings.length > 0 ? '⚠️' : '✅'
                                            : '❌'
                                        }
                                    </span>
                                    <span>
                                        {validationResult.isValid 
                                            ? validationResult.warnings.length > 0 
                                                ? `${validationResult.warnings.length} Warning${validationResult.warnings.length !== 1 ? 's' : ''}`
                                                : 'Valid'
                                            : `${validationResult.errors.length} Error${validationResult.errors.length !== 1 ? 's' : ''}`
                                        }
                                    </span>
                                </span>
                            )}
                        </div>
                        
                        <div
                            className="flex items-center space-x-2"
                            onMouseEnter={() => setHideQuickActions(true)}
                            onMouseLeave={() => setHideQuickActions(false)}
                        >
                            {/* Validate Button */}
                            <button
                                onClick={handleValidateQuery}
                                className={`${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white font-bold py-2 px-3 rounded-lg inline-flex items-center transition text-sm`}
                                title="Check query for errors and warnings"
                            >
                                <span className="mr-1">⚙️</span>
                                <span className="hidden md:inline">Validate</span>
                            </button>

                            {/* Copy Button */}
                            <button
                                onClick={() => copyToClipboard(generatedQuery)}
                                className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'} font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition text-sm`}
                            >
                                <CopyIcon />
                                <span>{copySuccess || 'Copy'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Validation Panel - Collapsible */}
                    {showValidation && validationResult && (
                        <div className="mb-3">
                            <div className="max-h-48 overflow-y-auto scroll-container">
                                <QueryValidationPanel 
                                    sql={generatedQuery} 
                                    queryState={null}
                                    validationResult={validationResult} // Pass pre-calculated result
                                    theme={theme}
                                    onClose={() => setShowValidation(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* SQL Code Display */}
                    <div className="flex-1 overflow-y-auto scroll-container mb-3">
                        <CodeBlock code={generatedQuery} />
                    </div>

                    {/* Action Buttons */}
                    <div
                        className="flex space-x-2 mt-auto pt-4"
                        onMouseEnter={() => setHideQuickActions(true)}
                        onMouseLeave={() => setHideQuickActions(false)}
                    >
                        <button
                            onClick={() => {
                                setQuery(resetQueryState());
                                setRunQueryText('');
                                StateManager.clearBuilderState(user.email);
                                setValidationResult(null); // Clear validation on reset
                                setShowValidation(false);
                            }}
                            className={`flex-1 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-slate-500 hover:bg-slate-600'} text-white font-bold py-3 px-6 rounded-lg transition shadow-md`}
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => {
                                handleViewChange('run');
                                setRunQueryText(generatedQuery);
                            }}
                            className={`flex-1 ${
                                validationResult && !validationResult.isValid
                                    ? theme === 'dark'
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : 'bg-yellow-500 hover:bg-yellow-600'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white font-bold py-3 px-6 rounded-lg transition`}
                            title={validationResult && !validationResult.isValid ? 'Query has validation errors' : 'Generate and run query'}
                        >
                            {validationResult && !validationResult.isValid ? '⚠️ Generate Query' : 'Generate Query'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const filterQueries = (queries, searchTerm) => {
        if (!searchTerm.trim()) return queries;

        const term = searchTerm.toLowerCase();
        return queries.filter(q => {
            const nameMatch = q.name?.toLowerCase().includes(term);
            const sqlMatch = q.sql?.toLowerCase().includes(term);
            const descMatch = q.description?.toLowerCase().includes(term);
            return nameMatch || sqlMatch || descMatch;
        });
    };

    const renderSavedQueries = () => {
        // Filter queries based on search
        const filteredPremade = filterQueries(userData.premadeQueries || [], premadeQueriesSearch);
        const filteredMyQueries = filterQueries(myQueries, savedQueriesSearch);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                {/* LEFT SIDE: Premade Queries */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg p-4 flex flex-col`}>
                    <div className="mb-4">
                        <QueryTemplates
                            onLoadTemplate={handleLoadTemplate}
                            userTemplates={userTemplates}
                            onSaveTemplate={handleSaveTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Premade Queries
                        </h2>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {filteredPremade.length} of {(userData.premadeQueries || []).length}
                        </span>
                    </div>

                    {/* SEARCH BOX for Premade Queries */}
                    <div className="mb-3 relative">
                        <input
                            type="text"
                            placeholder="Search premade queries..."
                            value={premadeQueriesSearch}
                            onChange={e => setPremadeQueriesSearch(e.target.value)}
                            className={`w-full p-2 pl-10 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {premadeQueriesSearch && (
                            <button
                                onClick={() => setPremadeQueriesSearch('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                Ã¢Å“â€¢
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 overflow-y-auto scroll-container">
                        {filteredPremade.length > 0 ? (
                            filteredPremade.map(q => (
                                <div key={q.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-blue-200 shadow-sm'} p-3 rounded-lg`}>
                                    <h3 className={`font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{q.name}</h3>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{q.description}</p>
                                    <pre className={`mt-2 p-3 rounded text-xs whitespace-pre-wrap overflow-x-auto ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                                        <code>{q.sql}</code>
                                    </pre>
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                            onClick={() => handleCopyToBuilder(q)}
                                            className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} hover:underline`}
                                        >
                                            Load
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
                                {premadeQueriesSearch ? 'No premade queries match your search' : 'No premade queries available'}
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: My Saved Queries */}
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg p-4 flex flex-col`}>
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                My Saved Queries
                            </h2>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {filteredMyQueries.length} of {myQueries.length}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowExportImport(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg inline-flex items-center text-sm"
                                title="Export or Import queries"
                            >
                                <span></span>
                                <span className="hidden md:inline ml-1">Export/Import</span>
                            </button>
                            <button
                                onClick={() => setShowPasteModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg inline-flex items-center text-sm"
                                title="Paste a custom SQL query"
                            >
                                <PlusCircleIcon />
                                <span className="hidden md:inline ml-1">Paste Query</span>
                            </button>
                        </div>
                    </div>

                    {/* SEARCH BOX for My Saved Queries */}
                    <div className="mb-3 relative">
                        <input
                            type="text"
                            placeholder="Search my saved queries..."
                            value={savedQueriesSearch}
                            onChange={e => setSavedQueriesSearch(e.target.value)}
                            className={`w-full p-2 pl-10 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {savedQueriesSearch && (
                            <button
                                onClick={() => setSavedQueriesSearch('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                Ã¢Å“â€¢
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={saveQueryName}
                            onChange={e => setSaveQueryName(e.target.value)}
                            placeholder="Name for current query..."
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} text-sm rounded-lg`}
                        />
                        <button onClick={handleSaveMyQuery} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center text-sm">
                            <SaveIcon className="mr-0 md:mr-2" />
                            <span className="hidden md:inline">Save</span>
                        </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto scroll-container">
                        {filteredMyQueries.length > 0 ? (
                            filteredMyQueries.map(q => (
                                <div key={q.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-blue-200 shadow-sm'} p-3 rounded-lg`}>
                                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{q.name}</h3>
                                    <pre className={`mt-2 p-3 rounded text-xs whitespace-pre-wrap overflow-x-auto ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                                        <code>{q.sql}</code>
                                    </pre>
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                            onClick={() => setEditQueryModal(q)}
                                            className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} hover:underline`}
                                        >
                                             Edit
                                        </button>
                                        <button
                                            onClick={() => handleLoadQuery(q)}
                                            className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} hover:underline`}
                                        >
                                            Load
                                        </button>
                                        <button onClick={() => handleSuggestQuery(q)} className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>Suggest</button>
                                        <button onClick={() => handleDeleteMyQuery(q.id)} className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} hover:underline`}>Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
                                {savedQueriesSearch ? 'No saved queries match your search' : 'No saved queries yet'}
                            </p>
                        )}
                    </div>

                    {/* Export/Import Modal */}
                    {showExportImport && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportImport(false)}>
                            <div onClick={(e) => e.stopPropagation()}>
                                <ExportImportQueries
                                    queries={myQueries}
                                    onImport={handleImportQueries}
                                    userData={userData}
                                    queryType="saved"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderRunQuery = () => {
        const visiblePortals = (userData.portals || []).filter(p => 
            user.isAdmin || (user.permissions?.portals || []).includes(p.id)
        );
        
        const handlePortalClick = () => {
            if (runQueryText && runQueryText.trim()) {
                addQueryToHistory(runQueryText);
            }
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg p-6 flex-grow flex flex-col`}>
                    <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Manual Run
                    </h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Paste your SQL below, then select a portal to open and run the query.</p>
                    <div className="relative flex-grow flex flex-col">
                        <textarea
                            value={runQueryText}
                            onChange={e => setRunQueryText(e.target.value)}
                            placeholder="Paste your query here..."
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 border border-gray-300'} rounded-lg min-h-[200px] text-sm flex-grow font-mono`}
                        />
                        <button
                            onClick={() => copyToClipboard(runQueryText)}
                            onMouseEnter={() => setHideQuickActions(true)}
                            onMouseLeave={() => setHideQuickActions(false)}
                            className={`absolute top-2 right-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'} font-bold p-2 rounded-lg inline-flex items-center cursor-pointer transition text-sm`}
                        >
                            <CopyIcon />
                        </button>
                    </div>
                    {sqlError && (
                        <div className="mt-2 text-yellow-400 text-sm flex items-center">
                            <AlertTriangleIcon />
                            <span>{sqlError}</span>
                        </div>
                    )}
                    <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} mt-4 pt-4`}>
                        <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Select a Portal to Open</h3>
                        <div
                            className="flex space-x-2"
                            onMouseEnter={() => setHideQuickActions(true)}
                            onMouseLeave={() => setHideQuickActions(false)}
                        >
                            {visiblePortals.length > 0 ? visiblePortals.map(p => (
                                <a
                                    key={p.id}
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handlePortalClick}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"
                                >
                                    {p.name}
                                </a>
                            )) : <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>You have not been assigned access to any data portals. Please contact the administrator.</p>}
                        </div>
                    </div>
                </div>

                <AutomationPanel
                    query={runQueryText || generatedQuery}
                    availablePortals={visiblePortals}
                    theme={theme}
                    currentUser={user.email}
                />
            </div>
        );
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-900'} min-h-screen font-sans flex flex-col p-4 md:p-6 lg:p-8`}>
            <ShortcutIndicator currentView={activeView} hidden={hideQuickActions} />
            <ShortcutHelper
                shortcuts={{
                    'ctrl+enter': () => {},
                    'ctrl+s': () => {},
                    'ctrl+k': () => {},
                    'escape': () => {},
                    'ctrl+/': () => {},
                    'ctrl+1': () => {},
                    'ctrl+2': () => {},
                    'ctrl+3': () => {},
                    'ctrl+4': () => {},
                    'ctrl+shift+v': () => {},
                    'ctrl+shift+c': () => {}
                }}
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />
            <HelpSystem isOpen={showHelpSystem} onClose={() => setShowHelpSystem(false)} theme={theme} />
            {showFeedbackModal && <FeedbackModal user={user} onCancel={() => setShowFeedbackModal(false)} />}
            {showPasteModal && <PasteQueryModal
                theme={theme}
                pasteQueryName={pasteQueryName}
                setPasteQueryName={setPasteQueryName}
                pasteQuerySQL={pasteQuerySQL}
                setPasteQuerySQL={setPasteQuerySQL}
                handlePasteQuery={handlePasteQuery}
                onClose={() => {
                    setShowPasteModal(false);
                    setPasteQueryName('');
                    setPasteQuerySQL('');
                }}
            />}
            {editQueryModal && <EditQueryModal 
                theme={theme} 
                query={editQueryModal} 
                onSave={handleEditQuery} onClose={() => setEditQueryModal(null)} 
            />}
            
            {editingSubquery && (
                <SubqueryBuilder
                    subquery={editingSubquery}
                    onChange={saveSubquery}
                    onClose={() => setEditingSubquery(null)}
                    allSchemas={visibleData}
                    userLevel={userLevel}
                    existingCTEs={query.ctes}
                />
            )}

            <header className={`flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-blue-400">Query Maker</h1>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                        Logged in as: <span className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{user.email}</span> ({userLevel})
                    </p>
                    
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                    
                    <button onClick={() => setShowHelpSystem(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition shadow-lg">
                        <span className="mr-2"></span><span>Help</span>
                    </button>
                    <button onClick={() => setShowFeedbackModal(true)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition">
                        <FeedbackIcon /><span>Feedback</span>
                    </button>
                    {user.isAdmin && <button onClick={onAdminView} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition">
                        <AdminIcon /><span>Admin</span>
                    </button>}
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition shadow-lg">
                        <LogoutIcon /><span>Logout</span>
                    </button>
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg"
                        title="Keyboard Shortcuts (Ctrl + /)"
                    >
                        Keyboard Shortcuts
                    </button>
                </div>
            </header>

            {visibleData ? (
                <main className="flex flex-col flex-grow min-h-0">
                    <div className={`flex flex-wrap justify-center space-x-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-200'} p-1 rounded-lg self-center mb-4`}>
                        {[
                            { id: 'explorer', label: 'Explorer', icon: <SearchIcon theme={theme} className="h-5 w-5" /> },
                            { id: 'builder', label: 'Builder', icon: <CodeIcon /> },
                            { id: 'saved', label: 'Saved Queries', icon: <SaveIcon /> },
                            { id: 'run', label: 'Run Query', icon: <PlayIcon /> },
                            { id: 'recent', label: 'Recent', icon: <HistoryIcon /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleViewChange(tab.id)}
                                onDragOver={(e) => handleTabDragOver(e, tab.id)}
                                onDragLeave={handleTabDragLeave}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition flex items-center gap-2
                                    ${activeView === tab.id 
                                        ? 'bg-blue-600 text-white' 
                                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-blue-900 hover:bg-blue-100'}`
                                    }
                                    ${isDragging && dragHoverTab === tab.id ? 'ring-2 ring-blue-400 bg-blue-100 dark:bg-blue-900' : ''}
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                                {isDragging && dragHoverTab === tab.id && (
                                    <span className="text-xs opacity-75 animate-pulse">...</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        {activeView === 'explorer' ? renderSchemaExplorer() : 
                         activeView === 'builder' ? renderQueryBuilder() : 
                         activeView === 'saved' ? renderSavedQueries() : 
                         activeView === 'recent' ? (
                            <EnhancedQueryHistory 
                                queries={queryHistory}
                                currentUser={user.email}
                                theme={theme}
                                onDeleteQuery={handleDeleteHistoryQuery}
                                onUpdateQuery={handleUpdateQuery}
                                onLoadQuery={q => {
                                    setRunQueryText(q.sql || q.queryText);
                                    handleViewChange('run');
                                }}
                                extraActions={
                                    <ExportImportQueries
                                        queries={queryHistory}
                                        onImport={handleImportQueries}
                                        userData={user}
                                        queryType="recent"
                                    />
                                }
                            />
                         ) : renderRunQuery()}
                    </div>
                </main>
            ) : (
                <div className={`flex-grow flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'} rounded-lg`}>
                    <div className="text-center p-8">
                        <h2 className={`mt-4 text-xl font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>No Schema Data Available</h2>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.isAdmin ? "Upload a master schema in the Admin Dashboard to begin." : "You have not been assigned any schemas. Please contact the administrator."}</p>
                    </div>
                </div>
            )}


            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
                    <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span>{toast}</span>
                    </div>
                </div>
            )}
        </div>
    );
}