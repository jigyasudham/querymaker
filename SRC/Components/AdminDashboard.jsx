// SRC/Components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { PythonAPI } from '/SRC/Services/PythonAPI.js';
import {
  UploadIcon, LogoutIcon, LockIcon, KeyIcon, TrashIcon,
  InfoIcon, PlusCircleIcon, SearchIcon, SaveIcon, PlayIcon, CodeIcon, AdminIcon
} from './UI/Icons.jsx';
import { PasswordChangeModal, ConfirmDeleteModal } from './UI/Modals.jsx';
import { AuthService } from '../Services/AuthService.js';
import { InfoTooltip, GlassCard, GlassButton, GlassInput } from './UI/UIHelpers.jsx';
import ThemeToggle from './UI/ThemeToggle.jsx';
import ExportImportQueries from './ExportImportQueries';

function BatchHistoryDetailsModal({ batch, onClose, theme }) {
    const [detailedData, setDetailedData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/batch-details/${batch.batchId}`);
                const data = await response.json();
                if (data.status === 'success') {
                    setDetailedData(data.data);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <GlassCard theme={theme} className="max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Batch Details</h2>
                        <p className="text-xs opacity-50 uppercase tracking-widest mt-1">{batch.datetime}</p>
                    </div>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100 text-2xl transition-opacity">✕</button>
                </div>

                <div className="flex-grow overflow-y-auto scroll-container p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-20 opacity-50">Loading details...</div>
                    ) : detailedData ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Queries', val: batch.totalQueries, color: 'text-blue-400' },
                                    { label: 'Succeeded', val: batch.succeeded, color: 'text-green-400' },
                                    { label: 'Failed', val: batch.failed, color: 'text-red-400' },
                                    { label: 'Duration', val: detailedData.duration || 'N/A', color: 'text-white' }
                                ].map((stat, i) => (
                                    <div key={i} className={`p-4 rounded-xl border border-white/5 bg-white/5`}>
                                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.val}</div>
                                        <div className="text-[10px] uppercase font-bold opacity-40">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3">
                                <h3 className="text-sm font-bold opacity-60 uppercase">Batch Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50">Batch ID</span>
                                        <span className="font-mono">{batch.batchId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50">Output Folder</span>
                                        <span className="font-mono">{batch.folder}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {detailedData.queries && detailedData.queries.map((query, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold opacity-30">#{idx + 1}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${query.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {query.status}
                                                </span>
                                            </div>
                                            <span className="text-[10px] opacity-40 font-bold">{query.duration || 'N/A'}</span>
                                        </div>
                                        {query.fileName && (
                                            <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                                <span className="text-xs font-mono opacity-60 truncate mr-2">{query.fileName}</span>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const filePath = `${detailedData.folder}/${query.fileName}`;
                                                            const response = await fetch('http://localhost:5000/api/download-file', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ filePath: filePath })
                                                            });
                                                            if (!response.ok) throw new Error('Download failed');
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
                                                            alert('Failed to download file.');
                                                        }
                                                    }}
                                                    className="text-[10px] font-bold text-blue-400 hover:underline"
                                                >
                                                    DOWNLOAD
                                                </button>
                                            </div>
                                        )}
                                        {query.error && <p className="text-xs text-red-400 mt-2 p-2 bg-red-400/10 rounded-lg">{query.error}</p>}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div className="text-center py-20 opacity-50">No details found</div>}
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <GlassButton theme={theme} variant="secondary" onClick={onClose}>Close</GlassButton>
                </div>
            </GlassCard>
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
    <div className={`p-4 rounded-xl border border-white/5 transition-all ${isOpen ? 'bg-white/10' : 'bg-white/5'}`}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-bold text-sm">{user.email}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-min mt-1 ${user.isAdmin ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
            {user.isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        <div className="flex gap-2">
          <GlassButton theme={theme} variant="secondary" onClick={() => setIsOpen(!isOpen)} className="p-2">
            <LockIcon className="w-4 h-4" />
          </GlassButton>
          <GlassButton theme={theme} variant="secondary" onClick={() => onChangePassword(user)} className="p-2">
            <KeyIcon className="w-4 h-4" />
          </GlassButton>
          <GlassButton theme={theme} variant="danger" onClick={() => onDeleteUser(user)} className="p-2">
            <TrashIcon className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      {isOpen && !user.isAdmin && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-black opacity-40">Builder Level</h4>
                <select
                    value={userLevel}
                    onChange={(e) => onLevelChange(user.id, e.target.value)}
                    className={`w-full p-2 bg-black/20 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-blue-500/50 text-white`}
                >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
            <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-black opacity-40">Portal Access</h4>
                <div className="flex flex-wrap gap-2">
                    {allPortals.map(p => (
                        <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${userPortalPermissions.has(p.id) ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-black/20 border-white/5 text-slate-500'}`}>
                            <input type="checkbox" checked={userPortalPermissions.has(p.id)} onChange={() => onPortalPermissionChange(user.id, p.id)} className="hidden" />
                            <span className="text-[10px] font-bold uppercase">{p.name}</span>
                        </label>
                    ))}
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-black opacity-40">Schema Permissions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto scroll-container pr-2 text-white">
              {allSchemas.map(schemaName => (
                <label key={schemaName} className={`flex items-center gap-2 px-2 py-1 rounded-md border text-[10px] cursor-pointer transition-all ${userPermissions.has(schemaName) ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-black/10 border-white/5 text-slate-500'}`}>
                  <input type="checkbox" checked={userPermissions.has(schemaName)} onChange={() => onPermissionChange(user.id, schemaName)} className="hidden" />
                  <span className="truncate font-mono">{schemaName}</span>
                </label>
              ))}
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
  const [maxWaitMinutes, setMaxWaitMinutes] = useState(30);
  const [batchSize, setBatchSize] = useState(10);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [queryTemplate, setQueryTemplate] = useState(userData.schemaQueryTemplate || `SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE table_schema IN ({schemas});`);
  const [batchHistory, setBatchHistory] = useState([]);
  const [detailsModalBatch, setDetailsModalBatch] = useState(null);

  const allSchemas = userData.schemaData ? Object.keys(userData.schemaData) : [];
  const allPortals = userData.portals || [];

  useEffect(() => {
    const loadHistory = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/batch-history');
            const data = await response.json();
            if (data.status === 'success') setBatchHistory(data.data);
        } catch (e) { console.error(e); }
    };
    loadHistory();
  }, []);

  const handleSaveFile = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'user_access.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage('User configuration saved to downloads.');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;
    setIsLoading(true);
    const passwordHash = await AuthService.hashPassword(newUserPassword);
    const newUser = { id: `user-${Date.now()}`, email: newUserEmail, passwordHash, isAdmin: isNewUserAdmin, permissions: { schemas: [], level: 'Beginner', portals: [] } };
    setUserData({ ...userData, users: [...userData.users, newUser] });
    setNewUserEmail(''); setNewUserPassword(''); setIsNewUserAdmin(false);
    setMessage(`User ${newUser.email} added locally.`);
    setIsLoading(false);
  };

  const handleDeleteUserActual = (userId) => {
    const updatedUsers = userData.users.filter(u => u.id !== userId);
    setUserData({ ...userData, users: updatedUsers });
    setDeleteUser(null);
    setMessage('User deleted successfully.');
  };

  const handlePasswordChangeActual = async (userId, newPassword) => {
    const passwordHash = await AuthService.hashPassword(newPassword);
    const updatedUsers = userData.users.map(u => u.id === userId ? { ...u, passwordHash } : u);
    setUserData({ ...userData, users: updatedUsers });
    setPasswordChangeUser(null);
    setMessage('Password updated successfully.');
  };

  const handleSavePortal = (e) => {
    e.preventDefault();
    const existingPortals = userData.portals || [];
    if (portalToEdit.id) {
        setUserData({ ...userData, portals: existingPortals.map(p => p.id === portalToEdit.id ? portalToEdit : p) });
    } else {
        const newPortal = { ...portalToEdit, id: `portal-${Date.now()}` };
        setUserData({ ...userData, portals: [...existingPortals, newPortal] });
    }
    setPortalToEdit({ id: null, name: '', url: '', automationType: 'none' });
    setMessage('Portal saved.');
  };

  const handleSaveQuery = (e) => {
    e.preventDefault();
    const existingQueries = userData.premadeQueries || [];
    if (queryToEdit.id) {
        setUserData({ ...userData, premadeQueries: existingQueries.map(q => q.id === queryToEdit.id ? queryToEdit : q) });
    } else {
        const newQuery = { ...queryToEdit, id: `query-${Date.now()}` };
        setUserData({ ...userData, premadeQueries: [...existingQueries, newQuery] });
    }
    setQueryToEdit({ id: null, name: '', description: '', sql: '' });
    setMessage('Premade query saved.');
  };

  const handlePermissionChange = (userId, schemaName) => {
    const updatedUsers = userData.users.map(u => {
        if (u.id === userId) {
            const current = new Set(u.permissions?.schemas || []);
            if (current.has(schemaName)) current.delete(schemaName); else current.add(schemaName);
            return { ...u, permissions: { ...u.permissions, schemas: Array.from(current) } };
        }
        return u;
    });
    setUserData({ ...userData, users: updatedUsers });
  };

  const handleLevelChange = (userId, level) => {
    const updatedUsers = userData.users.map(u => u.id === userId ? { ...u, permissions: { ...u.permissions, level } } : u);
    setUserData({ ...userData, users: updatedUsers });
  };

  const handlePortalPermissionChange = (userId, portalId) => {
    const updatedUsers = userData.users.map(u => {
        if (u.id === userId) {
            const current = new Set(u.permissions?.portals || []);
            if (current.has(portalId)) current.delete(portalId); else current.add(portalId);
            return { ...u, permissions: { ...u.permissions, portals: Array.from(current) } };
        }
        return u;
    });
    setUserData({ ...userData, users: updatedUsers });
  };

  const handleImportPremadeQueries = (imported) => {
    const existing = userData.premadeQueries || [];
    setUserData({ ...userData, premadeQueries: [...existing, ...imported] });
    setMessage('Premade templates imported.');
  };

  const handleInitiateBatchRun = async () => {
    if (!schemasToFetch || !schemaFetchCreds.username || !schemaFetchCreds.password) {
        alert('Missing schemas or credentials');
        return;
    }
    setBatchRunning(true);
    setMessage('Initiating batch automation run...');
    try {
        const response = await fetch('http://localhost:5000/api/run-batch-automation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schemas: schemasToFetch.split('\n').filter(Boolean),
                portalId: schemaFetchCreds.username,
                portalKey: schemaFetchCreds.password,
                queryTemplate: queryTemplate
            })
        });
        const data = await response.json();
        if (data.status === 'success') {
            setMessage('Batch run started successfully.');
        } else {
            setMessage(`Error: ${data.message}`);
        }
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setBatchRunning(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-8 gap-8 relative overflow-hidden font-sans selection:bg-blue-500/30 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {passwordChangeUser && <PasswordChangeModal user={passwordChangeUser} onSave={(newPass) => handlePasswordChangeActual(passwordChangeUser.id, newPass)} onCancel={() => setPasswordChangeUser(null)} />}
      {deleteUser && <ConfirmDeleteModal user={deleteUser} onConfirm={() => handleDeleteUserActual(deleteUser.id)} onCancel={() => setDeleteUser(null)} />}
      {detailsModalBatch && <BatchHistoryDetailsModal batch={detailsModalBatch} onClose={() => setDetailsModalBatch(null)} theme={theme} />}

      <GlassCard theme={theme} className="px-8 py-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <AdminIcon className="text-white w-7 h-7" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tight">Admin <span className="text-blue-500">Center</span></h1>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30">Infrastructure Management</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="h-10 w-px bg-white/10 mx-2"></div>
            <GlassButton theme={theme} onClick={onLogout} variant="primary" className="px-6 font-black uppercase text-xs tracking-widest">
                Exit Dashboard
            </GlassButton>
        </div>
      </GlassCard>

      {message && (
        <div className={`p-4 rounded-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500 ${message.startsWith('Error') ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-green-500/20 border-green-500/30 text-green-300'}`}>
            <span className="font-bold mr-2">{message.startsWith('Error') ? '⚠️' : '✅'}</span> {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
            <GlassCard theme={theme} className="p-8 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <LockIcon className="text-blue-400" /> User Ecosystem
                    </h2>
                    <GlassButton theme={theme} variant="success" onClick={handleSaveFile} className="text-xs uppercase font-black">Sync Configuration</GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] uppercase font-black opacity-40">Onboard New User</h3>
                        <form onSubmit={handleAddUser} className="space-y-3">
                            <GlassInput theme={theme} placeholder="Email Address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} icon={SearchIcon} />
                            <GlassInput theme={theme} placeholder="Initial Password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} icon={KeyIcon} />
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                                <input type="checkbox" checked={isNewUserAdmin} onChange={e => setIsNewUserAdmin(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/20 text-blue-500" />
                                <span className="text-xs font-bold opacity-60">Grant Administrative Privileges</span>
                            </label>
                            <GlassButton theme={theme} className="w-full" disabled={isLoading}>Create User Account</GlassButton>
                        </form>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] uppercase font-black opacity-40">Manage Directory</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto scroll-container pr-2">
                            {userData.users.map(u => (
                                <UserPermissions key={u.id} user={u} allSchemas={allSchemas} allPortals={allPortals} theme={theme} onPermissionChange={handlePermissionChange} onLevelChange={handleLevelChange} onPortalPermissionChange={handlePortalPermissionChange} onDeleteUser={() => setDeleteUser(u)} onChangePassword={() => setPasswordChangeUser(u)} />
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard theme={theme} className="p-8 space-y-6 shadow-xl">
                    <h2 className="text-lg font-bold flex items-center gap-3"><PlayIcon className="text-green-400" /> Data Portals</h2>
                    <form onSubmit={handleSavePortal} className="space-y-3">
                        <GlassInput theme={theme} placeholder="Portal Display Name" value={portalToEdit.name} onChange={e => setPortalToEdit({...portalToEdit, name: e.target.value})} />
                        <GlassInput theme={theme} placeholder="Infrastructure URL" value={portalToEdit.url} onChange={e => setPortalToEdit({...portalToEdit, url: e.target.value})} />
                        <select value={portalToEdit.automationType || 'none'} onChange={e => setPortalToEdit({ ...portalToEdit, automationType: e.target.value })} className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-xs focus:outline-none text-white">
                            <option value="none">No Automation</option><option value="type1">Type 1 (Default)</option>
                        </select>
                        <GlassButton theme={theme} className="w-full">Register Portal</GlassButton>
                    </form>
                    <div className="space-y-2 max-h-48 overflow-y-auto scroll-container pr-2">
                        {allPortals.map(p => (
                            <div key={p.id} className="p-3 rounded-xl border border-white/5 bg-white/5 flex justify-between items-center text-xs">
                                <div><p className="font-bold">{p.name}</p><p className="opacity-30 uppercase text-[9px]">{p.automationType}</p></div>
                                <button onClick={() => setPortalToEdit(p)} className="text-blue-400 font-bold hover:underline">EDIT</button>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard theme={theme} className="p-8 space-y-6 shadow-xl">
                    <h2 className="text-lg font-bold flex items-center gap-3"><UploadIcon className="text-purple-400" /> Schema Lifecycle</h2>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-2">
                            <p className="text-[10px] uppercase font-black opacity-30 tracking-widest text-white">Master Metadata (CSV)</p>
                            <input type="file" className="text-xs file:bg-blue-500/20 file:text-blue-400 file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:font-bold hover:file:bg-blue-500/30 cursor-pointer w-full text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-center">
                                <div className="text-xl font-bold text-blue-400">{allSchemas.length}</div>
                                <div className="text-[9px] uppercase font-black opacity-30">Schemas</div>
                            </div>
                            <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-center">
                                <div className="text-xl font-bold text-indigo-400">{Object.keys(userData.premadeQueries || {}).length}</div>
                                <div className="text-[9px] uppercase font-black opacity-30">Templates</div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>

        <div className="space-y-8">
            <GlassCard theme={theme} className="p-8 space-y-6 shadow-2xl">
                <h2 className="text-xl font-bold flex items-center gap-3"><CodeIcon className="text-orange-400" /> Automation Engine</h2>
                <div className="space-y-4">
                    <textarea placeholder="List schemas to fetch..." value={schemasToFetch} onChange={e => setSchemasToFetch(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-xs font-mono min-h-[120px] focus:outline-none focus:border-orange-500/50 text-white" />
                    <div className="grid grid-cols-2 gap-3">
                        <GlassInput theme={theme} type="text" placeholder="Portal ID" value={schemaFetchCreds.username} onChange={e => setSchemaFetchCreds({...schemaFetchCreds, username: e.target.value})} />
                        <GlassInput theme={theme} type="password" placeholder="Portal Key" value={schemaFetchCreds.password} onChange={e => setSchemaFetchCreds({...schemaFetchCreds, password: e.target.value})} />
                    </div>
                    <GlassButton theme={theme} variant="primary" className="w-full py-4 shadow-lg shadow-blue-500/10" onClick={handleInitiateBatchRun} disabled={batchRunning}>
                        {batchRunning ? 'Initiating...' : 'Initiate Automation Run'}
                    </GlassButton>
                </div>
                <div className="space-y-3">
                    <h3 className="text-[10px] uppercase font-black opacity-40 flex justify-between">Recent Executions</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto scroll-container pr-2">
                        {batchHistory.slice(0, 5).map((h, i) => (
                            <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/5 flex justify-between items-center hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setDetailsModalBatch(h)}>
                                <div><p className="text-[11px] font-bold">{h.datetime}</p><p className="text-[9px] opacity-30 uppercase tracking-tighter">{h.batchId}</p></div>
                                <div className="text-[10px] font-black"><span className="text-green-400">{h.succeeded}</span> / <span className="text-red-400">{h.failed}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>

            <GlassCard theme={theme} className="p-8 space-y-6 shadow-2xl">
                <h2 className="text-lg font-bold flex items-center gap-3"><SaveIcon className="text-blue-400" /> Template Bulk Ops</h2>
                <ExportImportQueries queries={userData.premadeQueries || []} onImport={handleImportPremadeQueries} userData={userData} queryType="premade" />
                <p className="text-[10px] opacity-30 font-bold text-center uppercase tracking-widest leading-relaxed">Export your collection as encrypted JSON<br/>or share via CSV distribution.</p>
            </GlassCard>
        </div>
      </div>
    </div>
  );
}
