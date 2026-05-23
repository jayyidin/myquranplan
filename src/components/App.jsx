import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import MainApp from './MainApp';
import LoginScreen from './LoginScreen';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return 'light';
  });

  useEffect(() => {
    // 1. Cek sesi yang sudah ada saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Dengarkan perubahan status autentikasi (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. Hentikan listener saat komponen tidak lagi digunakan
    return () => subscription.unsubscribe();
  }, []);

  // Efek untuk mengubah tema
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


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Tampilkan loading saat sesi sedang diperiksa
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <Loader2 size={48} className="animate-spin text-[#00e676] mb-4" />
      </div>
    );
  }

  // Jika tidak ada sesi (belum login), tampilkan halaman login.
  // Jika ada sesi, tampilkan aplikasi utama.
  return (
    <>
      {!session
        ? <LoginScreen theme={theme} setTheme={handleSetTheme} />
        : <MainApp currentUser={{ id: session.user.id, email: session.user.email, ...session.user.user_metadata }} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />}
    </>
  );
}

export default App;