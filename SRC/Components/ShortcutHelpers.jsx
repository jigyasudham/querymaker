import React, { useState, useEffect, useRef } from 'react';

/**
 * Component to display available shortcuts
 */
export const ShortcutHelper = ({ shortcuts, isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = {
    'Query Actions': [
      { keys: 'Ctrl + Enter', description: 'Run query', action: shortcuts['ctrl+enter'] },
      { keys: 'Ctrl + S', description: 'Save query', action: shortcuts['ctrl+s'] },
      { keys: 'Ctrl + K', description: 'Copy query', action: shortcuts['ctrl+k'] },
    ],
    'Navigation': [
      { keys: 'Escape', description: 'Close modal/dialog', action: shortcuts['escape'] },
      { keys: 'Ctrl + /', description: 'Show shortcuts', action: shortcuts['ctrl+/'] },
    ],
    'Query Building': [
      { keys: 'Ctrl + Shift + V', description: 'Validate query', action: shortcuts['ctrl+shift+v'] },
      { keys: 'Ctrl + Shift + C', description: 'Clear query', action: shortcuts['ctrl+shift+c'] },
    ],
    'View Controls': [
      { keys: 'Ctrl + 1', description: 'Explorer tab', action: shortcuts['ctrl+1'] },
      { keys: 'Ctrl + 2', description: 'Builder tab', action: shortcuts['ctrl+2'] },
      { keys: 'Ctrl + 3', description: 'Saved Queries tab', action: shortcuts['ctrl+3'] },
      { keys: 'Ctrl + 4', description: 'Run Query tab', action: shortcuts['ctrl+4'] },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {Object.entries(shortcutGroups).map(([groupName, groupShortcuts]) => (
            <div key={groupName}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {groupName}
              </h3>
              <div className="space-y-2">
                {groupShortcuts
                  .filter(shortcut => shortcut.action) // Only show shortcuts that are defined
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded font-mono text-sm text-gray-900 dark:text-white">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Pro Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Hold Ctrl (or Cmd on Mac) and press the key</li>
              <li>Shortcuts work from any tab or view</li>
              <li>Press Ctrl + / to see this list anytime</li>
              <li>Escape closes any open modal or dialog</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Floating shortcut indicator (shows active shortcuts)
 * Auto-hides when `hidden` prop is true (e.g., when hovering action buttons)
 */
export const ShortcutIndicator = ({ currentView, hidden = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const boundsRef = useRef(null);

  const shortcuts = {
    explorer: ['Ctrl + Enter: Run', 'Ctrl + S: Save'],
    builder: ['Ctrl + Enter: Run', 'Ctrl + K: Copy', 'Ctrl + Shift + V: Validate'],
    saved: ['Enter: Load Query', 'Delete: Remove Query'],
    run: ['Ctrl + Enter: Run Query']
  };

  const currentShortcuts = shortcuts[currentView] || [];

  // Track mouse position globally when hovered to detect when mouse leaves the area
  useEffect(() => {
    if (!isHovered) return;

    const handleMouseMove = (e) => {
      if (!boundsRef.current) return;

      const { left, right, top, bottom } = boundsRef.current;
      const isInside = e.clientX >= left && e.clientX <= right &&
                       e.clientY >= top && e.clientY <= bottom;

      if (!isInside) {
        setIsHovered(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const handleMouseEnter = () => {
    // Store the bounds when hovering starts
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
    setIsHovered(true);
  };

  if (currentShortcuts.length === 0 || hidden) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 max-w-xs"
      onMouseEnter={handleMouseEnter}
      style={{ pointerEvents: isHovered ? 'none' : 'auto' }}
    >
      <div
        className={`bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg px-4 py-3 transition-opacity duration-200 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-xs font-semibold mb-2 text-gray-400">Quick Actions:</div>
        <div className="space-y-1">
          {currentShortcuts.map((shortcut, index) => (
            <div key={index} className="text-sm">
              {shortcut}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};