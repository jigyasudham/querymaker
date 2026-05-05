import React, { useState, useRef } from 'react';
import ExportFormatGuide from './ExportFormatGuide';

/**
 * Export/Import Queries Component
 * Allows users to backup, share, and restore queries
 */
const ExportImportQueries = ({ 
  queries = [], 
  onImport, 
  userData,
  queryType = 'all' // 'all', 'saved', 'recent', 'templates'
}) => {
  console.log('🔍 ExportImportQueries received queries:', queries.length, queries);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [importData, setImportData] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importOptions, setImportOptions] = useState({
    mergeDuplicates: false,
    preserveIds: false,
    updateTimestamp: true
  });
  const fileInputRef = useRef(null);

  // Export formats
  const [exportFormat, setExportFormat] = useState('json'); // 'json', 'csv', 'sql'
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeTimestamps: true,
    includeTags: true,
    includeStats: true,
    prettify: true
  });

  // Select/deselect all queries
  const handleSelectAll = () => {
    if (selectedQueries.length === queries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries(queries.map(q => q.id));
    }
  };

  // Toggle query selection
  const toggleQuerySelection = (queryId) => {
    if (selectedQueries.includes(queryId)) {
      setSelectedQueries(selectedQueries.filter(id => id !== queryId));
    } else {
      setSelectedQueries([...selectedQueries, queryId]);
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    // ✅ FIX: Only export selected queries, or nothing if none selected
    const queriesToExport = selectedQueries.length === 0 
      ? [] // Don't export anything if nothing selected
      : queries.filter(q => selectedQueries.includes(q.id));
    
    if (queriesToExport.length === 0) {
      alert('Please select at least one query to export');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportedBy: userData?.email || 'unknown',
      queryCount: queriesToExport.length,
      queries: queriesToExport.map(q => {
        const exported = { ...q };
        
        if (!exportOptions.includeMetadata) {
          delete exported.executionTime;
          delete exported.rowsReturned;
        }
        if (!exportOptions.includeTimestamps) {
          delete exported.timestamp;
        }
        if (!exportOptions.includeTags) {
          delete exported.tags;
        }
        
        return exported;
      })
    };

    const jsonString = exportOptions.prettify 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    downloadFile(jsonString, `queries_${Date.now()}.json`, 'application/json');
    setShowExportModal(false);
    setSelectedQueries([]); // ✅ Clear selection after export
  };

  // Export to CSV
  const exportToCSV = () => {
    const queriesToExport = selectedQueries.length === 0 
      ? [] 
      : queries.filter(q => selectedQueries.includes(q.id));

    if (queriesToExport.length === 0) {
      alert('Please select at least one query to export');
      return;
    }

    const headers = [
      'Name',
      'SQL',
      'Timestamp',
      'User',
      'Success',
      'Favorite',
      'Tags',
      'Execution Time (ms)',
      'Rows Returned'
    ];

    const rows = queriesToExport.map(q => [
      q.name || 'Unnamed',
      q.sql?.replace(/"/g, '""'), // Escape quotes
      q.timestamp,
      q.user || '',
      q.success !== false ? 'Yes' : 'No',
      q.favorite ? 'Yes' : 'No',
      q.tags?.join('; ') || '',
      q.executionTime || '',
      q.rowsReturned || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, `queries_${Date.now()}.csv`, 'text/csv');
    setShowExportModal(false);
    setSelectedQueries([]);
  };

  // Export to SQL
  const exportToSQL = () => {
    const queriesToExport = selectedQueries.length === 0 
      ? [] 
      : queries.filter(q => selectedQueries.includes(q.id));

    if (queriesToExport.length === 0) {
      alert('Please select at least one query to export');
      return;
    }

    const sqlContent = queriesToExport.map((q, index) => {
      const lines = [];
      lines.push(`-- Query ${index + 1}: ${q.name || 'Unnamed'}`);
      lines.push(`-- User: ${q.user || 'unknown'}`);
      lines.push(`-- Date: ${q.timestamp}`);
      if (q.tags && q.tags.length > 0) {
        lines.push(`-- Tags: ${q.tags.join(', ')}`);
      }
      lines.push('');
      lines.push(q.sql);
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('');
      return lines.join('\n');
    }).join('\n');

    downloadFile(sqlContent, `queries_${Date.now()}.sql`, 'text/plain');
    setShowExportModal(false);
    setSelectedQueries([]);
  };

  // Handle export based on format
  const handleExport = () => {
    switch (exportFormat) {
      case 'json':
        exportToJSON();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'sql':
        exportToSQL();
        break;
      default:
        exportToJSON();
    }
  };

  // Download helper
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle file selection for import
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          setImportData(data);
          setImportPreview(data.queries || []);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const queries = parseCSV(content);
          setImportData({ queries });
          setImportPreview(queries);
        } else {
          alert('Unsupported file format. Please use .json or .csv files.');
          return;
        }
        
        setShowImportModal(true);
      } catch (error) {
        console.error('Failed to parse file:', error);
        alert('Failed to read file. Please ensure it\'s a valid query export.');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Parse CSV to queries
  const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const queries = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
        .map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
      
      const query = {
        id: `imported-${Date.now()}-${i}`,
        name: values[0] || 'Imported Query',
        sql: values[1] || '',
        timestamp: values[2] || new Date().toISOString(),
        user: values[3] || 'imported',
        success: values[4] === 'Yes',
        favorite: values[5] === 'Yes',
        tags: values[6] ? values[6].split(';').map(t => t.trim()) : [],
        executionTime: parseInt(values[7]) || null,
        rowsReturned: parseInt(values[8]) || null
      };
      
      queries.push(query);
    }
    
    return queries;
  };

  // Handle import confirmation
  const handleImportConfirm = () => {
    try {
      const importedQueries = importPreview.map(q => {
        const imported = { ...q };
        
        if (!importOptions.preserveIds) {
          imported.id = `imported-${Date.now()}-${Math.random()}`;
        }
        
        if (importOptions.updateTimestamp) {
          imported.timestamp = new Date().toISOString();
        }
        
        return imported;
      });

      onImport(importedQueries, importOptions);
      
      setShowImportModal(false);
      setImportData(null);
      setImportPreview([]);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import queries: ' + error.message);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      <button
        onClick={() => setShowExportModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
      >
        <span>📤</span>
        <span>Export</span>
      </button>

      {/* Import Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <span>📥</span>
        <span>Import</span>
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📤 Export Queries
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Format Guide */}
              <ExportFormatGuide theme={userData?.theme || 'light'} />

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'json', label: 'JSON', desc: 'Full data with metadata' },
                    { value: 'csv', label: 'CSV', desc: 'Spreadsheet compatible' },
                    { value: 'sql', label: 'SQL', desc: 'Ready to execute' }
                  ].map(format => (
                    <button
                      key={format.value}
                      onClick={() => setExportFormat(format.value)}
                      className={`p-4 border-2 rounded text-left transition-colors ${
                        exportFormat === format.value
                          ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-400 dark:border-gray-600 hover:border-green-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-800 dark:text-gray-400 mt-1">
                        {format.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Queries to Export
                  </label>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedQueries.length === queries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-400 dark:border-gray-600 rounded p-3 space-y-2">
                  {queries.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No queries to export</p>
                  ) : (
                    queries.map(query => (
                      <label
                        key={query.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQueries.includes(query.id)}
                          onChange={() => toggleQuerySelection(query.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-white flex-1">
                          {query.name || query.sql?.substring(0, 50) + '...'}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-400 mt-2">
                  {selectedQueries.length === 0 
                    ? 'All queries will be exported' 
                    : `${selectedQueries.length} selected`}
                </p>
              </div>

              {/* Export Options (JSON only) */}
              {exportFormat === 'json' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Export Options
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'includeMetadata', label: 'Include execution metadata' },
                      { key: 'includeTimestamps', label: 'Include timestamps' },
                      { key: 'includeTags', label: 'Include tags' },
                      { key: 'prettify', label: 'Pretty print (readable)' }
                    ].map(option => (
                      <label key={option.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportOptions[option.key]}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            [option.key]: e.target.checked
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Export Uses
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li><strong>Backup:</strong> Save your queries regularly</li>
                  <li><strong>Share:</strong> Send to teammates or other installations</li>
                  <li><strong>Archive:</strong> Keep historical query records</li>
                  <li><strong>Transfer:</strong> Move queries between computers</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={queries.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export {selectedQueries.length || queries.length} {selectedQueries.length === 1 ? 'Query' : 'Queries'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📥 Import Queries
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Import Info */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      File Loaded Successfully
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      Found {importPreview.length} queries ready to import
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preview Queries
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-400 dark:border-gray-600 rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">SQL Preview</th>
                        <th className="px-4 py-2 text-left">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {importPreview.map((query, index) => (
                        <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                            {query.name || 'Unnamed'}
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-400 font-mono text-xs">
                            {query.sql?.substring(0, 50)}...
                          </td>
                          <td className="px-4 py-2">
                            {query.tags?.map(tag => (
                              <span key={tag} className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs mr-1">
                                #{tag}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Import Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importOptions.mergeDuplicates}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        mergeDuplicates: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Skip duplicate queries (by SQL content)
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importOptions.updateTimestamp}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        updateTimestamp: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Update timestamps to current time
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importOptions.preserveIds}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        preserveIds: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Preserve original query IDs
                    </span>
                  </label>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Note:</strong> Imported queries will be added to your existing queries. 
                  {importOptions.mergeDuplicates ? ' Duplicates will be skipped.' : ' This may create duplicates.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Import {importPreview.length} {importPreview.length === 1 ? 'Query' : 'Queries'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportImportQueries;