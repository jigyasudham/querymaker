import React, { memo, useState, useEffect, useRef } from 'react';
import { InfoIcon, ChevronDownIcon } from './Icons.jsx';

// --- Glassmorphism Primitives ---

export const GlassCard = ({ children, className = '', theme = 'dark' }) => (
    <div className={`backdrop-blur-xl border transition-all duration-300 ${
        theme === 'dark' 
            ? 'bg-slate-900/40 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]' 
            : 'bg-white/40 border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
    } rounded-2xl ${className}`}>
        {children}
    </div>
);

export const GlassButton = ({ children, onClick, className = '', theme = 'dark', variant = 'primary' }) => {
    const variants = {
        primary: theme === 'dark' 
            ? 'bg-blue-600/80 hover:bg-blue-500 text-white border-white/10' 
            : 'bg-blue-500/80 hover:bg-blue-600 text-white border-white/20',
        secondary: theme === 'dark'
            ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            : 'bg-black/5 hover:bg-black/10 text-slate-700 border-black/10',
        danger: 'bg-red-500/80 hover:bg-red-600 text-white border-white/10',
        success: 'bg-green-600/80 hover:bg-green-500 text-white border-white/10'
    };

    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 font-medium ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export const GlassInput = ({ value, onChange, placeholder, type = 'text', className = '', theme = 'dark', icon: Icon }) => (
    <div className="relative group">
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Icon className="w-4 h-4" />
            </div>
        )}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full py-2 ${Icon ? 'pl-10' : 'px-4'} pr-4 rounded-xl border backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                theme === 'dark'
                    ? 'bg-slate-900/50 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white/50 border-black/10 text-slate-900 placeholder-slate-400'
            } ${className}`}
        />
    </div>
);

// --- Refactored Existing Components ---

export const CollapsibleSection = memo(({ title, count, children, highlight, theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(!!highlight);

    useEffect(() => {
        if (highlight) {
            setIsOpen(true);
        }
    }, [highlight]);

    return (
        <div className={`border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`w-full flex justify-between items-center p-4 text-left hover:bg-white/5 transition-all duration-200 focus:outline-none`}
            >
                <span className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    <Highlight text={title} highlight={highlight}/> 
                    <span className={`text-xs font-normal opacity-60`}>({count})</span>
                </span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'} opacity-60`}><ChevronDownIcon /></span>
            </button>
            {isOpen && (
                <div className={`p-4 pt-0 transition-all duration-300`}>
                    {children}
                </div>
            )}
        </div>
    );
});

export const InfoTooltip = ({ text }) => (
    <div className="tooltip inline-flex items-center justify-center ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <InfoIcon />
        <span className="tooltiptext">{text}</span>
    </div>
);

export const CodeBlock = ({ code, theme = 'dark' }) => {
    const codeRef = useRef(null);
    useEffect(() => {
        if (codeRef.current && typeof Prism !== 'undefined') {
            Prism.highlightElement(codeRef.current);
        }
    }, [code]);
    return (
        <pre className={`rounded-xl text-sm flex-grow overflow-y-auto scroll-container p-4 border backdrop-blur-md ${
            theme === 'dark' 
                ? 'bg-slate-900/60 text-blue-100 border-white/10' 
                : 'bg-slate-50/60 text-slate-800 border-black/5'
        }`}>
            <code ref={codeRef} className="font-mono">
                {code}
            </code>
        </pre>
    );
};

export const Highlight = ({ text, highlight }) => {
    if (!highlight) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-blue-500/30 text-blue-400 rounded px-0.5">{part}</span> : part)}</span>;
};

export function SearchableDropdown({ options, value, onChange, placeholder, theme = 'dark' }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(opt =>
        opt && typeof opt === 'string' && opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 rounded-xl border backdrop-blur-md text-left text-sm flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark'
                        ? 'bg-slate-900/50 border-white/10 text-white'
                        : 'bg-white/50 border-black/10 text-slate-900 shadow-sm'
                }`}
            >
                <span className={value ? '' : 'opacity-50'}>
                    {value || placeholder}
                </span>
                <span className="opacity-40 text-xs">▼</span>
            </button>

            {isOpen && (
                <div className={`absolute z-50 w-full mt-2 border backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${
                    theme === 'dark' 
                        ? 'bg-slate-900/90 border-white/10' 
                        : 'bg-white/90 border-black/10'
                }`}>
                    <div className={`p-2 border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full p-2 text-sm rounded-lg bg-transparent border-0 focus:outline-none focus:ring-0 ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto scroll-container">
                        {filtered.length > 0 ? (
                            filtered.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        option === value 
                                            ? 'bg-blue-600 text-white' 
                                            : theme === 'dark'
                                                ? 'text-slate-300 hover:bg-white/5'
                                                : 'text-slate-700 hover:bg-black/5'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-sm text-center opacity-50">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

