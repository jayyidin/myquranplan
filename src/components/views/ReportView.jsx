import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Award,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Mic,
  Printer,
  Repeat,
  Search,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { formatPeriode, formatPrintData, formatShortDate, getInitials } from '../../utils/helpers';

const JURNAL = {
  tahsin: 'jurnalTahsin',
  halTahsin: 'jurnalHalAyatTahsin',
  tahsinNilai: 'jurnalTahsinNilai',
  tahsinSuratNilai: 'jurnalTahsinSuratNilai',
  tahfidz: 'jurnalTahfidz',
  ayatTahfidz: 'jurnalAyatTahfidz',
  tahfidzNilai: 'jurnalTahfidzNilai',
  murojaah: 'jurnalMurojaah',
  catatan: 'jurnalCatatan'
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const JILID_ORDER = ['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', "Al-Qur'an"];

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== '' && text !== '-';
};

const getMonthTitle = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const hasJournalData = (record) => {
  if (!record) return false;
  return [
    JURNAL.tahsin,
    JURNAL.halTahsin,
    JURNAL.tahsinNilai,
    JURNAL.tahsinSuratNilai,
    JURNAL.tahfidz,
    JURNAL.ayatTahfidz,
    JURNAL.tahfidzNilai,
    JURNAL.murojaah,
    JURNAL.catatan
  ].some((field) => hasValue(record[field]));
};

