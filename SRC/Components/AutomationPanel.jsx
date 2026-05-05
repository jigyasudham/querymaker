import React, { useState, useEffect } from 'react';
import { StateManager } from '../Services/StateManager.js';
import { PlayIcon, AlertTriangleIcon, CopyIcon } from './UI/Icons.jsx';

const DEBUG = false; // Set to true for development logging

export default function AutomationPanel({ query, availablePortals, theme, currentUser }) {
    // User-specific localStorage keys to prevent data leakage between users
    const userKey = currentUser || 'default';
    const STORAGE_KEYS = {
        credentials: `portal_credentials_${userKey}`,
        history: `automation_history_${userKey}`
    };

    // Load saved credentials from localStorage (user-specific ONLY - don't use shared StateManager)
    const savedCredentials = JSON.parse(localStorage.getItem(STORAGE_KEYS.credentials) || '{}');

    // Credentials MUST be user-specific - never load from shared StateManager
    const [credentials, setCredentials] = useState({
        username: savedCredentials.username || '',
        password: savedCredentials.rememberPassword ? (savedCredentials.password || '') : '',
        title: '',
        portalId: savedCredentials.portalId || '',
        rememberUsername: savedCredentials.rememberUsername || false,
        rememberPassword: savedCredentials.rememberPassword || false
    });

    // StateManager is only for resuming running automation sessions (same browser session)
    // It's NOT user-specific, so only use for transient running state
    const savedAutomationState = StateManager.loadAutomationState();

    const [isRunning, setIsRunning] = useState(savedAutomationState?.isRunning || false);
    const [progress, setProgress] = useState(savedAutomationState?.progress || 0);
    const [currentStep, setCurrentStep] = useState(savedAutomationState?.currentStep || '');
    // Don't restore result from shared StateManager - it may be from another user
    const [result, setResult] = useState(null);
    const [automationId, setAutomationId] = useState(savedAutomationState?.automationId || null);
    
    const [showCredentials, setShowCredentials] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Filter portals that support automation
    const automationPortals = availablePortals?.filter(p => p.automationType && p.automationType !== 'none') || [];

    // Early return if no automation portals available
    if (automationPortals.length === 0) {
        return (
            <div
                data-automation-panel
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6`}
            >
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Automation Panel (The Robot 🤖)
                </h2>
                <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                    <div className="flex items-center text-yellow-400">
                        <span className="mr-2">⚠️</span>
                        <span className="font-semibold">No Automation Portals Available</span>
                    </div>
                    <p className="mt-2 text-sm text-yellow-300">
                        No portals with automation enabled are available for your account.
                        Contact your administrator to enable portal access.
                    </p>
                </div>
            </div>
        );
    }

    // Save automation running state to StateManager (for resume on page refresh)
    // NOTE: Do NOT save credentials here - they go to user-specific localStorage only
    useEffect(() => {
        // Only save if automation is actually running (to allow resume)
        if (isRunning && automationId) {
            const state = {
                isRunning,
                progress,
                currentStep,
                automationId,
                timestamp: Date.now()
            };
            StateManager.saveAutomationState(state);
        }
    }, [isRunning, progress, currentStep, automationId]);

    // Save credentials when they change
    const handleCredentialChange = (field, value) => {
        setCredentials(prev => {
            const updated = { ...prev, [field]: value };

            // Save to localStorage based on remember preferences (user-specific)
            const savedData = JSON.parse(localStorage.getItem(STORAGE_KEYS.credentials) || '{}');

            // Always save these non-sensitive fields
            savedData.portalId = updated.portalId;
            savedData.rememberUsername = updated.rememberUsername;
            savedData.rememberPassword = updated.rememberPassword;

            // Save username if rememberUsername is enabled
            if (updated.rememberUsername) {
                savedData.username = updated.username;
            } else {
                delete savedData.username;
            }

            // Save password if rememberPassword is enabled (with warning shown in UI)
            if (updated.rememberPassword) {
                savedData.password = updated.password;
            } else {
                delete savedData.password;
            }

            localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(savedData));

            return updated;
        });
    };
    
    const handleDownloadFile = async (filepath) => {
      try {
        if (DEBUG) console.log('📥 Downloading:', filepath);
        
        const response = await fetch('http://localhost:5000/api/download-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filepath })
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
    
        const blob = await response.blob();
        const filename = filepath.split('/').pop().split('\\').pop();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (DEBUG) console.log('✓ Download successful!');
        
      } catch (error) {
        console.error('❌ Download failed:', error);
        alert(`Download failed: ${error.message}`);
      }
    };

    // Set default portal when component mounts
    useEffect(() => {
        if (automationPortals && automationPortals.length > 0 && !credentials.portalId) {
            handleCredentialChange('portalId', automationPortals[0].id);
        }
    }, [automationPortals]);

    // Resume polling if automation was running
    useEffect(() => {
        if (savedAutomationState?.isRunning && savedAutomationState?.automationId) {
            if (DEBUG) console.log('🔄 Resuming automation polling:', savedAutomationState.automationId);
            resumeAutomationPolling(savedAutomationState.automationId);
        }
    }, []); // Only run on mount

    // Load automation history from localStorage (user-specific)
    const loadAutomationHistory = () => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
            setDownloadHistory(history);
        } catch (error) {
            console.error('Failed to load automation history:', error);
            setDownloadHistory([]);
        }
    };

    // Save automation result to history (user-specific)
    const saveToHistory = (automationResult) => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
            const newEntry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: automationResult.status,
                message: automationResult.message,
                fileName: automationResult.fileName,
                filePath: automationResult.filePath,
                query: query?.substring(0, 100) + '...',
                portal: availablePortals?.find(p => p.id === credentials.portalId)?.name || 'Unknown'
            };
            // Keep only last 20 entries
            const updatedHistory = [newEntry, ...history].slice(0, 20);
            localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updatedHistory));
            setDownloadHistory(updatedHistory);
        } catch (error) {
            console.error('Failed to save to history:', error);
        }
    };

    // Load history when showHistory is toggled on
    useEffect(() => {
        if (showHistory && downloadHistory.length === 0) {
            loadAutomationHistory();
        }
    }, [showHistory]);

    const resumeAutomationPolling = (runId) => {
        const pollInterval = setInterval(async () => {
            try {
                const statusResponse = await fetch(`http://localhost:5000/api/automation-status/${runId}`);
                const statusData = await statusResponse.json();

                // Only update if values changed
                setProgress(prev => {
                    const newVal = statusData.progress || 0;
                    return prev === newVal ? prev : newVal;
                });
                setCurrentStep(prev => {
                    const newVal = statusData.step || 'Processing...';
                    return prev === newVal ? prev : newVal;
                });

                if (statusData.status === 'success' || statusData.status === 'error' || statusData.status === 'cancelled') {
                    clearInterval(pollInterval);
                    setIsRunning(false);
                    setResult(statusData);

                    // Clear saved state on completion
                    StateManager.clearAutomationState();
                }
            } catch (error) {
                if (DEBUG) console.error('Polling error:', error);
                clearInterval(pollInterval);
                setIsRunning(false);
                StateManager.clearAutomationState();
            }
        }, 2000); // Poll every 2 seconds
        
        // Store interval ID so we can clear it
        return pollInterval;
    };

    const startAutomation = async () => {
        // Safety Check 1: Prevent double execution
        if (isRunning) {
            if (DEBUG) console.log('⚠️ Automation already running, ignoring click');
            return;
        }

        // Safety Check 2: Empty query validation
        if (!query || query.trim() === '') {
            alert('Query cannot be empty. Please enter a SQL query first.');
            return;
        }

        if (!credentials.username || !credentials.password || !credentials.title || !credentials.portalId) {
            alert('Please fill in all credentials and select a portal');
            return;
        }

        const selectedPortal = availablePortals.find(p => p.id === credentials.portalId);

        if (!selectedPortal || !selectedPortal.url) {
            alert('Please select a valid portal with automation enabled.');
            return;
        }

        // Enhanced logging - start
        const startTime = Date.now();
        if (DEBUG) console.log('🤖 Starting automation:', {
            portal: selectedPortal?.name,
            query: query?.substring(0, 100) + '...',
            timestamp: new Date().toISOString(),
            user: credentials.username
        });

        setIsRunning(true);
        setCurrentStep('Starting...');
        setProgress(0);
        setResult(null);
        setAutomationId(null); // CLEAR OLD ID

        try {
const response = await fetch('/api/run-automation', {                
    method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portalUrl: selectedPortal.url,
                    username: credentials.username,
                    password: credentials.password,
                    title: credentials.title,
                    querySql: query,
                    browser: 'chrome'
                })
            });

            const data = await response.json();
            
        if (data.status === 'success') {
            const runId = data.sessionId; // ⬅️ NOTE: The backend returns 'sessionId' or 'batchId'
            
            // Set the ID immediately in state for the cancel button to work
            setAutomationId(runId); 
            
            if (DEBUG) console.log('✅ Automation started with ID:', runId);
            
            // START POLLING... Use runId directly in the interval
            const pollInterval = setInterval(async () => {
                try {
                    // CRITICAL: Ensure runId exists before polling
                    if (!runId) {
                        throw new Error("Missing automation ID.");
                    }
                    
                    const statusResponse = await fetch(`http://localhost:5000/api/automation-status/${runId}`);
                    const statusData = await statusResponse.json();

                    // Only update state if values actually changed (avoid unnecessary re-renders)
                    setProgress(prev => {
                        const newVal = statusData.progress || 0;
                        return prev === newVal ? prev : newVal;
                    });
                    setCurrentStep(prev => {
                        const newVal = statusData.step || '';
                        return prev === newVal ? prev : newVal;
                    });
                    
                    if (statusData.status === 'success' || statusData.status === 'error' || statusData.status === 'cancelled') {
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        setResult(statusData);
                        setAutomationId(null);

                        // Save to automation history
                        saveToHistory(statusData);

                        // Clear saved state upon successful completion/failure
                        if (typeof StateManager !== 'undefined') {
                            StateManager.clearAutomationState();
                        }
                    } else if (statusData.status === 'unknown') {
                        // If status is unknown, it means the server may have lost the session
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        const errorResult = {
                            status: 'error',
                            message: 'Session lost or completed unexpectedly on server.'
                        };
                        setResult(errorResult);
                        saveToHistory(errorResult);
                        setAutomationId(null);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                    clearInterval(pollInterval);
                    setIsRunning(false);
                    setAutomationId(null);
                }
            }, 2000);
        } else {
            setIsRunning(false);
            setCurrentStep('Failed to start');
            alert(`Error: ${data.message}`);
        }
        } catch (error) {
            // Improved error handling with specific messages
            const errorMsg = error.message?.toLowerCase() || '';
            let userMessage = '';

            if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
                userMessage = 'Network error: Cannot connect to backend. Is the server running?';
            } else if (errorMsg.includes('portal') || errorMsg.includes('login')) {
                userMessage = 'Portal connection failed. Check portal URL and credentials.';
            } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
                userMessage = 'Request timed out. The server may be busy.';
            } else {
                userMessage = `Automation failed: ${error.message}`;
            }

            setIsRunning(false);
            setCurrentStep('Error starting automation');
            setResult({ status: 'error', message: userMessage });
            console.error('❌ Automation error:', error);
        }
    };

    const handleCancel = async () => {
        if (!automationId) {
            console.error('❌ No automation ID - cannot cancel');
            alert('Cannot cancel: No active automation ID found');
            return;
        }
        
        if (DEBUG) console.log('🛑 Attempting to cancel automation:', automationId);
        
        try {
            const response = await fetch(`http://localhost:5000/api/cancel-automation/${automationId}`, {
                method: 'POST'
            });
            
            const data = await response.json();
            if (DEBUG) console.log('Cancel response:', data);
            
            if (data.status === 'success') {
                setIsRunning(false);
                setCurrentStep('✓ Cancelled by user');
                setAutomationId(null);
                
                // Clear saved state
                if (typeof StateManager !== 'undefined') {
                    StateManager.clearAutomationState();
                }
            } else {
                alert(`Failed to cancel: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Cancel error:', error);
            alert('Failed to cancel automation. Check console for details.');
        }
    };

    const getProgressColor = () => {
        if (!result) return 'bg-blue-500';
        if (result.status === 'error') return 'bg-red-500';
        if (result.status === 'success' || result.status === 'complete') return 'bg-green-500';
        return 'bg-blue-500';
    };

    return (
        <div 
            data-automation-panel
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-6 flex flex-col`}
        >
            <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Automation Panel (The Robot 🤖)
            </h2>

            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} mb-4`}>
                Automatically submit query to portal, wait for completion, and download results.
            </p>

            {/* Credentials Section */}
            <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg p-4 mb-4`}>
                <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className={`w-full text-left font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                    {showCredentials ? '▼' : '▶'} Portal Credentials
                    {(credentials.rememberUsername || credentials.rememberPassword) && (
                        <span className="ml-2 text-xs font-normal text-green-500">(Saved locally)</span>
                    )}
                </button>
                
                {showCredentials && (
                    <div className="space-y-3 mt-3">
                        <div>
                            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Select Portal
                            </label>
                            <select
                                value={credentials.portalId}
                                onChange={(e) => handleCredentialChange('portalId', e.target.value)}
                                disabled={isRunning}
                                className={`w-full p-2 ${theme === 'dark' 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-900 border border-gray-400'
                                } rounded-lg text-sm`}
                            >
                                {automationPortals && automationPortals.length > 0 ? (
    automationPortals.map(portal => (
        <option key={portal.id} value={portal.id}>
            {portal.name} ({portal.automationType === 'type1' ? 'Type 1' : 'Type 2'})
                                        </option>
                                    ))
                                ) : (
    <option value="">No automation-enabled portals</option>
                                )}
                            </select>
                        </div>
                        
                        <div>
                            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Portal Username
                            </label>
                            <input
                                type="text"
                                value={credentials.username}
                                onChange={(e) => handleCredentialChange('username', e.target.value)}
                                placeholder="your.email@company.com"
                                disabled={isRunning}
                                className={`w-full p-2 ${theme === 'dark'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-white text-gray-900 border border-gray-400'
                                } rounded-lg text-sm`}
                            />
                            <label className="flex items-center mt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={credentials.rememberUsername}
                                    onChange={(e) => handleCredentialChange('rememberUsername', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Remember username
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Portal Password
                            </label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => handleCredentialChange('password', e.target.value)}
                                placeholder="••••••••"
                                disabled={isRunning}
                                className={`w-full p-2 ${theme === 'dark'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-white text-gray-900 border border-gray-400'
                                } rounded-lg text-sm`}
                            />
                            <label className="flex items-center mt-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={credentials.rememberPassword}
                                    onChange={(e) => handleCredentialChange('rememberPassword', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Remember password
                                </span>
                                {credentials.rememberPassword && (
                                    <span className="ml-2 text-xs text-yellow-500">(⚠️ stored locally)</span>
                                )}
                            </label>
                        </div>

                        <div>
                            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Request Title
                            </label>
                            <input
                                type="text"
                                value={credentials.title}
                                onChange={(e) => setCredentials({...credentials, title: e.target.value})}
                                placeholder="e.g., Sales Report Q4"
                                disabled={isRunning}
                                className={`w-full p-2 ${theme === 'dark' 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-900 border border-gray-400'
                                } rounded-lg text-sm`}
                            />
                        </div>

                        <button
                            onClick={() => {
                                localStorage.removeItem(STORAGE_KEYS.credentials);
                                setCredentials(prev => ({
                                    ...prev,
                                    username: '',
                                    password: '',
                                    rememberUsername: false,
                                    rememberPassword: false
                                }));
                                alert('Saved credentials cleared');
                            }}
                            className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-800 hover:text-gray-800'} underline`}
                        >
                            Clear saved credentials
                        </button>

                        <div className={`text-xs ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} flex items-start`}>
                            <AlertTriangleIcon />
                            <span className="ml-2">
                                {credentials.rememberPassword
                                    ? 'Warning: Password is stored in browser localStorage (not encrypted). Uncheck "Remember password" to disable.'
                                    : 'Credentials are stored in memory only. Check "Remember" to save locally.'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Display */}
            {(isRunning || result) && (
                <div className={`border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg p-4 mb-4`}>
                    {/* Running indicator with spinner */}
                    {isRunning && (
                        <div className={`flex items-center gap-3 mb-3 p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-100 border border-blue-300'
                        }`}>
                            <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                            <span className={`font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                Automation in progress...
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {currentStep || 'Processing...'}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                            {progress || 0}%
                        </span>
                    </div>

                    {/* Progress Bar with stages */}
                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-3 mb-2 relative`}>
                        <div
                            className={`${getProgressColor()} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${progress || 0}%` }}
                        />
                        {/* Stage markers */}
                        <div className="absolute top-0 left-0 w-full h-full flex items-center pointer-events-none">
                            <div className="absolute left-[10%] w-0.5 h-full bg-gray-500/30" title="Login"></div>
                            <div className="absolute left-[40%] w-0.5 h-full bg-gray-500/30" title="Submit"></div>
                            <div className="absolute left-[80%] w-0.5 h-full bg-gray-500/30" title="Download"></div>
                        </div>
                    </div>

                    {/* Stage labels */}
                    {isRunning && (
                        <div className={`flex justify-between text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-2`}>
                            <span className={progress >= 10 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : ''}>
                                {progress >= 10 ? '✓' : '○'} Login
                            </span>
                            <span className={progress >= 40 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : ''}>
                                {progress >= 40 ? '✓' : '○'} Submit
                            </span>
                            <span className={progress >= 80 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : ''}>
                                {progress >= 80 ? '✓' : '○'} Process
                            </span>
                            <span className={progress >= 100 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : ''}>
                                {progress >= 100 ? '✓' : '○'} Done
                            </span>
                        </div>
                    )}

                    {/* Cancel Button */}
                    {isRunning && (
                        <button
                            onClick={handleCancel}
                            disabled={!automationId}
                            className={`mt-2 w-full py-3 px-6 rounded-lg font-bold ${
                                automationId 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-gray-600 cursor-not-allowed'
                            } text-white`}
                            title={automationId ? `Cancel automation ${automationId}` : 'No active automation'}
                        >
                            ✕ Cancel Automation
                            {automationId && (
                                <span className="text-xs ml-2 opacity-75">
                                    (ID: {automationId.substring(0, 8)}...)
                                </span>
                            )}
                        </button>
                    )}

                    {/* Error or Success Message */}
                    {result && result.message && (
                        <div className={`text-sm mt-2 p-3 rounded ${
                            result.status === 'error'
                                ? 'text-red-400 bg-red-900/20 border border-red-800'
                                : 'text-green-400 bg-green-900/20 border border-green-800'
                        }`}>
                            {/* Portal Error - Show prominently */}
                            {result.status === 'error' && result.message?.includes('Portal error:') ? (
                                <div>
                                    <div className="font-semibold text-red-400 flex items-center mb-2">
                                        <span className="mr-2">⚠️</span>
                                        Portal Error Detected
                                    </div>
                                    <div className="bg-red-900/40 p-3 rounded font-mono text-sm whitespace-pre-wrap text-red-300 border border-red-700">
                                        {result.message.replace('Portal error: ', '')}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        This error was returned by the portal. Check your query syntax or contact support.
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <strong className="mr-2">
                                        {result.status === 'success' ? '✓' : '✗'}
                                    </strong>
                                    <span>{result.message}</span>
                                </div>
                            )}
        
        {/* Download Link */}
        {result.fileName && (
    <div className="mt-3 space-y-2">
        <div className="flex items-center space-x-2">
            <span className="text-xs">📁 File:</span>
            <button
                onClick={() => handleDownloadFile(result.filePath)}
                className="text-blue-400 hover:text-blue-300 underline text-xs font-mono"
            >
                {result.fileName}
            </button>
        </div>
                
                {/* Preview Button for CSV files */}
                {result.fileName.toLowerCase().endsWith('.csv') && (
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                        {showPreview ? '▼ Hide Preview' : '▶ Show Preview'}
                    </button>
                )}
            </div>
        )}
    </div>
)}
                </div>
            )}

            {/* File Preview Section */}
            {showPreview && result?.fileName && (
                <FilePreview fileName={result.fileName} theme={theme} />
            )}

            {/* Action Button */}
            <button
                onClick={startAutomation}
                disabled={isRunning}
                className={`w-full py-3 px-4 rounded-lg font-bold inline-flex items-center justify-center ${
                    isRunning 
                        ? 'bg-gray-1000 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                } text-white transition`}
            >
                {isRunning ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running...
                    </>
                ) : (
                    <>
                        <PlayIcon />
                        <span>Run Automation</span>
                    </>
                )}
            </button>

            {/* Info */}
            <div className={`mt-4 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-800'}`}>
                <p>• Browser will open automatically</p>
                <p>• You'll see the robot performing actions</p>
                <p>• File will download to your Downloads folder</p>
                <p>• Close this tab anytime - automation continues in background</p>
            </div>

            {/* Automation History Section */}
            <div className={`mt-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg`}>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`w-full p-3 text-left font-semibold flex items-center justify-between ${
                        theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-200'
                    } rounded-lg transition`}
                >
                    <span>{showHistory ? '▼' : '▶'} Automation History</span>
                    {downloadHistory.length > 0 && (
                        <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}>
                            {downloadHistory.length} runs
                        </span>
                    )}
                </button>

                {showHistory && (
                    <div className="p-3 pt-0">
                        {downloadHistory.length === 0 ? (
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                No automation history yet. Run an automation to see results here.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {downloadHistory.map((run, idx) => (
                                    <div
                                        key={run.id || idx}
                                        className={`p-2 rounded text-xs ${
                                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                                {new Date(run.timestamp).toLocaleString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${
                                                run.status === 'success'
                                                    ? 'bg-green-600/30 text-green-400'
                                                    : run.status === 'error'
                                                    ? 'bg-red-600/30 text-red-400'
                                                    : 'bg-yellow-600/30 text-yellow-400'
                                            }`}>
                                                {run.status === 'success' ? '✓ Success' : run.status === 'error' ? '✗ Failed' : '⚠ Cancelled'}
                                            </span>
                                        </div>
                                        <div className={`mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                            Portal: {run.portal}
                                        </div>
                                        {run.query && (
                                            <div className={`mt-1 truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                                Query: {run.query}
                                            </div>
                                        )}
                                        {run.status === 'error' && run.message && (
                                            <div className="mt-1 text-red-400 truncate">
                                                Error: {run.message.substring(0, 50)}...
                                            </div>
                                        )}
                                        {run.status === 'success' && run.fileName && (
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-gray-400">📁 {run.fileName}</span>
                                                <button
                                                    onClick={() => handleDownloadFile(run.filePath)}
                                                    className="text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={loadAutomationHistory}
                                className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} underline`}
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem(STORAGE_KEYS.history);
                                    setDownloadHistory([]);
                                }}
                                className={`text-xs ${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'} underline`}
                            >
                                Clear History
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilePreview({ fileName, theme }) {
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                const response = await fetch(`http://localhost:5000/downloads/${fileName}`);
                const text = await response.text();
                
                // Parse CSV
                const lines = text.split('\n').slice(0, 51); // First 50 rows + header
                const rows = lines.map(line => line.split(','));
                
                setPreviewData({ headers: rows[0], rows: rows.slice(1) });
                setLoading(false);
            } catch (error) {
                console.error('Preview error:', error);
                setLoading(false);
            }
        };
        
        loadPreview();
    }, [fileName]);

    if (loading) {
        return (
            <div className={`mt-3 p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                Loading preview...
            </div>
        );
    }

    if (!previewData) {
        return (
            <div className={`mt-3 p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                Could not load preview
            </div>
        );
    }

    return (
        <div className={`mt-3 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'} rounded-lg overflow-hidden`}>
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} px-4 py-2 text-sm font-semibold`}>
                Preview (First 50 rows)
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className={`w-full text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'} sticky top-0`}>
                        <tr>
                            {previewData.headers.map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left font-semibold border-r border-gray-600">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.rows.map((row, i) => (
                            <tr key={i} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-400'}`}>
                                {row.map((cell, j) => (
                                    <td key={j} className="px-3 py-1 border-r border-gray-600">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} px-4 py-2 text-xs text-center`}>
                Showing first 50 rows • Download full file using link above
            </div>
        </div>
    );
}