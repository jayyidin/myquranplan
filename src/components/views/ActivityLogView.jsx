import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, Clock, Loader2, User, ChevronDown, Calendar, X } from 'lucide-react';
import { supabase } from '../supabase';

const ActivityLogView = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async (reset = false) => {
    setIsLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
        
      // Filter Tanggal
      if (startDate) {
        const [year, month, day] = startDate.split('-');
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-');
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      const { data, error } = await query;

      if (!error && data) {
        if (reset) {
          setLogs(data);
        } else {
          setLogs(prev => [...prev, ...data]);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [startDate, endDate]);

  const filteredLogs = logs.filter(log => 
    (log.guru_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 custom-scrollbar min-h-0 p-3 sm:p-5 md:p-8 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 leading-tight">
              <Activity className="text-blue-500 shrink-0" size={24} /> <span className="truncate">Log Aktifitas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 sm:mt-2 leading-relaxed">
              Pantau riwayat perubahan data, pengelolaan siswa, dan pembaruan sistem.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full md:w-auto">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:flex sm:items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 rounded-xl p-1.5 sm:p-1 shadow-sm w-full sm:w-auto">
              <div className="flex items-center px-1.5 sm:px-2 text-slate-400"><Calendar size={15} /></div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="min-w-0 bg-transparent text-[11px] sm:text-sm font-bold text-slate-600 outline-none cursor-pointer" title="Tanggal Awal" />
              <span className="text-slate-300 font-black text-xs sm:text-sm">-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="min-w-0 bg-transparent text-[11px] sm:text-sm font-bold text-slate-600 outline-none cursor-pointer sm:pr-2" title="Tanggal Akhir" />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors" title="Hapus Filter Tanggal">
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>
            <button onClick={() => fetchLogs(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors font-bold text-xs sm:text-sm shadow-sm">
              <RefreshCw size={16} className={isLoading && page === 0 ? "animate-spin" : ""} />
              Muat Ulang
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[calc(100dvh-210px)] sm:max-h-[800px]">
          <div className="p-3 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input type="text" placeholder="Cari nama, aksi, atau detail..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            {searchQuery && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-2 ml-1 italic">
                *Pencarian hanya dilakukan pada log yang sudah dimuat.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
            {isLoading && page === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 sm:py-20 text-slate-400 gap-3"><Loader2 size={30} className="animate-spin text-blue-500" /><p className="font-bold text-xs sm:text-sm">Memuat log aktifitas...</p></div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 sm:py-20 text-slate-400 gap-3"><Activity size={42} className="opacity-20" /><p className="font-bold text-xs sm:text-sm text-center">Tidak ada log aktifitas yang ditemukan.</p></div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-slate-50 border border-slate-100 sm:border-transparent hover:border-slate-100 transition-colors group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 mt-0.5 sm:mt-1"><User size={15} className="sm:w-[18px] sm:h-[18px]" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 min-w-0"><span className="font-black text-slate-800 text-xs sm:text-base truncate" title={log.guru_name || 'System / Unknown'}>{log.guru_name || 'System / Unknown'}</span><span className="flex items-center gap-1.5 text-[9px] sm:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg w-max shrink-0"><Clock size={11} />{formatDate(log.created_at)}</span></div>
                      <p className="text-slate-700 text-xs sm:text-sm font-bold mb-1 break-words">{log.action}</p>
                      {log.details && (<p className="text-[11px] sm:text-xs text-slate-500 font-medium bg-white border border-slate-100 p-2 sm:p-2.5 rounded-lg mt-2 break-words whitespace-pre-wrap leading-relaxed max-h-40 sm:max-h-none overflow-y-auto custom-scrollbar">{log.details}</p>)}
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="pt-4 flex justify-center">
                    <button 
                      onClick={() => fetchLogs(false)} 
                      disabled={isLoading}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading && page > 0 ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                      {isLoading && page > 0 ? 'Memuat...' : 'Muat Lebih Banyak'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ActivityLogView;
