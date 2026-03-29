// File: src/App.jsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './config/firebase';
import { Loader2 } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUserData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error(error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, () => { setIsAuthReady(true); });
    return () => unsubscribe();
  }, []);

  

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('currentUserData', JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUserData');
    setCurrentUser(null);
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="animate-spin text-green-500" size={40}/></div>;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return <MainApp currentUser={currentUser} onLogout={handleLogout} />;
}

export default App;