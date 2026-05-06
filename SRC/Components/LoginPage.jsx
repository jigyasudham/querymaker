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
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Decorative Background Elements */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 180, 270, 360],
                    x: [0, 100, 0, -100, 0],
                    y: [0, 50, 100, 50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 270, 180, 90, 0],
                    x: [0, -100, 0, 100, 0],
                    y: [0, -50, -100, -50, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none"
            />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative z-10 flex w-full max-w-5xl backdrop-blur-xl border ${
                    theme === 'dark' 
                        ? 'bg-slate-900/60 border-white/10' 
                        : 'bg-white/60 border-white/20'
                } rounded-3xl shadow-2xl overflow-hidden`}
            >
                
                {/* LEFT ANIMATION */}
                <div className={`hidden md:flex w-1/2 items-center justify-center ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                } backdrop-blur-md`}>
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
                <div className="w-full md:w-1/2 p-8 lg:p-12 space-y-8">
                
                {/* Theme Toggle */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        QuerryHub
                    </h2>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>

                <div className="text-center space-y-2">
                    <h1 className={`text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Welcome Back
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-lg`}>
                        Enter your credentials to access your workspace
                    </p>
                </div>

                {error && (
                    <motion.p 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-center font-medium backdrop-blur-sm"
                    >
                        {error}
                    </motion.p>
                )}
                
                <div className="space-y-4">
                    <label 
                        htmlFor="user-file-upload" 
                        className={`w-full font-bold py-4 px-6 rounded-xl inline-flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                            fileName 
                                ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white border border-emerald-400/30' 
                                : 'bg-slate-700/50 hover:bg-slate-700 text-white border border-white/10'
                        } backdrop-blur-md ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <UploadIcon/>
                        <span className="ml-2">{isLoading ? 'Loading...' : (fileName || '1. Load User Access File')}</span>
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
                    <div className="space-y-2">
                        <label className={`text-sm font-semibold ml-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            Email Address
                        </label>
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
                            className={`w-full p-4 rounded-xl outline-none transition-all duration-300 border ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/50 border-white/10 text-white focus:border-blue-500 focus:bg-slate-800' 
                                    : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className={`text-sm font-semibold ml-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            Password
                        </label>
                        <div className="relative">
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
                                className={`w-full p-4 pr-12 rounded-xl outline-none transition-all duration-300 border ${
                                    theme === 'dark' 
                                        ? 'bg-slate-800/50 border-white/10 text-white focus:border-blue-500 focus:bg-slate-800' 
                                        : 'bg-white/50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!userData || isLoading} 
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isLoading ? (
                            <motion.div 
                                animate={{ rotate: 360 }} 
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                                className="h-6 w-6 border-2 border-white border-t-transparent rounded-full"
                            />
                        ) : (
                            <span className="text-lg">Access Workspace</span>
                        )} 
                    </button>
                </form>

                <div className="text-center space-y-4">
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} text-sm`}>
                        First time setup?{' '}
                        <button onClick={createInitialFile} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                            Create a New User File
                        </button>
                    </p>
                </div>
                </div>
            </motion.div>
        </div>
    );
}