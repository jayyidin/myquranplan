import React, { useMemo, useState } from 'react';
import { PieChart, TrendingUp, Users, BookOpen, Mic, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPeriode } from '../../utils/helpers';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const getMonthTitle = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const getJuzFromSurah = (surahString) => {
  if (!surahString) return 'Belum Ada';
  const match = surahString.match(/^(\d+)\./);
  if (match) {
    const no = parseInt(match[1], 10);
    if (no >= 78 && no <= 114) return 'Juz 30';
    if (no >= 67 && no <= 77) return 'Juz 29';
    if (no >= 58 && no <= 66) return 'Juz 28';
    if (no >= 51 && no <= 57) return 'Juz 27';
    if (no >= 46 && no <= 50) return 'Juz 26';
    if (no >= 41 && no <= 45) return 'Juz 25';
    if (no >= 39 && no <= 40) return 'Juz 24';
    if (no >= 36 && no <= 38) return 'Juz 23';
    if (no >= 33 && no <= 35) return 'Juz 22';
    if (no >= 29 && no <= 32) return 'Juz 21';
    if (no >= 27 && no <= 28) return 'Juz 20';
    if (no >= 25 && no <= 26) return 'Juz 19';
    if (no >= 23 && no <= 24) return 'Juz 18';
    if (no >= 21 && no <= 22) return 'Juz 17';
    if (no >= 19 && no <= 20) return 'Juz 16';
    if (no >= 17 && no <= 18) return 'Juz 15';
    if (no >= 15 && no <= 16) return 'Juz 14';
    if (no >= 13 && no <= 14) return 'Juz 13';
    if (no === 12) return 'Juz 12';
    if (no >= 10 && no <= 11) return 'Juz 11';
    if (no === 9) return 'Juz 10';
    if (no === 8) return 'Juz 9';
    if (no === 7) return 'Juz 8';
    if (no === 6) return 'Juz 7';
    if (no === 5) return 'Juz 6';
    if (no === 4) return 'Juz 4';
    if (no === 3) return 'Juz 3';
    if (no >= 1 && no <= 2) return 'Juz 1';
  }
  const juzMatch = surahString.match(/Juz\s*(\d+)/i);
  if (juzMatch) return `Juz ${juzMatch[1]}`;

  if (surahString === 'Belum Ada' || surahString === '-') return 'Belum Ada';
  return 'Lainnya';
};

