// SRC/Components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { PythonAPI } from '/SRC/Services/PythonAPI.js';
import {
  UploadIcon, LogoutIcon, LockIcon, KeyIcon, TrashIcon,
  InfoIcon, PlusCircleIcon
} from './UI/Icons.jsx';
import { PasswordChangeModal, ConfirmDeleteModal } from './UI/Modals.jsx';
import { DataService } from '../Services/DataService.js';
import { AuthService } from '../Services/AuthService.js';
import { InfoTooltip } from './UI/UIHelpers.jsx';
import ThemeToggle from './UI/ThemeToggle.jsx'; // ADD THIS
import ExportImportQueries from './ExportImportQueries';

// ADD THIS NEW COMPONENT to AdminDashboard.jsx
// Place it near the top with other modal components

function BatchHistoryDetailsModal({ batch, onClose, theme }) {
    const [detailedData, setDetailedData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Fetch detailed batch data from backend
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/batch-details/${batch.batchId}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    setDetailedData(data.data);
                } else {
                    console.error('Failed to load batch details');
                }
            } catch (error) {
                console.error('Error fetching batch details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [batch.batchId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto scroll-container`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Batch Details
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} mt-1`}>
                            {batch.datetime}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-800 hover:text-gray-900'} text-2xl`}
                    >
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Loading details...</p>
                    </div>
                ) : detailedData ? (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {batch.totalQueries}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                    Total Queries
                                </div>
                            </div>
                            <div className={`${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'} p-4 rounded-lg`}>
                                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                                    {batch.succeeded}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    Succeeded
                                </div>
                            </div>
                            <div className={`${theme === 'dark' ? 'bg-red-900' : 'bg-red-100'} p-4 rounded-lg`}>
                                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                                    {batch.failed}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                    Failed
                                </div>
                            </div>
                            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {detailedData.duration || 'N/A'}
                                </div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                    Duration
                                </div>
                            </div>
                        </div>

                        {/* Batch Info */}
                        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg mb-6`}>
                            <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Batch Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Batch ID:</span>
                                    <span className={`ml-2 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {batch.batchId}
                                    </span>
                                </div>
                                <div>
                                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Output Folder:</span>
                                    <span className={`ml-2 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {batch.folder}
                                    </span>
                                </div>
                                <div>
                                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Started:</span>
                                    <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {detailedData.startTime || batch.datetime}
                                    </span>
                                </div>
                                <div>
                                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Completed:</span>
                                    <span className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {detailedData.endTime || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Query Details Tabs */}
                        <div className="mb-4">
                            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'}`}>
                                <div className="flex space-x-4">
                                    <button className={`px-4 py-2 font-semibold border-b-2 border-blue-500 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                        All Queries ({batch.totalQueries})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Query List */}
                        <div className="space-y-3 max-h-96 overflow-y-auto scroll-container">
                            {detailedData.queries && detailedData.queries.map((query, idx) => (
                                <div key={idx} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-lg font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                                #{idx + 1}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                query.status === 'success' 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-red-500 text-white'
                                            }`}>
                                                {query.status === 'success' ? '✓ SUCCESS' : '✗ FAILED'}
                                            </span>
                                        </div>
                                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                            {query.duration || 'N/A'}
                                        </span>
                                    </div>

                                    {query.schemas && (
                                        <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <span className="font-semibold">Schemas:</span> {
                                                Array.isArray(query.schemas) 
                                                    ? query.schemas.join(', ') 
                                                    : query.schemas
                                            }
                                        </div>
                                    )}

                                    {query.fileName && (
                                        <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} flex items-center justify-between`}>
                                            <div>
                                                <span className="font-semibold">📁 File:</span> {query.fileName}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        // Construct the full file path
                                                        const filePath = `${detailedData.folder}/${query.fileName}`;
                                                        
                                                        const response = await fetch('http://localhost:5000/api/download-file', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                            },
                                                            body: JSON.stringify({ filePath: filePath })
                                                        });

                                                        if (!response.ok) {
                                                            throw new Error('Download failed');
                                                        }

                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = query.fileName;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (error) {
                                                        console.error('Download error:', error);
                                                        alert('Failed to download file. It may have been moved or deleted.');
                                                    }
                                                }}
                                                className={`ml-2 px-3 py-1 rounded text-xs font-medium ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} transition-colors`}
                                            >
                                                ⬇️ Download
                                            </button>
                                        </div>
                                    )}

                                    {query.error && (
                                        <div className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                            <span className="font-semibold">⚠️ Error:</span> {query.error}
                                        </div>
                                    )}

                                    {query.message && (
                                        <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-800'}`}>
                                            {query.message}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                            {/* Download All Successful Files */}
                            {detailedData.queries?.some(q => q.fileName) && (
                                <button
                                    onClick={async () => {
                                        const successfulQueries = detailedData.queries.filter(q => q.fileName);
                                        
                                        for (const query of successfulQueries) {
                                            try {
                                                const filePath = `${detailedData.folder}/${query.fileName}`;
                                                
                                                const response = await fetch('http://localhost:5000/api/download-file', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ filePath })
                                                });

                                                if (response.ok) {
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = query.fileName;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    window.URL.revokeObjectURL(url);
                                                    
                                                    // Small delay between downloads
                                                    await new Promise(resolve => setTimeout(resolve, 500));
                                                }
                                            } catch (error) {
                                                console.error(`Failed to download ${query.fileName}:`, error);
                                            }
                                        }
                                        
                                        alert(`Started downloading ${successfulQueries.length} file(s)`);
                                    }}
                                    className={`px-4 py-2 rounded font-medium ${
                                        theme === 'dark'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                >
                                    ⬇️ Download All Files ({detailedData.queries.filter(q => q.fileName).length})
                                </button>
                            )}
                            {batch.failed > 0 && (
                                <button
                                    onClick={() => {
                                        // Extract failed schemas
                                        const failedQueries = detailedData.queries
                                            .filter(q => q.status === 'failed')
                                            .map(q => q.schemas)
                                            .filter(Boolean);
                                        
                                        const schemasText = failedQueries.join('\n');
                                        
                                        navigator.clipboard.writeText(schemasText);
                                        alert(`✓ Copied ${batch.failed} failed schema(s) to clipboard!\n\nPaste into Schema Fetching Assistant to retry.`);
                                    }}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
                                >
                                    📋 Copy Failed Schemas ({batch.failed})
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    // Open folder in file explorer
                                    alert(`Opening folder: ${batch.folder}`);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                                📁 Open Folder
                            </button>
                            <button
                                onClick={onClose}
                                className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} px-4 py-2 rounded-lg`}
                            >
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                            Failed to load batch details
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function UserPermissions({
  user, allSchemas, onPermissionChange, onLevelChange,
  onChangePassword, onDeleteUser, allPortals, onPortalPermissionChange, theme
}) {
  const [isOpen, setIsOpen] = useState(false);
  const userPermissions = new Set(user.permissions?.schemas || []);
  const userPortalPermissions = new Set(user.permissions?.portals || []);
  const userLevel = user.permissions?.level || 'Beginner';

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} p-3 rounded-lg`}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full w-min mt-1 ${user.isAdmin ? 'bg-yellow-500 text-black' : 'bg-gray-1000 text-white'}`}>
            {user.isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onDeleteUser(user)} className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold p-2 rounded-md inline-flex items-center"><TrashIcon/></button>
          <button onClick={() => onChangePassword(user)} className="bg-gray-600 hover:bg-gray-1000 text-white text-sm font-bold py-1 px-3 rounded-md inline-flex items-center"><KeyIcon/><span>Password</span></button>
          {!user.isAdmin && (
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded-md inline-flex items-center">
              <LockIcon /><span>{isOpen ? 'Close' : 'Permissions'}</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && !user.isAdmin && (
        <div className={`mt-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-400'} pt-3 space-y-4`}>
          <div>
            <h4 className={`font-semibold mb-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Query Builder Level</h4>
            <select
              value={userLevel}
              onChange={(e) => onLevelChange(user.id, e.target.value)}
              className={`w-full p-2 ${theme === 'dark' 
                ? 'bg-gray-600 text-white' 
                : 'bg-white border border-gray-400 text-gray-900'
              } text-sm rounded-lg focus:outline-none`}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <h4 className={`font-semibold mb-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Portal Access</h4>
            <div className="space-y-2">
              {allPortals.length > 0 ? allPortals.map(portal => (
                <label key={portal.id} className="flex items-center space-x-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={userPortalPermissions.has(portal.id)}
                    onChange={() => onPortalPermissionChange(user.id, portal.id)}
                    className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{portal.name}</span>
                </label>
              )) : <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>No portals defined.</p>}
            </div>
          </div>

          <div>
            <h4 className={`font-semibold mb-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Schema Access</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto scroll-container pr-2">
              {allSchemas.length > 0 ? allSchemas.map(schemaName => (
                <label key={schemaName} className="flex items-center space-x-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={userPermissions.has(schemaName)}
                    onChange={() => onPermissionChange(user.id, schemaName)}
                    className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{schemaName}</span>
                </label>
              )) : <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>No schemas available to assign.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ userData, setUserData, onLogout, theme, setTheme }) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isNewUserAdmin, setIsNewUserAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryToEdit, setQueryToEdit] = useState({ id: null, name: '', description: '', sql: '' });
  const [passwordChangeUser, setPasswordChangeUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [schemasToFetch, setSchemasToFetch] = useState('');
  const [generatedFetchQueries, setGeneratedFetchQueries] = useState([]);
  const [schemaFetchCreds, setSchemaFetchCreds] = useState({ username: '', password: '' });
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchOutputFolder, setBatchOutputFolder] = useState('');
  const [portalToEdit, setPortalToEdit] = useState({ id: null, name: '', url: '', automationType: 'none' });
  const [maxWaitMinutes, setMaxWaitMinutes] = useState(30); // NEW: State for max wait time
  const [batchSize, setBatchSize] = useState(10); // Default 10 schemas per query
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [queryTemplate, setQueryTemplate] = useState(
    userData.schemaQueryTemplate || 
    `SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_schema IN ({schemas});`
  );
  const [batchHistory, setBatchHistory] = useState([]);
  const [detailsModalBatch, setDetailsModalBatch] = useState(null);
  const [allUserQueries, setAllUserQueries] = useState([]);

  const allSchemas = userData.schemaData ? Object.keys(userData.schemaData) : [];
  const allPortals = userData.portals || [];

  // Persist batch state to localStorage
  useEffect(() => {
    // Load batch history on mount
    const loadHistory = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/batch-history');
            const data = await response.json();
            if (data.status === 'success') {
                setBatchHistory(data.data);
            }
        } catch (e) {
            console.error('Failed to load batch history:', e);
        }
    };
    loadHistory();
}, []);
  React.useEffect(() => {
    if (batchRunning || batchResults) {
        localStorage.setItem('batchState', JSON.stringify({
            running: batchRunning,
            status: batchStatus,
            results: batchResults,
            currentBatchId: currentBatchId,
            timestamp: Date.now()
        }));
    }
  }, [batchRunning, batchStatus, batchResults, currentBatchId]);

  // Restore batch state on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('batchState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            // Only restore if less than 1 hour old AND server confirms it exists
            if (Date.now() - state.timestamp < 3600000) {
                // Validate with server before restoring
                if (state.currentBatchId) {
                    fetch(`http://localhost:5000/api/batch-status/${state.currentBatchId}`)
                        .then(res => res.json())
                        .then(serverStatus => {
                            // Only restore if server still has this batch
                            if (serverStatus && serverStatus.status !== 'unknown') {
                                if (state.running) {
                                    setBatchRunning(true);
                                    setBatchStatus(state.status);
                                    setCurrentBatchId(state.currentBatchId);
                                    resumeBatchPolling(state.currentBatchId);
                                } else if (state.results) {
                                    setBatchResults(state.results);
                                }
                            } else {
                                // Server doesn't have this batch anymore, clear it
                                console.log('Clearing stale batch state');
                                localStorage.removeItem('batchState');
                            }
                        })
                        .catch(() => {
                            // Server error, clear stale state
                            localStorage.removeItem('batchState');
                        });
                } else {
                    // No batch ID, just restore results
                    if (state.results) {
                        setBatchResults(state.results);
                    }
                }
            } else {
                // Too old, clear it
                localStorage.removeItem('batchState');
            }
        } catch (e) {
            console.error('Error restoring batch state:', e);
            localStorage.removeItem('batchState');
        }
    }
}, []);

  // Resume polling function
  const resumeBatchPolling = (batchId) => {
      const pollInterval = setInterval(async () => {
          try {
              const statusResponse = await fetch(`http://localhost:5000/api/batch-status/${batchId}`);
              const statusData = await statusResponse.json();
              
              setBatchStatus({ current: statusData.current || 0, total: statusData.total || 0, message: statusData.message || 'Processing...', currentProgress: statusData.currentProgress });
              
              if (statusData.status === 'complete' || statusData.status === 'cancelled') { clearInterval(pollInterval); setBatchRunning(false); setBatchResults({ success: statusData.success || [], failed: statusData.failed || [], downloadFolder: statusData.folder }); localStorage.removeItem('batchState'); }
          } catch (error) {
              console.error('Polling error:', error);
              clearInterval(pollInterval);
          }
      }, 3000);
  };
  const handleSchemaUpload = async (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        setMessage('Uploading schema...');
        setIsLoading(true);
        
        try {
            // Send to Python backend
            const result = await PythonAPI.uploadSchemaCSV(file);
            
            if (result.status === 'success') {
                setUserData({ ...userData, schemaData: result.data });
                setMessage(`Success! Loaded schema from ${file.name}. Save the user file to apply.`);
            } else {
                setMessage(`Error: ${result.message}`);
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    } else {
        setMessage('Error: Please upload a valid .csv file.');
    }
};
  const handleCombineAndLoad = async (files) => {
    if (files.length === 0) {
        setMessage('Error: No files selected.');
        return;
    }
    
    setMessage(`Combining ${files.length} files...`);
    setIsLoading(true);
    
    try {
        // Send to Python backend
        const result = await PythonAPI.combineSchemaCSVs(files);
        
        if (result.status === 'success') {
            setUserData({ ...userData, schemaData: result.data });
            setMessage(`Success! Combined ${files.length} files and loaded schema. Save the user file to apply.`);
        } else {
            setMessage(`Error: ${result.message}`);
        }
    } catch (err) {
        setMessage(`Error: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
};

  const handleGenerateFetchQueries = () => {
    const schemas = schemasToFetch.split(/[\s,]+/).filter(Boolean);
    if (schemas.length === 0) {
      setMessage('Error: Please enter at least one schema name.');
      return;
    }
    // Use the configurable batch size
    const currentBatchSize = batchSize || 10;
    const queries = [];
    for (let i = 0; i < schemas.length; i += currentBatchSize) {
      const batch = schemas.slice(i, i + currentBatchSize);
      const schemaList = batch.map(s => `'${s}'`).join(', ');
      // Use the custom template
      const query = queryTemplate.replace('{schemas}', schemaList);
      queries.push(query);
    }
    setGeneratedFetchQueries(queries);
    setMessage(`${queries.length} queries generated (${currentBatchSize} schemas per query). Run batch automation or copy queries.`);
  };

  const handleCopyQueries = () => {
      const txt = generatedFetchQueries.join('\n\n');
      navigator.clipboard.writeText(txt);
      setMessage('Generated queries copied to clipboard.');
  };
  
  const handleRunBatchAutomation = async () => {
      if (!schemaFetchCreds.username || !schemaFetchCreds.password) {
          setMessage('Error: Please enter portal credentials');
          return;
      }
      
      if (generatedFetchQueries.length === 0) {
          setMessage('Error: No queries to run');
          return;
      }
      
      // Get automation-enabled portal
      const autoPortal = (userData.portals || []).find(p => p.automationType === 'type1');
      if (!autoPortal) {
          setMessage('Error: No automation-enabled portal configured');
          return;
      }
      
      setBatchRunning(true);
      setBatchResults(null);
      setMessage('Starting batch automation...');
      
      try {
          const response = await fetch('http://localhost:5000/api/run-batch-automation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  portalUrl: autoPortal.url,
                  username: schemaFetchCreds.username,
                  password: schemaFetchCreds.password,
                  queries: generatedFetchQueries,
                  folderName: batchOutputFolder || null,
                  maxWaitMinutes: maxWaitMinutes  // NEW: Pass max wait time to API
              })
          });
          
          const data = await response.json();
          
          if (data.status === 'success') {
              const batchId = data.batchId;
              setCurrentBatchId(batchId);  // ADD THIS LINE
              
              // Poll for status
              const pollInterval = setInterval(async () => {
                  const statusResponse = await fetch(`http://localhost:5000/api/batch-status/${batchId}`);
                  const statusData = await statusResponse.json();
                  
                  setBatchStatus({ current: statusData.current || 0, total: statusData.total || 0, message: statusData.message || 'Processing...', currentProgress: statusData.currentProgress });
                  
                  if (statusData.status === 'complete') { clearInterval(pollInterval); setBatchRunning(false); setBatchResults({ success: statusData.success || [], failed: statusData.failed || [], downloadFolder: statusData.folder }); setMessage(`Batch complete: ${statusData.success?.length || 0} succeeded, ${statusData.failed?.length || 0} failed`); }
              }, 3000);  // Check every 3 seconds
          } else {
              setMessage(`Error: ${data.message}`);
              setBatchRunning(false);
          }
      } catch (error) {
          setMessage(`Error: ${error.message}`);
          setBatchRunning(false);
      }
  };
  
  const handleRetryFailed = async () => {
      // Get the failed query indices
      const failedIndices = batchResults.failed.map(f => f.query - 1);
      const failedQueries = failedIndices.map(i => generatedFetchQueries[i]);
      
      // Reset results
      setBatchResults(null);
      
      // Re-run with only failed queries
      const autoPortal = (userData.portals || []).find(p => p.automationType === 'type1');
      
      setBatchRunning(true);
      
      try {
          const response = await fetch('http://localhost:5000/api/run-batch-automation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  portalUrl: autoPortal.url,
                  username: schemaFetchCreds.username,
                  password: schemaFetchCreds.password,
                  queries: failedQueries
              })
          });
          
          const data = await response.json();
          
          if (data.status === 'success') {
              const batchId = data.batchId;
              
              const pollInterval = setInterval(async () => {
                  const statusResponse = await fetch(`http://localhost:5000/api/batch-status/${batchId}`);
                  const statusData = await statusResponse.json();
                  
                  setBatchStatus({ current: statusData.current || 0, total: statusData.total || 0, message: statusData.message || 'Processing...' });
                  
                  if (statusData.status === 'complete') { clearInterval(pollInterval); setBatchRunning(false); setBatchResults({ success: statusData.success || [], failed: statusData.failed || [], downloadFolder: statusData.folder }); setMessage(`Retry complete: ${statusData.success?.length || 0} succeeded, ${statusData.failed?.length || 0} failed`); }
              }, 3000);
          }
      } catch (error) {
          setMessage(`Error: ${error.message}`);
          setBatchRunning(false);
      }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (userData.users.some(u => u.email === newUserEmail)) {
      setMessage('Error: User with this email already exists.');
      setIsLoading(false);
      return;
    }
    const passwordHash = await AuthService.hashPassword(newUserPassword);
    if (!passwordHash) {
      setMessage('Error: Could not hash password.');
      setIsLoading(false);
      return;
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email: newUserEmail,
      passwordHash,
      isAdmin: isNewUserAdmin,
      permissions: { schemas: [], level: 'Beginner', portals: [] }
    };
    setUserData({ ...userData, users: [...userData.users, newUser] });
    setNewUserEmail('');
    setNewUserPassword('');
    setIsNewUserAdmin(false);
    setMessage(`Success! User ${newUser.email} added. Remember to save the new file.`);
    setIsLoading(false);
  };

  const handleSaveFile = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'user_access.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage('New user_access.json file saved to your downloads.');
  };

  const handlePermissionChange = (userId, schemaName) => {
    const updatedUsers = userData.users.map(user => {
      if (user.id === userId) {
        const currentPermissions = new Set(user.permissions?.schemas || []);
        if (currentPermissions.has(schemaName)) currentPermissions.delete(schemaName);
        else currentPermissions.add(schemaName);
        return { ...user, permissions: { ...user.permissions, schemas: Array.from(currentPermissions) } };
      }
      return user;
    });
    setUserData({ ...userData, users: updatedUsers });
    setMessage('Permissions updated. Save the file to make them permanent.');
  };

  const handleLevelChange = (userId, level) => {
    const updatedUsers = userData.users.map(user => {
      if (user.id === userId) {
        return { ...user, permissions: { ...user.permissions, level } };
      }
      return user;
    });
    setUserData({ ...userData, users: updatedUsers });
    setMessage('Permissions updated. Save the file to make them permanent.');
  };

  const handlePortalPermissionChange = (userId, portalId) => {
    const updatedUsers = userData.users.map(user => {
      if (user.id === userId) {
        const currentPortals = new Set(user.permissions?.portals || []);
        if (currentPortals.has(portalId)) currentPortals.delete(portalId);
        else currentPortals.add(portalId);
        return { ...user, permissions: { ...user.permissions, portals: Array.from(currentPortals) } };
      }
      return user;
    });
    setUserData({ ...userData, users: updatedUsers });
    setMessage('Portal access updated. Save the file to apply.');
  };

  const handlePasswordSave = async (userId, newPassword) => {
    const passwordHash = await AuthService.hashPassword(newPassword);
    if (!passwordHash) {
      setMessage('Error: Could not update password.');
      return;
    }
    const updatedUsers = userData.users.map(user => user.id === userId ? { ...user, passwordHash } : user);
    setUserData({ ...userData, users: updatedUsers });
    setPasswordChangeUser(null);
    setMessage(`Password for ${passwordChangeUser.email} updated. Save the user file to apply.`);
  };

  const handleDeleteUserConfirm = (userId) => {
    const userToDelete = userData.users.find(u => u.id === userId);
    const updatedUsers = userData.users.filter(u => u.id !== userId);
    setUserData({ ...userData, users: updatedUsers });
    setDeleteUser(null);
    setMessage(`User ${userToDelete.email} has been deleted. Save the user file to apply.`);
  };

  const handleSaveQuery = (e) => {
    e.preventDefault();
    const { id, name, description, sql } = queryToEdit;
    if (!name || !sql) {
      setMessage('Error: Query must have a name and SQL content.');
      return;
    }
    const existingQueries = userData.premadeQueries || [];
    if (id) {
      const updatedQueries = existingQueries.map(q => q.id === id ? queryToEdit : q);
      setUserData({ ...userData, premadeQueries: updatedQueries });
    } else {
      const newQuery = { ...queryToEdit, id: `query-${Date.now()}` };
      setUserData({ ...userData, premadeQueries: [...existingQueries, newQuery] });
    }
    setQueryToEdit({ id: null, name: '', description: '', sql: '' });
    setMessage('Query saved. Download the user file to apply changes.');
  };

  const handleDeleteQuery = (id) => {
    const updatedQueries = (userData.premadeQueries || []).filter(q => q.id !== id);
    setUserData({ ...userData, premadeQueries: updatedQueries });
    setMessage('Query deleted. Download the user file to apply changes.');
  };

  const handleImportPremadeQueries = (importedQueries, options) => {
    let queriesToAdd = importedQueries;
    const currentPremade = userData.premadeQueries || [];
    
    if (options.mergeDuplicates) {
        const existingSQL = new Set(currentPremade.map(q => q.sql));
        queriesToAdd = importedQueries.filter(q => !existingSQL.has(q.sql));
    }
    
    const newQueries = queriesToAdd.map(q => ({
        ...q,
        id: q.id || `premade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    setUserData({
        ...userData,
        premadeQueries: [...currentPremade, ...newQueries]
    });
    setMessage(`Imported ${newQueries.length} premade queries. Save the user file to apply.`);
  };

  const handleImportAllQueries = (importedQueries) => {
      alert("Importing to 'All Queries' is not supported directly. Please import to Premade Queries.");
  };

  const handleSavePortal = (e) => {
    e.preventDefault();
    if (!portalToEdit.name || !portalToEdit.url) {
      setMessage('Error: Portal must have a name and URL.');
      return;
    }
    const existingPortals = userData.portals || [];
    if (portalToEdit.id) {
      const updatedPortals = existingPortals.map(p => p.id === portalToEdit.id ? portalToEdit : p);
      setUserData({ ...userData, portals: updatedPortals });
    } else {
      if (existingPortals.length >= 2) {
        setMessage('Error: You can only have a maximum of 2 portals.');
        return;
      }
      const newPortal = { ...portalToEdit, id: `portal-${Date.now()}` };
      setUserData({ ...userData, portals: [...existingPortals, newPortal] });
    }
    setPortalToEdit({ id: null, name: '', url: '', automationType: 'none' });
    setMessage('Portal saved. Remember to save and download the main user file.');
  };

  const handleDeletePortal = (id) => {
    const updatedPortals = (userData.portals || []).filter(p => p.id !== id);
    setUserData({ ...userData, portals: updatedPortals });
    setMessage('Portal deleted. Save the user file to apply changes.');
  };

  return (
    <div className={`${theme === 'dark' 
      ? 'bg-gray-900 text-white' 
      : 'bg-gray-100 text-gray-900'
    } min-h-screen font-sans flex flex-col p-4 md:p-6 lg:p-8`}>
      {passwordChangeUser && <PasswordChangeModal user={passwordChangeUser} onSave={handlePasswordSave} onCancel={() => setPasswordChangeUser(null)} />}
      {deleteUser && <ConfirmDeleteModal user={deleteUser} onConfirm={handleDeleteUserConfirm} onCancel={() => setDeleteUser(null)} />}
      {detailsModalBatch && (
        <BatchHistoryDetailsModal
            batch={detailsModalBatch}
            onClose={() => setDetailsModalBatch(null)}
            theme={theme}
        />
      )}

      <header className={`flex justify-between items-center mb-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'}`}>
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Admin Dashboard</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} mt-1`}>Manage users, permissions, master schema, portals, and queries.</p>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button
            onClick={onLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition shadow-lg"
          >
            <span>Back to Panel</span>
          </button>
        </div>
      </header>

      {message && (
        <p className={`p-3 rounded-lg mb-4 text-center font-semibold ${message.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'} text-white`}>{message}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Add New User */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className={`block text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  required
                  className={`mt-1 w-full p-2 ${theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-400 text-gray-900'
                  } border rounded-lg`}
                />
              </div>
              <div>
                <label className={`block text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  required
                  className={`mt-1 w-full p-2 ${theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-400 text-gray-900'
                  } border rounded-lg`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isNewUserAdmin}
                  onChange={e => setIsNewUserAdmin(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="isAdmin" className={`ml-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Make Admin?</label>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-1000 flex justify-center items-center">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Add User'}
              </button>
            </form>
          </div>

          {/* Current Users */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Current Users ({userData.users.length})</h2>
              <button onClick={handleSaveFile} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Save & Download File</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-container">
              {userData.users.map(user => (
                <UserPermissions
                  key={user.id}
                  user={user}
                  allSchemas={allSchemas}
                  allPortals={allPortals}
                  onPermissionChange={handlePermissionChange}
                  onLevelChange={handleLevelChange}
                  onChangePassword={setPasswordChangeUser}
                  onDeleteUser={setDeleteUser}
                  onPortalPermissionChange={handlePortalPermissionChange}
                  theme={theme}
                />
              ))}
            </div>
          </div>

          {/* Schema Fetching Assistant */}
<div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg space-y-3`}>
    <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Schema Fetching Assistant <InfoTooltip text="Generate and auto-run batched queries to fetch schema metadata." />
    </h2>

    <label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Schemas to fetch (comma or space separated)
    </label>
    <textarea
        placeholder="e.g., public, sales, analytics"
        value={schemasToFetch}
        onChange={e => setSchemasToFetch(e.target.value)}
        className={`w-full p-2 ${theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-400 text-gray-900'
        } border rounded-lg min-h-[80px]`}
    />
    <div className="grid grid-cols-2 gap-3">
    <div>
        <label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Schemas per Query
        </label>
        <input
            type="number"
            value={batchSize}
            onChange={e => setBatchSize(parseInt(e.target.value) || 10)}
            min="1"
            max="50"
            className={`w-full p-2 text-sm ${theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-400 text-gray-900'
            } rounded-lg`}
        />
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
            Default: 10. Use smaller batches if queries time out.
        </p>
    </div>
    
    <div>
        <label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Max Wait Time (minutes)
        </label>
        <input
            type="number"
            value={maxWaitMinutes}
            onChange={e => setMaxWaitMinutes(parseInt(e.target.value) || 30)}
            min="10"
            max="120"
            className={`w-full p-2 text-sm ${theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-400 text-gray-900'
            } rounded-lg`}
        />
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
            Heavy queries may need 60-120 min
        </p>
    </div>
</div>

    <div>
        <label className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Output Folder Name (optional)
        </label>
        <input
            type="text"
            placeholder="e.g., Q4_schemas or leave blank for auto-generated"
            value={batchOutputFolder}
            onChange={e => setBatchOutputFolder(e.target.value)}
            className={`w-full p-2 text-sm ${theme === 'dark' 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-400 text-gray-900'
            } rounded-lg`}
        />
    </div>

    {/* Portal Credentials for Automation */}
    <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg p-3`}>
        <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Portal Credentials (Required for Automation)
        </h3>
        <div className="space-y-2">
            <input
                type="text"
                placeholder="Portal Username"
                value={schemaFetchCreds?.username || ''}
                onChange={e => setSchemaFetchCreds({...schemaFetchCreds, username: e.target.value})}
                className={`w-full p-2 text-sm ${theme === 'dark' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-white border border-gray-400 text-gray-900'
                } rounded-lg`}
            />
            <input
                type="password"
                placeholder="Portal Password"
                value={schemaFetchCreds?.password || ''}
                onChange={e => setSchemaFetchCreds({...schemaFetchCreds, password: e.target.value})}
                className={`w-full p-2 text-sm ${theme === 'dark' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-white border border-gray-400 text-gray-900'
                } rounded-lg`}
            />
        </div>
    </div>

    <div className="flex space-x-2">
        <button 
            onClick={handleGenerateFetchQueries} 
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
            Generate Queries
        </button>
        
        {generatedFetchQueries.length > 0 && (
            <>
                <button
                    onClick={handleCopyQueries}
                    className="w-full py-2 bg-gray-600 hover:bg-gray-1000 text-white rounded-lg"
                >
                    Copy Queries
                </button>
                
                <button
                    onClick={handleRunBatchAutomation}
                    disabled={batchRunning || !schemaFetchCreds?.username || !schemaFetchCreds?.password}
                    className={`w-full py-2 rounded-lg text-white ${
                        batchRunning || !schemaFetchCreds?.username || !schemaFetchCreds?.password
                            ? 'bg-gray-1000 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {batchRunning ? '🤖 Running...' : '🤖 Auto-Run All'}
                </button>
            </>
        )}
    </div>

    {/* Batch Progress */}
    {batchRunning && (
    <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg p-3`}>
        <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {batchStatus?.total > 0 
                    ? `Processing: ${batchStatus?.current || 0} / ${batchStatus?.total}`
                    : 'Initializing batch...'}
            </span>
            <button
                onClick={async () => {
                    if (confirm('Cancel entire batch automation?')) {
                        try {
                            if (currentBatchId) {
                                await fetch(`/api/cancel-batch/${currentBatchId}`, {
                                    method: 'POST'
                                });
                                setBatchRunning(false);
                                setMessage('Batch automation cancelled');
                            }
                        } catch (error) {
                            console.error('Cancel error:', error);
                        }
                    }
                }}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
                ✕ Cancel Batch
            </button>
        </div>
        <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
            <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(batchStatus?.current / batchStatus?.total) * 100}%` }}
            />
        </div>
        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
            {batchStatus?.message || 'Processing...'}
        </p>
        
        {/* Granular Progress for Current Query */}
        {batchStatus?.currentProgress !== undefined && (
            <div className="mt-3 pt-2 border-t border-gray-600">
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Query Progress:
                </p>
                <div className={`w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-1.5`}>
                    <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${batchStatus.currentProgress}%` }}
                    />
                </div>
            </div>
        )}
    </div>
    )}

    {/* Results Log */}
    {batchResults && (
        <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg p-3`}>
            <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Batch Results
            </h3>
            {batchResults.success?.length > 0 && (
                <div className="mb-2">
                    <p className="text-green-400 font-semibold">✓ Success: {batchResults.success.length}</p>
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto scroll-container">
                        {batchResults.success.map((item, i) => (
                            <div key={i} className="text-xs text-green-400">
                                • {typeof item.schemas === 'string' ? item.schemas : (Array.isArray(item.schemas) ? item.schemas.join(', ') : 'Batch ' + item.query)} - {item.file}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {batchResults.failed?.length > 0 && (
                <div className="mt-2">
                    <p className={`text-xs font-semibold text-red-400`}>
                        ✗ Failed: {batchResults.failed.length}
                    </p>
                    <div className="mt-1 space-y-1">
                        {batchResults.failed.map((item, i) => (
                           <div key={i} className="text-xs text-red-400">
                            • {typeof item.schemas === 'string' ? item.schemas : (Array.isArray(item.schemas) ? item.schemas.join(', ') : 'Batch ' + item.query)} - {item.error}
                            </div>))}

                    </div>
                    <button
                        onClick={handleRetryFailed}
                        className="mt-2 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
                    >
                        Retry Failed
                    </button>
                </div>
            )}
            
            {batchResults.downloadFolder && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                    📁 Files saved to: {batchResults.downloadFolder}
                </p>
            )}
        </div>
    )}

    {/* Existing Preview */}
    {generatedFetchQueries.length > 0 && !batchRunning && !batchResults && (
        <div className="mt-3">
            <h3 className={`font-semibold mb-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Preview ({generatedFetchQueries.length} queries)
            </h3>
            <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} p-2 rounded max-h-48 overflow-y-auto scroll-container text-xs whitespace-pre-wrap`}>
                {generatedFetchQueries.map((q, i) => (
                    <div key={i} className="mb-3">
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} font-bold`}>
                            Batch {i + 1}
                        </p>
                        <pre className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {q}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    )}
