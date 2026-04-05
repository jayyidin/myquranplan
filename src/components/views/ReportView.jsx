import React from 'react';
import { Printer, FileText, Calendar, Users, Award, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
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
    if (students.length === 0) return { status: 'none', count: 0 };
    const filledCount = students.filter(s => {
      const r = s.records?.[dateStr];
      return r && (
        (r.tahsin && r.tahsin !== '-') || (r.tahfidz && r.tahfidz !== '-') ||
        (r.murojaah && r.murojaah !== '-') || (r.catatan && r.catatan !== '-')
      );
    }).length;

    if (filledCount === 0) return { status: 'none', count: 0 };
    const status = filledCount === students.length ? 'full' : 'partial';
    return { status, count: filledCount };
  };

  const getStatus = (student) => {
    if (!student || !activeDate) return { status: 'Kosong', color: 'text-gray-400', bg: 'bg-gray-50' };

    const studentRecords = student?.records || {};
    const record = studentRecords[activeDate];
    if (!record || Object.keys(record).length === 0) return { status: 'Kosong', color: 'text-gray-400', bg: 'bg-gray-50' };

    // Ambil nilai tertinggi dari berbagai kemungkinan input
    const tahsin = record.tahsinNilai || record.jurnalTahsinNilai || '';
    const isGood = ['Lancar', 'A', 'B+', 'B', 'Sangat Baik'].some(v => String(tahsin).includes(v)) || parseInt(tahsin) > 80;
    const isRepeat = ['Ulang', 'C', 'Kurang'].some(v => String(tahsin).includes(v)) || (parseInt(tahsin) > 0 && parseInt(tahsin) <= 80);

    if (isGood) return { status: 'Lancar', color: 'text-green-700', bg: 'bg-green-50' };
    if (isRepeat) return { status: 'Perlu Ulang', color: 'text-red-700', bg: 'bg-red-50' };
    return { status: 'Selesai', color: 'text-blue-700', bg: 'bg-blue-50' };
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">

      {/* Area Kontrol & Navigasi */}
      <div className="z-50 bg-gray-100/80 border-gray-200 backdrop-blur-xl -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-2 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden border-b shadow-sm transition-all duration-500 text-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Laporan Halaqoh</h1>
          <p className="font-medium text-slate-500">Pratinjau laporan harian untuk wali santri & arsip.</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={students.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
        >
          <Printer size={18} /> Cetak Laporan
        </button>
      </div>

      {/* NAVIGASI TANGGAL & MINGGU (Sinkron dengan HomeView) */}
      <div className="flex flex-col gap-4 mb-8 print:hidden">
        <div className="flex items-center justify-between px-3 py-3 sm:px-4 rounded-2xl border shadow-sm w-full gap-2 bg-white border-gray-200/80">
          <button onClick={() => changeWeek(-7)} className="p-2 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600"><ChevronLeft size={16} /><span className="hidden sm:inline">Sebelumnya</span></button>
          <div className="font-black text-xs sm:text-sm md:text-base text-center flex-1 sm:flex-none text-gray-700"><Calendar size={14} className="inline text-green-500 mr-1 sm:mr-2 align-text-bottom" /> {formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</div>
          <button onClick={() => changeWeek(7)} className="p-2 sm:px-3 sm:py-2 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors"><span className="hidden sm:inline">Selanjutnya</span><ChevronRight size={16} /></button>
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 w-full snap-x">
          {weekDates.map((dateObj) => {
            if (!dateObj || typeof dateObj.getDay !== 'function') return null;
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
            if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
            const { status: dateStatus, count: filledCount } = getDateStatus(dateStr);
            return (
              <button key={dateStr} onClick={() => setActiveDate(dateStr)} className={`flex-1 flex flex-col shrink-0 min-w-[80px] sm:min-w-[90px] items-center justify-center p-3 rounded-2xl border transition-all snap-center relative ${activeDate === dateStr ? 'bg-[#00e676] border-[#00e676] text-white shadow-md transform scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">{dayName}</span>
                <span className="text-xs md:text-base font-black">{dateObj.getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]}</span>
                {dateStatus !== 'none' && (
                  <div
                    data-tooltip-id="date-tooltip"
                    data-tooltip-content={`${filledCount} dari ${students.length} siswa terisi`}
                    className={`absolute top-1.5 right-1.5 ${activeDate === dateStr ? 'text-white' : dateStatus === 'full' ? 'text-green-500' : 'text-amber-500'}`}
                  >
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kertas Laporan (Bagian ini yang akan dicetak) */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl md:rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-gray-100 p-5 sm:p-8 md:p-12 print:shadow-none print:border-none print:p-0 print:m-0 transition-colors">

        {/* Kop Laporan / Header Cetak */}
        <div className="flex flex-col sm:flex-row items-center border-b-2 border-slate-900 pb-4 mb-6 gap-4 sm:gap-0 transition-colors">
          <div className="w-16 h-16 shrink-0 sm:mr-6 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 transition-colors">
            {institutionLogo && institutionLogo !== 'logo.png' ? (
              <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-xl text-slate-300 font-black tracking-tighter">MQ<span className="text-green-500">.</span></div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-wide mb-1 transition-colors">Laporan Progres Qur'an</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-1 max-w-md mx-auto sm:mx-0 text-slate-800 transition-colors">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Halaqoh</p>
              <p className="text-xs sm:text-sm font-black text-left">: {activeHalaqoh || '-'}</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Pengajar</p>
              <p className="text-sm font-black">: {activeGuru || '-'}</p>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Tanggal</p>
              <p className="text-sm font-black">: {activeDate ? formatShortDate(new Date(activeDate)) : '-'}</p>
            </div>
          </div>
        </div>

        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 print:break-inside-avoid transition-all">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col items-center text-center transition-colors">
            <Users size={24} className="text-blue-500 mb-2" />
            <span className="text-3xl font-black text-slate-900 leading-none">{students.length}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Siswa Terdaftar</span>
          </div>
          <div className="bg-green-50 p-5 rounded-3xl border border-green-100 flex flex-col items-center text-center transition-colors">
            <Award size={24} className="text-green-500 mb-2" />
            <span className="text-3xl font-black text-green-700 leading-none transition-colors">
              {students.filter(s => getStatus(s)?.status === 'Lancar').length}
            </span>
            <span className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mt-1 transition-colors">Lancar / Baik</span>
          </div>
          <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 flex flex-col items-center text-center transition-colors">
            <FileText size={24} className="text-red-500 mb-2" />
            <span className="text-3xl font-black text-rose-700 leading-none transition-colors">
              {students.filter(s => getStatus(s)?.status === 'Perlu Ulang').length}
            </span>
            <span className="text-[10px] font-black text-rose-600/70 uppercase tracking-widest mt-1 transition-colors">Perlu Murojaah</span>
          </div>
        </div>

        {/* Tabel Laporan Utama */}
        {students.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[2rem] text-slate-400 font-bold border-2 border-dashed border-slate-200">
            <p>Tidak ada data siswa untuk ditampilkan pada laporan ini.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse print:text-[11px] relative">
            <thead className="sticky top-[100px] sm:top-[80px] z-20 print:static transition-all bg-slate-50/95 backdrop-blur-sm">
              <tr className="uppercase text-[10px] font-black tracking-[0.15em] transition-colors text-slate-400 border-b-2 border-slate-200">
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3 min-w-[150px]">Identitas Siswa</th>
                <th className="px-4 py-3">Tahsin / Tilawah</th>
                <th className="px-4 py-3">Tahfidz / Hafalan</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3">Murojaah</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {students.map((student, index) => {
                // Pengaman jika ada elemen array yang null
                if (!student) return null;

                const studentRecords = student?.records || {};
                const record = studentRecords[activeDate] || {};

                // Prioritaskan data Jurnal (capaian), jika tidak ada, gunakan data Target (lesson plan)
                const tahsin = (record.jurnalTahsin && record.jurnalTahsin !== '-') ? record.jurnalTahsin : record.tahsin;
                const halAyatTahsin = (record.jurnalHalAyatTahsin && record.jurnalHalAyatTahsin !== '-') ? record.jurnalHalAyatTahsin : record.halAyatTahsin;
                const tahsinNilai = (record.jurnalTahsinNilai && record.jurnalTahsinNilai !== '-') ? record.jurnalTahsinNilai : record.tahsinNilai;
                const tahsinSuratNilai = (record.jurnalTahsinSuratNilai && record.jurnalTahsinSuratNilai !== '-') ? record.jurnalTahsinSuratNilai : record.tahsinSuratNilai;

                const tahfidz = (record.jurnalTahfidz && record.jurnalTahfidz !== '-') ? record.jurnalTahfidz : record.tahfidz;
                const ayatTahfidz = (record.jurnalAyatTahfidz && record.jurnalAyatTahfidz !== '-') ? record.jurnalAyatTahfidz : record.ayatTahfidz;
                const tahfidzNilai = (record.jurnalTahfidzNilai && record.jurnalTahfidzNilai !== '-') ? record.jurnalTahfidzNilai : record.tahfidzNilai;

                const murojaah = (record.jurnalMurojaah && record.jurnalMurojaah !== '-') ? record.jurnalMurojaah : record.murojaah;

                const catatan = (record.jurnalCatatan && record.jurnalCatatan !== '-') ? record.jurnalCatatan : record.catatan;

                // Gunakan helper formatPrintData agar konsisten dengan tampilan di Beranda
                const displayTahsin = formatPrintData(tahsin, halAyatTahsin, tahsinNilai, tahsinSuratNilai);
                const displayTahfidz = formatPrintData(tahfidz, ayatTahfidz, null, tahfidzNilai);
                const displayMurojaah = formatPrintData(murojaah, '-', null, null);
                const displayCatatan = catatan && catatan !== '-' ? catatan : '-';

                const status = getStatus(student);

                return (
                  <tr key={student.id} className="print:break-inside-avoid group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-center text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-black leading-tight text-slate-800">{student?.name || 'Siswa'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student?.id ? String(student.id).substring(0, 8) : 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-sm text-slate-600">{displayTahsin}</td>
                    <td className="px-4 py-4 font-medium text-sm text-slate-600">{displayTahfidz}</td>
                    <td className={`px-4 py-4 font-medium text-sm ${getStatusColor(displayCatatan)}`}>
                      {displayCatatan}
                    </td>
                    <td className="px-4 py-4 font-medium text-sm text-slate-600">{displayMurojaah}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status?.bg || 'bg-gray-100'} ${status?.color || 'text-gray-500'}`}>
                        {status?.status || 'Kosong'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer Tanda Tangan (Hanya muncul saat print) */}
        <div className="hidden print:grid grid-cols-2 mt-20 gap-20 transition-all">
          <div className="text-center">
            <p className="mb-20 text-xs font-bold text-slate-500 uppercase tracking-widest">Koordinator Al-Qur'an</p>
            <div className="w-48 mx-auto border-b-2 border-slate-900 mb-1"></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">NIP. ...........................</p>
          </div>
          <div className="text-center">
            <p className="mb-20 text-xs font-bold text-slate-500 uppercase tracking-widest">Pengajar Halaqoh</p>
            <p className="font-black text-slate-900 border-b-2 border-slate-900 w-48 mx-auto pb-1 uppercase transition-colors">{activeGuru || '...........................'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ustadz / Ustadzah</p>
          </div>
        </div>

        {/* Watermark/Footer kecil di setiap halaman print */}
        <div className="hidden print:block fixed bottom-4 left-0 right-0 text-center">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">Laporan digenerate otomatis melalui MyQuranPlan pada {new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      <Tooltip
        id="date-tooltip"
        place="top"
        className="!bg-slate-800 !text-white !rounded-xl !px-3 !py-2 !text-[10px] !font-bold !opacity-100 !shadow-xl z-[100]"
      />
    </div>
  );
};
export default ReportView;