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
      <style dangerouslySetInnerHTML={{
        __html: `
        /* --- GLOBAL DARK MODE OVERRIDES --- */
        html.dark { color-scheme: dark; }
        html.dark body { background-color: #0f172a; color: #f8fafc; }
        
        /* Backgrounds */
        html.dark .bg-white { background-color: #1e293b !important; }
        html.dark .bg-white\\/80, html.dark [class*="bg-white/80"] { background-color: rgba(30, 41, 59, 0.8) !important; border-color: rgba(255, 255, 255, 0.05) !important; }
        html.dark .bg-slate-50, html.dark .bg-gray-50, html.dark .bg-\\[\\#f8fafc\\], html.dark .bg-\\[\\#f2fdf5\\] { background-color: #0f172a !important; }
        html.dark .bg-slate-50\\/50 { background-color: rgba(15, 23, 42, 0.5) !important; }
        html.dark .bg-slate-100, html.dark .bg-gray-100, html.dark .bg-slate-200 { background-color: #334155 !important; }
        html.dark .bg-gray-800, html.dark .bg-slate-900 { background-color: #f8fafc !important; color: #0f172a !important; }
        
        /* Pastel Backgrounds (Translucent) */
        html.dark .bg-emerald-50, html.dark .bg-green-50, html.dark .bg-\\[\\#e6fbf0\\] { background-color: rgba(16, 185, 129, 0.15) !important; color: #34d399 !important; border-color: rgba(16, 185, 129, 0.2) !important; }
        html.dark .bg-blue-50 { background-color: rgba(59, 130, 246, 0.15) !important; color: #60a5fa !important; border-color: rgba(59, 130, 246, 0.2) !important; }
        html.dark .bg-purple-50 { background-color: rgba(168, 85, 247, 0.15) !important; color: #c084fc !important; border-color: rgba(168, 85, 247, 0.2) !important; }
        html.dark .bg-orange-50 { background-color: rgba(249, 115, 22, 0.15) !important; color: #fb923c !important; border-color: rgba(249, 115, 22, 0.2) !important; }
        html.dark .bg-red-50, html.dark .bg-red-100 { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; border-color: rgba(239, 68, 68, 0.2) !important; }
        html.dark .bg-amber-50, html.dark .bg-amber-100 { background-color: rgba(245, 158, 11, 0.15) !important; color: #fbbf24 !important; border-color: rgba(245, 158, 11, 0.2) !important; }
        html.dark .bg-indigo-50 { background-color: rgba(99, 102, 241, 0.15) !important; color: #818cf8 !important; border-color: rgba(99, 102, 241, 0.2) !important; }
        
        /* Text Colors */
        html.dark .text-slate-900, html.dark .text-gray-900, html.dark .text-slate-800, html.dark .text-gray-800, html.dark .text-\\[\\#111827\\] { color: #ffffff !important; }
        html.dark .text-slate-700, html.dark .text-gray-700 { color: #f8fafc !important; }
        html.dark .text-slate-600, html.dark .text-gray-600 { color: #f1f5f9 !important; }
        html.dark .text-slate-500, html.dark .text-gray-500 { color: #e2e8f0 !important; }
        html.dark .text-slate-400, html.dark .text-gray-400 { color: #cbd5e1 !important; }
        html.dark .text-slate-300, html.dark .text-gray-300 { color: #94a3b8 !important; }
        html.dark .text-white { color: #ffffff !important; }
        
        /* Fix: Override agar text-white pada button gelap yang di-invert menjadi terang tetap terbaca */
        html.dark .bg-gray-800.text-white, html.dark .bg-slate-900.text-white { color: #0f172a !important; border-color: #e2e8f0 !important; }
        html.dark .bg-gray-800:hover, html.dark .bg-slate-900:hover { background-color: #e2e8f0 !important; color: #0f172a !important; border-color: #cbd5e1 !important; }

        /* Borders & Dividers */
        html.dark .border-slate-200, html.dark .border-gray-200, html.dark .border-slate-100, html.dark .border-gray-100, html.dark .border-slate-50, html.dark .border-gray-50, html.dark .border-slate-300 { border-color: #334155 !important; }
        html.dark .divide-gray-100 > :not([hidden]) ~ :not([hidden]), html.dark .divide-slate-100 > :not([hidden]) ~ :not([hidden]) { border-color: #334155 !important; }
        
        /* Inputs & Tables (Garis Tabel Dipertegas) */
        html.dark input:not([type="checkbox"]):not([type="radio"]), html.dark select, html.dark textarea { background-color: #0f172a !important; color: #f8fafc !important; border-color: #334155 !important; }
        
        /* Autofill Overrides (Menghilangkan warna coklat di form login) */
        html.dark input:-webkit-autofill,
        html.dark input:-webkit-autofill:hover, 
        html.dark input:-webkit-autofill:focus, 
        html.dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
            -webkit-text-fill-color: #f8fafc !important;
            caret-color: #f8fafc !important;
        }
        html.dark ::placeholder { color: #475569 !important; }
        html.dark th { background-color: #1e293b !important; border-color: #10b981 !important; color: #ffffff !important; }
        html.dark thead { background-color: #1e293b !important; }
        html.dark tr { border-color: #10b981 !important; }
        
        /* Hover States */
        html.dark .hover\\:bg-gray-50:hover, html.dark .hover\\:bg-slate-50:hover { background-color: #334155 !important; }
        html.dark .hover\\:bg-gray-100:hover, html.dark .hover\\:bg-slate-100:hover { background-color: #475569 !important; }
        html.dark .hover\\:bg-white:hover { background-color: #1e293b !important; }
        
        /* Header Utama (Navigasi) */
        html.dark header.bg-white { background-color: rgba(30, 41, 59, 0.85) !important; backdrop-filter: blur(12px); border-bottom-color: #334155 !important; }
        
        /* Button Glow Effects (Animasi Cahaya saat Hover) */
        html.dark button.bg-\\[\\#00e676\\]:hover, html.dark button.bg-emerald-500:hover, html.dark button.bg-emerald-600:hover { box-shadow: 0 0 15px rgba(16, 185, 129, 0.6) !important; }
        html.dark button.bg-blue-500:hover, html.dark button.bg-blue-600:hover { box-shadow: 0 0 15px rgba(37, 99, 235, 0.6) !important; }
        html.dark button.bg-purple-500:hover, html.dark button.bg-purple-600:hover { box-shadow: 0 0 15px rgba(147, 51, 234, 0.6) !important; }
        html.dark button.bg-red-500:hover, html.dark button.bg-red-600:hover { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6) !important; }
        html.dark button.bg-amber-500:hover, html.dark button.bg-orange-500:hover { box-shadow: 0 0 15px rgba(245, 158, 11, 0.6) !important; }
        html.dark button.bg-slate-800:hover, html.dark button.bg-slate-900:hover { box-shadow: 0 0 15px rgba(255, 255, 255, 0.2) !important; }
        
        /* ----- FIX WARNA COKLAT DI DATA SISWA (JURNAL & LESSON PLAN) ----- */
        /* Menghilangkan tumpukan blur yang menyebabkan warna keruh/coklat di tabel */
        html.dark td.bg-white,
        html.dark [id^="student-row-"] td.bg-white,
        html.dark [id^="student-card-"].bg-white {
            background-color: #1e293b !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
        }
        
        /* Ubah warna hover baris tabel menjadi biru dongker */
        html.dark .group:hover .group-hover\:bg-\\[\\#f4f7fa\\] {
            background-color: #334155 !important;
        }
        
        /* Ubah background kartu mapel di mobile menjadi biru dongker pekat */
        html.dark .bg-blue-50\\/30, html.dark .bg-purple-50\\/30, html.dark .bg-emerald-50\\/30, html.dark .bg-orange-50\\/30, html.dark .bg-emerald-50\\/40, html.dark .bg-emerald-50\\/50, html.dark .bg-emerald-50\\/80 {
            background-color: #0f172a !important;
            border-color: #334155 !important;
        }
        `
      }} />
      {!session
        ? <LoginScreen theme={theme} setTheme={handleSetTheme} />
        : <MainApp currentUser={{ id: session.user.id, email: session.user.email, ...session.user.user_metadata }} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />}
    </>
  );
}

export default App;