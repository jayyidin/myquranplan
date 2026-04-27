import React from 'react';
import { Printer, FileText, Calendar, Users, Award, ChevronLeft, ChevronRight, TrendingUp, Info, BookOpen } from 'lucide-react';
import { formatShortDate, formatPrintData, formatPeriode, getStatusColor } from '../../utils/helpers';

const ReportView = ({
  activeHalaqoh, activeGuru, activeDate, setActiveDate, weekDates, changeWeek, filteredStudents, institutionLogo
}) => {

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Pastikan filteredStudents selalu berupa array agar tidak error .length atau .map
  const students = Array.isArray(filteredStudents) ? filteredStudents : [];

  const getDateStatus = (dateStr) => {
    if (students.length === 0) return { count: 0 };
    const filledCount = students.filter(s => {
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

  const getStatus = (student) => {
    if (!student || !reportDateStr) return { status: 'Kosong', color: 'text-gray-400', bg: 'bg-gray-50' };

    const studentRecords = student?.records || {};
    const record = studentRecords[reportDateStr];
    if (!record || Object.keys(record).length === 0) return { status: 'Kosong', color: 'text-gray-400', bg: 'bg-gray-50' };

    // Ambil nilai tertinggi dari berbagai kemungkinan input
    const tahsin = record.jurnalTahsinNilai || '';
    const isGood = ['Lancar', 'A', 'B+', 'B', 'Sangat Baik'].some(v => String(tahsin).includes(v)) || parseInt(tahsin) > 80;
    const isRepeat = ['Ulang', 'C', 'Kurang'].some(v => String(tahsin).includes(v)) || (parseInt(tahsin) > 0 && parseInt(tahsin) <= 80);

    if (isGood) return { status: 'Lancar', color: 'text-green-700', bg: 'bg-green-50' };
    if (isRepeat) return { status: 'Perlu Ulang', color: 'text-red-700', bg: 'bg-red-50' };
    return { status: 'Selesai', color: 'text-blue-700', bg: 'bg-blue-50' };
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-[#F8FAFC] relative print:bg-white print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
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
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Rekapitulasi</h2>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Laporan Halaqoh</h1>
            <p className="text-slate-500 font-medium mt-1">Pratinjau dan cetak laporan harian Ananda untuk arsip dan wali santri.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={students.length === 0}
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
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-x-auto custom-scrollbar print:overflow-visible print:shadow-none print:border-none print:rounded-none print:!m-0 print:!p-0 transition-colors relative">
          
          {/* Dekorasi Kertas Print */}
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 print:hidden"></div>

          <div className="min-w-[1000px] p-6 sm:p-8 md:p-12 print:p-0 print:m-0">
            
            {/* KOP LAPORAN */}
            <div className="flex flex-row items-center justify-between border-b-4 border-emerald-600 pb-6 mb-8 gap-0">
              <div className="flex items-center gap-5 w-auto text-left">
                <div className="w-24 h-24 flex items-center justify-center shrink-0 overflow-hidden">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen size={64} className="text-emerald-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Laporan Progres</h1>
                  <h2 className="text-lg font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Program Al-Qur'an</h2>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 w-auto grid grid-cols-2 gap-x-6 gap-y-2 text-sm print:bg-transparent print:border-none print:p-0">
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Halaqoh</div>
                <div className="font-black text-slate-800 text-left">{activeHalaqoh || '-'}</div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Ustadz/ah</div>
                <div className="font-black text-slate-800 text-left">{activeGuru || '-'}</div>
                <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Tanggal</div>
                <div className="font-black text-slate-800 text-left">{reportDateStr ? formatShortDate(new Date(reportDateStr)) : '-'}</div>
              </div>
            </div>

            {/* STATISTIK RINGKAS */}
            <div className="grid grid-cols-3 gap-6 mb-8 print:break-inside-avoid">
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center print:bg-white print:border-slate-300">
                <Users size={24} className="text-blue-500 mb-2 print:text-slate-600" />
                <span className="text-3xl font-black text-blue-900 leading-none print:text-slate-800">{students.length}</span>
                <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mt-1.5 print:text-slate-500">Total Siswa</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center print:bg-white print:border-slate-300">
                <Award size={24} className="text-emerald-500 mb-2 print:text-slate-600" />
                <span className="text-3xl font-black text-emerald-700 leading-none print:text-slate-800">
                  {students.filter(s => getStatus(s)?.status === 'Lancar').length}
                </span>
                <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest mt-1.5 print:text-slate-500">Lancar / Baik</span>
              </div>
              <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center print:bg-white print:border-slate-300">
                <TrendingUp size={24} className="text-rose-500 mb-2 print:text-slate-600" />
                <span className="text-3xl font-black text-rose-700 leading-none print:text-slate-800">
                  {students.filter(s => getStatus(s)?.status === 'Perlu Ulang').length}
                </span>
                <span className="text-[10px] font-black text-rose-600/70 uppercase tracking-widest mt-1.5 print:text-slate-500">Perlu Ulang</span>
              </div>
            </div>

            {/* TABEL DATA */}
            {students.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl text-slate-400 font-bold border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><FileText size={24} className="text-slate-300"/></div>
                <p>Tidak ada data siswa untuk ditampilkan.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse print:text-[11px] bg-white">
                  <thead>
                <tr className="bg-emerald-600 text-white uppercase text-[10px] font-black tracking-widest print:bg-emerald-600 print:text-white">
                  <th className="px-4 py-3.5 w-12 text-center border-r border-emerald-500 print:border-emerald-700">No</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700 min-w-[160px]">Identitas Siswa</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Tahsin / Tilawah</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Tahfidz / Hafalan</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Murojaah</th>
                  <th className="px-4 py-3.5 border-r border-emerald-500 print:border-emerald-700">Catatan</th>
                  <th className="px-4 py-3.5 text-center print:border-emerald-700">Status</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200 print:border-slate-300 print:divide-slate-300">
                    {students.map((student, index) => {
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

                      const status = getStatus(student);

                      return (
                        <tr key={student.id} className="print:break-inside-avoid group hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-center text-slate-500 font-black border-r border-slate-200 bg-slate-50/30 print:bg-transparent print:border-slate-300">{index + 1}</td>
                      <td className="px-4 py-4 border-r border-slate-200 print:border-slate-300">
                            <div className={`font-black leading-tight text-slate-800 mb-0.5 ${(student?.name || '').length > 24 ? 'text-[10px]' : (student?.name || '').length > 18 ? 'text-[11px]' : 'text-sm'}`}>{student?.name || 'Siswa'}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{student?.id ? String(student.id).substring(0, 8) : 'N/A'}</div>
                          </td>
                      <td className="px-4 py-4 text-xs font-bold text-blue-700 bg-blue-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayTahsin}</td>
                      <td className="px-4 py-4 text-xs font-bold text-purple-700 bg-purple-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayTahfidz}</td>
                      <td className="px-4 py-4 text-xs font-bold text-emerald-700 bg-emerald-50/10 border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug">{displayMurojaah}</td>
                      <td className={`px-4 py-4 text-xs font-bold border-r border-slate-200 print:border-slate-300 print:bg-transparent whitespace-pre-wrap leading-snug ${getStatusColor(displayCatatan)}`}>{displayCatatan}</td>
                          <td className="px-4 py-4 text-center">
                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-24 text-center border ${status?.bg ? status.bg.replace('bg-', 'border-').replace('50', '200') : 'border-gray-200'} ${status?.bg || 'bg-gray-50'} ${status?.color || 'text-gray-500'} print:bg-transparent print:border print:shadow-none print:border-slate-300 print:text-slate-700`}>
                              {status?.status || 'Kosong'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
};
export default ReportView;