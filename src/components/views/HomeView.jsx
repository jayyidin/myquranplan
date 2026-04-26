import React, { useState, useEffect } from 'react';
import { Settings, Users, Edit3, Trash2, Share2, Plus, X, Calendar, ChevronLeft, ChevronRight, BookOpen, Mic, Repeat, Printer, Check, Download, FileText, History, Link, Search, ImageDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { formatShortDate, getInitials, formatPeriode, formatPrintData } from '../../utils/helpers';

const HomeView = ({
  activeHalaqoh, activeGuru, homeTab, setHomeTab, weekStart, changeWeek,
  activeDate, setActiveDate, weekDates, filteredStudents, handleOpenModal,
  requestClearRecord, setSharingStudent, handleRemoveData, getStatusColor,
  institutionLogo,
  isLoading,
  searchQuery,
  setSearchQuery,
  studentsInHalaqohCount
}) => {
  // State untuk fitur Share Laporan Individu
  const [shareStudent, setShareStudent] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [isClassReportVisible, setIsClassReportVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(window.innerWidth >= 768);

  // State untuk Lazy Loading di Mobile
  const [visibleCount, setVisibleCount] = useState(10);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // Reset jumlah yang terlihat saat berganti halaqoh atau tanggal
  useEffect(() => {
    setVisibleCount(10);
    setIsMoreLoading(false);
  }, [activeHalaqoh, activeDate]);

  // Fungsi Muat Lebih Banyak dengan Skeleton Delay
  const handleLoadMore = () => {
    setIsMoreLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 10);
      setIsMoreLoading(false);
    }, 800); // Delay 800ms agar skeleton sempat terlihat
  };


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

  // --- FUNGSI UNDUH GAMBAR LAPORAN KELAS (PNG) ---
  const handleDownloadClassReportImage = async (pageId, pageNum) => {
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

      const element = document.getElementById(pageId);
      if (element) {
        const dataURL = await window.htmlToImage.toPng(element, { quality: 1, pixelRatio: 1.5, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        const safeHalaqoh = activeHalaqoh.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `Laporan_Halaqoh_${safeHalaqoh}_${getDateString(weekDates[0])}_Hal${pageNum}.png`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error("Gagal mengunduh gambar laporan kelas:", error);
      alert("Maaf, terjadi kesalahan saat membuat gambar.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- FUNGSI UNDUH PDF LAPORAN INDIVIDU ---
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await document.fonts.ready;

      // Load html-to-image
      if (!window.htmlToImage) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
        document.body.appendChild(script);
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
      }

      // Load jsPDF
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.body.appendChild(script);
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
      }

      const { jsPDF } = window.jspdf;
      const element = document.getElementById('share-report-card');
      if (element) {
        const imgData = await window.htmlToImage.toPng(element, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('p', 'mm', 'a4'); // portrait
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const img = new Image();
        img.src = imgData;
        await new Promise(resolve => img.onload = resolve);
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const finalImgWidth = imgWidth * ratio;
        const finalImgHeight = imgHeight * ratio;
        const imgX = (pdfWidth - finalImgWidth) / 2;
        const imgY = 0;
        pdf.addImage(imgData, 'PNG', imgX, imgY, finalImgWidth, finalImgHeight);
        const safeName = shareStudent?.name ? shareStudent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'siswa';
        const safeDate = weekDates[0] ? getDateString(weekDates[0]) : 'mingguan';
        pdf.save(`Laporan_${safeName}_${safeDate}.pdf`);
      }
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      alert("Maaf, terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- FUNGSI UNDUH PDF LAPORAN KELAS ---
  const handleDownloadClassReportPdf = async () => {
    setIsDownloading(true);
    try {
      await document.fonts.ready;
      if (!window.htmlToImage) { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js'; document.body.appendChild(script); await new Promise((r, j) => { script.onload = r; script.onerror = j; }); }
      if (!window.jspdf) { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.body.appendChild(script); await new Promise((r, j) => { script.onload = r; script.onerror = j; }); }
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4'); // portrait
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const addPageToPdf = async (pageId) => {
        const element = document.getElementById(pageId);
        if (element) {
          const imgData = await window.htmlToImage.toPng(element, { quality: 1, pixelRatio: 1.5, backgroundColor: '#ffffff' });
          const img = new Image(); img.src = imgData; await new Promise(r => img.onload = r);
          const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
          const w = img.width * ratio; const h = img.height * ratio;
          const x = (pdfWidth - w) / 2; const y = 0;
          pdf.addImage(imgData, 'PNG', x, y, w, h);
        }
      };
      await addPageToPdf('class-report-page-1');
      const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);
      if (workDays.length > 3) { pdf.addPage(); await addPageToPdf('class-report-page-2'); }
      const safeHalaqoh = activeHalaqoh.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`Laporan_Halaqoh_${safeHalaqoh}_${getDateString(weekDates[0])}.pdf`);
    } catch (error) { console.error("Gagal mengunduh PDF laporan kelas:", error); alert("Maaf, terjadi kesalahan saat membuat PDF."); }
    finally { setIsDownloading(false); }
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

      const catBadge = (nilaiCat && nilaiCat !== '-') ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[12px] font-black px-2.5 py-1 rounded-full shadow-sm w-max leading-none">{String(nilaiCat)}</div> : null;

      if (!tahsin || tahsin === '-' || typeof tahsin !== 'string') return <div className="flex flex-col items-center justify-center w-full min-w-0"><span className="text-[13px] md:text-[14px] font-bold text-gray-700 break-words text-center">{halAyat !== '-' ? String(halAyat) : ''}</span>{catBadge}</div>;

      if (tahsin.includes('Tajwid') || tahsin.includes('Ghorib') || tahsin.includes('Gharib')) {
        const parts = tahsin.split(','); const category = parts[0].trim(); const suratListStr = parts.slice(1).join(',').trim();
        let halMat = halAyat !== '-' ? String(halAyat) : '', ayatListStr = '';
        if (halMat.includes(' / ')) { const splitDetails = halMat.split(' / '); halMat = splitDetails[0].trim(); ayatListStr = splitDetails.slice(1).join(' / ').trim(); } else if (!halMat.includes('Hal') && !halMat.includes('-') && !halMat.includes('|')) { ayatListStr = halMat; halMat = ''; }
        const sList = suratListStr ? suratListStr.split(',').map(s => s.trim()) : [];
        const aList = ayatListStr ? ayatListStr.split(',').map(s => s.trim()) : [];
        const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s => s.trim()) : [];

        return (
          <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0 group relative">
            <div className="flex flex-col items-center justify-center gap-1 max-w-full w-full">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-[10px] md:text-[11px] font-black uppercase tracking-widest break-words w-max text-center leading-none">{category}</span>
              {catBadge}
            </div>
            {halMat && halMat !== '-' && <span className="text-[12px] font-bold text-gray-700 leading-snug break-words whitespace-normal max-w-full text-center mt-0.5">{halMat}</span>}
            {sList.length > 0 && sList.map((s, i) => {
              const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? s + ' ' + a : s;
              const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
              const sBadge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
              return (
                <div key={i} className="text-[11px] md:text-[12px] text-blue-800 bg-blue-50 px-2.5 py-2 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 font-bold leading-snug mt-0.5 w-fit max-w-full text-center">
                  <div className="flex items-center justify-center gap-1"><BookOpen size={14} className="text-blue-500 shrink-0 mt-0.5" /> <span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
                  {sBadge}
                </div>
              );
            })}
          </div>
        );
      }
      if (tahsin.includes('Jilid')) return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0 group relative">
          <div className="flex items-center justify-center gap-1 w-full max-w-full"><span className="text-[14px] font-bold text-gray-800 leading-none break-words text-center">{tahsin}</span></div>
          {halAyat !== '-' && <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100/70 break-words whitespace-normal max-w-full text-center">{String(halAyat)}</span>}
          {catBadge}
        </div>
      );
      const tList = tahsin.split(',').map(s => s.trim());
      const aList = String(halAyat || '').split(',').map(s => s.trim());
      const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s => s.trim()) : [];
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
          {tList.map((t, i) => {
            const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? t + ' ' + a : t;
            const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
            const sBadge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
            return (
              <div key={i} className="text-[11px] md:text-[12px] font-bold text-blue-800 bg-blue-50 px-2.5 py-2 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
                <div className="flex items-center justify-center gap-1 overflow-hidden"><BookOpen size={14} className="text-blue-500 shrink-0 mt-0.5" /><span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
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
      const nList = nilai && nilai !== '-' ? String(nilai).split(',').map(s => s.trim()) : [];
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
          {tList.map((t, i) => {
            const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? t + ' ' + a : t;
            const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
            const badge = n ? <div className="mt-1 inline-flex items-center justify-center bg-[#0f4c5c] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm w-max leading-none">{n}</div> : null;
            return (
              <div key={i} className="text-[11px] md:text-[12px] font-bold text-purple-800 bg-purple-50 px-2.5 py-2 rounded-lg border border-purple-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
                <div className="flex items-center justify-center gap-1 overflow-hidden"><Mic size={14} className="text-purple-500 shrink-0 mt-0.5" /> <span className="flex-1 min-w-0 break-words whitespace-normal">{combined}</span></div>
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
            <div key={i} className="text-[11px] md:text-[12px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-100 flex items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center">
              <div className="flex items-center justify-center gap-1 overflow-hidden"><Repeat size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span className="flex-1 min-w-0 break-words whitespace-normal">{item}</span></div>
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
    } catch (e) { return '-'; }
  };

  const getDayName = (dateObj) => {
    try { return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()]; } catch (e) { return ''; }
  };

  const getDateString = (dateObj) => {
    try { return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`; } catch (e) { return ''; }
  };

  // Kunci data dinamis berdasarkan tab yang aktif (Target vs Capaian)
  const k = homeTab === 'lesson_plan'
    ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' }
    : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

  // Kunci data untuk Kartu Laporan (Share) menggunakan Capaian (Jurnal)
  const k_share = { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

  const getDateStatus = (dateStr) => {
    if (filteredStudents.length === 0) return { status: 'none', count: 0 };
    const filledCount = filteredStudents.filter(s => {
      const r = s.records?.[dateStr];
      return r && (
        (r[k.t] && r[k.t] !== '-') || (r[k.f] && r[k.f] !== '-') ||
        (r[k.m] && r[k.m] !== '-') || (r[k.c] && r[k.c] !== '-')
      );
    }).length;

    if (filledCount === 0) return { status: 'none', count: 0 };
    const status = filledCount === filteredStudents.length ? 'full' : 'partial';
    return { status, count: filledCount };
  };

  // Helper untuk me-render tabel cetak (Tabel Keseluruhan/Kelas)
  const renderPrintTable = (datesToRender, pageNum, totalPages) => {
    const isThreeDays = datesToRender.length === 3;
    // Agar lebar kolom No, Nama, dan Hari tetap konsisten antara Hal 1 dan Hal 2,
    // kita kecilkan lebar total tabel pada Hal 2 (2 hari) menjadi ±73% dan dipusatkan.
    const tableWidth = isThreeDays ? '100%' : '73%';
    const wNo = isThreeDays ? '4%' : '5.48%'; // 4% dari total halaman
    const wNama = isThreeDays ? '15%' : '20.55%'; // 15% dari total halaman
    const wDay = isThreeDays ? '27%' : '36.98%'; // 27% dari total halaman

    return (
      <div id={`class-report-page-${pageNum}`} className="w-full min-h-screen p-10 flex flex-col justify-between bg-white text-black print-area" style={{ breakAfter: 'page', pageBreakAfter: pageNum < totalPages ? 'always' : 'auto' }}>
        <div>
          {/* MODERN HEADER CETAK (Gaya Screenshot) */}
          <div className="flex items-center justify-between mb-10 bg-[#f2fdf5] p-6 rounded-[2rem] border border-green-100">
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
              </h1>
              <p className="text-[#00e676] font-extrabold text-sm italic tracking-wide">SDIT Al-Fityan School Bogor</p>
            </div>
            <div className="w-24 h-24 flex items-center justify-center shrink-0">
              {institutionLogo && institutionLogo !== 'logo.png' ? (
                <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <BookOpen size={48} className="text-green-600" />
              )}
            </div>
          </div>

          {/* INFO BOX CETAK - MODERN STYLE */}
          <div className="grid grid-cols-4 gap-4 w-full mb-8 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100">
            <div className="flex-1 border-l-4 border-[#00e676] pl-3">
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
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Ustadz/ah</p>
              <p className="text-sm font-extrabold text-gray-800">{String(activeGuru || '-')}</p>
            </div>
          </div>

          {/* SUB-HEADER HALAMAN */}
          {pageNum > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic px-4 bg-white">Halaman {pageNum}: Lanjutan Kamis & Jumat</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
          )}

          {/* TABEL DATA CETAK */}
          <div className="w-full flex justify-center overflow-hidden">
            <table className="border-collapse table-fixed mx-auto w-full" style={{ width: tableWidth }}>
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-slate-200">
                  <th rowSpan={2} className="p-1.5 text-[9px] font-black text-gray-500 text-center uppercase align-middle bg-gray-50" style={{ width: wNo }}>No</th>
                  <th rowSpan={2} className="p-1.5 text-[9px] font-black text-gray-500 text-center uppercase align-middle bg-gray-50" style={{ width: wNama }}>Nama Siswa</th>
                  {datesToRender.map((dateObj, idx) => (
                    <th key={`head-day-${idx}`} colSpan={3} className="p-1.5 text-center bg-gray-50" style={{ width: wDay }}>
                      <div className="text-[10px] font-black text-green-700 uppercase tracking-widest">{getDayName(dateObj)}</div>
                      <div className="text-[8px] font-bold text-gray-400 mt-0.5">{dateObj && typeof dateObj.getDate === 'function' ? `${dateObj.getDate()} ${getBulanTahun(dateObj).split(' ')[0]} ${dateObj.getFullYear()}` : '-'}</div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b-2 border-slate-200">
                  {datesToRender.map((dateObj, idx) => (
                    <React.Fragment key={`head-sub-${idx}`}>
                      <th className="p-0.5 text-[8px] font-black text-emerald-600 text-center tracking-widest w-1/3">MUROJAAH</th>
                      <th className="p-0.5 text-[8px] font-black text-blue-600 text-center tracking-widest w-1/3">TAHSIN</th>
                      <th className="p-0.5 text-[8px] font-black text-purple-600 text-center tracking-widest w-1/3">TAHFIDZ</th>
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
                      <tr className="border-b border-slate-100">
                        <td rowSpan={2} className="p-1.5 text-center text-[10px] font-bold text-gray-600 align-top bg-white">{idx + 1}</td>
                        <td rowSpan={2} className="p-1.5 align-top bg-white">
                          <div className="flex items-center gap-2">
                            {student?.photo && student.photo !== '' ? (
                              <img src={student.photo} alt={student?.name} className="w-5 h-5 rounded-full object-cover border border-green-100 shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 text-green-700 flex items-center justify-center text-[8px] font-black shrink-0">{initials}</div>
                            )}
                            <div>
                              <div className="text-[10px] font-black text-gray-800 leading-tight">{String(student?.name || 'Unknown')}</div>
                              <div className="text-[7px] text-gray-400 font-bold uppercase mt-0.5">Kelas {String(student?.kelas || '-')}</div>
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
                              <td className="p-1.5 text-center text-[9px] font-bold text-emerald-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valM, '-', null, null)}
                              </td>
                              <td className="p-1.5 text-center text-[9px] font-bold text-blue-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valT, valH, valTNilai, valTSNilai)}
                              </td>
                              <td className="p-1.5 text-center text-[9px] font-bold text-purple-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {formatPrintData(valF, valAF, null, valFNilai)}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                      {/* Catatan Row */}
                      <tr className="border-b-2 border-slate-200 last:border-b-0">
                        {datesToRender.map((dateObj, dIdx) => {
                          const dateStr = getDateString(dateObj);
                          const rec = student?.records?.[dateStr] || {};
                          const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';

                          return (
                            <td key={dateStr + '-note'} colSpan={3} className="px-2 py-0.5 text-[7px] text-center bg-white h-auto align-middle">
                              {valC ? (
                                <span className="text-red-600 font-bold"><span className="text-orange-500 font-black">Catatan:</span> {valC}</span>
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
          @page { size: portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* Sembunyikan semua elemen di halaman secara default saat mencetak */
          body * {
            visibility: hidden;
          }
          /* Kemudian, tampilkan hanya elemen dengan kelas .printable-area dan semua turunannya */
          .printable-area, .printable-area * {
            visibility: visible;
          }
          ::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* ===== MODAL PREVIEW CETAK LAPORAN KELAS ===== */}
      {isClassReportVisible && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-start bg-slate-900/80 p-0 md:p-6 pb-32 md:pb-6 overflow-y-auto custom-scrollbar printable-area print:!static print:p-0 print:m-0 print:overflow-visible">
          {(() => {
            const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);
            const totalPages = workDays.length > 3 ? 2 : 1;
            return (
              <>
                {/* Tombol Aksi */}
                <div className="fixed bottom-6 right-6 md:bottom-auto md:top-6 md:right-6 flex flex-col-reverse md:flex-row gap-3 z-[100000] print:hidden" data-html2canvas-ignore="true">
                  <button onClick={() => handleDownloadClassReportImage('class-report-page-1', 1)} disabled={isDownloading} className="bg-emerald-500 text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-600 transition-colors disabled:opacity-50">
                    {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <ImageDown size={18} />}
                    <span className="inline">{isDownloading ? 'Memproses...' : 'Unduh Hal. 1'}</span>
                  </button>
                  {totalPages > 1 && (
                    <button onClick={() => handleDownloadClassReportImage('class-report-page-2', 2)} disabled={isDownloading} className="bg-emerald-500 text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-600 transition-colors disabled:opacity-50">
                      {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <ImageDown size={18} />}
                      <span className="inline">{isDownloading ? 'Memproses...' : 'Unduh Hal. 2'}</span>
                    </button>
                  )}
                  <button onClick={handleDownloadClassReportPdf} disabled={isDownloading} className="bg-white text-gray-800 px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                    {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <Download size={18} />}
                    <span className="inline">{isDownloading ? 'Memproses...' : 'Download PDF'}</span>
                  </button>
                  <button onClick={() => setIsClassReportVisible(false)} className="bg-red-500 text-white w-14 h-14 md:w-11 md:h-11 flex items-center justify-center rounded-full md:rounded-xl shadow-xl hover:bg-red-600 transition-colors self-end md:self-auto mb-2 md:mb-0">
                    <X size={24} className="md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Konten Laporan */}
                <div className="flex flex-col gap-8 items-center">
                  {/* Halaman 1 */}
                  <div className="w-full max-w-6xl transform scale-[0.9] md:scale-100 origin-top print:scale-100 print:shadow-none">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                      {workDays.length >= 1 && renderPrintTable(workDays.slice(0, 3), 1, totalPages)}
                    </div>
                  </div>
                  {/* Halaman 2 */}
                  {totalPages > 1 && (
                    <div className="w-full max-w-6xl transform scale-[0.9] md:scale-100 origin-top print:scale-100 print:shadow-none">
                      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {workDays.length > 3 && renderPrintTable(workDays.slice(3, 5), 2, totalPages)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ===== MODAL SHARE LAPORAN INDIVIDU ===== */}
      {shareStudent && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-start md:items-center bg-slate-900/80 p-0 md:p-6 pb-32 md:pb-6 overflow-y-auto custom-scrollbar printable-area print:!static print:p-0 print:m-0 print:overflow-visible">

          {/* Tombol Aksi Web (Floating Bottom on Mobile) */}
          <div className="fixed bottom-6 right-6 md:bottom-auto md:top-6 md:right-6 flex flex-col-reverse md:flex-row gap-3 z-[100000] print:hidden" data-html2canvas-ignore="true">
            <button onClick={handleCopyShareLink} className="bg-blue-600 text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-colors">
              <Link size={18} /> <span className="inline">Salin Link Orang Tua</span>
            </button>
            <button onClick={handleDownloadImage} disabled={isDownloading} className="bg-[#00e676] text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-green-600 transition-colors disabled:opacity-50">
              {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <Download size={18} />}
              <span className="inline">{isDownloading ? 'Memproses...' : 'Unduh (PNG)'}</span>
            </button>
            <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-white text-gray-800 px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
              {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <Download size={18} />}
              <span className="inline">{isDownloading ? 'Memproses...' : 'Download PDF'}</span>
            </button>
            <button onClick={() => setShareStudent(null)} className="bg-red-500 text-white w-14 h-14 md:w-11 md:h-11 flex items-center justify-center rounded-full md:rounded-xl shadow-xl hover:bg-red-600 transition-colors self-end md:self-auto mb-2 md:mb-0">
              <X size={24} className="md:w-5 md:h-5" />
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
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                {institutionLogo && institutionLogo !== 'logo.png' ? (
                  <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <BookOpen size={48} className="sm:w-16 sm:h-16 text-green-600" />
                )}
              </div>
            </div>

            {/* INFO SISWA */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-5 border-b border-gray-50">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-[#e6fbf0] border-4 border-[#00e676] text-[#00e676] flex items-center justify-center text-3xl font-black relative shrink-0">
                  {shareStudent?.photo ? (
                    <img src={shareStudent.photo} alt={shareStudent?.name || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{getInitials(shareStudent?.name)}</span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 text-[#00e676] shadow-sm">
                    <div className="w-5 h-5 bg-[#00e676] rounded-full flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">{String(shareStudent?.name || 'Siswa')}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#e6fbf0] text-green-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">Kelas {String(shareStudent?.kelas || '-')}</span>
                    <span className="bg-[#e6fbf0] text-green-800 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">Kelompok {String(activeHalaqoh || '-')}</span>
                  </div>
                </div>
              </div>

              {/* QR CODE UNTUK LINK DIGITAL */}
              <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 print:flex">
                <div className="w-16 h-16 bg-white p-1 border border-gray-100 rounded-lg shadow-sm">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?share=${shareStudent?.id}`)}`} alt="QR Code" className="w-full h-full" crossOrigin="anonymous" />
                </div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Scan Laporan Digital</p>
              </div>
            </div>

            {/* DAFTAR HARI / JURNAL SISWA */}
            <div className="p-6 sm:p-8 flex flex-col gap-5 bg-gray-50/50">
              {weekDates.map((dateObj) => {
                if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
                const dateStr = getDateString(dateObj);
                const dayName = getDayName(dateObj).toUpperCase();
                const displayDate = `${dateObj.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]} ${dateObj.getFullYear()}`;

                const rec = shareStudent?.records?.[dateStr] || {};
                const valM = formatPrintData(rec?.[k_share.m], '-', null, null);
                const valT = formatPrintData(rec?.[k_share.t], rec?.[k_share.h], rec?.[k_share.tNilai], rec?.[k_share.tsNilai]);
                const valF = formatPrintData(rec?.[k_share.f], rec?.[k_share.af], null, rec?.[k_share.fNilai]);
                const valC = rec?.[k_share.c] && rec?.[k_share.c] !== '-' ? String(rec[k_share.c]) : '-';

                return (
                  <div key={dateStr} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:break-inside-avoid">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                      <span className="bg-[#00e676] text-white px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-sm">{dayName}</span>
                      <span className="text-gray-400 font-bold italic text-sm">{displayDate}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      {/* Info TAHSIN */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-blue-500">
                          <BookOpen size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">Tahsin</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{valT}</div>
                      </div>

                      {/* Info TAHFIDZ */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-purple-500">
                          <Mic size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">Tahfidz</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{valF}</div>
                      </div>

                      {/* Info MUROJAAH */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-emerald-500">
                          <Repeat size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">Murojaah</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{valM}</div>
                      </div>

                      {/* Info CATATAN */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 text-orange-500">
                          <FileText size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">Catatan</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{valC}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FOOTER LAPORAN */}
            <div className="bg-[#111827] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Users size={14} className="text-gray-300" /></div>
                <span className="text-xs sm:text-sm font-medium text-gray-400">Ustadz/ah: <strong className="text-white block sm:inline">{String(activeGuru || '-')}</strong></span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-8 h-8 rounded-full bg-[#00e676]/20 flex items-center justify-center shrink-0"><Calendar size={14} className="text-[#00e676]" /></div>
                <span className="text-xs sm:text-sm font-medium text-gray-400">Periode: <strong className="text-white block sm:inline">{formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</strong></span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAMPILAN APLIKASI WEB NORMAL (APP-SHELL LAYOUT)
          (Terbagi 3 blok kaku: Header Fix, Content Scroll, Footer Fix) 
      ========================================================================= */}
      <div className="print:hidden w-full h-full flex flex-col transition-colors duration-500 bg-slate-50 text-slate-900 overflow-hidden">

        {/* BLOK 1: HEADER HALAMAN (SHRINK-0 = SELALU TERKUNCI DI ATAS, TIDAK IKUT SCROLL) */}
        {isHeaderVisible && (
          <div className="bg-white border-gray-200 shrink-0 z-40 border-b px-4 sm:px-6 md:px-8 py-2 sm:py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4 transition-all animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="w-full md:w-auto flex items-center gap-1.5 sm:gap-3">
              <div className="hidden sm:flex w-16 md:w-20 h-16 md:h-20 items-center justify-center shrink-0">
                {institutionLogo && institutionLogo !== 'logo.png' && institutionLogo !== '' ? (
                  <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <BookOpen size={80} className="text-green-600" />
                )}
              </div>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold mb-0.5 sm:mb-1 text-slate-700">
                  {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
                </h1>
                <div className="flex flex-wrap sm:flex-row sm:items-center gap-x-3 gap-y-1 text-gray-500 font-medium text-[9px] sm:text-xs mt-0.5 sm:mt-1">
                  <span className="flex items-center gap-1.5">
                    Halaqoh: <strong className="text-green-700 bg-green-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-green-100">{String(activeHalaqoh || '-')}</strong>
                  </span>
                  <span className="hidden md:inline text-gray-300">•</span>
                  <span className="flex items-center gap-1.5">
                    Ustadz/ah: <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-blue-100 transition-colors">{String(activeGuru || '-')}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full md:w-auto gap-2 shrink-0 mt-1 sm:mt-0 transition-all">
              <button onClick={() => handleOpenModal(null, 'full_bulk', homeTab)} disabled={!activeHalaqoh} className="flex-1 md:flex-none border-2 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all bg-white text-slate-700 border-slate-200 hover:bg-gray-50 disabled:opacity-50">
                <Edit3 size={16} className="text-[#00e676]" /> <span className="inline">Input Massal</span>
              </button>
              <button onClick={() => setIsClassReportVisible(true)} disabled={!activeHalaqoh || filteredStudents.length === 0} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-lg border-2 bg-gray-800 text-white border-gray-900 hover:bg-gray-700 disabled:opacity-50">
                <Printer size={18} /> <span className="inline">Laporan Kelas</span>
              </button>
            </div>
          </div>
        )}

        {/* BLOK 2: KONTEN UTAMA - AREA SCROLL */}
        <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar bg-slate-50 p-3 sm:p-4 md:p-6 transition-colors duration-500" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex flex-col gap-3 sm:gap-4 w-full mx-auto pb-32 md:pb-8">

            {/* TOMBOL TAB & NAVIGASI */}
            <div className="flex flex-row rounded-xl sm:rounded-2xl p-1 gap-1 shadow-inner transition-colors bg-slate-100/80">
              <button onClick={() => setHomeTab('lesson_plan')} className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 min-w-fit ${homeTab === 'lesson_plan' ? 'bg-green-500 text-white shadow-md border border-green-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                {homeTab === 'lesson_plan' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>}
                <span className="sm:hidden">Lesson Plan</span>
                <span className="hidden sm:inline">Target (Lesson Plan)</span>
              </button>
              <button onClick={() => setHomeTab('jurnal')} className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 min-w-fit ${homeTab === 'jurnal' ? 'bg-blue-500 text-white shadow-md border border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                {homeTab === 'jurnal' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>}
                <span className="sm:hidden">Jurnal</span>
                <span className="hidden sm:inline">Capaian (Jurnal)</span>
              </button>
              <button 
                onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                className="flex items-center justify-center px-2 py-1.5 sm:py-2 bg-white text-slate-500 hover:text-emerald-600 rounded-lg sm:rounded-xl shadow-sm border border-gray-200/50 transition-all"
                title={isHeaderVisible ? "Sembunyikan Header Atas" : "Tampilkan Header Atas"}
              >
                {isHeaderVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>

            {/* NAVIGASI TANGGAL & MINGGU */}
            <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border shadow-sm w-full gap-2 transition-all duration-500 bg-white border-gray-200/80">
              <button onClick={() => changeWeek(-7)} className="p-1.5 sm:px-3 sm:py-1.5 rounded-md flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600"><ChevronLeft size={16} /><span className="hidden sm:inline">Sebelumnya</span></button>
              <div className="font-black text-xs sm:text-sm md:text-base text-center flex-1 sm:flex-none text-gray-700 transition-colors"><Calendar size={14} className="inline text-green-500 mr-1 sm:mr-2 align-text-bottom" /> {formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</div>
              <button onClick={() => changeWeek(7)} className="p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-md flex items-center gap-1 font-bold text-xs sm:text-sm transition-colors"><span className="hidden sm:inline">Selanjutnya</span><ChevronRight size={16} /></button>
            </div>

            {/* HORIZONTAL DATE NAV (SNAP SCROLLING) */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 w-full snap-x">
              {weekDates.map((dateObj) => {
                if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
                const { status: dateStatus, count: filledCount } = getDateStatus(dateStr);
                return ( // Removed dark mode styles
                  <button key={dateStr} onClick={() => setActiveDate(dateStr)} className={`flex-1 flex flex-col shrink-0 min-w-[70px] sm:min-w-[80px] items-center justify-center p-2 rounded-xl border transition-all snap-center relative ${activeDate === dateStr ? 'bg-[#00e676] border-[#00e676] text-white shadow-md transform scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">{dayName}</span>
                    <span className="text-xs md:text-base font-black">{dateObj.getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]}</span>
                    {dateStatus !== 'none' && (
                      <div
                        data-tooltip-id="home-date-tooltip"
                        data-tooltip-content={`${filledCount} dari ${filteredStudents.length} siswa terisi`}
                        className={`absolute top-1.5 right-1.5 ${activeDate === dateStr ? 'text-white' : dateStatus === 'full' ? 'text-green-500' : 'text-amber-500'}`}
                      >
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* KOTAK PENCARIAN SISWA */}
            {!isSearchVisible && !searchQuery ? (
              <div className="flex justify-end -mt-2 sm:-mt-1 mb-1 z-10">
                <button
                  onClick={() => setIsSearchVisible(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/80 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm text-[10px] sm:text-xs font-bold"
                  title="Pencarian Siswa"
                >
                  <Search size={14} /> Cari Siswa
                </button>
              </div>
            ) : (
              <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={18}
                />
                <input
                  autoFocus
                  type="text"
                  placeholder={activeHalaqoh ? `Cari nama siswa... (${studentsInHalaqohCount} siswa)` : 'Pilih halaqoh terlebih dahulu'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!activeHalaqoh}
                  className="w-full bg-white border border-gray-200/80 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-bold text-slate-700 transition-all shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* LOGIKA PENCARIAN DATA HARI SEBELUMNYA UNTUK DISPLAY BAYANGAN */}
            {(() => {
              window._lastDayData = {};
              const activeDateObj = new Date(activeDate);

              filteredStudents.forEach(s => {
                // Get all recorded dates for the student and sort them descending
                const recordedDates = Object.keys(s.records || {})
                  .map(d => new Date(d))
                  .filter(d => d < activeDateObj) // Only dates before the active date
                  .sort((a, b) => b - a); // Sort descending, most recent first

                // Find the first date that has data
                for (const d of recordedDates) {
                  const dStr = getDateString(d);
                  const rec = s.records[dStr];
                  if (rec && (rec[k.t] !== '-' || rec[k.f] !== '-' || rec[k.m] !== '-')) {
                    window._lastDayData[s.id] = { ...rec, date: dStr }; // Found the most recent record
                    break; // Move to the next student
                  }
                }
              });
            })()}

            {/* FRAME RIWAYAT DATA TERAKHIR (MUNCUL SAAT SISWA DIPILIH) */}
            {activeStudentId && window._lastDayData?.[activeStudentId] && (
              <div className="border-2 rounded-2xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300 transition-colors bg-white border-[#00e676]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#00e676]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Terakhir ({formatShortDate(new Date(window._lastDayData[activeStudentId].date))}):</span>
                    <span className="text-xs font-black text-slate-700">{filteredStudents.find(s => s.id === activeStudentId)?.name}</span>
                  </div>
                  <button onClick={() => setActiveStudentId(null)} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Tahsin', val: window._lastDayData[activeStudentId][k.t], color: 'blue' },
                    { label: 'Tahfidz', val: window._lastDayData[activeStudentId][k.f], color: 'purple' },
                    { label: 'Murojaah', val: window._lastDayData[activeStudentId][k.m], color: 'emerald' },
                    { label: 'Catatan', val: window._lastDayData[activeStudentId][k.c], color: 'orange' }
                  ].map((item, i) => ( // Fix potential missing colors in tailwind by using full classes or safe list
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
              <div className="hidden text-xs font-bold text-blue-500 flex items-center gap-1.5 px-1 -mt-2">
                <ChevronRight size={14} className="animate-pulse" />
                Geser tabel ke kiri untuk melihat detail
              </div>
            )}

            {/* TABEL DATA WEB (TIDAK LAGI FIXED HEIGHT, SEKARANG MEMANJANG BEBAS) */}
            <div key={homeTab} className="rounded-2xl shadow-sm border overflow-visible relative flex-1 flex flex-col animate-tab-content transition-colors bg-white border-gray-200 shadow-slate-200/50">
              {isLoading && (
                <div className="absolute top-0 left-0 w-full h-1 overflow-hidden z-50 rounded-t-2xl bg-slate-50 transition-colors">
                  <div className="h-full bg-green-500 animate-loading-bar rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                </div>
              )}

              {!activeHalaqoh ? (
                <div className="text-center py-24 flex flex-col items-center justify-center gap-3 text-gray-400 font-bold"><Settings size={36} className="text-gray-300" /><p>Silakan pilih kelompok halaqoh di atas.</p></div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center justify-center gap-3 text-gray-400 font-bold">
                  <Users size={36} className="text-gray-300" />
                  <p>
                    {searchQuery ? `Siswa dengan nama "${searchQuery}" tidak ditemukan.` : 'Belum ada siswa di halaqoh ini.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className={`hidden md:block overflow-x-auto custom-scrollbar flex-1 relative transition-all duration-500 ${isLoading ? 'blur-[1.5px] opacity-60 pointer-events-none' : ''}`}>
                    <table className="w-full text-center border-collapse min-w-[1000px] bg-white transition-colors">
                      {/* HEADER TABEL (STICKY DI BAWAH HEADER APLIKASI) */}
                      <thead className="sticky top-[-1px] z-30 shadow-sm transition-colors bg-[#f8fafc]">
                        <tr className="border-b border-gray-200 text-[11px] font-black text-gray-400 uppercase tracking-widest transition-colors">
                          <th className="p-2.5 sm:p-3 text-center sticky left-0 top-0 z-40 w-[40px] sm:w-[50px] bg-[#f8fafc]">No</th>
                          <th className="p-2.5 sm:p-3 pl-2 text-left sticky left-[40px] sm:left-[50px] top-0 z-40 w-[140px] sm:w-[220px] shadow-[4px_0_12px_rgba(0,0,0,0.05)] border-r bg-[#f8fafc] border-gray-100">Nama Siswa</th>
                          <th className="p-2.5 sm:p-3 w-[200px] sticky top-0 z-30 transition-colors bg-[#f8fafc]">
                            <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleOpenModal(null, 'tahsin', homeTab)}>
                              Tahsin
                            </div>
                          </th>
                          <th className="p-2.5 sm:p-3 w-[200px] sticky top-0 z-30 transition-colors bg-[#f8fafc]">
                            <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-purple-600 transition-colors" onClick={() => handleOpenModal(null, 'tahfidz', homeTab)}>
                              Tahfidz
                            </div>
                          </th>
                          <th className="p-2.5 sm:p-3 w-[200px] sticky top-0 z-30 transition-colors bg-[#f8fafc]">
                            <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => handleOpenModal(null, 'murojaah', homeTab)}>
                              Murojaah
                            </div>
                          </th>
                          <th className="p-2.5 sm:p-3 w-[200px] sticky top-0 z-30 transition-colors bg-[#f8fafc]">
                            <div className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => handleOpenModal(null, 'catatan', homeTab)}>
                              Catatan
                            </div>
                          </th>
                          <th className="p-2.5 sm:p-3 w-[90px] sm:w-[120px] sticky right-0 top-0 z-40 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l transition-colors bg-[#f8fafc] border-gray-100">
                            <div className="flex items-center justify-center gap-1.5"><Settings size={12} /> Aksi</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 transition-colors">
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
                          const lastRec = window._lastDayData?.[student.id];
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
                              className={`relative transition-all duration-300 group ${!isLoading ? 'animate-row-slide-in' : ''} hover:bg-white hover:shadow-xl hover:z-20`}
                              style={!isLoading ? { animationDelay: `${index * 0.05}s` } : {}}
                            >
                              <td className="text-center text-xs font-bold text-slate-400 p-2 sticky left-0 z-20 bg-white group-hover:bg-[#f4f7fa] transition-colors">{index + 1}</td>
                              <td onClick={() => setActiveStudentId(student.id)} className="p-2.5 sm:p-3 pl-2 text-left sticky left-[40px] sm:left-[50px] z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-all border-r cursor-pointer border-l-4 border-transparent group-hover:border-l-green-500 bg-white border-gray-50 group-hover:bg-[#f4f7fa]">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {student?.photo ? (
                                    <img src={student.photo} alt={student?.name || ''} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 shrink-0 shadow-sm" />
                                  ) : (
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[9px] sm:text-[11px] font-black shrink-0 border transition-colors bg-blue-50 text-blue-700 border-blue-100">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className={`font-extrabold text-gray-800 group-hover:text-slate-950 transition-colors ${(student?.name || '').length > 24 ? 'text-[10px] sm:text-[11px] leading-tight break-words whitespace-normal line-clamp-2' : (student?.name || '').length > 18 ? 'text-[11px] sm:text-xs leading-tight break-words whitespace-normal line-clamp-2' : 'text-[13px] sm:text-sm truncate'}`}>{String(student?.name || 'Unknown')}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase group-hover:text-slate-600 transition-colors">Kelas {String(student?.kelas || '-')}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahsin', homeTab); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                  {!isTahsinEmpty ? (
                                    renderTahsinCard(valT, valH, student?.id, activeDate, valTNilai, valTSNilai)
                                  ) : hasGhostTahsin ? (
                                    <div className="grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-60 opacity-25" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>
                                      <div className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-0.5">Hari Sebelumnya</div>
                                      {renderTahsinCard(lastRec[k.t], lastRec[k.h], student?.id, 'ghost', lastRec[k.tNilai], lastRec[k.tsNilai])}
                                    </div>
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {!isTahsinEmpty ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'tahsin_all', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-blue-500 bg-blue-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahfidz', homeTab); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                  {!isTahfidzEmpty ? (
                                    renderTahfidzCard(valF, valAF, student?.id, activeDate, valFNilai)
                                  ) : hasGhostTahfidz ? (
                                    <div className="grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-60 opacity-25" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>
                                      <div className="text-[9px] font-black text-purple-400 uppercase tracking-tighter mb-0.5">Hari Sebelumnya</div>
                                      {renderTahfidzCard(lastRec[k.f], lastRec[k.af], student?.id, 'ghost', lastRec[k.fNilai])}
                                    </div>
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {!isTahfidzEmpty ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'tahfidz_all', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-purple-500 bg-purple-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'murojaah', homeTab); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                  {!isMurojaahEmpty ? (
                                    renderMurojaahCard(valM, student?.id, activeDate)
                                  ) : hasGhostMurojaah ? (
                                    <div className="grayscale scale-90 origin-center transition-opacity group-hover/cell:opacity-60 opacity-25" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>
                                      <div className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter mb-0.5">Hari Sebelumnya</div>
                                      {renderMurojaahCard(lastRec[k.m], student?.id, 'ghost')}
                                    </div>
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {!isMurojaahEmpty ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'murojaah_all', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-emerald-500 bg-emerald-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'catatan', homeTab); }} className="min-h-[60px] flex flex-col items-center justify-center border border-transparent hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50">
                                  {!isCatatanEmpty ? (
                                    <span className={`text-xs text-center ${getStatusColor(valC)}`}>{String(valC)}</span>
                                  ) : hasGhostCatatan ? (
                                    <div className="grayscale italic scale-90 origin-center opacity-30" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>
                                      <span className="text-[10px] text-gray-400">{String(lastRec[k.c])}</span>
                                    </div>
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {valC !== '-' ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'catatan', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-orange-500 bg-orange-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className="p-2.5 sm:p-3 sticky right-0 z-10 transition-all border-l shadow-[-10px_0_15px_rgba(0,0,0,0.02)] bg-white border-gray-200 group-hover:bg-gray-50">
                                <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                  <button
                                    onClick={() => handleOpenModal(student, 'full_edit', homeTab)}
                                    className="group/btn p-1.5 sm:p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl sm:rounded-2xl transition-all"
                                    title="Edit Data"
                                  >
                                    <Edit3 size={18} />
                                  </button>
                                  <button
                                    onClick={() => setShareStudent(student)}
                                    className="group/btn p-1.5 sm:p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-2xl transition-all"
                                    title="Bagikan Laporan"
                                  >
                                    <Share2 size={18} />
                                  </button>
                                  <div className="w-px h-4 bg-gray-100 mx-0.5" />
                                  <button
                                    onClick={(e) => requestClearRecord(e, student?.id, activeDate, homeTab)}
                                    className="group/btn p-1.5 sm:p-2.5 text-slate-400 group-hover:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all"
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

                  {/* TAMPILAN MOBILE (CARD VIEW) - SOLUSI UNTUK DATA TIDAK TERLIHAT DI HP */}
                  <div className={`md:hidden flex flex-col divide-y divide-gray-100 transition-all duration-500 ${isLoading ? 'blur-[1.5px] opacity-60' : ''}`}>
                    {filteredStudents.slice(0, visibleCount).map((student, index) => {
                      const record = student?.records?.[activeDate] || {};
                      const valT = record?.[k.t] || '-';
                      const valH = record?.[k.h] || '-';
                      const valTNilai = record?.[k.tNilai] || '-';
                      const valTSNilai = record?.[k.tsNilai] || '-';
                      const valF = record?.[k.f] || '-';
                      const valAF = record?.[k.af] || '-';
                      const valFNilai = record?.[k.fNilai] || '-';
                      const valM = record?.[k.m] || '-';
                      const valC = record?.[k.c] || '-';

                      const lastRec = window._lastDayData?.[student.id];
                      const isTahsinEmpty = valT === '-' && valH === '-' && valTNilai === '-';
                      const isTahfidzEmpty = valF === '-' && valAF === '-' && valFNilai === '-';
                      const isMurojaahEmpty = valM === '-';
                      const isCatatanEmpty = valC === '-';

                      return (
                        <div key={student.id} className="p-4 bg-white flex flex-col gap-4 animate-row-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                          {/* Info Siswa & Aksi Cepat */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                              {student?.photo ? (
                                <img src={student.photo} className="w-10 h-10 rounded-full object-cover border" alt="" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs border border-blue-100">{getInitials(student?.name)}</div>
                              )}
                              <div>
                                <h4 className={`font-extrabold text-gray-800 leading-tight ${student.name.length > 24 ? 'text-[11px]' : student.name.length > 18 ? 'text-[13px]' : 'text-sm md:text-base'}`}>{student.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Kelas {student.kelas}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleOpenModal(student, 'full_edit', homeTab)} className="p-2 text-slate-400 bg-slate-50 rounded-xl" title="Edit"><Edit3 size={18} /></button>
                              <button onClick={() => setShareStudent(student)} className="p-2 text-slate-400 bg-slate-50 rounded-xl" title="Share"><Share2 size={18} /></button>
                              <button onClick={(e) => requestClearRecord(e, student?.id, activeDate, homeTab)} className="p-2 text-slate-400 bg-slate-50 rounded-xl"><Trash2 size={18} /></button>
                            </div>
                          </div>

                          {/* Grid Data - Menampilkan data secara vertikal agar terbaca di HP */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Tahsin */}
                            <div onClick={() => handleOpenModal(student, 'tahsin', homeTab)} className="p-3 bg-blue-50/30 border border-blue-100 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center active:scale-95 transition-all relative">
                              <div className="flex items-center gap-1 mb-1.5 text-blue-500 font-black uppercase text-[8px] tracking-widest"><BookOpen size={12} /> Tahsin</div>
                              {!isTahsinEmpty ? renderTahsinCard(valT, valH, student.id, activeDate, valTNilai, valTSNilai) : (lastRec && lastRec[k.t] !== '-' ? <div className="opacity-30 grayscale scale-90" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>{renderTahsinCard(lastRec[k.t], lastRec[k.h], student.id, 'ghost', lastRec[k.tNilai], lastRec[k.tsNilai])}</div> : <span className="text-gray-300">-</span>)
                              }
                              {!isTahsinEmpty && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'tahsin_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Tahfidz */}
                            <div onClick={() => handleOpenModal(student, 'tahfidz', homeTab)} className="p-3 bg-purple-50/30 border border-purple-100 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center active:scale-95 transition-all relative">
                              <div className="flex items-center gap-1 mb-1.5 text-purple-500 font-black uppercase text-[8px] tracking-widest"><Mic size={12} /> Tahfidz</div>
                              {!isTahfidzEmpty ? renderTahfidzCard(valF, valAF, student.id, activeDate, valFNilai) : (lastRec && lastRec[k.f] !== '-' ? <div className="opacity-30 grayscale scale-90" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>{renderTahfidzCard(lastRec[k.f], lastRec[k.af], student.id, 'ghost', lastRec[k.fNilai])}</div> : <span className="text-gray-300">-</span>)
                              }
                              {!isTahfidzEmpty && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'tahfidz_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Murojaah */}
                            <div onClick={() => handleOpenModal(student, 'murojaah', homeTab)} className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center active:scale-95 transition-all relative">
                              <div className="flex items-center gap-1 mb-1.5 text-emerald-500 font-black uppercase text-[8px] tracking-widest"><Repeat size={12} /> Murojaah</div>
                              {!isMurojaahEmpty ? renderMurojaahCard(valM, student.id, activeDate) : (lastRec && lastRec[k.m] !== '-' ? <div className="opacity-30 grayscale scale-90" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>{renderMurojaahCard(lastRec[k.m], student.id, 'ghost')}</div> : <span className="text-gray-300">-</span>)
                              }
                              {!isMurojaahEmpty && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'murojaah_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Catatan */}
                            <div onClick={() => handleOpenModal(student, 'catatan', homeTab)} className="p-3 bg-orange-50/30 border border-orange-100 rounded-2xl flex flex-col items-center justify-center min-h-[90px] text-center active:scale-95 transition-all relative">
                              <div className="flex items-center gap-1 mb-1.5 text-orange-500 font-black uppercase text-[8px] tracking-widest"><FileText size={12} /> Catatan</div>
                              {!isCatatanEmpty ? (<span className={`text-[10px] leading-tight ${getStatusColor(valC)}`}>{String(valC)}</span>) : (lastRec && lastRec[k.c] !== '-' ? <span className="text-[10px] text-gray-300 italic line-clamp-2" title={`Dari tgl ${formatShortDate(new Date(lastRec.date))}`}>{String(lastRec[k.c])}</span> : <span className="text-gray-300">-</span>)}

                              {!isCatatanEmpty && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'catatan', homeTab); }}
                                  className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* SKELETON LOADING (MUNCUL SAAT KLIK MUAT LEBIH BANYAK) */}
                    {isMoreLoading && (
                      <div className="flex flex-col divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 bg-white flex flex-col gap-4 animate-pulse">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="flex flex-col gap-2">
                                  <div className="h-3 w-32 bg-slate-100 rounded-md" />
                                  <div className="h-2 w-16 bg-slate-50 rounded-md" />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-[90px] bg-slate-50/50 rounded-2xl border border-slate-100" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tombol Load More */}
                    {visibleCount < filteredStudents.length && (
                      <div className="p-6 bg-white flex justify-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={isMoreLoading}
                          className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                        >
                          {isMoreLoading ? 'Menyiapkan Data...' : `Muat ${filteredStudents.length - visibleCount} Siswa Lainnya`}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 z-40 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 text-center transition-colors">
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
            &copy; {new Date().getFullYear()} <strong className="text-gray-700">Juman Jayyidin</strong>. All rights reserved.
          </p>
        </footer>

        <Tooltip
          id="home-date-tooltip"
          place="top"
          className="!bg-slate-900 !text-white !rounded-xl !px-3 !py-2 !text-[10px] !font-bold !opacity-100 !shadow-2xl z-[100]"
        />
      </div>
    </>
  );
};

export default HomeView;