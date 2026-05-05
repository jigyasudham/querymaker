// src/Services/StateManager.js

const getStorageKey = (userEmail) => {
    return userEmail ? `queryBuilderState_${userEmail}` : 'queryBuilderState_guest';
};

export const StateManager = {
    // Helper to convert Sets to Arrays for JSON storage
    serializeQuery: (query) => {
        if (!query) return null;
        
        const serialized = { ...query };
        
        // Convert columns object with Sets to arrays
        if (serialized.columns) {
            const serializedColumns = {};
            for (const [alias, colSet] of Object.entries(serialized.columns)) {
                serializedColumns[alias] = colSet instanceof Set 
                    ? Array.from(colSet) 
                    : (Array.isArray(colSet) ? colSet : []);
            }
            serialized.columns = serializedColumns;
        }
        
        return serialized;
    },

    // Helper to convert Arrays back to Sets
    deserializeQuery: (query) => {
        if (!query) return null;
        
        const deserialized = { ...query };
        
        // Convert columns arrays back to Sets
        if (deserialized.columns) {
            const deserializedColumns = {};
            for (const [alias, colArray] of Object.entries(deserialized.columns)) {
                deserializedColumns[alias] = new Set(
                    Array.isArray(colArray) ? colArray : []
                );
            }
            deserialized.columns = deserializedColumns;
        }
        
        return deserialized;
    },

    // Query Builder State
    saveBuilderState: (state, userEmail) => {
        try {
            const serializedState = {
                query: StateManager.serializeQuery(state.query),
                runQueryText: state.runQueryText,
                activeView: state.activeView,  // NEW: Save which tab user was on
                timestamp: Date.now()
            };
            localStorage.setItem(getStorageKey(userEmail), JSON.stringify(serializedState));
            console.log('✅ State saved:', serializedState.activeView, 'Query has table:', serializedState.query?.table);
        } catch (e) {
            console.error('Failed to save builder state:', e);
        }
    },

    loadBuilderState: (userEmail) => {
        try {
            const saved = localStorage.getItem(getStorageKey(userEmail));
            if (!saved) return null;

            const state = JSON.parse(saved);
            // Only restore if less than 30 minutes old
            if (Date.now() - state.timestamp < 1800000) {
                const restored = {
                    query: StateManager.deserializeQuery(state.query),
                    runQueryText: state.runQueryText,
                    activeView: state.activeView  // NEW: Restore the tab too
                };
                console.log('✅ State loaded:', restored.activeView, 'Query has table:', restored.query?.table);
                return restored;
            }
            console.log('⚠️ Saved state too old, clearing');
            localStorage.removeItem(getStorageKey(userEmail));
            return null;
        } catch (e) {
            console.error('Failed to load builder state:', e);
            return null;
        }
    },

    clearBuilderState: (userEmail) => {
        localStorage.removeItem(getStorageKey(userEmail));
        console.log('🗑️ Builder state cleared');
    },

    // Automation State
    saveAutomationState: (state) => {
        try {
            localStorage.setItem('automationState', JSON.stringify({
                ...state,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to save automation state:', e);
        }
    },

    loadAutomationState: () => {
        try {
            const saved = localStorage.getItem('automationState');
            if (!saved) return null;

            const state = JSON.parse(saved);
            if (Date.now() - state.timestamp < 1800000) {
                return state;
            }
            localStorage.removeItem('automationState');
            return null;
        } catch (e) {
            console.error('Failed to load automation state:', e);
            return null;
        }
    },

    clearAutomationState: () => {
        localStorage.removeItem('automationState');
    },

    // Saved Queries Page State
    saveSavedQueriesState: (state) => {
        try {
            localStorage.setItem('savedQueriesState', JSON.stringify({
                ...state,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to save queries state:', e);
        }
    },

    loadSavedQueriesState: () => {
        try {
            const saved = localStorage.getItem('savedQueriesState');
            if (!saved) return null;

            const state = JSON.parse(saved);
            if (Date.now() - state.timestamp < 1800000) {
                return state;
            }
            localStorage.removeItem('savedQueriesState');
            return null;
        } catch (e) {
            console.error('Failed to load queries state:', e);
            return null;
        }
    }
};