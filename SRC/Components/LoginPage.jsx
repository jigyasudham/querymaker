import React, { useState } from 'react';
import { useSpring, motion } from "framer-motion";
import { PythonAPI } from '/SRC/Services/PythonAPI.js';
import { UploadIcon } from './UI/Icons.jsx';
import ThemeToggle from './UI/ThemeToggle.jsx';
import LoginIllustration from './LoginIllustration.jsx';

export default function LoginPage({ onLogin, setInitialUserData, theme, setTheme }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userData, setUserData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [typing, setTyping] = useState(false);
    const focusBoost = useSpring(1, { stiffness: 120, damping: 20 });
    const [loginError, setLoginError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [typingPassword, setTypingPassword] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.json')) {
            setIsLoading(true);
            setError('');
            
            try {
                // Send file to Python backend
                const result = await PythonAPI.uploadUserFile(file);
                
                if (result.status === 'success') {
                    setUserData(result.data);
                    setFileName(file.name);
                    setError('');
                } else {
                    throw new Error(result.message || 'Failed to load user file');
                }
            } catch (err) {
                setError(`Error: ${err.message}`);
                setUserData(null);
                setFileName('');
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Please upload a valid ".json" user file.');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        if (!userData) {
            setError('Please load the user access file first.');
            setIsLoading(false);
            return;
        }
        
        try {
            // Verify login via Python backend
            const result = await PythonAPI.verifyLogin(email, password);
            
            if (result.status === 'success') {
                onLogin(result.user, result.userData);
            } else {
                setError(result.message || 'Invalid email or password.');
                setLoginError(true);
                setIsLoading(false);
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            setLoginError(true);
            setIsLoading(false);
        }
    };
    
    const createInitialFile = () => {
        setInitialUserData({ users: [], schemaData: null, premadeQueries: [], portals: [] });
    }

    return (
        <div className={`${theme === 'dark' 
            ? 'bg-gray-800' 
            : 'bg-gray-100'
        } min-h-screen flex items-center justify-center p-4`}>
            <div className={`flex w-full max-w-5xl rounded-xl p-6${theme === 'dark' 
                ? 'bg-gray-900' 
                : 'bg-white'
            } rounded-2xl shadow-2xl overflow-hidden`}>
                
                {/* LEFT ANIMATION */}
                <div className={`hidden md:flex w-1/2 items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <LoginIllustration 
                        theme={theme} 
                        typing={typing} 
                        focusBoost={focusBoost} 
                        loginError={loginError} 
                        setLoginError={setLoginError}
                        email={email}
                        password={password}
                        showPassword={showPassword}
                        typingPassword={typingPassword}
                    />
                </div>

                {/* RIGHT FORM */}
                <div className="w-full md:w-1/2 p-8 space-y-6">
                
                {/* Theme Toggle */}
                <div className="flex justify-end">
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-400">Query Maker</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'} mt-2`}>Secure Login</p>
                </div>

                {error && <p className="bg-red-500 text-white p-3 rounded-lg text-center font-semibold">{error}</p>}
                
                <div className="text-center">
                    <label htmlFor="user-file-upload" className={`w-full font-bold py-3 px-4 rounded-lg inline-flex items-center justify-center cursor-pointer transition shadow-lg ${fileName 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    } text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <UploadIcon/>
                        <span>{isLoading ? 'Loading...' : (fileName || '1. Load User Access File')}</span>
                    </label>
                    <input 
                        id="user-file-upload" 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            disabled={!userData || isLoading} 
                            onFocus={() => {
                                setTyping(true);
                                focusBoost.set(1.05);
                            }}
                            onBlur={() => {
                                setTyping(false);
                                focusBoost.set(1);
                            }}
                            className={`mt-1 w-full p-3 ${theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                                : 'bg-gray-100 border-gray-400 text-gray-900 focus:border-blue-500'
                            } border-2 rounded-lg focus:ring-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                        <div className="relative mt-1">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            disabled={!userData || isLoading} 
                            onFocus={() => {
                                setTyping(true);
                                setTypingPassword(true);
                                focusBoost.set(1.05);
                            }}
                            onBlur={() => {
                                setTyping(false);
                                setTypingPassword(false);
                                focusBoost.set(1);
                            }}
                            className={`w-full p-3 pr-10 ${theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                                : 'bg-gray-100 border-gray-400 text-gray-900 focus:border-blue-500'
                            } border-2 rounded-lg focus:ring-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showPassword ? '🙈' : '👁'}
                        </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!userData || isLoading} 
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition shadow-lg disabled:bg-gray-1000 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isLoading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></motion.div>
                        ) : '2. Login'} 
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>First time setup?</p>
                    <button onClick={createInitialFile} className="text-blue-400 hover:underline">Create a New User File</button>
                </div>
                </div>
            </div>
        </div>
    );
}