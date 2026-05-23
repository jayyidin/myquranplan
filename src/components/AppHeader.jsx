import React from 'react';
import { BookOpen, User, Menu, LogOut, Moon, Sun } from 'lucide-react';

const AppHeader = ({
  institutionLogo, institutionName, currentView, setCurrentView,
  isSuperAdmin, currentUser, onLogout, theme, setTheme, mobileMenuOpen, setMobileMenuOpen
}) => {
  return (
    <header className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shrink-0 z-[60] w-full shadow-sm print:hidden sticky top-0 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 sm:h-28 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
            {institutionLogo && institutionLogo !== 'logo.png' ? (
              <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-[#0f4c5c] dark:text-emerald-500" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-arabic tracking-tight leading-tight transition-all text-xl sm:text-3xl text-green-600">MyQuranPlan</span>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 -mt-1 sm:-mt-2"></div>
            <span className="font-extrabold tracking-tight leading-tight transition-all text-slate-800 dark:text-slate-100 text-base sm:text-xl">{institutionName}</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-gray-500 dark:text-slate-400">
          {['home', 'siswa', 'laporan', 'arsip', 'statistik'].map(view => (
            <button key={view} onClick={() => setCurrentView(view)} className={`relative pb-1 group transition-colors ${currentView === view ? 'text-green-600' : 'hover:text-green-600'}`}>
              {view === 'home' ? 'Beranda' : view === 'siswa' ? 'Data Siswa' : view.charAt(0).toUpperCase() + view.slice(1)}
              <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${currentView === view ? 'w-full' : 'w-0 group-hover:w-full'} bg-green-600`}></span>
            </button>
          ))}
          {isSuperAdmin && (
            <button onClick={() => setCurrentView('log')} className={`relative pb-1 group transition-colors ${currentView === 'log' ? 'text-green-600' : 'hover:text-green-600'}`}>Log Aktifitas<span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'log' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span></button>
          )}
          <button onClick={() => setCurrentView('pengaturan')} className={`relative pb-1 group transition-colors ${currentView === 'pengaturan' ? 'text-green-600' : 'hover:text-green-600'}`}>Pengaturan<span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'pengaturan' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span></button>
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-400 hover:text-amber-500 bg-gray-50 rounded-xl hidden md:block" title="Mode Gelap/Terang">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
            <User size={14} className="text-gray-400 dark:text-slate-400" />
            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{currentUser.name}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-slate-800 rounded-xl hidden md:block"><LogOut size={18} /></button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg"><Menu size={18} /></button>
        </div>
      </div>
    </header>
  );
}
export default AppHeader;