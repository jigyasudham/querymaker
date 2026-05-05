/**
 * PythonAPI.js
 * Service to communicate with Python backend
 * Place this in: src/Services/PythonAPI.js
 */

const API_BASE = 'http://localhost:5000/api';

export const PythonAPI = {
    /**
     * Upload user_access.json file to Python
     */
    async uploadUserFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload-user-file`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    },

    /**
     * Verify login credentials via Python
     */
    async verifyLogin(email, password) {
        const response = await fetch(`${API_BASE}/verify-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        return await response.json();
    },

    /**
     * Upload single CSV schema file
     */
    async uploadSchemaCSV(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE}/upload-schema-csv`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    },

    /**
     * Combine multiple CSV files
     */
    async combineSchemaCSVs(files) {
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
        
        const response = await fetch(`${API_BASE}/combine-schema-csvs`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    },

    /**
     * Save query (replaces localStorage)
     */
    async saveQuery(userEmail, queryType, queryData) {
        const response = await fetch(`${API_BASE}/save-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                type: queryType, // 'my_queries' or 'recent'
                query: queryData
            })
        });
        
        return await response.json();
    },

    /**
     * Load queries (replaces localStorage)
     */
    async loadQueries(userEmail, queryType) {
        const response = await fetch(
            `${API_BASE}/load-queries?userEmail=${encodeURIComponent(userEmail)}&type=${queryType}`
        );
        
        return await response.json();
    },

    /**
     * Delete a specific query
     */
    async deleteQuery(userEmail, queryType, queryId) {
        const response = await fetch(`${API_BASE}/delete-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                type: queryType,
                queryId  // Send ID instead of index
            })
        });
        
        return await response.json();
    }, // <-- FIX: Added the missing comma here

    /**
     * Update a specific query (e.g. toggle favorite, add tags)
     */
    async updateQuery(userEmail, queryType, queryId, updates) {
        const response = await fetch(`${API_BASE}/update-query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                type: queryType,
                queryId,
                updates
            })
        });
        
        return await response.json();
    },

    /**
     * Update an entire list of queries (e.g., after deleting one)
     */
    async updateQueries(userEmail, queryType, queries) {
        const response = await fetch(`${API_BASE}/update-queries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                type: queryType,
                queries
            })
        });
        
        return await response.json();
    },

    /**
     * Test connection
     */
    async testConnection() {
        const response = await fetch(`${API_BASE}/test`);
        return await response.json();
    }
};