</div>

          {/* Batch Automation History */}
<div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg space-y-3`}>
    <div className="flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Batch Automation History
        </h2>
        <button
            onClick={async () => {
                const response = await fetch('http://localhost:5000/api/batch-history');
                const data = await response.json();
                if (data.status === 'success') {
                    setBatchHistory(data.data);
                }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
            Refresh History
        </button>
    </div>
    
    {batchHistory && batchHistory.length > 0 ? (
        <div className={`max-h-96 overflow-y-auto scroll-container`}>
            {batchHistory.slice().reverse().map((entry, idx) => (
                <div key={idx} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} p-3 rounded-lg mb-2`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {entry.datetime}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                Total: {entry.totalQueries} | 
                                <span className="text-green-400 ml-1">✓ {entry.succeeded}</span> |
                                <span className="text-red-400 ml-1">✗ {entry.failed}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setDetailsModalBatch(entry);
                            }}
                            className="text-blue-400 hover:underline text-sm"
                        >
                            Details
                        </button>
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
            No batch history yet. Run a batch automation to see history here.
        </p>
    )}
</div>

          {/* Schema Query Template (Advanced) */}
<div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg space-y-3`}>
    <h2 className={`text-xl font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Schema Query Template (Advanced) <InfoTooltip text="Customize the SQL query used to fetch schema metadata. Use {schemas} as placeholder." />
    </h2>
    
    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
        This template is used by the Schema Fetching Assistant. Change it if your portal uses different column names.
    </p>
    
    <textarea
        value={queryTemplate}
        onChange={e => setQueryTemplate(e.target.value)}
        className={`w-full p-3 font-mono text-sm ${theme === 'dark'
            ? 'bg-gray-900 border-gray-700 text-green-400'
            : 'bg-gray-100 border-gray-400 text-gray-900'
        } border rounded-lg min-h-[120px]`}
        placeholder="SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE table_schema IN ({schemas});"
    />
    
    <div className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'} flex items-start p-2 bg-yellow-900/20 rounded`}>
        <span className="mr-2">⚠️</span>
        <span>Use <code className="px-1 bg-gray-700 rounded">{'{schemas}'}</code> as placeholder. It will be replaced with the actual schema list (e.g., 'schema1', 'schema2').</span>
    </div>
    
    <div className="flex space-x-2">
        <button
            onClick={() => {
                const updated = { ...userData, schemaQueryTemplate: queryTemplate };
                setUserData(updated);
                setMessage('Query template saved. Remember to download the user file to apply permanently.');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
            Save Template
        </button>
        
        <button
            onClick={() => {
                const defaultTemplate = `SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_schema IN ({schemas});`;
                setQueryTemplate(defaultTemplate);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
            Reset to Default
        </button>
    </div>
</div>

          {/* Upload / Combine Schema CSV */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg space-y-4`}>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upload / Combine Schema CSV</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Upload a single master CSV, or select multiple CSVs to combine them automatically.</p>

            <div>
              <label className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upload Master CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleSchemaUpload}
                className={`w-full p-2 ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
                } border rounded-lg`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Combine Multiple CSVs</label>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={e => handleCombineAndLoad(e.target.files)}
                className={`w-full p-2 ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
                } border rounded-lg`}
              />
            </div>

            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
              CSV must include headers with variations of "schema", "table", and "column".
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Manage Data Portals */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg flex flex-col`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Manage Data Portals <InfoTooltip text="Define up to two data portals. Users can be granted access for the 'Run Query' feature." />
            </h2>

            <form onSubmit={handleSavePortal} className="space-y-3">
    <input
        type="text"
        placeholder="Portal Name (e.g., Production BI)"
        value={portalToEdit.name}
        onChange={e => setPortalToEdit({ ...portalToEdit, name: e.target.value })}
        required
        className={`w-full p-2 ${theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-400 text-gray-900'
        } border rounded-lg`}
    />
    <input
        type="url"
        placeholder="Portal URL (e.g., https://portal.example.com)"
        value={portalToEdit.url}
        onChange={e => setPortalToEdit({ ...portalToEdit, url: e.target.value })}
        required
        className={`w-full p-2 ${theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-400 text-gray-900'
        } border rounded-lg`}
    />
    
    {/* NEW: Automation Type Selection */}
    <div>
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Automation Support
        </label>
        <select
            value={portalToEdit.automationType || 'none'}
            onChange={e => setPortalToEdit({ ...portalToEdit, automationType: e.target.value })}
            className={`w-full p-2 ${theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-400 text-gray-900'
            } border rounded-lg`}
        >
            <option value="none">No Automation</option>
            <option value="type1">Type 1 - Current Portal (Materialize)</option>
            <option value="type2">Type 2 - Second Portal (Not Configured)</option>
        </select>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
            Select automation type based on portal interface
        </p>
    </div>
    
    <div className="flex space-x-2">
        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            {portalToEdit.id ? 'Update Portal' : 'Add Portal'}
        </button>
        {portalToEdit.id && (
            <button
                type="button"
                onClick={() => setPortalToEdit({ id: null, name: '', url: '', automationType: 'none' })}
                className="w-full py-2 bg-gray-600 hover:bg-gray-1000 text-white rounded-lg"
            >
                Cancel Edit
            </button>
        )}
    </div>
</form>

            <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} mt-4 pt-4`}>
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Defined Portals</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto scroll-container">
                {(userData.portals || []).map(p => (
                  <div key={p.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} p-2 rounded-lg flex justify-between items-center text-sm`}>
        <div>
            <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {p.name}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                🤖 {p.automationType === 'type1' ? 'Automation Type 1' : 
                     p.automationType === 'type2' ? 'Automation Type 2' : 
                     'Manual Only'}
            </p>
        </div>
        <div className="space-x-2">
            <button onClick={() => setPortalToEdit(p)} className="text-blue-400 hover:underline">Edit</button>
            <button onClick={() => handleDeletePortal(p.id)} className="text-red-400 hover:underline">Delete</button>
        </div>
    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Manage Premade Queries */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-lg flex flex-col`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Manage Premade Queries</h2>
            <form onSubmit={handleSaveQuery} className="space-y-3 flex-grow flex flex-col">
              <input
                type="text"
                placeholder="Query Name"
                value={queryToEdit.name}
                onChange={e => setQueryToEdit({ ...queryToEdit, name: e.target.value })}
                required
                className={`w-full p-2 ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
                } border rounded-lg`}
              />
              <input
                type="text"
                placeholder="Description"
                value={queryToEdit.description}
                onChange={e => setQueryToEdit({ ...queryToEdit, description: e.target.value })}
                className={`w-full p-2 ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
                } border rounded-lg`}
              />
              <textarea
                placeholder="SELECT * FROM ..."
                value={queryToEdit.sql}
                onChange={e => setQueryToEdit({ ...queryToEdit, sql: e.target.value })}
                required
                className={`w-full p-2 ${theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
                } border rounded-lg flex-grow min-h-[100px]`}
              />
              <div className="flex space-x-2">
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {queryToEdit.id ? 'Update Query' : 'Add Query'}
                </button>
                {queryToEdit.id && (
                  <button
                    type="button"
                    onClick={() => setQueryToEdit({ id: null, name: '', description: '', sql: '' })}
                    className="w-full py-2 bg-gray-600 hover:bg-gray-1000 text-white rounded-lg"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} mt-4 pt-4`}>
              <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Saved Queries</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto scroll-container">
                {(userData.premadeQueries || []).map(q => (
                  <div key={q.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} p-2 rounded-lg flex justify-between items-center text-sm`}>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{q.name}</p>
                    <div className="space-x-2">
                      <button onClick={() => setQueryToEdit(q)} className="text-blue-400 hover:underline">Edit</button>
                      <button onClick={() => handleDeleteQuery(q.id)} className="text-red-400 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export/Import Premade Queries */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Manage Premade Queries (Bulk)
            </h3>
            
            <ExportImportQueries
              queries={userData.premadeQueries || []}
              onImport={handleImportPremadeQueries}
              userData={userData}
              queryType="premade"
            />
          </div>

          {/* Export/Import All User Queries */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Backup All Queries
            </h3>
            
            <ExportImportQueries
              queries={allUserQueries}
              onImport={handleImportAllQueries}
              userData={userData}
              queryType="all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
