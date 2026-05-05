import React, { useState } from 'react';
import { CopyIcon } from './Icons.jsx';

export function PasswordChangeModal({ user, onSave, onCancel, theme = 'dark' }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Password strength validation
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
        if (!/[0-9]/.test(password)) errors.push('One number');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('One special character');
        return errors;
    };

    const passwordErrors = validatePassword(newPassword);
    const passwordsMatch = newPassword === confirmPassword;
    const isValid = newPassword && passwordErrors.length === 0 && passwordsMatch && confirmPassword;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid) {
            onSave(user.id, newPassword);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-400'} p-6 rounded-lg shadow-xl w-full max-w-md`}>
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Change Password for <span className="text-blue-400">{user.email}</span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password Field */}
                    <div>
                        <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                autoFocus
                                className={`w-full p-2 pr-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-400'} border rounded-lg`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className={`text-xs p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <div className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Password Requirements:
                        </div>
                        <ul className="space-y-1">
                            {[
                                { check: newPassword.length >= 8, text: 'At least 8 characters' },
                                { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
                                { check: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
                                { check: /[0-9]/.test(newPassword), text: 'One number' },
                                { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword), text: 'One special character' }
                            ].map((req, idx) => (
                                <li key={idx} className={`flex items-center ${req.check ? 'text-green-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}`}>
                                    <span className="mr-2">{req.check ? '✓' : '○'}</span>
                                    {req.text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-400'} border rounded-lg ${
                                confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                            }`}
                        />
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                        {confirmPassword && passwordsMatch && newPassword && (
                            <p className="text-green-500 text-xs mt-1">✓ Passwords match</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`py-2 px-4 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} rounded-lg`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`py-2 px-4 rounded-lg ${
                                isValid
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-500 cursor-not-allowed text-gray-300'
                            }`}
                        >
                            Save Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ConfirmDeleteModal({ user, onConfirm, onCancel, theme = 'dark' }) {
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-400'} p-6 rounded-lg shadow-xl w-full max-w-sm`}>
                <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Delete User</h2>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>Are you sure you want to delete <span className="font-bold text-red-400">{user.email}</span>? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onCancel} className={`py-2 px-4 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-1000' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} rounded-lg`}>Cancel</button>
                    <button type="button" onClick={() => onConfirm(user.id)} className="py-2 px-4 bg-red-600 hover:bg-red-500 rounded-lg">Delete User</button>
                </div>
            </div>
        </div>
    );
}

export const FeedbackModal = ({ user, onCancel, theme = 'dark' }) => {
    const [feedbackType, setFeedbackType] = useState('New Feature');
    const [details, setDetails] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const feedbackText = `**Type of Feedback:** ${feedbackType}\n\n**Details:**\n${details}\n\n**User:** ${user.email}`;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-400'} p-6 rounded-lg shadow-xl w-full max-w-lg`}>
                 <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Submit Feedback / Suggestion</h2>
                 <div className="space-y-4">
                    <select value={feedbackType} onChange={e=>setFeedbackType(e.target.value)} className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-500'} text-sm rounded-lg`}>
                        <option>New Feature</option>
                        <option>Bug Report</option>
                        <option>Schema Request</option>
                        <option>General Comment</option>
                    </select>
                    <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Please provide details here..." className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border-2 border-gray-500'} text-sm rounded-lg min-h-[150px]`}/>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>Clicking "Copy for Email" will copy the formatted text below to your clipboard. Please paste it into a new email to the administrator.</p>
                    <pre className={`${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-900 border border-gray-400'} p-2 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto scroll-container`}><code>{feedbackText}</code></pre>
                 </div>
                 <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onCancel} className={`py-2 px-4 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-1000' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} rounded-lg`}>Cancel</button>
                    <button onClick={() => { copyToClipboard(feedbackText); onCancel(); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg">{copySuccess || 'Copy for Email'}</button>
                </div>
            </div>
        </div>
    );
};

