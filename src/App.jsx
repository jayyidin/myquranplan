// File: src/App.jsx
import React, { useState, useEffect } from 'react';
import MainApp from './components/MainApp.jsx';
import LoginScreen from './components/LoginScreen.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return 'light';
  });

  useEffect(() => {
    // Cek localStorage saat aplikasi dimuat untuk mempertahankan sesi login
    const savedUser = localStorage.getItem('myquranplan_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

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
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
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
    <>
      {!currentUser ? <LoginScreen onLogin={handleLogin} theme={theme} setTheme={handleSetTheme} /> : <MainApp currentUser={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />}
    </>
  );
}

export default App;