import React, { useMemo } from 'react';
import { PieChart, TrendingUp, Users, BookOpen } from 'lucide-react';

const ProgressChartView = ({ students, activeHalaqoh }) => {
  // Mengolah data siswa untuk divisualisasikan
  const stats = useMemo(() => {
    const tahsinCounts = {
      'Jilid 1': 0, 'Jilid 2': 0, 'Jilid 3': 0, 'Jilid 4': 0, 'Jilid 5': 0, 'Jilid 6': 0,
      'Al-Qur\'an': 0, 'Tajwid': 0, 'Ghorib': 0, 'Belum Ada': 0
    };

    let totalStudents = students.length;

    students.forEach(student => {
      // Mencari nilai/level tahsin terakhir dari rekaman jurnal
      let latestTahsin = null;
      const dates = Object.keys(student.records || {}).sort((a, b) => new Date(b) - new Date(a));
      for (const d of dates) {
        const t = student.records[d]?.jurnalTahsin || student.records[d]?.tahsin;
        if (t && t !== '-') {
          latestTahsin = t;
          break;
        }
      }

      if (!latestTahsin) {
        tahsinCounts['Belum Ada']++;
      } else {
        if (latestTahsin.includes('Jilid 1')) tahsinCounts['Jilid 1']++;
        else if (latestTahsin.includes('Jilid 2')) tahsinCounts['Jilid 2']++;
        else if (latestTahsin.includes('Jilid 3')) tahsinCounts['Jilid 3']++;
        else if (latestTahsin.includes('Jilid 4')) tahsinCounts['Jilid 4']++;
        else if (latestTahsin.includes('Jilid 5')) tahsinCounts['Jilid 5']++;
        else if (latestTahsin.includes('Jilid 6')) tahsinCounts['Jilid 6']++;
        else if (latestTahsin.includes('Al-Qur\'an') || latestTahsin.includes('Al Quran')) tahsinCounts['Al-Qur\'an']++;
        else if (latestTahsin.includes('Tajwid')) tahsinCounts['Tajwid']++;
        else if (latestTahsin.includes('Ghorib') || latestTahsin.includes('Gharib')) tahsinCounts['Ghorib']++;
        else tahsinCounts['Belum Ada']++; 
      }
    });

    return { tahsinCounts, totalStudents };
  }, [students]);

  const tahsinLabels = Object.keys(stats.tahsinCounts).filter(k => k !== 'Belum Ada' || stats.tahsinCounts[k] > 0);
  const maxTahsinCount = Math.max(...tahsinLabels.map(k => stats.tahsinCounts[k]), 1);
  const dominantLevel = tahsinLabels.length > 0 ? tahsinLabels.reduce((a, b) => stats.tahsinCounts[a] > stats.tahsinCounts[b] ? a : b, tahsinLabels[0]) : '-';

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-5">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <PieChart size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Statistik Pencapaian</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Pantau distribusi level tahsin dan capaian siswa secara visual.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart Tahsin */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6"><BookOpen className="text-blue-500" size={20} /><h2 className="text-lg font-black text-slate-800">Distribusi Level Tahsin</h2></div>
            <div className="space-y-4">
              {tahsinLabels.map(label => {
                const count = stats.tahsinCounts[label];
                const percentage = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
                const barWidth = `${(count / maxTahsinCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-700">{label}</span><span className="text-slate-500">{count} Siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} style={{ width: barWidth }}/></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget Informasi */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><Users size={32} /></div>
              <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Siswa Aktif</p><p className="text-4xl font-black text-slate-800 leading-none mt-1">{stats.totalStudents}</p><p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">Halaqoh: <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">{activeHalaqoh || 'Semua'}</span></p></div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl text-white relative overflow-hidden"><div className="absolute -right-10 -top-10 text-white/5"><TrendingUp size={180} /></div><div className="relative z-10"><h3 className="text-lg sm:text-xl font-black text-emerald-400 mb-3 flex items-center gap-2"><TrendingUp size={20}/> Insight Otomatis</h3><p className="text-sm sm:text-base font-medium text-slate-300 leading-relaxed">Berdasarkan data saat ini, mayoritas siswa berada di level <strong className="text-white bg-slate-700 px-2 py-0.5 rounded-md">{dominantLevel}</strong>. Terus pantau perkembangan harian pada Jurnal untuk melihat transisi jilid yang lebih detail secara berkelanjutan.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProgressChartView;