import React, { useState, useRef } from 'react';
import { Printer, FileText, Calendar, Users, ChevronLeft, ChevronRight, Info, BookOpen, ArrowUp, Search, X, Mic, Repeat } from 'lucide-react';
import { formatShortDate, formatPrintData, formatPeriode, getStatusColor } from '../../utils/helpers';

const ReportView = ({
  activeHalaqoh, activeGuru, activeDate, setActiveDate, weekDates, changeWeek, filteredStudents, institutionLogo, guruHalaqohData
}) => {

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Pastikan filteredStudents selalu berupa array agar tidak error .length atau .map
  const students = Array.isArray(filteredStudents) ? filteredStudents : [];

  const [guruFilter, setGuruFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const getStudentGuru = (halaqoh) => {
    if (!guruHalaqohData) return '-';
    for (const [guru, halaqohs] of Object.entries(guruHalaqohData)) {
      if (Array.isArray(halaqohs) && halaqohs.includes(halaqoh)) return guru;
    }
    return '-';
  };

  const finalStudents = students.filter(s => {
    const matchGuru = !guruFilter.trim() || getStudentGuru(s?.halaqoh).toLowerCase().includes(guruFilter.trim().toLowerCase());
    const matchStudent = !studentSearch.trim() || (s?.name || '').toLowerCase().includes(studentSearch.trim().toLowerCase());
    return matchGuru && matchStudent;
  });

  const getDateStatus = (dateStr) => {
    if (finalStudents.length === 0) return { count: 0 };
    const filledCount = finalStudents.filter(s => {
      const r = s.records?.[dateStr];
      return r && (
        (r.jurnalTahsin && r.jurnalTahsin !== '-') || (r.jurnalTahfidz && r.jurnalTahfidz !== '-') ||
        (r.jurnalMurojaah && r.jurnalMurojaah !== '-') || (r.jurnalCatatan && r.jurnalCatatan !== '-')
      );
    }).length;
    return { count: filledCount };
  };

  // Cari hari terakhir yang memiliki data pada minggu ini
  const getLatestFilledDateStr = () => {
    if (!weekDates || weekDates.length === 0) return activeDate;
    // Pindai dari akhir pekan (Jumat) mundur ke awal pekan (Senin)
    for (let i = weekDates.length - 1; i >= 0; i--) {
      const dateObj = weekDates[i];
      if (!dateObj || typeof dateObj.getDay !== 'function') continue;
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      if (getDateStatus(dateStr).count > 0) return dateStr;
    }
    return activeDate; // fallback (kembali ke hari default) jika kosong semua
  };

  const reportDateStr = getLatestFilledDateStr();
  const reportDateObj = new Date(reportDateStr);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-[#F8FAFC] relative print:bg-white print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 12mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
        `}
      </style>

      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none -z-10 print:hidden"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-32 md:pb-12">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 print:hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full shrink-0"></div>
              <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.2em] truncate">Rekapitulasi</h2>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Laporan Halaqoh</h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium mt-1">Pratinjau dan cetak laporan harian Ananda untuk arsip dan wali siswa.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={finalStudents.length === 0}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              <Printer size={20} /> Cetak Laporan PDF
            </button>
          </div>
        </div>

        {/* NAVIGASI & BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 print:hidden">
          <div className="lg:col-span-1 flex items-center justify-between px-4 py-3 sm:py-4 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <button onClick={() => changeWeek(-7)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /></button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Periode</span>
              <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> {formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</span>
            </div>
            <button onClick={() => changeWeek(7)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><ChevronRight size={20} /></button>
          </div>
          
          <div className="lg:col-span-2 bg-blue-50/80 border border-blue-100/50 rounded-2xl p-4 flex items-start sm:items-center gap-3 shadow-sm">
            <div className="bg-blue-100 text-blue-500 p-2 rounded-xl shrink-0 mt-0.5 sm:mt-0"><Info size={20} /></div>
            <div>
              <h4 className="text-sm font-black text-blue-900 leading-none mb-1">Mode Otomatis Aktif</h4>
              <p className="text-xs sm:text-sm text-blue-700 font-medium leading-snug">Laporan ini menampilkan data dari hari terakhir yang diinput pekan ini: <strong className="font-black bg-white/50 px-1.5 py-0.5 rounded text-blue-800">{reportDateObj && !isNaN(reportDateObj.getTime()) ? `${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][reportDateObj.getDay()]}, ${formatShortDate(reportDateObj)}` : '-'}</strong></p>
            </div>
          </div>
        </div>

        {/* KERTAS LAPORAN (PRINTABLE AREA) */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden md:overflow-x-auto custom-scrollbar print:overflow-visible print:shadow-none print:border-none print:rounded-none print:!m-0 print:!p-0 transition-colors relative">
          
          {/* Dekorasi Kertas Print */}
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 print:hidden"></div>

          <div className="w-full min-w-0 md:min-w-[1000px] p-4 sm:p-6 md:p-12 print:p-0 print:m-0 print:w-full print:min-w-0">
            
            {/* KOP LAPORAN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-emerald-600 pb-4 md:pb-6 mb-6 md:mb-8 gap-4 md:gap-0">
              <div className="flex items-center gap-3 sm:gap-5 w-full md:w-auto text-left min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 flex items-center justify-center shrink-0 overflow-hidden">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase break-words whitespace-normal leading-tight">Laporan Progres</h1>
                  <h2 className="text-[10px] sm:text-xs md:text-lg font-bold text-emerald-600 uppercase tracking-widest mt-0.5 break-words whitespace-normal">Program Al-Qur'an</h2>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 w-full md:w-auto grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm print:bg-transparent print:border-none print:p-0">
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Halaqoh</div>
                <div className={`font-black text-slate-800 text-left break-words whitespace-normal max-w-[120px] sm:max-w-[150px] ${(activeHalaqoh || '').length > 20 ? 'text-[9px] sm:text-[11px]' : (activeHalaqoh || '').length > 15 ? 'text-[10px] sm:text-xs' : ''}`}>{activeHalaqoh || '-'}</div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Ustadz/ah</div>
                <div className={`font-black text-slate-800 text-left break-words whitespace-normal max-w-[120px] sm:max-w-[150px] ${(activeGuru || '').length > 20 ? 'text-[9px] sm:text-[11px]' : (activeGuru || '').length > 15 ? 'text-[10px] sm:text-xs' : ''}`}>{activeGuru || '-'}</div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Tanggal</div>
                <div className="font-black text-slate-800 text-left">{reportDateStr ? formatShortDate(new Date(reportDateStr)) : '-'}</div>
              </div>
            </div>

          {/* FILTER PENCARIAN */}
          <div className="mb-6 flex flex-col sm:flex-row justify-end gap-3 print:hidden">
            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input
                  type="text"
                  placeholder="Cari Siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
               />
               {studentSearch && (
                  <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                     <X size={16} />
                  </button>
               )}
            </div>
            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input
                  type="text"
                  placeholder="Filter Ustadz/ah..."
                  value={guruFilter}
                  onChange={(e) => setGuruFilter(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
               />
               {guruFilter && (
                  <button onClick={() => setGuruFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                     <X size={16} />
                  </button>
               )}
            </div>
          </div>

            {/* STATISTIK RINGKAS */}
            <div className="flex mb-8 print:break-inside-avoid">
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center w-full sm:w-64 print:bg-white print:border-slate-300">
                <Users size={24} className="text-blue-500 mb-2 print:text-slate-600" />
              <span className="text-3xl font-black text-blue-900 leading-none print:text-slate-800">{finalStudents.length}</span>
                <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mt-1.5 print:text-slate-500">Total Siswa</span>
              </div>
            </div>

            {/* TABEL DATA */}
          {finalStudents.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl text-slate-400 font-bold border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><FileText size={24} className="text-slate-300"/></div>
                <p>Tidak ada data siswa untuk ditampilkan.</p>
              </div>
            ) : (
              <>
                {/* TAMPILAN DESKTOP & PRINT (TABLE) */}
                <div className="hidden md:block print:block rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse print:text-[11px] bg-white">
                  <thead>
                <tr className="bg-emerald-600 text-white uppercase text-[10px] font-black tracking-widest print:bg-emerald-600 print:text-white">
                  <th className="px-4 py-3.5 w-12 text-center border-r border-emerald-500 print:border-emerald-700">No</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700 min-w-[220px]">Identitas Siswa</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Tahsin / Tilawah</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Tahfidz / Hafalan</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Murojaah</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Catatan</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200 print:border-slate-300 print:divide-slate-300">
                  {finalStudents.map((student, index) => {
                      if (!student) return null;

                      const record = student?.records?.[reportDateStr] || {};
                      const tahsin = record.jurnalTahsin || '-';
                      const halAyatTahsin = record.jurnalHalAyatTahsin || '-';
                      const tahsinNilai = record.jurnalTahsinNilai || '-';
                      const tahsinSuratNilai = record.jurnalTahsinSuratNilai || '-';
                      const tahfidz = record.jurnalTahfidz || '-';
                      const ayatTahfidz = record.jurnalAyatTahfidz || '-';
                      const tahfidzNilai = record.jurnalTahfidzNilai || '-';
                      const murojaah = record.jurnalMurojaah || '-';
                      const catatan = record.jurnalCatatan || '-';

                      const displayTahsin = formatPrintData(tahsin, halAyatTahsin, tahsinNilai, tahsinSuratNilai);
                      const displayTahfidz = formatPrintData(tahfidz, ayatTahfidz, null, tahfidzNilai);
                      const displayMurojaah = formatPrintData(murojaah, '-', null, null);
                      const displayCatatan = catatan && catatan !== '-' ? catatan : '-';

                      return (
                        <tr key={student.id} className="print:break-inside-avoid group hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center text-slate-500 font-black border-r border-slate-200 bg-slate-50/30 print:bg-transparent print:border-slate-300">{index + 1}</td>
                      <td className="px-4 py-4 border-r border-slate-200 print:border-slate-300">
                            <div className={`font-black leading-tight text-slate-800 mb-0.5 ${(student?.name || '').length > 24 ? 'text-[10px]' : (student?.name || '').length > 18 ? 'text-[11px]' : 'text-sm'}`}>{student?.name || 'Siswa'}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{student?.halaqoh || '-'} • {getStudentGuru(student?.halaqoh)}</div>
                          </td>
                      <td className="px-4 py-4 text-xs font-bold text-blue-700 bg-blue-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayTahsin}</td>
                      <td className="px-4 py-4 text-xs font-bold text-purple-700 bg-purple-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayTahfidz}</td>
                      <td className="px-4 py-4 text-xs font-bold text-emerald-700 bg-emerald-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayMurojaah}</td>
                      <td className={`px-4 py-4 text-xs font-bold border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug ${getStatusColor(displayCatatan)}`}>{displayCatatan}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            {/* TAMPILAN MOBILE (CARDS) */}
            <div className="md:hidden flex flex-col gap-3 print:hidden">
              {finalStudents.map((student, index) => {
                if (!student) return null;

                const record = student?.records?.[reportDateStr] || {};
                const tahsin = record.jurnalTahsin || '-';
                const halAyatTahsin = record.jurnalHalAyatTahsin || '-';
                const tahsinNilai = record.jurnalTahsinNilai || '-';
                const tahsinSuratNilai = record.jurnalTahsinSuratNilai || '-';
                const tahfidz = record.jurnalTahfidz || '-';
                const ayatTahfidz = record.jurnalAyatTahfidz || '-';
                const tahfidzNilai = record.jurnalTahfidzNilai || '-';
                const murojaah = record.jurnalMurojaah || '-';
                const catatan = record.jurnalCatatan || '-';

                const displayTahsin = formatPrintData(tahsin, halAyatTahsin, tahsinNilai, tahsinSuratNilai);
                const displayTahfidz = formatPrintData(tahfidz, ayatTahfidz, null, tahfidzNilai);
                const displayMurojaah = formatPrintData(murojaah, '-', null, null);
                const displayCatatan = catatan && catatan !== '-' ? catatan : '-';

                const isEmpty = displayTahsin === '-' && displayTahfidz === '-' && displayMurojaah === '-' && displayCatatan === '-';

                return (
                  <div key={student.id} className={`border rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-colors ${isEmpty ? 'bg-slate-50/80 border-slate-200 border-dashed opacity-80' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${isEmpty ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-black leading-tight truncate ${(student?.name || '').length > 24 ? 'text-[11px]' : 'text-sm'} ${isEmpty ? 'text-slate-500' : 'text-slate-800'}`}>{student?.name || 'Siswa'}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate mt-0.5">{student?.halaqoh || '-'} • {getStudentGuru(student?.halaqoh)}</div>
                      </div>
                      {isEmpty && (
                        <span className="shrink-0 bg-slate-200 text-slate-500 text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase">Kosong</span>
                      )}
                    </div>
                    {isEmpty ? (
                      <div className="text-center py-2 text-slate-400 text-xs font-bold italic">
                        Belum ada data pada hari ini.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 flex flex-col gap-1">
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><BookOpen size={12}/> Tahsin / Tilawah</div>
                          <div className="text-xs font-bold text-blue-800 whitespace-pre-wrap leading-snug">{displayTahsin}</div>
                        </div>
                        <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 flex flex-col gap-1">
                          <div className="text-[9px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-1.5"><Mic size={12}/> Tahfidz / Hafalan</div>
                          <div className="text-xs font-bold text-purple-800 whitespace-pre-wrap leading-snug">{displayTahfidz}</div>
                        </div>
                        <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 flex flex-col gap-1">
                          <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><Repeat size={12}/> Murojaah</div>
                          <div className="text-xs font-bold text-emerald-800 whitespace-pre-wrap leading-snug">{displayMurojaah}</div>
                        </div>
                        {displayCatatan !== '-' && (
                          <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50 flex flex-col gap-1">
                            <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5"><FileText size={12}/> Catatan</div>
                            <div className={`text-xs font-bold whitespace-pre-wrap leading-snug ${getStatusColor(displayCatatan)}`}>{displayCatatan}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
            )}

            {/* FOOTER TANDA TANGAN (Hanya muncul saat print) */}
        <div className="hidden print:grid grid-cols-2 mt-16 gap-20">
              <div className="text-center">
            <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Mengetahui,<br/>Koordinator Al-Qur'an</p>
            <div className="w-56 mx-auto border-b border-slate-800 mb-1"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NIP. ...........................</p>
              </div>
              <div className="text-center">
            <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Bogor, ........................ 20....<br/>Pengajar Halaqoh</p>
            <p className="font-black text-slate-900 border-b border-slate-800 w-56 mx-auto pb-1 uppercase">{activeGuru || '...........................'}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ustadz / Ustadzah</p>
              </div>
            </div>

            {/* WATERMARK PRINT */}
            <div className="hidden print:block fixed bottom-4 left-0 right-0 text-center">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Laporan digenerate otomatis melalui MyQuranPlan pada {new Date().toLocaleString('id-ID')}</p>
            </div>
            
          </div>
        </div>

      </div>
      
      {/* Tombol Scroll ke Atas */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-3 sm:p-3.5 bg-slate-800 text-white rounded-full shadow-2xl hover:bg-slate-900 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden"
          title="Scroll ke Atas"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
export default ReportView;