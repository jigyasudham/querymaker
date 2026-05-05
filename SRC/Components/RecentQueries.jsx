import React from 'react';

// Function to export query history as CSV
const exportQueryHistoryToCSV = (queryHistory, userEmail) => {
    if (!queryHistory || queryHistory.length === 0) {
        alert('No query history to export');
        return;
    }
    
    // CSV Headers
    const headers = ['Timestamp', 'User', 'Query'];
    
    // Convert data to CSV rows
    const rows = queryHistory.map(entry => {
        const timestamp = entry.time || 'N/A';
        const user = entry.user || userEmail || 'Unknown';
        const query = (entry.queryText || '').replace(/"/g, '""'); // Escape quotes
        
        return `"${timestamp}","${user}","${query}"`;
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `query_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function RecentQueries({ queryHistory, onSaveTemplate, theme = 'dark', user }) {
  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6 flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Queries ({queryHistory.length})</h2>
            <button onClick={() => exportQueryHistoryToCSV(queryHistory, user?.email)} disabled={queryHistory.length === 0} className={`${ queryHistory.length === 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700' } text-white font-bold py-2 px-4 rounded-lg inline-flex items-center text-sm`}>📥 Export to CSV</button>
        </div>
      <div className="space-y-3 overflow-y-auto scroll-container max-h-[calc(100vh-250px)]">
        {queryHistory.length === 0 && (
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>No queries executed yet. Start building or running queries to see them here!</p>
        )}
        {queryHistory.map((q, i) => (
          <div key={i} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} p-4 rounded-lg`}>
            <div className="flex justify-between items-start mb-2">
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                by {q.user} • {new Date(q.time).toLocaleString()}
              </div>
              <button
                onClick={() => onSaveTemplate(q)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
              >
                Save as Template
              </button>
            </div>
            <pre className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} p-3 rounded text-sm whitespace-pre-wrap overflow-x-auto`}>
              <code className={`${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>{q.queryText}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