const ProgressChartView = ({ students, activeHalaqoh, allStudents, weekDates, changeWeek }) => {
  const [periodType, setPeriodType] = useState('all'); // 'all', 'weekly', 'monthly'
  const [monthDate, setMonthDate] = useState(new Date());
  const [dataSourceType, setDataSourceType] = useState('all'); // 'all', 'filtered'

  const changeMonth = (offset) => {
    const nextDate = new Date(monthDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setMonthDate(nextDate);
  };

  const periodRange = useMemo(() => {
    if (periodType === 'all') return null;
    if (periodType === 'monthly') {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, title: getMonthTitle(monthDate), label: 'Bulanan' };
    }
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[weekDates.length - 1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, title: formatPeriode(start, end), label: 'Mingguan' };
  }, [periodType, monthDate, weekDates]);

  // Mengolah data siswa untuk divisualisasikan (Semua Siswa)
  const globalStats = useMemo(() => {
    const dataSource = dataSourceType === 'all' && allStudents ? allStudents : students;
    const tahsinCounts = {
      'Jilid 1': 0, 'Jilid 2': 0, 'Jilid 3': 0, 'Jilid 4': 0, 'Jilid 5': 0, 'Jilid 6': 0,
      'Al-Qur\'an': 0, 'Tajwid': 0, 'Ghorib': 0, 'Belum Ada': 0
    };
    const tahfidzCounts = { 'Belum Ada': 0 };
    const tahfidzJuzCounts = { 'Belum Ada': 0 };

    let totalStudents = dataSource.length;

    dataSource.forEach(student => {
      // Mencari nilai/level tahsin dan tahfidz terakhir dari rekaman jurnal
      let latestTahsin = null;
      let latestTahfidz = null;
      const dates = Object.keys(student.records || {})
        .filter(d => {
          if (!periodRange) return true;
          const dateObj = new Date(d);
          return dateObj >= periodRange.start && dateObj <= periodRange.end;
        })
        .sort((a, b) => new Date(b) - new Date(a));
      for (const d of dates) {
        if (!latestTahsin) {
          const t = student.records[d]?.jurnalTahsin || student.records[d]?.tahsin;
          if (t && t !== '-') latestTahsin = t;
        }
        if (!latestTahfidz) {
          const f = student.records[d]?.jurnalTahfidz || student.records[d]?.tahfidz;
          if (f && f !== '-') latestTahfidz = f;
        }
        if (latestTahsin && latestTahfidz) break;
      }

      // Hitung Tahsin
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

      // Hitung Tahfidz
      if (latestTahfidz) {
        const surah = latestTahfidz.split(',')[0].trim();
        tahfidzCounts[surah] = (tahfidzCounts[surah] || 0) + 1;

        const juz = getJuzFromSurah(surah);
        tahfidzJuzCounts[juz] = (tahfidzJuzCounts[juz] || 0) + 1;
      } else {
        tahfidzCounts['Belum Ada']++;
        tahfidzJuzCounts['Belum Ada']++;
      }
    });

    return { tahsinCounts, tahfidzCounts, tahfidzJuzCounts, totalStudents };
  }, [allStudents, students, periodRange, dataSourceType]);

  const tahsinLabels = Object.keys(globalStats.tahsinCounts).filter(k => k !== 'Belum Ada' || globalStats.tahsinCounts[k] > 0);
  const maxTahsinCount = Math.max(...tahsinLabels.map(k => globalStats.tahsinCounts[k]), 1);
  const dominantLevel = tahsinLabels.length > 0 ? tahsinLabels.reduce((a, b) => globalStats.tahsinCounts[a] > globalStats.tahsinCounts[b] ? a : b, tahsinLabels[0]) : '-';

  const tahfidzData = useMemo(() => {
    let labels = Object.keys(globalStats.tahfidzCounts)
      .filter(k => k !== 'Belum Ada')
      .sort((a, b) => globalStats.tahfidzCounts[b] - globalStats.tahfidzCounts[a]);

    let othersCount = 0;
    if (labels.length > 6) {
      const others = labels.slice(6);
      labels = labels.slice(0, 6);
      others.forEach(k => {
        othersCount += globalStats.tahfidzCounts[k];
      });
    }

    const dataObj = { ...globalStats.tahfidzCounts };
    if (othersCount > 0) {
      dataObj['Lainnya'] = othersCount;
      labels.push('Lainnya');
    }
    if (dataObj['Belum Ada'] > 0) {
      labels.push('Belum Ada');
    }

    return {
      labels,
      counts: dataObj,
      maxCount: Math.max(...labels.map(k => dataObj[k]), 1)
    };
  }, [globalStats.tahfidzCounts]);

  const topTahfidzSurah = tahfidzData.labels.filter(k => k !== 'Belum Ada' && k !== 'Lainnya')[0] || '-';

  const tahfidzJuzData = useMemo(() => {
    let labels = Object.keys(globalStats.tahfidzJuzCounts)
      .filter(k => k !== 'Belum Ada' && k !== 'Lainnya')
      .sort((a, b) => globalStats.tahfidzJuzCounts[b] - globalStats.tahfidzJuzCounts[a]);

    let othersCount = globalStats.tahfidzJuzCounts['Lainnya'] || 0;
    if (labels.length > 6) {
      const others = labels.slice(6);
      labels = labels.slice(0, 6);
      others.forEach(k => {
        othersCount += globalStats.tahfidzJuzCounts[k];
      });
    }

    const dataObj = { ...globalStats.tahfidzJuzCounts };
    if (othersCount > 0) {
      dataObj['Lainnya'] = othersCount;
      labels.push('Lainnya');
    }
    if (dataObj['Belum Ada'] > 0) {
      labels.push('Belum Ada');
    }

    return {
      labels,
      counts: dataObj,
      maxCount: Math.max(...labels.map(k => dataObj[k]), 1)
    };
  }, [globalStats.tahfidzJuzCounts]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 custom-scrollbar transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
            <PieChart size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Statistik Pencapaian</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Pantau pencapaian level tahsin dan target tahfidz siswa secara visual.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 flex flex-col xl:flex-row gap-3 mb-6 transition-colors">
          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full xl:w-auto">
            <button onClick={() => setDataSourceType('all')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${dataSourceType === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Semua Siswa</button>
            <button onClick={() => setDataSourceType('filtered')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${dataSourceType === 'filtered' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Halaqoh Aktif</button>
          </div>

          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full xl:w-auto xl:ml-auto">
            <button onClick={() => setPeriodType('all')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${periodType === 'all' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Semua Waktu</button>
            <button onClick={() => setPeriodType('monthly')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${periodType === 'monthly' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Bulanan</button>
            <button onClick={() => setPeriodType('weekly')} className={`flex-1 xl:flex-none px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${periodType === 'weekly' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Mingguan</button>
          </div>

          {periodType !== 'all' && (
            <div className="flex items-center justify-between xl:w-[360px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-2 py-1.5 border border-slate-200 dark:border-slate-700">
              <button onClick={() => periodType === 'weekly' ? changeWeek(-7) : changeMonth(-1)} className="p-2 sm:p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronLeft size={20} /></button>
              <div className="text-center px-2">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{periodRange?.label}</div>
                <div className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5"><Calendar size={14} className="text-indigo-500 dark:text-indigo-400" /> {periodRange?.title}</div>
              </div>
              <button onClick={() => periodType === 'weekly' ? changeWeek(7) : changeMonth(1)} className="p-2 sm:p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronRight size={20} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart Tahsin */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><BookOpen className="text-blue-500 dark:text-blue-400" size={20} /><h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Pencapaian Tahsin</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Level</span>
            </div>
            <div className="space-y-4">
              {tahsinLabels.map(label => {
                const count = globalStats.tahsinCounts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / maxTahsinCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-700 dark:text-slate-200">{label}</span><span className="text-slate-500 dark:text-slate-400">{count} Siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Tahfidz */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><Mic className="text-purple-500 dark:text-purple-400" size={20} /><h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Pencapaian Tahfidz</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Surat</span>
            </div>
            <div className="space-y-4">
              {tahfidzData.labels.map(label => {
                const count = tahfidzData.counts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / tahfidzData.maxCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-700 dark:text-slate-200 truncate mr-2" title={label}>{label}</span><span className="text-slate-500 dark:text-slate-400 shrink-0">{count} Siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Tahfidz (Juz) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><Mic className="text-emerald-500 dark:text-emerald-400" size={20} /><h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Pencapaian Tahfidz</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Juz</span>
            </div>
            <div className="space-y-4">
              {tahfidzJuzData.labels.map(label => {
                const count = tahfidzJuzData.counts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / tahfidzJuzData.maxCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-700 dark:text-slate-200 truncate mr-2" title={label}>{label}</span><span className="text-slate-500 dark:text-slate-400 shrink-0">{count} Siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget Informasi */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0"><Users size={32} /></div>
              <div><p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Siswa {dataSourceType === 'all' ? 'Aktif' : 'Terfilter'}</p><p className="text-4xl font-black text-slate-800 dark:text-slate-100 leading-none mt-1">{globalStats.totalStudents}</p><p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">Halaqoh: <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">{dataSourceType === 'all' ? 'Semua Halaqoh' : (activeHalaqoh || 'Semua')}</span></p></div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 dark:border-slate-800/80 shadow-xl text-white relative overflow-hidden"><div className="absolute -right-10 -top-10 text-white/5"><TrendingUp size={180} /></div><div className="relative z-10"><h3 className="text-lg sm:text-xl font-black text-emerald-400 mb-3 flex items-center gap-2"><TrendingUp size={20} /> Insight Otomatis</h3><p className="text-sm sm:text-base font-medium text-slate-300 leading-relaxed">Berdasarkan data <strong className="text-white">{dataSourceType === 'all' ? 'Semua Siswa' : 'Siswa Terfilter'}</strong> {periodRange ? `periode ${periodRange.label.toLowerCase()}` : 'sepanjang waktu'}, mayoritas berada di level <strong className="text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md">{dominantLevel}</strong> untuk Tahsin, serta capaian terbanyak Tahfidz pada <strong className="text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">{topTahfidzSurah}</strong>. Terus pantau perkembangan untuk melihat transisi yang lebih detail secara berkelanjutan.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChartView;