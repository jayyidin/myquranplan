import React from 'react';
import { User, Home, Users, BarChart3, PieChart, Activity, Settings, LogOut, X, Moon, Sun, Archive, ClipboardCheck, ArrowUpDown, Camera, Trash2 } from 'lucide-react';

const MobileMenu = ({ mobileMenuOpen, setMobileMenuOpen, currentUser, theme, setTheme, currentView, setCurrentView, isSuperAdmin, onLogout, teacherPhotos, handleTeacherPhotoUpload, requestDeleteTeacherPhoto }) => {
  const photoRef = React.useRef(null);
  const teacherPhoto = currentUser?.username ? teacherPhotos?.[currentUser.username] : null;
  if (!mobileMenuOpen) return null;
  return (
    <div className="md:hidden fixed inset-0 z-[150] flex justify-end animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      <div className="relative w-72 h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 border-l dark:border-slate-800 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-green-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-green-600 dark:text-emerald-400 overflow-hidden">
              {teacherPhoto ? (
                <img src={teacherPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleTeacherPhotoUpload?.(file); e.target.value = ''; }} />
              <button onClick={() => photoRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                <Camera size={14} className="text-white" />
              </button>
              {teacherPhoto && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); requestDeleteTeacherPhoto?.(); }}
                  className="absolute right-0 bottom-0 z-10 w-5 h-5 rounded-full bg-red-500 text-white border border-white dark:border-slate-900 flex items-center justify-center shadow-md"
                  title="Hapus foto"
                >
                  <Trash2 size={10} strokeWidth={3} />
                </button>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">{currentUser.name}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currentUser.role}</span>
            </div>
          </div>
          <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 rounded-xl">
            {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 rounded-xl"><X size={20} /></button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4 mb-2">Navigasi Cepat</p>
          <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'home' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Home size={20} /> Beranda</button>
          <button onClick={() => { setCurrentView('siswa'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'siswa' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Users size={20} /> Data Siswa</button>
          <button onClick={() => { setCurrentView('ujian'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'ujian' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ClipboardCheck size={20} /> Ujian</button>
          {isSuperAdmin && (
            <button onClick={() => { setCurrentView('kelola'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'kelola' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ArrowUpDown size={20} /> Kelola</button>
          )}
          <button onClick={() => { setCurrentView('laporan'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'laporan' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><BarChart3 size={20} /> Laporan</button>
          <button onClick={() => { setCurrentView('arsip'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'arsip' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Archive size={20} /> Arsip Semester</button>
          <button onClick={() => { setCurrentView('statistik'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'statistik' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><PieChart size={20} /> Statistik</button>
          {isSuperAdmin && (
            <button onClick={() => { setCurrentView('log'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'log' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Activity size={20} /> Log Aktifitas</button>
          )}
          <button onClick={() => { setCurrentView('pengaturan'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'pengaturan' ? 'bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Settings size={20} /> Pengaturan</button>
        </div>
        <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="mt-auto flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black transition-all shadow-sm border border-red-100 dark:border-red-500/20">
          <LogOut size={20} /> Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}
export default MobileMenu;
