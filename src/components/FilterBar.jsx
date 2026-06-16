import React from 'react';
import { User, Filter, Link, ChevronDown } from 'lucide-react';

const FilterBar = ({ currentView, isSuperAdmin, activeGuru, setActiveGuru, setActiveHalaqoh, guruList, currentUser, showUnfilledOnly, setShowUnfilledOnly, handleCopyPortalLink, activeHalaqoh, guruHalaqohData, students }) => {
  if (['pengaturan', 'log', 'statistik', 'arsip', 'mutasi'].includes(currentView)) return null;

  const halaqohOptions = activeGuru
    ? (guruHalaqohData[activeGuru] || [])
    : Array.from(new Set(students.map(s => s.halaqoh).filter(Boolean)));

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-slate-800 border-b px-3 sm:px-3 md:px-6 py-2.5 sm:py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shrink-0 z-50 print:hidden min-h-11 shadow-sm transition-all duration-500 backdrop-blur-md sticky top-[56px] sm:top-[112px]">
      <div className="min-w-0 w-full sm:w-auto sm:flex-1 md:flex-none">
        {isSuperAdmin ? (
          <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 sm:px-2 py-2 sm:py-1.5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ustadz</span>
            <select
              value={activeGuru}
              onChange={(e) => { setActiveGuru(e.target.value); setActiveHalaqoh(''); }}
              title={activeGuru || 'Pilih Ustadz'}
              className="min-w-0 w-full bg-transparent text-slate-800 dark:text-slate-100 font-black outline-none text-xs sm:text-sm transition-colors"
            >
            {guruList.length === 0 && <option value="">Belum ada Guru</option>}
            {guruList.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 sm:py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-2xl sm:rounded-xl border border-blue-100 dark:border-blue-500/20 shadow-sm overflow-hidden text-xs sm:text-sm font-black transition-colors">
            <span className="w-7 h-7 sm:w-auto sm:h-auto rounded-xl sm:rounded-none bg-white/70 sm:bg-transparent border border-blue-100 sm:border-0 flex items-center justify-center shrink-0">
              <User size={14} />
            </span>
            <span className="min-w-0 truncate" title={currentUser.name}>{currentUser.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] sm:flex sm:items-center gap-2 w-full sm:w-auto sm:flex-none sm:justify-end">
        {currentView === 'home' && (
          <button onClick={() => setShowUnfilledOnly(!showUnfilledOnly)} className={`h-11 sm:h-10 flex items-center justify-center gap-1 sm:gap-2 px-3 rounded-2xl sm:rounded-xl transition-colors border shadow-sm ${showUnfilledOnly ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}`}>
            <Filter size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Belum Mengisi</span>
          </button>
        )}
        <button onClick={handleCopyPortalLink} className="h-11 sm:h-10 flex items-center justify-center gap-1 sm:gap-2 px-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-2xl sm:rounded-xl transition-colors border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <Link size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Share Link</span>
        </button>
        <div className={`${currentView === 'home' ? 'col-span-2 sm:col-span-1' : ''} relative min-w-0`}>
          <select
            value={activeHalaqoh}
            onChange={(e) => setActiveHalaqoh(e.target.value)}
            title={activeHalaqoh || 'Pilih Halaqoh'}
            className="min-w-0 w-full sm:w-[260px] md:w-auto md:max-w-[340px] h-11 sm:h-10 bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/20 text-green-800 dark:text-emerald-300 rounded-2xl sm:rounded-xl pl-3 pr-10 font-black outline-none focus:ring-2 focus:ring-green-500/20 text-xs sm:text-sm transition-colors appearance-none truncate"
          >
            {halaqohOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-600 dark:text-emerald-300 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
export default FilterBar;