const extractJilid = (tahsin) => {
  if (!hasValue(tahsin)) return null;
  const text = String(tahsin);
  const match = text.match(/Jilid\s*[1-6]/i);
  if (match) return match[0].replace(/\s+/, ' ').replace(/jilid/i, 'Jilid');
  if (/Al-?Qur'?an|Al Quran/i.test(text)) return "Al-Qur'an";
  return null;
};

const getTahsinLevel = (tahsin) => {
  if (!hasValue(tahsin)) return '-';
  const jilid = extractJilid(tahsin);
  if (jilid) return jilid;
  const text = String(tahsin);
  if (/Al-?Qur'?an|Al Quran/i.test(text)) return "Al-Qur'an";
  if (/Tajwid/i.test(text)) return 'Tajwid';
  if (/Ghorib|Gharib/i.test(text)) return 'Ghorib';
  return 'Tahsin';
};

const getRecordDisplay = (record) => {
  const tahsin = formatPrintData(record?.[JURNAL.tahsin], record?.[JURNAL.halTahsin], record?.[JURNAL.tahsinNilai], record?.[JURNAL.tahsinSuratNilai]);
  const tahfidz = formatPrintData(record?.[JURNAL.tahfidz], record?.[JURNAL.ayatTahfidz], null, record?.[JURNAL.tahfidzNilai]);
  const murojaah = hasValue(record?.[JURNAL.murojaah]) ? String(record[JURNAL.murojaah]) : '-';
  const catatan = hasValue(record?.[JURNAL.catatan]) ? String(record[JURNAL.catatan]) : '-';

  return { tahsin, tahfidz, murojaah, catatan };
};

const getStudentGuru = (guruHalaqohData, halaqoh) => {
  if (!guruHalaqohData) return '-';
  for (const [guru, halaqohs] of Object.entries(guruHalaqohData)) {
    if (Array.isArray(halaqohs) && halaqohs.includes(halaqoh)) return guru;
  }
  return '-';
};

const ReportView = ({
  activeHalaqoh,
  activeGuru,
  weekDates,
  changeWeek,
  filteredStudents,
  institutionLogo,
  guruHalaqohData
}) => {
  const [reportType, setReportType] = useState('weekly');
  const [monthDate, setMonthDate] = useState(new Date());
  const [studentSearch, setStudentSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);

  const students = Array.isArray(filteredStudents) ? filteredStudents : [];

  const period = useMemo(() => {
    if (reportType === 'monthly') {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      return {
        start,
        end,
        title: getMonthTitle(monthDate),
        label: 'Rekap Bulanan',
        note: 'Menampilkan jurnal terakhir yang diisi pada bulan ini.'
      };
    }

    const start = new Date(weekDates?.[0] || new Date());
    const end = new Date(weekDates?.[weekDates.length - 1] || start);
    return {
      start,
      end,
      title: formatPeriode(start, end),
      label: 'Rekap Mingguan',
      note: 'Menampilkan jurnal terakhir yang diisi pada pekan ini.'
    };
  }, [monthDate, reportType, weekDates]);

  const changeMonth = (offset) => {
    const nextDate = new Date(monthDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setMonthDate(nextDate);
  };

  const getRecordsInPeriod = (student) => {
    const records = student?.records || {};
    const startTime = new Date(period.start);
    const endTime = new Date(period.end);
    startTime.setHours(0, 0, 0, 0);
    endTime.setHours(23, 59, 59, 999);

    return Object.entries(records)
      .map(([date, record]) => ({ date, dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => !Number.isNaN(dateObj.getTime()) && dateObj >= startTime && dateObj <= endTime && hasJournalData(record))
      .sort((a, b) => b.dateObj - a.dateObj);
  };

  const getJilidJourney = (student) => {
    const records = Object.entries(student?.records || {})
      .map(([date, record]) => ({ date, dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => !Number.isNaN(dateObj.getTime()) && hasValue(record?.[JURNAL.tahsin]))
      .sort((a, b) => a.dateObj - b.dateObj);

    const journeyMap = new Map();
    records.forEach(({ date, record }) => {
      const jilid = extractJilid(record[JURNAL.tahsin]);
      if (!jilid) return;
      const existing = journeyMap.get(jilid);
      const item = {
        jilid,
        firstDate: existing?.firstDate || date,
        lastDate: date,
        detail: hasValue(record[JURNAL.halTahsin]) ? String(record[JURNAL.halTahsin]) : '-',
        nilai: hasValue(record[JURNAL.tahsinNilai]) ? String(record[JURNAL.tahsinNilai]) : '-'
      };
      journeyMap.set(jilid, item);
    });

    return Array.from(journeyMap.values()).sort((a, b) => JILID_ORDER.indexOf(a.jilid) - JILID_ORDER.indexOf(b.jilid));
  };

  const reportRows = students
    .map((student) => {
      const latest = getRecordsInPeriod(student)[0] || null;
      const display = getRecordDisplay(latest?.record || {});
      const journey = getJilidJourney(student);
      const lastJilid = journey[journey.length - 1] || null;
      const teacherName = getStudentGuru(guruHalaqohData, student?.halaqoh);

      return {
        student,
        latest,
        display,
        journey,
        lastJilid,
        teacherName,
        tahsinLevel: getTahsinLevel(latest?.record?.[JURNAL.tahsin])
      };
    })
    .filter(({ student, teacherName }) => {
    return !studentSearch.trim() || String(student?.name || '').toLowerCase().includes(studentSearch.trim().toLowerCase());
    });

  const stats = {
    filled: reportRows.filter((row) => row.latest).length,
    tahsin: reportRows.filter((row) => hasValue(row.latest?.record?.[JURNAL.tahsin])).length,
    tahfidz: reportRows.filter((row) => hasValue(row.latest?.record?.[JURNAL.tahfidz])).length,
    murojaah: reportRows.filter((row) => hasValue(row.latest?.record?.[JURNAL.murojaah])).length,
    jilid: reportRows.filter((row) => row.journey.length > 0).length
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderJourney = (journey, compact = false) => {
    if (!journey.length) return <span className="text-slate-400 font-bold">Belum ada progres jilid</span>;

    return (
      <div className={`flex ${compact ? 'gap-1.5 overflow-x-auto custom-scrollbar pb-1' : 'flex-wrap gap-2'}`}>
        {journey.map((item) => (
          <div key={item.jilid} className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 min-w-[92px]">
            <div className="text-[10px] font-black text-emerald-700 leading-none">{item.jilid}</div>
            <div className="text-[9px] font-bold text-emerald-600/70 mt-1">{formatShortDate(new Date(item.lastDate))}</div>
            {item.detail !== '-' && <div className="text-[9px] font-bold text-slate-500 mt-1 truncate">{item.detail}</div>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 text-slate-900 relative print:bg-white print:overflow-visible"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <style type="text/css" media="print" dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 landscape; margin: 10mm; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        .report-card { break-inside: avoid; }
      ` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-32 md:pb-12">
        <div className="print:hidden flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <TrendingUp size={18} />
              <span className="text-[11px] font-black uppercase tracking-[0.22em]">Laporan Progres Jurnal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">Rekap Tahsin, Tahfidz, dan Perjalanan Jilid</h1>
            <p className="text-sm text-slate-500 font-bold mt-1 max-w-3xl">{period.note} Data diambil dari Jurnal Harian, bukan Lesson Plan.</p>
          </div>
          <button
            onClick={handlePrint}
            disabled={reportRows.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
          >
            <Printer size={19} /> Cetak / Simpan PDF
          </button>
        </div>

        <div className="print:hidden grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-3 mb-5">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setReportType('weekly')} className={`flex-1 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${reportType === 'weekly' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Mingguan</button>
            <button onClick={() => setReportType('monthly')} className={`flex-1 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${reportType === 'monthly' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Bulanan</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col lg:flex-row gap-2">
            <div className="flex items-center justify-between lg:w-[360px] bg-slate-50 rounded-xl px-2 py-1.5">
              <button onClick={() => reportType === 'weekly' ? changeWeek(-7) : changeMonth(-1)} className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /></button>
              <div className="text-center px-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{period.label}</div>
                <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1.5"><Calendar size={14} className="text-emerald-500" /> {period.title}</div>
              </div>
              <button onClick={() => reportType === 'weekly' ? changeWeek(7) : changeMonth(1)} className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors"><ChevronRight size={20} /></button>
            </div>

    <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-full min-h-[44px] pl-10 pr-10 bg-slate-50 border border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-300 transition-all"
                />
                {studentSearch && <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={16} /></button>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="p-5 sm:p-7 md:p-9 print:p-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b-4 border-slate-900 print:border-b-2">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen size={52} className="text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-950 leading-tight uppercase">Laporan Progres Al-Qur'an</h2>
                  <p className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-widest mt-1">{period.label} - {period.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs print:bg-white print:border-slate-300">
                <span className="font-black text-slate-400 uppercase tracking-widest">Halaqoh</span>
                <span className="font-black text-slate-800">{activeHalaqoh || '-'}</span>
                <span className="font-black text-slate-400 uppercase tracking-widest">Ustadz/ah</span>
                <span className="font-black text-slate-800">{activeGuru || '-'}</span>
                <span className="font-black text-slate-400 uppercase tracking-widest">Sumber</span>
                <span className="font-black text-slate-800">Jurnal Harian</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 my-6 print:my-4">
              {[
                { label: 'Siswa Tampil', value: reportRows.length, icon: Users, className: 'bg-slate-50 text-slate-700 border-slate-200' },
                { label: 'Ada Jurnal', value: stats.filled, icon: FileText, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'Ada Tahsin', value: stats.tahsin, icon: BookOpen, className: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'Ada Tahfidz', value: stats.tahfidz, icon: Mic, className: 'bg-purple-50 text-purple-700 border-purple-100' },
                { label: 'Progres Jilid', value: stats.jilid, icon: Layers, className: 'bg-orange-50 text-orange-700 border-orange-100' }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-2xl border p-4 ${item.className}`}>
                    <Icon size={20} className="mb-2" />
                    <div className="text-3xl font-black leading-none">{item.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-75">{item.label}</div>
                  </div>
                );
              })}
            </div>

            {/* GRAFIK PERSENTASE (BAR CHART) */}
            {reportRows.length > 0 && (
              <div className="bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 mb-5 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  Grafik Persentase Capaian
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  {/* Bar Tahsin */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-blue-700 flex items-center gap-1.5"><BookOpen size={14}/> Tahsin</span>
                      <span className="text-slate-500">{Math.round((stats.tahsin / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.tahsin}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.tahsin / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                  {/* Bar Tahfidz */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-purple-700 flex items-center gap-1.5"><Mic size={14}/> Tahfidz</span>
                      <span className="text-slate-500">{Math.round((stats.tahfidz / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.tahfidz}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.tahfidz / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                  {/* Bar Murojaah */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-emerald-700 flex items-center gap-1.5"><Repeat size={14}/> Murojaah</span>
                      <span className="text-slate-500">{Math.round((stats.murojaah / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.murojaah}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.murojaah / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportRows.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl text-slate-400 font-bold border-2 border-dashed border-slate-200">
                <FileText size={30} className="mx-auto mb-3 text-slate-300" />
                Tidak ada siswa yang sesuai filter.
              </div>
            ) : (
              <>
                <div className="hidden lg:block rounded-2xl border border-slate-200 overflow-hidden print:block">
                  <table className="w-full border-collapse text-left bg-white print:text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <th className="px-3 py-3 border-r border-slate-200 w-12 text-center">No</th>
                        <th className="px-4 py-3 border-r border-slate-200 min-w-[210px]">Siswa</th>
                        <th className="px-4 py-3 border-r border-slate-200 w-[115px] text-center">Hari Terakhir</th>
                        <th className="px-4 py-3 border-r border-slate-200 text-blue-600">Tahsin Terakhir</th>
                        <th className="px-4 py-3 border-r border-slate-200 text-purple-600">Tahfidz Terakhir</th>
                        <th className="px-4 py-3 border-r border-slate-200 w-[140px] text-center">Posisi Tahsin</th>
                        <th className="px-4 py-3">Perjalanan Jilid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportRows.map((row, index) => (
                        <tr key={row.student?.id || index} className="report-card hover:bg-slate-50 align-top">
                          <td className="px-3 py-4 border-r border-slate-200 text-center font-black text-slate-400">{index + 1}</td>
                          <td className="px-4 py-4 border-r border-slate-200">
                            <div className="flex items-center gap-3">
                              {row.student?.photo ? (
                                <img src={row.student.photo} alt={row.student?.name || ''} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-xs font-black shrink-0">
                                  {getInitials(row.student?.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 leading-tight">{row.student?.name || 'Siswa'}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.student?.kelas || '-'} - {row.teacherName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 border-r border-slate-200 text-center">
                            <div className="text-[10px] font-black text-slate-700">{row.latest ? formatShortDate(new Date(row.latest.date)) : '-'}</div>
                            {!row.latest && <div className="text-[9px] font-bold text-slate-400 mt-1">Belum ada jurnal</div>}
                          </td>
                          <td className="px-4 py-4 border-r border-slate-200 text-xs font-bold text-blue-800 whitespace-pre-wrap leading-snug">{row.display.tahsin}</td>
                          <td className="px-4 py-4 border-r border-slate-200 text-xs font-bold text-purple-800 whitespace-pre-wrap leading-snug">{row.display.tahfidz}</td>
                          <td className="px-4 py-4 border-r border-slate-200 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl text-[10px] font-black ${row.tahsinLevel !== '-' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-400'}`}>
                              {row.tahsinLevel}
                            </span>
                            {row.lastJilid && <div className="text-[9px] font-bold text-slate-400 mt-2">Update {formatShortDate(new Date(row.lastJilid.lastDate))}</div>}
                          </td>
                          <td className="px-4 py-4 text-xs">{renderJourney(row.journey, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden print:hidden flex flex-col gap-3">
                  {reportRows.map((row, index) => (
                    <div key={row.student?.id || index} className="report-card bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-slate-900 leading-tight">{row.student?.name || 'Siswa'}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.student?.kelas || '-'} - {row.teacherName}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Terakhir</div>
                          <div className="text-[10px] font-black text-slate-700">{row.latest ? formatShortDate(new Date(row.latest.date)) : '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2"><BookOpen size={12} /> Tahsin</div>
                          <div className="text-xs font-bold text-blue-900 whitespace-pre-wrap leading-snug">{row.display.tahsin}</div>
                        </div>
                        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-600 uppercase tracking-widest mb-2"><Mic size={12} /> Tahfidz</div>
                          <div className="text-xs font-bold text-purple-900 whitespace-pre-wrap leading-snug">{row.display.tahfidz}</div>
                        </div>
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2"><Repeat size={12} /> Murojaah</div>
                          <div className="text-xs font-bold text-emerald-900 whitespace-pre-wrap leading-snug">{row.display.murojaah}</div>
                        </div>
                        <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2"><Award size={12} /> Posisi Tahsin</div>
                          <div className="text-xs font-black text-orange-900">{row.tahsinLevel}</div>
                        </div>
                      </div>

                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2"><Layers size={12} /> Perjalanan Jilid</div>
                        {renderJourney(row.journey)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="hidden print:grid grid-cols-2 mt-14 gap-20">
              <div className="text-center">
                <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Mengetahui,<br />Koordinator Al-Qur'an</p>
                <div className="w-56 mx-auto border-b border-slate-800 mb-1"></div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NIP. ...........................</p>
              </div>
              <div className="text-center">
                <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Bogor, ........................ 20....<br />Pengajar Halaqoh</p>
                <p className="font-black text-slate-900 border-b border-slate-800 w-56 mx-auto pb-1 uppercase">{activeGuru || '...........................'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ustadz / Ustadzah</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-3 sm:p-3.5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden"
          title="Scroll ke Atas"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default ReportView;
