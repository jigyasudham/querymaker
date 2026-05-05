import React from 'react';

export default function ThemeToggle({ theme, setTheme }) {
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-1000 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-400'} font-bold py-2 px-4 rounded-lg inline-flex items-center cursor-pointer transition`}
      aria-label="Toggle theme"
    >
      <span className="text-lg mr-2">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span className="text-sm">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
