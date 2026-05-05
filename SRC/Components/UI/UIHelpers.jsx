import React, { memo } from 'react';  // NEW: Import memo for optimization
import { InfoIcon, ChevronDownIcon } from './Icons.jsx';
import { useState } from 'react';
import { useEffect,useRef } from 'react';


// MEMOIZED: Prevent unnecessary re-renders
export const CollapsibleSection = memo(({ title, count, children, highlight, theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(!!highlight);

    useEffect(() => {
        if (highlight) {
            setIsOpen(true);
        }
    }, [highlight]);

    return (
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-300'}`}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-3 text-left ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-blue-50'} focus:outline-none transition`}>
                <span className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    <Highlight text={title} highlight={highlight}/> 
                    <span className={`text-xs font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-blue-600'}`}>({count})</span>
                </span>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'} ${theme === 'dark' ? 'text-gray-400' : 'text-blue-500'}`}><ChevronDownIcon /></span>
            </button>
            {isOpen && <div className={`p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-100'}`}>{children}</div>}
        </div>
    );
});

export const InfoTooltip = ({ text }) => (
    <div className="tooltip inline-flex items-center justify-center ml-2">
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
        <pre className={`rounded-lg text-sm flex-grow overflow-y-auto scroll-container p-3 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
            <code ref={codeRef} className="font-mono">
                {code}
            </code>
        </pre>
    );
};

export const Highlight = ({ text, highlight }) => {
    if (!highlight) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-blue-200 text-blue-900">{part}</span> : part)}</span>;
};

export function SearchableDropdown({ options, value, onChange, placeholder, theme = 'dark' }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
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
            {/* Display Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border-2 border-blue-300 hover:border-blue-400 shadow-sm'} text-left text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition`}
            >
                <span className={value ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                    {value || placeholder}
                </span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>▼</span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className={`absolute z-50 w-full mt-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-300 shadow-2xl'} border-2 rounded-lg`}>
                    {/* Search Input */}
                    <div className={`p-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full p-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-300'} text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            autoFocus
                        />
                    </div>

                    {/* Options List - INCREASED HEIGHT */}
                    <div className="max-h-96 overflow-y-auto scroll-container">
                        {filtered.length > 0 ? (
                            filtered.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                        option === value 
                                            ? 'bg-blue-700 text-white font-semibold' 
                                            : theme === 'dark'
                                                ? 'text-gray-300 hover:bg-blue-600 hover:text-white'
                                                : 'text-gray-800 hover:bg-blue-100 hover:text-blue-900 border-b border-blue-100 last:border-0'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : (
                            <div className={`px-3 py-4 text-sm text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                No matches found
                            </div>
                        )}
                    </div>

                    {/* Footer with count */}
                    {filtered.length > 0 && (
                        <div className={`px-3 py-2 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-blue-300 bg-blue-100'} rounded-b-lg`}>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {filtered.length} of {options.length} items
                                {search && ` (filtered)`}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
