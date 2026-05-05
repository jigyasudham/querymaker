// useKeyboardShortcuts.js - Custom hook for keyboard shortcuts
import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to callbacks
 * @param {boolean} enabled - Whether shortcuts are enabled
 * 
 * Example usage:
 * useKeyboardShortcuts({
 *   'ctrl+enter': handleRunQuery,
 *   'ctrl+s': handleSaveQuery,
 *   'ctrl+k': handleCopyQuery,
 *   'escape': handleCloseModal
 * }, true);
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Build key combination string
    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    
    // Add the actual key (lowercase)
    const key = event.key.toLowerCase();
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      keys.push(key);
    }
    
    const combination = keys.join('+');

    // Check if this combination has a handler
    if (shortcuts[combination]) {
      // Prevent default browser behavior
      event.preventDefault();
      event.stopPropagation();
      
      // Execute the handler
      shortcuts[combination](event);
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

export default useKeyboardShortcuts;