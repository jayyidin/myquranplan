// File: src/App.jsx
import React, { Suspense, lazy, useEffect, useState } from 'react';

const MainApp = lazy(() => import('./components/MainApp.jsx'));
const LoginScreen = lazy(() => import('./components/LoginScreen.jsx'));
const getStoredTheme = () => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

const AppLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500 dark:border-slate-800 dark:border-t-emerald-400" />
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('myquranplan_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [theme, setTheme] = useState(() => {
    return getStoredTheme();
  });

  // Efek untuk mengaplikasikan class dark pada elemen html
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.add('theme-transition');
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    const timeout = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 500);

    return () => clearTimeout(timeout);
  }, [theme]);

  const handleSetTheme = (newTheme) => {
    const nextTheme = newTheme === 'dark' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogin = (userData) => {
    localStorage.setItem('myquranplan_user', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('myquranplan_user');
    setCurrentUser(null);
  };

  return (
    <Suspense fallback={<AppLoading />}>
      {!currentUser ? <LoginScreen onLogin={handleLogin} theme={theme} setTheme={handleSetTheme} /> : <MainApp currentUser={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />}
    </Suspense>
  );
}

export default App;
