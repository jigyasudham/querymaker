import React, { useState, useEffect } from 'react';
import ErrorBoundary from './Components/ErrorBoundary.jsx';
import LoginPage from './Components/LoginPage.jsx';
import AdminDashboard from './Components/AdminDashboard.jsx';
import SchemaPanel from './Components/SchemaPanel.jsx';
export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('login');

  // NEW: Theme state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark'; // Default to dark theme
  });

  // NEW: Apply theme on mount and when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleLogin = (user, fullUserData) => {
    setLoggedInUser(user);
    setUserData(fullUserData);
    setView('panel');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserData(null);
    setView('login');
  };

  const handleSetInitialData = (data) => {
    setUserData(data);
    setLoggedInUser({ email: 'admin-setup', isAdmin: true });
    setView('admin');
  };

  return (
    <ErrorBoundary>
      <div className="App">
        {view === 'login' && (
          <ErrorBoundary>
            <LoginPage 
              onLogin={handleLogin} 
              setInitialUserData={handleSetInitialData}
              theme={theme}
              setTheme={setTheme}
            />
          </ErrorBoundary>
        )}

        {view === 'admin' && (
          <ErrorBoundary>
            <AdminDashboard 
              userData={userData} 
              setUserData={setUserData} 
              onLogout={() => setView('panel')}
              theme={theme}
              setTheme={setTheme}
            />
          </ErrorBoundary>
        )}

        {view === 'panel' && (
          <ErrorBoundary>
            <SchemaPanel 
              user={loggedInUser} 
              userData={userData} 
              onLogout={handleLogout}
              onAdminView={() => setView('admin')}
              theme={theme}
              setTheme={setTheme}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}
