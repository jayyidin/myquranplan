// File: src/App.jsx
import React, { useState, useEffect } from 'react';
import MainApp from './components/MainApp.jsx';
import LoginScreen from './components/LoginScreen.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Cek localStorage saat aplikasi dimuat untuk mempertahankan sesi login
    const savedUser = localStorage.getItem('myquranplan_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('myquranplan_user', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('myquranplan_user');
    setCurrentUser(null);
  };

  return (
    !currentUser ? <LoginScreen onLogin={handleLogin} /> : <MainApp currentUser={currentUser} onLogout={handleLogout} />
  );
}

export default App;