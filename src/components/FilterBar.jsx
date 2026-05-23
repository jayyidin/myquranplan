import React from 'react';
import { User, Filter, Link } from 'lucide-react';

const FilterBar = ({ currentView, isSuperAdmin, activeGuru, setActiveGuru, setActiveHalaqoh, guruList, currentUser, showUnfilledOnly, setShowUnfilledOnly, handleCopyPortalLink, activeHalaqoh, guruHalaqohData, students }) => {
  if (['pengaturan', 'log', 'statistik', 'arsip'].includes(currentView)) return null;

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-slate-800 border-b px-2 sm:px-3 md:px-6 py-1 flex justify-between items-center shrink-0 z-50 print:hidden h-11 shadow-sm transition-all duration-500 backdrop-blur-md sticky top-[56px] sm:top-[112px]">
      <div className="flex items-center gap-2 flex-1 md:flex-none mr-2">
        {isSuperAdmin ? (
          <select value={activeGuru} onChange={(e) => { setActiveGuru(e.target.value); setActiveHalaqoh(''); }} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-1.5 font-bold w-full max-w-[140px] sm:max-w-[160px] md:w-auto md:max-w-none outline-none focus:ring-1 focus:ring-green-500/50 text-xs transition-colors">
            {guruList.length === 0 && <option value="">Belum ada Guru</option>}
            {guruList.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-500/20 shadow-sm overflow-hidden text-xs font-black transition-colors">
            <User size={14} className="shrink-0" /> {currentUser.name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
        {currentView === 'home' && (
          <button onClick={() => setShowUnfilledOnly(!showUnfilledOnly)} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors border shadow-sm ${showUnfilledOnly ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}`}>
            <Filter size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Belum Mengisi</span>
          </button>
        )}
        <button onClick={handleCopyPortalLink} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <Link size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Share Link</span>
        </button>
        <select value={activeHalaqoh} onChange={(e) => setActiveHalaqoh(e.target.value)} className="bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/20 text-green-800 dark:text-emerald-400 rounded-lg p-1.5 font-bold outline-none focus:ring-1 focus:ring-green-500/50 text-xs transition-colors">
          {(activeGuru ? (guruHalaqohData[activeGuru] || []) : Array.from(new Set(students.map(s => s.halaqoh).filter(Boolean)))).map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    </div>
  );
}
export default FilterBar;