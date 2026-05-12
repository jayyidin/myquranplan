import React from 'react';
import { User, Filter, Link } from 'lucide-react';

const FilterBar = ({ currentView, isSuperAdmin, activeGuru, setActiveGuru, setActiveHalaqoh, guruList, currentUser, showUnfilledOnly, setShowUnfilledOnly, handleCopyPortalLink, activeHalaqoh, guruHalaqohData, students }) => {
  if (['pengaturan', 'log', 'statistik'].includes(currentView)) return null;
  
  return (
    <div className="bg-white/95 border-gray-200 border-b px-2 sm:px-3 md:px-6 py-1 flex justify-between items-center shrink-0 z-50 print:hidden h-11 shadow-sm transition-all duration-500 backdrop-blur-md sticky top-[56px] sm:top-[112px]">
      <div className="flex items-center gap-2 flex-1 md:flex-none mr-2">
        {isSuperAdmin ? (
          <select value={activeGuru} onChange={(e) => { setActiveGuru(e.target.value); setActiveHalaqoh(''); }} className="bg-gray-50 border rounded-lg p-1.5 font-bold w-full max-w-[140px] sm:max-w-[160px] md:w-auto md:max-w-none outline-none focus:ring-2 focus:ring-green-500/20 text-xs">
            {guruList.length === 0 && <option value="">Belum ada Guru</option>}
            {guruList.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-sm overflow-hidden text-xs font-black">
            <User size={14} className="shrink-0" /> {currentUser.name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
        {currentView === 'home' && (
          <button onClick={() => setShowUnfilledOnly(!showUnfilledOnly)} className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors border shadow-sm ${showUnfilledOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}>
            <Filter size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Belum Mengisi</span>
          </button>
        )}
        <button onClick={handleCopyPortalLink} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shadow-sm">
          <Link size={14} /><span className="text-[10px] sm:text-xs font-bold hidden md:inline">Share Link</span>
        </button>
        <select value={activeHalaqoh} onChange={(e) => setActiveHalaqoh(e.target.value)} className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-1.5 font-bold outline-none focus:ring-2 focus:ring-green-500/20 text-xs">
          {(activeGuru ? (guruHalaqohData[activeGuru] || []) : Array.from(new Set(students.map(s => s.halaqoh).filter(Boolean)))).map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
    </div>
  );
}
export default FilterBar;