import React from 'react';
import { BookOpen, User, Menu, LogOut, Moon, Sun } from 'lucide-react';

const AppHeader = ({
  institutionLogo, institutionName, currentView, setCurrentView,
  isSuperAdmin, currentUser, onLogout, theme, setTheme, mobileMenuOpen, setMobileMenuOpen
}) => {
  return (
    <header className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shrink-0 z-[60] w-full shadow-sm print:hidden sticky top-0 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-3 md:px-4 xl:px-6 min-h-14 md:min-h-[76px] xl:min-h-[88px] py-2 md:py-2.5 flex items-center justify-between gap-2 lg:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 md:flex-none md:max-w-[260px] lg:max-w-[330px]">
          <div className="w-10 h-10 md:w-12 md:h-12 xl:w-14 xl:h-14 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
            {institutionLogo && institutionLogo !== 'logo.png' ? (
              <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 xl:w-11 xl:h-11 text-[#0f4c5c] dark:text-emerald-500" />
            )}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-arabic tracking-tight leading-tight transition-all text-[clamp(18px,2.2vw,30px)] text-green-600 truncate max-w-full">MyQuranPlan</span>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 -mt-1 sm:-mt-2"></div>
            <span className="font-extrabold tracking-tight leading-tight transition-all text-slate-800 dark:text-slate-100 text-[clamp(12px,1.25vw,20px)] line-clamp-2 break-words max-w-full">{institutionName}</span>
          </div>
        </div>

        <nav className="hidden md:flex flex-wrap items-center justify-center gap-x-2 lg:gap-x-3 xl:gap-x-4 gap-y-1 font-bold text-[clamp(10px,0.85vw,14px)] text-gray-500 dark:text-slate-400 min-w-0 flex-1">
          {['home', 'siswa', 'ujian', ...(isSuperAdmin ? ['mutasi'] : []), 'laporan', 'arsip', 'statistik'].map(view => (
            <button key={view} onClick={() => setCurrentView(view)} className={`relative pb-1 px-0.5 group transition-colors leading-tight whitespace-normal text-center max-w-[78px] lg:max-w-[92px] ${currentView === view ? 'text-green-600' : 'hover:text-green-600'}`}>
              {view === 'home' ? 'Beranda' : view === 'siswa' ? 'Data Siswa' : view === 'mutasi' ? 'Mutasi' : view.charAt(0).toUpperCase() + view.slice(1)}
              <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${currentView === view ? 'w-full' : 'w-0 group-hover:w-full'} bg-green-600`}></span>
            </button>
          ))}
          {isSuperAdmin && (
            <button onClick={() => setCurrentView('log')} className={`relative pb-1 px-0.5 group transition-colors leading-tight whitespace-normal text-center max-w-[92px] ${currentView === 'log' ? 'text-green-600' : 'hover:text-green-600'}`}>Log Aktifitas<span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'log' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span></button>
          )}
          {isSuperAdmin && (
            <button onClick={() => setCurrentView('pengaturan')} className={`relative pb-1 px-0.5 group transition-colors leading-tight whitespace-normal text-center max-w-[92px] ${currentView === 'pengaturan' ? 'text-green-600' : 'hover:text-green-600'}`}>Pengaturan<span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'pengaturan' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span></button>
          )}
        </nav>

        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-400 dark:text-slate-400 hover:text-amber-500 bg-gray-50 dark:bg-slate-800 rounded-xl hidden md:block" title="Mode Gelap/Terang">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
          <div className="hidden md:flex items-center gap-2 px-2.5 lg:px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 max-w-[150px] lg:max-w-[180px]">
            <User size={14} className="text-gray-400 dark:text-slate-400" />
            <span className="text-[11px] lg:text-xs font-bold text-gray-600 dark:text-slate-300 truncate">{currentUser.name}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-50 dark:bg-slate-800 rounded-xl hidden md:block"><LogOut size={18} /></button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg"><Menu size={18} /></button>
        </div>
      </div>
    </header>
  );
}
export default AppHeader;
