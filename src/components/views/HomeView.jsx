import React, { useState } from 'react';
import { Settings, Users, Edit3, Trash2, Share2, Plus, X, Calendar, ChevronLeft, ChevronRight, BookOpen, Mic, Repeat, Printer, Check, Download, FileText, History, Link } from 'lucide-react';
import { formatShortDate, getInitials, formatPeriode, formatPrintData } from '../../utils/helpers';

const HomeView = ({ 
  activeHalaqoh, activeGuru, homeTab, setHomeTab, weekStart, changeWeek, 
  activeDate, setActiveDate, weekDates, filteredStudents, handleOpenModal, 
  requestClearRecord, setSharingStudent, handleRemoveData, getStatusColor,
  institutionLogo,
  isLoading
}) => {
  // State untuk fitur Share Laporan Individu
  const [shareStudent, setShareStudent] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- FUNGSI UNDUH GAMBAR (PNG) MODERN & FONT LOCKED ---
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      await document.fonts.ready;

      if (!window.htmlToImage) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
        document.body.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      const element = document.getElementById('share-report-card');
      if (element) {
        const dataURL = await window.htmlToImage.toPng(element, { 
          quality: 1, 
          pixelRatio: 2, 
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)', 
            transformOrigin: 'top left'
          }
        });
        
        const link = document.createElement('a');
        const safeName = shareStudent?.name ? shareStudent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'siswa';
        const safeDate = weekDates[0] ? getDateString(weekDates[0]) : 'mingguan';
        
        link.download = `Laporan_${safeName}_${safeDate}.png`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error("Gagal mengunduh gambar:", error);
      alert("Maaf, terjadi kesalahan saat membuat gambar. Pastikan koneksi internet stabil.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- FUNGSI SALIN LINK UNTUK ORANG TUA ---
  const handleCopyShareLink = () => {
    if (!shareStudent) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?share=${shareStudent.id}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Link khusus orang tua berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error('Gagal menyalin link:', err);
    });
  };

  // --- FUNGSI DESAIN KARTU TAHSIN (TAMPILAN WEB) - ANTI CRASH ---
  const renderTahsinCard = (tahsin, halAyat, studentId, dateStr, nilaiCat, nilaiSuratStr) => {
    try {
      if (!tahsin && !halAyat && !nilaiCat) return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
      if (tahsin === '-' && halAyat === '-' && nilaiCat === '-') return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
      
      const catBadge = (nilaiCat && nilaiCat !== '-') ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm w-max leading-none">{String(nilaiCat)}</div> : null;
      
      if (!tahsin || tahsin === '-' || typeof tahsin !== 'string') return <div className="flex flex-col items-center justify-center w-full min-w-0"><span className="text-[11px] md:text-[13px] font-bold text-gray-700 break-words text-center">{halAyat !== '-' ? String(halAyat) : ''}</span>{catBadge}</div>;

      if (tahsin.includes('Tajwid') || tahsin.includes('Ghorib') || tahsin.includes('Gharib')) {
        const parts = tahsin.split(','); const category = parts[0].trim(); const suratListStr = parts.slice(1).join(',').trim();
        let halMat = halAyat !== '-' ? String(halAyat) : '', ayatListStr = '';
        if (halMat.includes(' / ')) { const splitDetails = halMat.split(' / '); halMat = splitDetails[0].trim(); ayatListStr = splitDetails.slice(1).join(' / ').trim(); } else if (!halMat.includes('Hal') && !halMat.includes('-') && !halMat.includes('|')) { ayatListStr = halMat; halMat = ''; }
        const sList = suratListStr ? suratListStr.split(',').map(s=>s.trim()) : [];
        const aList = ayatListStr ? ayatListStr.split(',').map(s=>s.trim()) : [];
        const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s=>s.trim()) : [];

        return (
          <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0 group relative">
            <div className="flex flex-col items-center justify-center gap-1 max-w-full w-full">
               <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest break-words w-max text-center leading-none">{category}</span>
               {catBadge}
            </div>
            {halMat && halMat !== '-' && <span className="text-[10px] md:text-[12px] font-bold text-gray-700 leading-snug break-words whitespace-normal max-w-full text-center mt-0.5">{halMat}</span>}
            {sList.length > 0 && sList.map((s, i) => {
                const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? s + ' ' + a : s;
                const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
                const sBadge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
                return (
                  <div key={i} className="text-[9px] md:text-[11px] lg:text-[12px] text-blue-800 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 font-bold leading-snug mt-0.5 w-fit max-w-full text-center">
                    <div className="flex items-center justify-center gap-1"><BookOpen size={12} className="text-blue-500 shrink-0 mt-0.5"/> <span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
                    {sBadge}
                  </div>
                );
            })}
          </div>
        );
      }
      if (tahsin.includes('Jilid')) return (
          <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0 group relative">
             <div className="flex items-center justify-center gap-1 w-full max-w-full"><span className="text-[12px] md:text-[14px] font-bold text-gray-800 leading-none break-words text-center">{tahsin}</span></div>
             {halAyat !== '-' && <span className="text-[9px] md:text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100/70 break-words whitespace-normal max-w-full text-center">{String(halAyat)}</span>}
             {catBadge}
          </div>
      );
      const tList = tahsin.split(',').map(s => s.trim()); 
      const aList = String(halAyat || '').split(',').map(s => s.trim());
      const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s=>s.trim()) : [];
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
           {tList.map((t, i) => {
              const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? t + ' ' + a : t;
              const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
              const sBadge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
              return (
                 <div key={i} className="text-[9px] md:text-[11px] lg:text-[12px] font-bold text-blue-800 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
                    <div className="flex items-center justify-center gap-1 overflow-hidden"><BookOpen size={12} className="text-blue-500 shrink-0 mt-0.5"/><span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
                    {sBadge}
                 </div>
              );
           })}
        </div>
      );
    } catch (err) {
      return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
    }
  };

  // --- FUNGSI DESAIN KARTU TAHFIDZ (TAMPILAN WEB) - ANTI CRASH ---
  const renderTahfidzCard = (tahfidz, ayat, studentId, dateStr, nilai) => {
    try {
      if ((!tahfidz || tahfidz === '-' || typeof tahfidz !== 'string') && (!nilai || nilai === '-')) return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
      const tList = tahfidz && tahfidz !== '-' && typeof tahfidz === 'string' ? tahfidz.split(',').map(s => s.trim()) : []; 
      const aList = ayat && ayat !== '-' ? String(ayat || '').split(',').map(s => s.trim()) : [];
      const nList = nilai && nilai !== '-' ? String(nilai).split(',').map(s=>s.trim()) : [];
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
           {tList.map((t, i) => { 
              const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? t + ' ' + a : t; 
              const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
              const badge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
              return ( 
                 <div key={i} className="text-[9px] md:text-[11px] lg:text-[12px] font-bold text-purple-800 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
                    <div className="flex items-center justify-center gap-1 overflow-hidden"><Mic size={12} className="text-purple-500 shrink-0 mt-0.5"/> <span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
                    {badge}
                 </div>
              ); 
           })}
        </div>
      );
    } catch (err) {
      return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
    }
  };

  // --- FUNGSI DESAIN KARTU MUROJAAH (TAMPILAN WEB) - ANTI CRASH ---
  const renderMurojaahCard = (murojaah, studentId, dateStr) => {
    try {
      if (!murojaah || murojaah === '-' || typeof murojaah !== 'string') return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
      const items = murojaah.split(',').map(s => s.trim());
      return ( 
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
           {items.map((item, i) => ( 
              <div key={i} className="text-[9px] md:text-[11px] lg:text-[12px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
                 <div className="flex items-center justify-center gap-1 overflow-hidden"><Repeat size={12} className="text-emerald-500 shrink-0 mt-0.5"/><span className="flex-1 min-w-0 break-words whitespace-normal">{item}</span></div>
              </div>
           ))}
        </div> 
      );
    } catch (err) {
      return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
    }
  };

  const getBulanTahun = (date) => {
    try {
      const d = new Date(date);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch(e) { return '-'; }
  };

  const getDayName = (dateObj) => {
    try { return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()]; } catch(e) { return ''; }
  };

  const getDateString = (dateObj) => {
    try { return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`; } catch(e) { return ''; }
  };

  // Kunci data untuk Kartu Laporan selalu menggunakan Target (Lesson Plan)
  const k = { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' };

  // Helper untuk me-render tabel cetak (Tabel Keseluruhan/Kelas)
  const renderPrintTable = (datesToRender, pageNum, totalPages) => {
    const isFull = datesToRender.length === 3;
    const tableWidth = isFull ? '100%' : '73%';
    const wNo = isFull ? '4%' : '5.48%';
    const wNama = isFull ? '15%' : '20.55%';
    const wDay = isFull ? '27%' : '36.98%';

    return (
      <div className="w-full h-screen p-8 flex flex-col justify-between bg-white text-black break-after-page" style={{ pageBreakAfter: pageNum < totalPages ? 'always' : 'auto' }}>
        <div>
          {/* HEADER CETAK */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
              {institutionLogo && institutionLogo !== 'logo.png' ? (
                <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <BookOpen size={32} className="text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
              </h1>
              <p className="text-gray-500 font-bold italic text-sm mt-1">SDIT Al-Fityan School Bogor</p>
            </div>
          </div>

          {/* INFO BOX CETAK */}
          <div className="flex w-full mb-6 border-b-2 border-gray-200 pb-4">
            <div className="flex-1 border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Bulan</p>
              <p className="text-sm font-extrabold text-gray-800">{getBulanTahun(weekStart)}</p>
            </div>
            <div className="flex-1 border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Halaqoh</p>
              <p className="text-sm font-extrabold text-gray-800">{String(activeHalaqoh || '-')}</p>
            </div>
            <div className="flex-[1.5] border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Periode</p>
              <p className="text-sm font-extrabold text-gray-800">{formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</p>
            </div>
            <div className="flex-1 border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Pengajar</p>
              <p className="text-sm font-extrabold text-gray-800">{String(activeGuru || '-')}</p>
            </div>
          </div>

          {/* TABEL DATA CETAK */}
          <div className="w-full flex justify-center">
            <table className="border-collapse border border-green-200 table-fixed mx-auto" style={{ width: tableWidth }}>
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-green-200 p-2 text-[10px] font-black text-gray-700 text-center uppercase bg-white align-middle" style={{ width: wNo }}>No</th>
                  <th rowSpan={2} className="border border-green-200 p-2 text-[10px] font-black text-gray-700 text-center uppercase bg-white align-middle" style={{ width: wNama }}>Nama Siswa</th>
                  {datesToRender.map((dateObj, idx) => (
                    <th key={`head-day-${idx}`} colSpan={3} className="border border-green-200 p-2 text-center text-gray-800 font-bold bg-white" style={{ width: wDay }}>
                      <div className="text-sm">{getDayName(dateObj)}</div>
                      <div className="text-[9px] font-normal text-gray-500">{dateObj && typeof dateObj.getDate === 'function' ? `${dateObj.getDate()} ${getBulanTahun(dateObj).split(' ')[0]} ${dateObj.getFullYear()}` : '-'}</div>
                    </th>
                  ))}
                </tr>
                <tr>
                  {datesToRender.map((dateObj, idx) => (
                    <React.Fragment key={`head-sub-${idx}`}>
                      <th className="border border-green-200 p-1 text-[9px] font-black text-emerald-600 text-center tracking-widest w-1/3">MUROJAAH</th>
                      <th className="border border-green-200 p-1 text-[9px] font-black text-blue-600 text-center tracking-widest w-1/3">TAHSIN</th>
                      <th className="border border-green-200 p-1 text-[9px] font-black text-purple-600 text-center tracking-widest w-1/3">TAHFIDZ</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const initials = getInitials(student?.name);

                  return (
                    <React.Fragment key={(student?.id || idx) + '-row'}>
                      {/* Data Row */}
                      <tr>
                        <td rowSpan={2} className="border border-green-200 p-2 text-center text-xs font-bold text-gray-600 align-top bg-white">{idx + 1}</td>
                        <td rowSpan={2} className="border border-green-200 p-2 align-top bg-white">
                          <div className="flex items-center gap-2">
                            {student?.photo ? (
                              <img src={student.photo} alt={student?.name} className="w-6 h-6 rounded-full object-cover border border-green-100 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-green-50 border border-green-100 text-green-700 flex items-center justify-center text-[9px] font-black shrink-0">{initials}</div>
                            )}
                            <div>
                              <div className="text-[11px] font-black text-gray-800 leading-tight">{String(student?.name || 'Unknown')}</div>
                              <div className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Kelas {String(student?.kelas || '-')}</div>
                            </div>
                          </div>
                        </td>
                        {datesToRender.map((dateObj, dIdx) => {
                          const dateStr = getDateString(dateObj);
                          const rec = student?.records?.[dateStr] || {};
                          
                          // AMBIL DATA & NILAI UNTUK CETAKAN
                          const valM = rec?.[k.m] || '-';
                          const valT = rec?.[k.t] || '-';
                          const valH = rec?.[k.h] || '-';
                          const valTNilai = rec?.[k.tNilai] || '-';
                          const valTSNilai = rec?.[k.tsNilai] || '-';
                          const valF = rec?.[k.f] || '-';
                          const valAF = rec?.[k.af] || '-';
                          const valFNilai = rec?.[k.fNilai] || '-';

                          return (
                            <React.Fragment key={dateStr + '-data'}>
                              <td className="border border-green-200 p-2 text-center text-[10px] font-bold text-emerald-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valM, '-', null, null)}
                              </td>
                              <td className="border border-green-200 p-2 text-center text-[10px] font-bold text-blue-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valT, valH, valTNilai, valTSNilai)}
                              </td>
                              <td className="border border-green-200 p-2 text-center text-[10px] font-bold text-purple-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valF, valAF, null, valFNilai)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                      {/* Catatan Row */}
                      <tr>
                        {datesToRender.map((dateObj, dIdx) => {
                          const dateStr = getDateString(dateObj);
                          const rec = student?.records?.[dateStr] || {};
                          const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';
                          
                          return (
                            <td key={dateStr + '-note'} colSpan={3} className="border border-green-200 px-2 py-1 text-[8px] text-center bg-white h-[20px] align-middle">
                              {valC ? (
                                <span className="text-red-600 font-bold"><span className="text-orange-500">Catatan:</span> {valC}</span>
                              ) : (
                                <span className="text-transparent">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER CETAK */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-4">
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Membangun Generasi Qurani Dan Pemimpin Masa Depan</div>
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">PAGE {pageNum} OF {totalPages}</div>
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">DOC ID: SDITALFITYAN-LP-{getDateString(weekDates[0]).replace(/-/g, '')}-{(activeHalaqoh || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]/g, '')}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: ${shareStudent ? 'portrait' : 'landscape'}; margin: ${shareStudent ? '0mm' : '5mm'}; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; }
          .break-after-page { page-break-after: always; }
          ::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* ===== TAMPILAN HIDDEN PRINT (KHUSUS KERTAS TABEL KELAS) ===== */}
      <div className={`${shareStudent ? 'hidden' : 'hidden print:block'} w-full bg-white text-black m-0 p-0 absolute top-0 left-0 z-[9999]`}>
         {renderPrintTable(weekDates.slice(0, 3), 1, 2)} {/* Halaman 1: Senin - Rabu */}
         {renderPrintTable(weekDates.slice(3, 5), 2, 2)} {/* Halaman 2: Kamis - Jumat */}
      </div>

      {/* ===== MODAL SHARE LAPORAN INDIVIDU ===== */}
      {shareStudent && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-start md:items-center bg-slate-900/80 p-0 md:p-6 pb-32 md:pb-6 overflow-y-auto custom-scrollbar print:absolute print:inset-0 print:bg-white print:p-0 print:overflow-visible">
          
          {/* Tombol Aksi Web (Floating Bottom on Mobile) */}
          <div className="fixed bottom-6 right-6 md:bottom-auto md:top-6 md:right-6 flex flex-col-reverse md:flex-row gap-3 z-[100000] print:hidden" data-html2canvas-ignore="true">
              <button onClick={handleCopyShareLink} className="bg-blue-600 text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-colors">
                 <Link size={18}/> <span className="inline">Salin Link Orang Tua</span>
              </button>
              <button onClick={handleDownloadImage} disabled={isDownloading} className="bg-[#00e676] text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-green-600 transition-colors disabled:opacity-50">
                 {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <Download size={18}/>} 
                 <span className="inline">{isDownloading ? 'Memproses...' : 'Unduh (PNG)'}</span>
              </button>
              <button onClick={() => window.print()} className="bg-white text-gray-800 px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-gray-50 transition-colors">
                 <Printer size={18}/> <span className="inline">Cetak PDF</span>
              </button>
              <button onClick={() => setShareStudent(null)} className="bg-red-500 text-white w-14 h-14 md:w-11 md:h-11 flex items-center justify-center rounded-full md:rounded-xl shadow-xl hover:bg-red-600 transition-colors self-end md:self-auto mb-2 md:mb-0">
                 <X size={24} className="md:w-5 md:h-5"/>
              </button>
          </div>

          {/* KARTU LAPORAN INDIVIDU */}
          <div id="share-report-card" className="bg-white w-full max-w-[800px] rounded-none md:rounded-[32px] overflow-hidden shadow-2xl relative my-auto print:shadow-none print:rounded-none">
            
            {/* HEADER LAPORAN */}
            <div className="bg-[#f2fdf5] p-6 sm:p-8 border-b border-green-100 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-1">
                    Lesson Plan Al-Qur'an
                  </h1>
                  <p className="text-[#00e676] font-bold text-sm italic">SDIT Al-Fityan School Bogor</p>
               </div>
               <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center shrink-0 dark:invert">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen size={48} className="sm:w-16 sm:h-16 text-green-600" />
                  )}
               </div>
            </div>

            {/* INFO SISWA */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-5 border-b border-gray-50 dark:border-gray-700">
               <div className="flex items-center gap-5">
               <div className="w-20 h-20 rounded-full bg-[#e6fbf0] border-4 border-[#00e676] text-[#00e676] flex items-center justify-center text-3xl font-black relative shrink-0">
                  {shareStudent?.photo ? (
                    <img src={shareStudent.photo} alt={shareStudent?.name || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="dark:text-green-400">{getInitials(shareStudent?.name)}</span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 text-[#00e676] shadow-sm">
                     <div className="w-5 h-5 bg-[#00e676] rounded-full flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     </div>
                  </div>
               </div>
               <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2 dark:text-gray-100">{String(shareStudent?.name || 'Siswa')}</h2>
                  <div className="flex flex-wrap gap-2">
                     <span className="bg-[#e6fbf0] text-green-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest dark:bg-green-900/50 dark:text-green-300">Kelas {String(shareStudent?.kelas || '-')}</span>
                     <span className="bg-[#e6fbf0] text-green-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest dark:bg-green-900/50 dark:text-green-300">Kelompok {String(activeHalaqoh || '-')}</span>
                  </div>
               </div>
               </div>

               {/* QR CODE UNTUK LINK DIGITAL */}
               <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 print:flex">
                  <div className="w-16 h-16 bg-white p-1 border border-gray-100 rounded-lg shadow-sm">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?share=${shareStudent?.id}`)}`} alt="QR Code" className="w-full h-full" crossOrigin="anonymous" />
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter dark:text-gray-400">Scan Laporan Digital</p>
               </div>
            </div>

            {/* DAFTAR HARI / JURNAL SISWA */}
            <div className="p-6 sm:p-8 flex flex-col gap-5 bg-gray-50/50 dark:bg-gray-900/50">
               {weekDates.map((dateObj) => {
                  if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                  if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
                  const dateStr = getDateString(dateObj);
                  const dayName = getDayName(dateObj).toUpperCase();
                  const displayDate = `${dateObj.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                  
                  const rec = shareStudent?.records?.[dateStr] || {};
                  const valM = formatPrintData(rec?.[k.m], '-', null, null);
                  const valT = formatPrintData(rec?.[k.t], rec?.[k.h], rec?.[k.tNilai], rec?.[k.tsNilai]);
                  const valF = formatPrintData(rec?.[k.f], rec?.[k.af], null, rec?.[k.fNilai]);
                  const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '-';

                  return (
                    <div key={dateStr} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:break-inside-avoid dark:bg-gray-800 dark:border-gray-700">
                       <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                          <span className="bg-[#00e676] text-white px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-sm">{dayName}</span>
                          <span className="text-gray-400 font-bold italic text-sm">{displayDate}</span>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                          {/* Info TAHSIN */}
                          <div>
                             <div className="flex items-center gap-1.5 mb-1.5 text-blue-500">
                                <BookOpen size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase dark:text-blue-400">Tahsin</span>
                             </div>
                             <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap dark:text-gray-200">{valT}</div>
                          </div>

                          {/* Info TAHFIDZ */}
                          <div>
                             <div className="flex items-center gap-1.5 mb-1.5 text-purple-500">
                                <Mic size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase dark:text-purple-400">Tahfidz</span>
                             </div>
                             <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap dark:text-gray-200">{valF}</div>
                          </div>

                          {/* Info MUROJAAH */}
                          <div>
                             <div className="flex items-center gap-1.5 mb-1.5 text-emerald-500">
                                <Repeat size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase dark:text-emerald-400">Murojaah</span>
                             </div>
                             <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap dark:text-gray-200">{valM}</div>
                          </div>

                          {/* Info CATATAN */}
                          <div>
                             <div className="flex items-center gap-1.5 mb-1.5 text-orange-500">
                                <FileText size={14} />
                                <span className="text-[10px] font-black tracking-widest uppercase dark:text-orange-400">Catatan</span>
                             </div>
                             <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap dark:text-gray-200">{valC}</div>
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>

            {/* FOOTER LAPORAN */}
            <div className="bg-[#111827] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white dark:bg-gray-950">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Users size={14} className="text-gray-300"/></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Pengajar: <strong className="text-white block sm:inline">{String(activeGuru || '-')}</strong></span>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-[#00e676]/20 flex items-center justify-center shrink-0"><Calendar size={14} className="text-[#00e676]"/></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Periode: <strong className="text-white block sm:inline">{formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</strong></span>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAMPILAN APLIKASI WEB NORMAL (APP-SHELL LAYOUT)
          (Terbagi 3 blok kaku: Header Fix, Content Scroll, Footer Fix) 
      ========================================================================= */} {/* Add dark mode styles to this container */}
      <div className="print:hidden w-full h-full flex flex-col overflow-hidden dark:bg-slate-950 transition-colors duration-500">
        
        {/* BLOK 1: HEADER HALAMAN (SHRINK-0 = SELALU TERKUNCI DI ATAS, TIDAK IKUT SCROLL) */}
        <div className="shrink-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="w-40 h-40 flex items-center justify-center shrink-0">
              {institutionLogo && institutionLogo !== 'logo.png' ? (
                <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain dark:invert" />
              ) : (
                <BookOpen size={80} className="text-green-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="dark:text-slate-100">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1a202c] dark:text-white mb-1 leading-tight">
              {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-500 dark:text-slate-400 font-medium text-sm mt-2">
              <span className="flex items-center gap-1.5">
                Halaqoh: <strong className="text-green-700 dark:text-emerald-400 bg-green-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-green-100 dark:border-slate-700">{String(activeHalaqoh || '-')}</strong>
              </span>
              <span className="hidden sm:inline text-gray-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                Pengajar: <strong className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-blue-100 dark:border-slate-700">{String(activeGuru || '-')}</strong>
              </span>
            </div>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2 shrink-0">
            <button onClick={() => handleOpenModal(null, 'full_bulk')} disabled={!activeHalaqoh} className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
              <Edit3 size={16} className="text-[#00e676]" /> <span className="inline">Input Massal</span>
            </button>
            <button onClick={() => window.print()} className="flex-1 md:flex-none bg-gray-800 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm hover:bg-gray-700 transition-all shadow-lg border-2 border-gray-900">
              <Printer size={18} /> <span className="inline">Cetak</span>
            </button>
          </div>
        </div>
        
        {/* BLOK 2: KONTEN UTAMA - AREA SCROLL */}
        <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar bg-slate-50 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-6 w-full mx-auto">
            
            {/* TOMBOL TAB & NAVIGASI */}
            <div className="flex flex-col sm:flex-row bg-slate-100/80 rounded-2xl p-1.5 gap-1.5 shadow-inner">
                <button onClick={() => setHomeTab('lesson_plan')} className={`flex-1 px-4 py-3 sm:py-2.5 font-black text-sm rounded-xl transition-all duration-300 min-w-fit ${homeTab === 'lesson_plan' ? 'bg-white text-green-600 shadow-md border border-gray-200/50 scale-[1.01]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>Target (Lesson Plan)</button>
                <button onClick={() => setHomeTab('jurnal')} className={`flex-1 px-4 py-3 sm:py-2.5 font-black text-sm rounded-xl transition-all duration-300 min-w-fit ${homeTab === 'jurnal' ? 'bg-white text-blue-600 shadow-md border border-gray-200/50 scale-[1.01]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>Capaian (Jurnal)</button>
            </div>

            {/* NAVIGASI TANGGAL & MINGGU */}
            <div className="flex items-center justify-between bg-white px-3 py-3 sm:px-4 rounded-2xl border border-gray-200/80 shadow-sm w-full gap-2">
              <button onClick={() => changeWeek(-7)} className="p-2 sm:px-3 sm:py-2 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors"><ChevronLeft size={16}/><span className="hidden sm:inline">Sebelumnya</span></button>
              <div className="font-black text-gray-700 text-xs sm:text-sm md:text-base text-center flex-1 sm:flex-none"><Calendar size={14} className="inline text-green-500 mr-1 sm:mr-2 align-text-bottom"/> {formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</div>
              <button onClick={() => changeWeek(7)} className="p-2 sm:px-3 sm:py-2 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-lg flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors"><span className="hidden sm:inline">Selanjutnya</span><ChevronRight size={16}/></button>
            </div>

            {/* HORIZONTAL DATE NAV (SNAP SCROLLING) */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 w-full snap-x">
              {weekDates.map((dateObj) => {
                if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null; 
                return (
                    <button key={dateStr} onClick={() => setActiveDate(dateStr)} className={`flex-1 flex flex-col shrink-0 min-w-[80px] sm:min-w-[90px] items-center justify-center p-3 rounded-2xl border transition-all snap-center ${activeDate === dateStr ? 'bg-[#00e676] border-[#00e676] text-white shadow-md transform scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">{dayName}</span>
                      <span className="text-xs md:text-base font-black">{dateObj.getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]}</span>
                    </button>
                );
              })}
            </div>

            {/* LOGIKA PENCARIAN DATA PEKAN LALU UNTUK DISPLAY BAYANGAN */}
            {(() => {
              const prevWeekStart = new Date(weekStart);
              prevWeekStart.setDate(prevWeekStart.getDate() - 7);
              const lastWeekFormattedDates = [4, 3, 2, 1, 0].map(offset => {
                const d = new Date(prevWeekStart);
                d.setDate(d.getDate() + offset);
                return getDateString(d);
              });

              window._lastWeekData = {};
              filteredStudents.forEach(s => {
                for (let dStr of lastWeekFormattedDates) {
                  const rec = s.records?.[dStr];
                  if (rec && (rec[k.t] !== '-' || rec[k.f] !== '-' || rec[k.m] !== '-')) {
                    window._lastWeekData[s.id] = rec;
                    break;
                  }
                }
              });
            })()}

            {/* FRAME RIWAYAT DATA TERAKHIR (MUNCUL SAAT SISWA DIPILIH) */}
            {activeStudentId && window._lastWeekData?.[activeStudentId] && (
              <div className="bg-white border-2 border-[#00e676]/20 rounded-2xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#00e676]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posisi Terakhir:</span>
                    <span className="text-xs font-black text-slate-700">{filteredStudents.find(s => s.id === activeStudentId)?.name}</span>
                  </div>
                  <button onClick={() => setActiveStudentId(null)} className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                   {[
                     { label: 'Tahsin', val: window._lastWeekData[activeStudentId][k.t], color: 'blue' },
                     { label: 'Tahfidz', val: window._lastWeekData[activeStudentId][k.f], color: 'purple' },
                     { label: 'Murojaah', val: window._lastWeekData[activeStudentId][k.m], color: 'emerald' },
                     { label: 'Catatan', val: window._lastWeekData[activeStudentId][k.c], color: 'orange' }
                   ].map((item, i) => (
                     <div key={i} className={`bg-${item.color}-50/50 p-2 rounded-xl border border-${item.color}-100/50`}>
                        <p className={`text-[8px] font-black text-${item.color}-400 uppercase mb-0.5`}>{item.label}</p>
                        <p className={`text-[10px] font-bold text-${item.color}-800 truncate`}>{item.val || '-'}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* PETUNJUK GESER (KHUSUS MOBILE) */}
            {activeHalaqoh && filteredStudents.length > 0 && (
              <div className="md:hidden text-xs font-bold text-blue-500 flex items-center gap-1.5 px-1 -mt-2">
                 <ChevronRight size={14} className="animate-pulse" />
                 Geser tabel ke kiri untuk melihat detail
              </div>
            )}

            {/* TABEL DATA WEB (TIDAK LAGI FIXED HEIGHT, SEKARANG MEMANJANG BEBAS) */}
            <div key={homeTab} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-visible relative flex-1 flex flex-col animate-tab-content transition-colors">
                {isLoading && (
                  <div className="absolute top-0 left-0 w-full h-1 overflow-hidden z-50 rounded-t-2xl bg-slate-50 dark:bg-slate-900">
                    <div className="h-full bg-green-500 animate-loading-bar rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                  </div>
                )}

                {!activeHalaqoh ? (
                  <div className="text-center py-24 flex flex-col items-center justify-center gap-3 text-gray-400 font-bold"><Settings size={36} className="text-gray-300"/><p>Tidak ada Halaqoh yang dipilih.</p></div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-24 flex flex-col items-center justify-center gap-3 text-gray-400 font-bold"><Users size={36} className="text-gray-300"/><p>Belum ada siswa.</p></div>
                ) : (
                  <div className={`overflow-x-auto custom-scrollbar flex-1 relative transition-all duration-500 ${isLoading ? 'blur-[1.5px] opacity-60 pointer-events-none' : ''}`}>
                      <table className="w-full text-center border-collapse min-w-[1000px]">
                        {/* HEADER TABEL (STICKY DI BAWAH HEADER APLIKASI) */}
                        <thead className="sticky top-[-1px] z-30 shadow-sm bg-[#f8fafc] dark:bg-slate-900 transition-colors">
                            <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                              <th className="p-3 pl-4 text-left sticky left-0 top-0 bg-[#f8fafc] dark:bg-slate-900 z-40 w-[240px] shadow-[4px_0_12px_rgba(0,0,0,0.05)] border-r border-gray-100 dark:border-slate-800 transition-colors">Nama Siswa</th>
                              <th className="p-3 w-[200px] sticky top-0 bg-[#f8fafc] dark:bg-slate-900 z-30">
                                <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleOpenModal(null, 'tahsin')}>
                                  Tahsin
                                </div>
                              </th>
                              <th className="p-3 w-[200px] sticky top-0 bg-[#f8fafc] dark:bg-slate-900 z-30">
                                <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handleOpenModal(null, 'tahfidz')}>
                                  Tahfidz
                                </div>
                              </th>
                              <th className="p-3 w-[200px] sticky top-0 bg-[#f8fafc] dark:bg-slate-900 z-30">
                                <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => handleOpenModal(null, 'murojaah')}>
                                  Murojaah
                                </div>
                              </th>
                              <th className="p-3 w-[200px] sticky top-0 bg-[#f8fafc] dark:bg-slate-900 z-30">
                                <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => handleOpenModal(null, 'catatan')}>
                                  Catatan
                                </div>
                              </th>
                              <th className="p-3 w-[120px] sticky right-0 top-0 bg-[#f8fafc] dark:bg-slate-900 z-40 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l border-gray-100 dark:border-slate-800 transition-colors">
                                <div className="flex items-center justify-center gap-1.5"><Settings size={12} /> Aksi</div>
                              </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                            {filteredStudents.map((student, index) => {
                              const record = student?.records?.[activeDate] || {};
                              
                              // AMBIL DATA TERMASUK NILAI
                              const valT = record?.[k.t] || '-'; 
                              const valH = record?.[k.h] || '-'; 
                              const valTNilai = record?.[k.tNilai] || '-'; 
                              const valTSNilai = record?.[k.tsNilai] || '-'; 

                              const valF = record?.[k.f] || '-'; 
                              const valAF = record?.[k.af] || '-'; 
                              const valFNilai = record?.[k.fNilai] || '-';

                              const valM = record?.[k.m] || '-'; 
                              const valC = record?.[k.c] || '-';
                              
                              // Inisial untuk avatar web
                              const initials = getInitials(student?.name);

                              // Ambil data referensi pekan lalu
                              const lastRec = window._lastWeekData?.[student.id];
                              const isTahsinEmpty = valT === '-' && valH === '-' && valTNilai === '-';
                              const isTahfidzEmpty = valF === '-' && valAF === '-' && valFNilai === '-';
                              const isMurojaahEmpty = valM === '-';
                              const isCatatanEmpty = valC === '-';

                              // Determine if the current cell is empty and has ghost data
                              const hasGhostTahsin = isTahsinEmpty && lastRec && lastRec[k.t] !== '-';
                              const hasGhostTahfidz = isTahfidzEmpty && lastRec && lastRec[k.f] !== '-';
                              const hasGhostMurojaah = isMurojaahEmpty && lastRec && lastRec[k.m] !== '-';
                              const hasGhostCatatan = isCatatanEmpty && lastRec && lastRec[k.c] !== '-';
                              return (
                                  <tr 
                                    key={student?.id || Math.random()} 
                                    className={`hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:z-20 relative transition-all duration-300 group ${!isLoading ? 'animate-row-slide-in' : ''}`}
                                    style={!isLoading ? { animationDelay: `${index * 0.05}s` } : {}}
                                  >
                                    <td onClick={() => setActiveStudentId(student.id)} className="p-3 pl-4 text-left sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-[#f4f7fa] dark:group-hover:bg-slate-800 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-all border-r border-gray-50 dark:border-slate-800 cursor-pointer border-l-4 border-transparent group-hover:border-l-green-500 group-hover:shadow-[4px_0_12px_rgba(0,0,0,0.03),inset_8px_0_20px_-6px_rgba(34,197,94,0.6)]">
                                      <div className="flex items-center gap-3">
                                        {student?.photo ? (
                                          <img src={student.photo} alt={student?.name || ''} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 shadow-sm" />
                                        ) : (
                                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[11px] font-black shrink-0 border border-blue-100">
                                            {initials}
                                          </div>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="font-extrabold text-sm text-gray-800 dark:text-slate-100 line-clamp-1 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{String(student?.name || 'Unknown')}</span>
                                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Kelas {String(student?.kelas || '-')}</span>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    <td className="p-2">
                                        <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahsin'); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50 dark:active:bg-slate-800/50">
                                          {!isTahsinEmpty ? (
                                            renderTahsinCard(valT, valH, student?.id, activeDate, valTNilai, valTSNilai)
                                          ) : lastRec && lastRec[k.t] !== '-' ? (
                                            <div className="opacity-25 grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-40">
                                              <div className="text-[7px] font-black text-blue-400 uppercase tracking-tighter mb-0.5">Pekan Lalu</div>
                                              {renderTahsinCard(lastRec[k.t], lastRec[k.h], student?.id, 'ghost', lastRec[k.tNilai], lastRec[k.tsNilai])}
                                            </div>
                                          ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                          <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-blue-500 bg-blue-50 p-1 rounded-md transition-opacity"><Plus size={12}/></button>
                                        </div>
                                    </td>

                                    <td className="p-2">
                                        <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahfidz'); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                          {!isTahfidzEmpty ? (
                                            renderTahfidzCard(valF, valAF, student?.id, activeDate, valFNilai)
                                          ) : lastRec && lastRec[k.f] !== '-' ? (
                                            <div className="opacity-25 grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-40">
                                              <div className="text-[7px] font-black text-purple-400 uppercase tracking-tighter mb-0.5">Pekan Lalu</div>
                                              {renderTahfidzCard(lastRec[k.f], lastRec[k.af], student?.id, 'ghost', lastRec[k.fNilai])}
                                            </div>
                                          ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                          <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-purple-500 bg-purple-50 p-1 rounded-md transition-opacity"><Plus size={12}/></button>
                                        </div>
                                    </td>

                                    <td className="p-2">
                                        <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'murojaah'); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                          {!isMurojaahEmpty ? (
                                            renderMurojaahCard(valM, student?.id, activeDate)
                                          ) : lastRec && lastRec[k.m] !== '-' ? (
                                            <div className="opacity-25 grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-40">
                                              <div className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter mb-0.5">Pekan Lalu</div>
                                              {renderMurojaahCard(lastRec[k.m], student?.id, 'ghost')}
                                            </div>
                                          ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                          <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-emerald-500 bg-emerald-50 p-1 rounded-md transition-opacity"><Plus size={12}/></button>
                                        </div>
                                    </td>

                                    <td className="p-2">
                                        <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'catatan'); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                          {!isCatatanEmpty ? (
                                            <span className={`text-xs text-center ${getStatusColor(valC)}`}>{String(valC)}</span>
                                          ) : lastRec && lastRec[k.c] !== '-' ? (
                                            <div className="opacity-30 grayscale italic scale-90 origin-center">
                                              <span className="text-[10px] text-gray-400">{String(lastRec[k.c])}</span>
                                            </div>
                                          ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                          {valC !== '-' ? (
                                            <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'catatan')} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12}/></button>
                                          ) : (
                                            <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-orange-500 bg-orange-50 p-1 rounded-md transition-opacity"><Plus size={12}/></button>
                                          )}
                                        </div>
                                    </td>

                                    <td className="p-3 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 transition-all border-l border-gray-200 dark:border-slate-800 shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                                      <div className="flex items-center justify-center gap-1">
                                        <button 
                                          onClick={() => handleOpenModal(student, 'full_edit')} 
                                          className="group/btn p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-all" 
                                          title="Edit Data"
                                        >
                                          <Edit3 size={18} />
                                        </button>
                                        <button 
                                          onClick={() => setShareStudent(student)} 
                                          className="group/btn p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" 
                                          title="Bagikan Laporan"
                                        >
                                          <Share2 size={18} />
                                        </button>
                                        <div className="w-px h-4 bg-gray-100 mx-0.5" />
                                        <button 
                                          onClick={(e) => requestClearRecord(e, student?.id, activeDate)} 
                                          className="group/btn p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" 
                                          title="Kosongkan Data"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                              );
                            })}
                        </tbody>
                      </table>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="shrink-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 sm:px-6 py-3 text-center transition-colors">
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
            &copy; {new Date().getFullYear()} <strong className="text-gray-700 dark:text-slate-200">Juman Jayyidin</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};

export default HomeView;