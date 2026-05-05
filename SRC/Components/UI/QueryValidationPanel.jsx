import React, { useState } from 'react';
import QueryValidator from '../../Services/QueryValidator';
import ValidationHelpModal from './ValidationHelpModal';

export default function QueryValidationPanel({ sql, queryState, theme, onClose }) {
    const [showHelp, setShowHelp] = useState(false);
    const [validation, setValidation] = useState(null);

    React.useEffect(() => {
        if (sql) {
            try {
                const result = QueryValidator.validate(sql, queryState);
                setValidation(result);
            } catch (error) {
                console.error('Validation error:', error);
                setValidation(null);
            }
        }
    }, [sql, queryState]);

    const handleClose = () => {
        if (onClose) onClose();
    };

    if (!validation) {
        return null;
    }

    const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;
    const hasPerformanceHints = validation.performanceHints && validation.performanceHints.length > 0;

    // Performance score color
    const getScoreColor = (score) => {
        if (score >= 80) return theme === 'dark' ? 'text-green-400' : 'text-green-600';
        if (score >= 60) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
        if (score >= 40) return theme === 'dark' ? 'text-orange-400' : 'text-orange-600';
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return theme === 'dark' ? 'bg-green-900' : 'bg-green-100';
        if (score >= 60) return theme === 'dark' ? 'bg-yellow-900' : 'bg-yellow-100';
        if (score >= 40) return theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100';
        return theme === 'dark' ? 'bg-red-900' : 'bg-red-100';
    };

    if (!hasIssues && !hasPerformanceHints) {
        return (
            <div className={`${theme === 'dark' ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">✅</span>
                        <span className={`font-medium text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                            Query looks excellent! No issues found.
                        </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getScoreBg(validation.performanceScore)}`}>
                        <span className={`text-sm font-bold ${getScoreColor(validation.performanceScore)}`}>
                            Score: {validation.performanceScore}/100
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-3 relative`}>
            {onClose && (
                <button onClick={handleClose} className={`absolute top-2 right-2 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-800 hover:text-gray-900'}`}>
                    ✕
                </button>
            )}

            {/* Performance Score Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Query Analysis
                    </h4>
                    <button
                        onClick={() => setShowHelp(true)}
                        className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-semibold`}
                        title="What do these mean?"
                    >
                        ❓ Help
                    </button>
                </div>
                <div className={`px-3 py-1 rounded-full ${getScoreBg(validation.performanceScore)}`}>
                    <span className={`text-sm font-bold ${getScoreColor(validation.performanceScore)}`}>
                        Performance: {validation.performanceScore}/100
                    </span>
                </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
                <div className="mb-3">
                    <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        🚫 Errors ({validation.errors.length})
                    </h4>
                    <div className="space-y-2">
                        {validation.errors.map((error, idx) => (
                            <div
                                key={idx}
                                className={`${theme === 'dark' ? 'bg-red-900 bg-opacity-20 border-red-700' : 'bg-red-50 border-red-200'} border rounded p-2`}
                            >
                                <p className={`text-xs font-medium ${QueryValidator.getSeverityColor(error.severity, theme)}`}>
                                    {error.message}
                                </p>
                                {error.suggestion && (
                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                        💡 {error.suggestion}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
                <div className="mb-3">
                    <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        ⚠️ Warnings ({validation.warnings.length})
                    </h4>
                    <div className="space-y-2">
                        {validation.warnings.map((warning, idx) => (
                            <div
                                key={idx}
                                className={`${theme === 'dark' ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded p-2`}
                            >
                                <p className={`text-xs font-medium ${QueryValidator.getSeverityColor(warning.severity, theme)}`}>
                                    {warning.message}
                                </p>
                                {warning.suggestion && (
                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                        💡 {warning.suggestion}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        {/* Performance Hints */}
        {hasPerformanceHints && (
            <div>
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    ⚡ Performance Hints ({validation.performanceHints.length})
                </h4>
                <div className="space-y-2">
                    {validation.performanceHints.map((hint, idx) => (
                        <div
                            key={idx}
                            className={`${theme === 'dark' ? 'bg-blue-900 bg-opacity-20 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded p-2`}
                        >
                            <div className="flex items-start space-x-2">
                                <span className="text-base">{QueryValidator.getImpactIcon(hint.impact)}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={`text-xs font-medium ${QueryValidator.getSeverityColor(hint.severity, theme)}`}>
                                            {hint.message}
                                        </p>
                                        {hint.impact && (
                                            <span className={`text-xs px-2 py-0.5 rounded ${hint.impact === 'very_high' ? 'bg-red-900 text-red-300' :
                                                    hint.impact === 'high' ? 'bg-orange-900 text-orange-300' :
                                                        hint.impact === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                                            'bg-green-900 text-green-300'}`}>
                                                {hint.impact.replace('_', ' ')} impact
                                            </span>
                                        )}
                                    </div>
                                    {hint.suggestion && (
                                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}>
                                            💡 {hint.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Help Modal */}
        {showHelp && (
            <ValidationHelpModal
                theme={theme}
                onClose={() => setShowHelp(false)}
            />
        )}
    </div>
    );
}