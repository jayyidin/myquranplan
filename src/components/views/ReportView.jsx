import React from 'react';
import { Printer, FileText, Calendar, Users, Award } from 'lucide-react';
import { formatShortDate } from '../../utils/helpers';

const ReportView = ({ 
  activeHalaqoh, activeGuru, activeDate, weekDates, filteredStudents, institutionLogo
}) => {
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Pastikan filteredStudents selalu berupa array agar tidak error .length atau .map
  const students = Array.isArray(filteredStudents) ? filteredStudents : [];

  // Helper untuk memformat data progres (Tahsin/Tahfidz/Murojaah)
  const formatProgress = (mainVal, listVal, detailVal) => {
    // Jika ada data list (format array dari JurnalModal)
    if (listVal && Array.isArray(listVal) && listVal.length > 0) {
      return listVal.map(item => {
        if (!item) return null;
        const surahName = (item.surat && typeof item.surat === 'string')
          ? (item.surat.includes('.') ? item.surat.split('. ')[1] : item.surat) 
          : (item.surat || '');
        const ayatRange = item.ayatStart && item.ayatEnd ? ` (${item.ayatStart}-${item.ayatEnd})` : '';
        return `${surahName}${ayatRange}`;
      }).filter(Boolean).join(', ');
    }
    
    // Jika hanya ada data string biasa
    if (!mainVal || mainVal === '-' || typeof mainVal !== 'string') return '-';
    const detail = detailVal && detailVal !== '-' ? ` (${detailVal})` : '';
    return `${mainVal}${detail}`;
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
      <div className="z-50 bg-gray-100/80 border-gray-200 backdrop-blur-xl -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden border-b shadow-sm transition-all duration-500 text-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Laporan Halaqoh</h1>
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

      {/* Kertas Laporan (Bagian ini yang akan dicetak) */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl md:rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-gray-100 p-5 sm:p-8 md:p-12 print:shadow-none print:border-none print:p-0 print:m-0 transition-colors">
        
        {/* Kop Laporan / Header Cetak */}
        <div className="flex flex-col sm:flex-row items-center border-b-4 border-slate-900 pb-6 mb-8 gap-4 sm:gap-0 transition-colors">
          <div className="w-24 h-24 shrink-0 sm:mr-6 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 transition-colors">
            {institutionLogo && institutionLogo !== 'logo.png' ? (
              <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-xl text-slate-300 font-black tracking-tighter">MQ<span className="text-green-500">.</span></div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2 transition-colors">Laporan Progres Qur'an</h2>
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
          <table className="w-full text-left border-separate border-spacing-y-2 print:text-[11px] relative">
            <thead className="sticky top-[100px] sm:top-[80px] z-20 print:static transition-all">
              <tr className="uppercase text-[10px] font-black tracking-[0.15em] backdrop-blur-sm transition-colors text-slate-400 bg-white/95">
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3 min-w-[150px]">Identitas Siswa</th>
                <th className="px-4 py-3">Tahsin / Tilawah</th>
                <th className="px-4 py-3">Tahfidz / Hafalan</th>
                <th className="px-4 py-3">Murojaah</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                // Pengaman jika ada elemen array yang null
                if (!student) return null;

                const studentRecords = student?.records || {};
                const record = studentRecords[activeDate] || {};
                
                // Perbaikan parameter formatProgress: 
                // Gunakan record.murojaah sebagai mainVal jika murojaah disimpan sebagai string
                const displayTahsin = formatProgress(record.tahsin || record.jurnalTahsin, record.tahsinSuratList, record.halAyatTahsin || record.jurnalHalAyatTahsin);
                const displayTahfidz = formatProgress(record.tahfidz || record.jurnalTahfidz, record.tahfidzSuratList, record.ayatTahfidz || record.jurnalAyatTahfidz);
                const displayMurojaah = formatProgress(record.murojaah || record.jurnalMurojaah, null, null);

                const status = getStatus(student);

                return (
                  <tr key={student.id} className="print:break-inside-avoid group">
                    <td className="px-4 py-4 text-center text-slate-400 font-bold rounded-l-2xl transition-colors bg-slate-50/50 group-hover:bg-slate-50">{index + 1}</td>
                    <td className="px-4 py-4 transition-colors bg-slate-50/50 group-hover:bg-slate-50">
                      <div className="font-black leading-tight text-slate-800">{student?.name || 'Siswa'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student?.id ? String(student.id).substring(0, 8) : 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-sm transition-colors bg-slate-50/50 text-slate-600 group-hover:bg-slate-50">{displayTahsin}</td>
                    <td className="px-4 py-4 font-medium text-sm transition-colors bg-slate-50/50 text-slate-600 group-hover:bg-slate-50">{displayTahfidz}</td>
                    <td className="px-4 py-4 font-medium text-sm transition-colors bg-slate-50/50 text-slate-600 group-hover:bg-slate-50">{displayMurojaah}</td>
                    <td className="px-4 py-4 text-center rounded-r-2xl transition-colors bg-slate-50/50 group-hover:bg-slate-50">
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
    </div>
  );
};
export default ReportView;