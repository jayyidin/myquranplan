import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, Users, Edit3, Trash2, Share2, Plus, X, Calendar, ChevronLeft, ChevronRight, BookOpen, Mic, Repeat, Printer, Check, Download, FileText, History, Link, Search, ImageDown, ChevronUp, ChevronDown, ArrowUp, Star, ChevronsUpDown, CheckCircle2 } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { formatShortDate, getInitials, formatPeriode, formatPrintData, copyTextToClipboard } from '../../utils/helpers';

const renderTextWithHighlights = (txt) => {
  if (typeof txt !== 'string') return txt;

  const regex = /(Sangat Baik|\(A\)|\(B\+\)|\(B\)|Nilai:\s*A|Nilai:\s*B\+|Nilai:\s*B)/g;
  const parts = txt.split(regex);

  return parts.map((part, index) => {
    if (part === 'Sangat Baik') {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 px-1.5 py-px rounded-[4px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest mx-0.5 border border-amber-200 shadow-sm align-baseline">
          <Star size={10} className="fill-amber-500 text-amber-500" /> Sangat Baik
        </span>
      );
    } else if (part === '(A)') {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-amber-400 text-amber-900 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-amber-200 align-baseline leading-none">
          <Star size={10} className="fill-amber-900" /> A
        </span>
      );
    } else if (part === '(B+)') {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-slate-200 text-slate-700 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-slate-300 border border-slate-300 align-baseline leading-none">
          <Star size={10} className="fill-slate-500 text-slate-500" /> B+
        </span>
      );
    } else if (part === '(B)') {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-800 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-orange-200 border border-orange-300 align-baseline leading-none">
          <Star size={10} className="fill-orange-600 text-orange-600" /> B
        </span>
      );
    } else if (part.match(/^Nilai:\s*A$/)) {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-amber-400 text-amber-900 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-amber-200 align-baseline leading-none">
          <Star size={10} className="fill-amber-900" /> Nilai A
        </span>
      );
    } else if (part.match(/^Nilai:\s*B\+$/)) {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-slate-200 text-slate-700 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-slate-300 border border-slate-300 align-baseline leading-none">
          <Star size={10} className="fill-slate-500 text-slate-500" /> Nilai B+
        </span>
      );
    } else if (part.match(/^Nilai:\s*B$/)) {
      return (
        <span key={index} className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-800 px-1.5 py-px rounded-full text-[10px] sm:text-[11px] font-black mx-0.5 shadow-sm shadow-orange-200 border border-orange-300 align-baseline leading-none">
          <Star size={10} className="fill-orange-600 text-orange-600" /> Nilai B
        </span>
      );
    }
    return part;
  });
};

const ExpandableText = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text || text === '-') return <div className="text-xs sm:text-sm font-bold text-gray-800">-</div>;

  // Perbaikan TypeError: Pastikan text diolah sebagai string sebelum membaca properti length
  const safeText = String(text);
  const isLong = safeText.length > 50 || safeText.split('\n').length > 2;
  const textSizeClass = safeText.length > 40 ? 'text-[10px] sm:text-xs leading-snug' : safeText.length > 25 ? 'text-[11px] sm:text-[13px] leading-snug' : 'text-xs sm:text-sm leading-relaxed';

  return (
    <div className="flex flex-col items-start w-full">
      <div className={`${textSizeClass} font-bold text-gray-800 whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2 print:line-clamp-none' : ''}`}>
        {renderTextWithHighlights(safeText)}
      </div>
      {isLong && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-[9px] sm:text-[10px] font-black text-emerald-500 hover:text-emerald-600 mt-1 active:scale-95 transition-all bg-emerald-50 px-2 py-0.5 rounded-md print:hidden"
          data-html2canvas-ignore="true"
        >
          {isExpanded ? 'Sembunyikan' : 'Lihat Selengkapnya'}
        </button>
      )}
    </div>
  );
};

const jurnalKeys = {
  t: 'jurnalTahsin',
  h: 'jurnalHalAyatTahsin',
  tNilai: 'jurnalTahsinNilai',
  tsNilai: 'jurnalTahsinSuratNilai',
  f: 'jurnalTahfidz',
  af: 'jurnalAyatTahfidz',
  fNilai: 'jurnalTahfidzNilai',
  m: 'jurnalMurojaah',
  c: 'jurnalCatatan',
  cT: 'jurnalCatatanTahsin',
  cF: 'jurnalCatatanTahfidz'
};

const renderCatatanDetail = (valC, valCT, valCF) => {
  const hasC = valC && valC !== '-';
  const hasCT = valCT && valCT !== '-';
  const hasCF = valCF && valCF !== '-';

  if (!hasC && !hasCT && !hasCF) return <ExpandableText text="-" />;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {hasCT && <div><span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-0.5">Tahsin:</span><ExpandableText text={valCT} /></div>}
      {hasCF && <div><span className="text-[9px] font-black text-purple-500 uppercase tracking-widest block mb-0.5">Tahfidz:</span><ExpandableText text={valCF} /></div>}
      {hasC && <div><span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">Umum:</span><ExpandableText text={valC} /></div>}
    </div>
  );
}

const hasAnyCatatan = (valC, valCT, valCF) => (
  (valC && valC !== '-') || (valCT && valCT !== '-') || (valCF && valCF !== '-')
);

const renderCompactCatatan = (valC, valCT, valCF, getStatusColor) => (
  <div className="flex flex-col gap-1 w-full px-2 py-1.5">
    {valCT && valCT !== '-' && (
      <div className="text-[10px] leading-tight text-left">
        <span className="text-blue-500 font-black">Tahsin:</span>{' '}
        <span className="font-bold text-gray-700">{renderTextWithHighlights(String(valCT))}</span>
      </div>
    )}
    {valCF && valCF !== '-' && (
      <div className="text-[10px] leading-tight text-left">
        <span className="text-purple-500 font-black">Tahfidz:</span>{' '}
        <span className="font-bold text-gray-700">{renderTextWithHighlights(String(valCF))}</span>
      </div>
    )}
    {valC && valC !== '-' && (
      <div className={`text-[10px] leading-tight text-center ${getStatusColor(valC)}`}>
        {renderTextWithHighlights(String(valC))}
      </div>
    )}
  </div>
);

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim();
  return normalized !== '' && normalized !== '-';
};

const getGhostDateLabel = (record, group) => {
  const date = record?.__dates?.[group] || record?.date;
  return date ? formatShortDate(new Date(date)) : '-';
};

const HomeView = ({
  activeHalaqoh, activeGuru, homeTab, setHomeTab, weekStart, changeWeek,
  activeDate, setActiveDate, weekDates, filteredStudents, handleOpenModal,
  requestClearRecord, requestClearAllRecordForDay, handleAutoFillFromGhost, setSharingStudent, handleRemoveData, getStatusColor,
  institutionLogo,
  isLoading,
  searchQuery,
  setSearchQuery,
  studentsInHalaqohCount,
  studentsInHalaqoh,
  targetReguler,
  targetAlQuran,
  showToast
}) => {
  // State untuk fitur Share Laporan Individu
  const [shareStudent, setShareStudent] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [isClassReportVisible, setIsClassReportVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(window.innerWidth >= 768);

  // State untuk Lazy Loading di Mobile
  const [visibleCount, setVisibleCount] = useState(10);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);
  const dateNavRef = useRef(null);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [currentNavStudent, setCurrentNavStudent] = useState(null);
  const [copySuccessModal, setCopySuccessModal] = useState({ isOpen: false, title: '', message: '', link: '' });

  // Auto-scroll Date Nav agar tanggal yang aktif selalu di tengah layar
  useEffect(() => {
    if (dateNavRef.current) {
      const activeBtn = dateNavRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        setTimeout(() => { 
          // Gulir khusus kontainer tanggal secara horizontal, tanpa mereset posisi scroll vertikal layar
          const container = dateNavRef.current;
          const scrollLeft = activeBtn.offsetLeft - (container.offsetWidth / 2) + (activeBtn.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [activeDate, weekDates]);

  // --- DEBOUNCE PENCARIAN (MENGURANGI LAG DI HP) ---
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300); // Jeda 300ms sebelum filter dijalankan
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);
  useEffect(() => {
    if (searchQuery === '') setLocalSearch('');
  }, [searchQuery]);

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tracker Siswa yang Aktif di Layar (Untuk Fitur Toggle Scroll Navigasi)
  useEffect(() => {
    if (!isNavMenuOpen) return;

    const handleCheckVisibleStudent = () => {
      const studentElements = filteredStudents.map(s => document.getElementById(`student-card-${s.id}`) || document.getElementById(`student-row-${s.id}`)).filter(Boolean);
      if (studentElements.length === 0) return;

      const viewportCenter = window.innerHeight / 2;
      let closestIdx = -1;
      let minDistance = Infinity;

      studentElements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      if (closestIdx >= 0) {
        setCurrentNavStudent({ ...filteredStudents[closestIdx], index: closestIdx });
      }
    };

    handleCheckVisibleStudent();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleCheckVisibleStudent, { passive: true });
      return () => container.removeEventListener('scroll', handleCheckVisibleStudent);
    }
  }, [isNavMenuOpen, filteredStudents]);

  const handleScrollToNextStudent = (direction) => {
    if (!currentNavStudent) return;
    let targetIdx = currentNavStudent.index + direction;
    if (targetIdx < 0) targetIdx = 0;
    if (targetIdx >= filteredStudents.length) targetIdx = filteredStudents.length - 1;

    let delay = 50;
    if (targetIdx >= visibleCount - 2 && visibleCount < filteredStudents.length) {
      setVisibleCount(prev => prev + 10);
      delay = 150; // Beri waktu pada perangkat HP merender baris baru
    }

    setTimeout(() => {
      const targetEl = document.getElementById(`student-card-${filteredStudents[targetIdx].id}`) || document.getElementById(`student-row-${filteredStudents[targetIdx].id}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('ring-4', 'ring-blue-400/50', 'ring-offset-2', 'z-50', 'transition-all', 'duration-500');
        setTimeout(() => targetEl.classList.remove('ring-4', 'ring-blue-400/50', 'ring-offset-2', 'z-50'), 1000);
      }
    }, delay);
  };

  // Reset jumlah yang terlihat saat berganti halaqoh, pencarian, atau tab (jangan reset saat ganti tanggal agar tidak terlempar ke atas)
  useEffect(() => {
    setVisibleCount(10);
    setIsMoreLoading(false);
  }, [activeHalaqoh, searchQuery, homeTab]);

  // Fungsi Muat Lebih Banyak dengan Skeleton Delay
  const handleLoadMore = () => {
    setIsMoreLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 10);
      setIsMoreLoading(false);
    }, 800); // Delay 800ms agar skeleton sempat terlihat
  };


  // Dipindahkan ke atas agar Linter tidak menampilkan error "no-use-before-define"
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

  // --- FUNGSI UNDUH GAMBAR (JPG) MODERN & FONT LOCKED ---
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
        const dataURL = await window.htmlToImage.toJpeg(element, {
          quality: 0.85,
          pixelRatio: 1.5,
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });

        const link = document.createElement('a');
        const safeName = shareStudent?.name ? shareStudent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'siswa';
        const safeDate = weekDates[0] ? getDateString(weekDates[0]) : 'mingguan';

        link.download = `Laporan_${safeName}_${safeDate}.jpg`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error("Gagal mengunduh gambar:", error);
      if (showToast) showToast("Gagal membuat gambar. Pastikan koneksi stabil.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- FUNGSI UNDUH GAMBAR LAPORAN KELAS (JPG) ---
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
        const dataURL = await window.htmlToImage.toJpeg(element, { quality: 0.85, pixelRatio: 1.5, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        // Menghindari crash jika activeHalaqoh bernilai null/undefined
        const safeHalaqoh = String(activeHalaqoh || 'Kelas').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `Laporan_Halaqoh_${safeHalaqoh}_${getDateString(weekDates[0])}_Hal${pageNum}.jpg`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error("Gagal mengunduh gambar laporan kelas:", error);
      if (showToast) showToast("Maaf, terjadi kesalahan saat membuat gambar.");
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
        const imgData = await window.htmlToImage.toJpeg(element, { quality: 0.85, pixelRatio: 1.5, backgroundColor: '#ffffff' });
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
        pdf.addImage(imgData, 'JPEG', imgX, imgY, finalImgWidth, finalImgHeight);
        const safeName = shareStudent?.name ? shareStudent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'siswa';
        const safeDate = weekDates[0] ? getDateString(weekDates[0]) : 'mingguan';
        pdf.save(`Laporan_${safeName}_${safeDate}.pdf`);
      }
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      if (showToast) showToast("Maaf, terjadi kesalahan saat membuat PDF.");
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
          const imgData = await window.htmlToImage.toJpeg(element, { quality: 0.85, pixelRatio: 1.5, backgroundColor: '#ffffff' });
          const img = new Image(); img.src = imgData; await new Promise(r => img.onload = r);
          const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
          const w = img.width * ratio; const h = img.height * ratio;
          const x = (pdfWidth - w) / 2; const y = 0;
          pdf.addImage(imgData, 'JPEG', x, y, w, h);
        }
      };
      await addPageToPdf('class-report-page-1');
      const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);
      if (workDays.length > 3) { pdf.addPage(); await addPageToPdf('class-report-page-2'); }
      // Menghindari crash jika activeHalaqoh bernilai null/undefined
      const safeHalaqoh = String(activeHalaqoh || 'Kelas').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`Laporan_Halaqoh_${safeHalaqoh}_${getDateString(weekDates[0])}.pdf`);
    } catch (error) { console.error("Gagal mengunduh PDF laporan kelas:", error); if (showToast) showToast("Maaf, terjadi kesalahan saat membuat PDF."); }
    finally { setIsDownloading(false); }
  };

  // --- FUNGSI SALIN LINK UNTUK ORANG TUA ---
  const handleCopyShareLink = async () => {
    if (!shareStudent) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const dateParam = getDateString(weekStart);
    const shareUrl = `${baseUrl}?share=${shareStudent.id}&date=${dateParam}`;
    const periode = formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0]);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Laporan Al-Qur'an ananda *${shareStudent.name}* periode *${periode}*:\n\n${shareUrl}\n\nTerima kasih.`;

    const copied = await copyTextToClipboard(textToCopy);
    if (copied) {
      setCopySuccessModal({
        isOpen: true,
        title: 'Tautan Berhasil Disalin!',
        message: `Tautan laporan individu untuk ${shareStudent.name} telah disalin ke clipboard. Anda dapat menempelkan (paste) pesan tersebut di WhatsApp atau aplikasi pesan lainnya.`,
        link: shareUrl
      });
    } else {
      if (showToast) showToast("Gagal menyalin tautan laporan.");
    }
  };

  // --- FUNGSI SALIN LINK UNTUK ORANG TUA (LAPORAN HALAQOH) ---
  const handleCopyClassShareLink = async () => {
    if (!activeHalaqoh) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const dateParam = getDateString(weekStart);
    const shareUrl = `${baseUrl}?shareClass=${encodeURIComponent(activeHalaqoh)}&date=${dateParam}`;
    const periode = formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0]);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Laporan Halaqoh *${activeHalaqoh}* periode *${periode}*:\n\n${shareUrl}\n\nTerima kasih.`;

    const copied = await copyTextToClipboard(textToCopy);
    if (copied) {
      setCopySuccessModal({
        isOpen: true,
        title: 'Tautan Berhasil Disalin!',
        message: `Tautan laporan halaqoh untuk kelompok ${activeHalaqoh} telah disalin ke clipboard. Anda dapat menempelkan (paste) pesan tersebut di grup WhatsApp wali murid.`,
        link: shareUrl
      });
    } else {
      if (showToast) showToast("Gagal menyalin tautan laporan.");
    }
  };

  // --- FUNGSI DESAIN KARTU TAHSIN (TAMPILAN WEB) - ANTI CRASH ---
  const renderTahsinCard = (tahsin, halAyat, studentId, dateStr, nilaiCat, nilaiSuratStr) => {
    try {
      if (!tahsin && !halAyat && !nilaiCat && !nilaiSuratStr) return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
      if (tahsin === '-' && halAyat === '-' && nilaiCat === '-' && (!nilaiSuratStr || nilaiSuratStr === '-')) return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;

      const isExcellent = String(nilaiCat).trim() === 'A';
      const isGood = String(nilaiCat).trim() === 'B+';
      const isFair = String(nilaiCat).trim() === 'B';
      const badgeBg = isExcellent ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGood ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFair ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
      const catBadge = (nilaiCat && nilaiCat !== '-') ? <div className={`mt-1 inline-flex items-center justify-center ${badgeBg} text-[12px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isExcellent || isGood || isFair) && <Star size={10} className={isExcellent ? "fill-amber-900" : isGood ? "fill-slate-500" : "fill-orange-600"} />}{String(nilaiCat)}</div> : null;

      if (!tahsin || tahsin === '-' || typeof tahsin !== 'string') {
        const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s => s.trim()) : [];
        return (
          <div className="flex flex-col items-center justify-center w-full min-w-0 gap-1">
            {halAyat !== '-' && <span className="text-[13px] md:text-[14px] font-bold text-gray-700 break-words text-center">{String(halAyat)}</span>}
            {catBadge}
            {nList.length > 0 && nList.map((n, i) => {
              if (!n || n === '-') return null;
              const isEx = String(n).trim() === 'A'; const isGd = String(n).trim() === 'B+'; const isFr = String(n).trim() === 'B';
              const bg = isEx ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGd ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFr ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
              return <div key={`tn-${i}`} className={`inline-flex items-center justify-center ${bg} text-[11px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isEx || isGd || isFr) && <Star size={10} className={isEx ? "fill-amber-900" : isGd ? "fill-slate-500" : "fill-orange-600"} />}{n}</div>;
            })}
          </div>
        );
      }

      if (tahsin.includes('Tajwid') || tahsin.includes('Ghorib') || tahsin.includes('Gharib')) {
        const parts = tahsin.split(','); const category = parts[0].trim(); const suratListStr = parts.slice(1).join(',').trim();
        let halMat = halAyat !== '-' ? String(halAyat) : '', ayatListStr = '';
        if (halMat.includes(' / ')) { const splitDetails = halMat.split(' / '); halMat = splitDetails[0].trim(); ayatListStr = splitDetails.slice(1).join(' / ').trim(); } else if (/^[0-9\-, ]+$/.test(halMat)) { ayatListStr = halMat; halMat = ''; } else if (!halMat.includes('Hal') && !halMat.includes('-') && !halMat.includes('|')) { ayatListStr = halMat; halMat = ''; }
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
              const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat' && !s.includes(a)) ? s + ' ' + a : s;
              const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
              const isExcellentN = String(n).trim() === 'A';
              const isGoodN = String(n).trim() === 'B+';
              const isFairN = String(n).trim() === 'B';
              const badgeBgN = isExcellentN ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGoodN ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFairN ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
              const sBadge = n ? <div className={`mt-1 inline-flex items-center justify-center ${badgeBgN} text-[11px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isExcellentN || isGoodN || isFairN) && <Star size={10} className={isExcellentN ? "fill-amber-900" : isGoodN ? "fill-slate-500" : "fill-orange-600"} />}{n}</div> : null;
              const textSize = combined.length > 25 ? 'text-[9px] md:text-[10px]' : combined.length > 15 ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[12px]';
              return (
                <div key={i} className={`${textSize} text-blue-800 bg-blue-50 px-2.5 py-2 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 font-bold leading-snug mt-0.5 w-fit max-w-full text-center`}>
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
          <div className="flex items-center justify-center gap-1 w-full max-w-full"><span className={`${tahsin.length > 15 ? 'text-[11px] md:text-[12px]' : 'text-[14px]'} font-bold text-gray-800 leading-none break-words text-center`}>{tahsin}</span></div>
          {halAyat !== '-' && <span className={`${String(halAyat).length > 20 ? 'text-[9px] md:text-[10px]' : 'text-[11px]'} font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100/70 break-words whitespace-normal max-w-full text-center`}>{String(halAyat)}</span>}
          {catBadge}
        </div>
      );
      const tList = tahsin.split(',').map(s => s.trim());
      const aList = String(halAyat || '').split(',').map(s => s.trim());
      const nList = nilaiSuratStr && nilaiSuratStr !== '-' ? String(nilaiSuratStr).split(',').map(s => s.trim()) : [];
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
          {tList.map((t, i) => {
            const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat' && !t.includes(a)) ? t + ' ' + a : t;
            const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
            const isExcellentN = String(n).trim() === 'A';
            const isGoodN = String(n).trim() === 'B+';
            const isFairN = String(n).trim() === 'B';
            const badgeBgN = isExcellentN ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGoodN ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFairN ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
            const sBadge = n ? <div className={`mt-1 inline-flex items-center justify-center ${badgeBgN} text-[11px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isExcellentN || isGoodN || isFairN) && <Star size={10} className={isExcellentN ? "fill-amber-900" : isGoodN ? "fill-slate-500" : "fill-orange-600"} />}{n}</div> : null;
            const textSize = combined.length > 25 ? 'text-[9px] md:text-[10px]' : combined.length > 15 ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[12px]';
            return (
              <div key={i} className={`${textSize} font-bold text-blue-800 bg-blue-50 px-2.5 py-2 rounded-lg border border-blue-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center`}>
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

      if (tList.length === 0 && nList.length > 0) {
        return (
          <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
            {nList.map((n, i) => {
              if (!n || n === '-') return null;
              const isEx = String(n).trim() === 'A'; const isGd = String(n).trim() === 'B+'; const isFr = String(n).trim() === 'B';
              const bg = isEx ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGd ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFr ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
              return <div key={`fn-${i}`} className={`inline-flex items-center justify-center ${bg} text-[11px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isEx || isGd || isFr) && <Star size={10} className={isEx ? "fill-amber-900" : isGd ? "fill-slate-500" : "fill-orange-600"} />}{n}</div>;
            })}
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full min-w-0">
          {tList.map((t, i) => {
            const a = aList[i]; const combined = (a && a !== '-' && a !== 'Semua Ayat') ? t + ' ' + a : t;
            const n = nList[i] && nList[i] !== '-' ? nList[i] : null;
            const isExcellentN = String(n).trim() === 'A';
            const isGoodN = String(n).trim() === 'B+';
            const isFairN = String(n).trim() === 'B';
            const badgeBgN = isExcellentN ? 'bg-amber-400 text-amber-900 shadow-amber-200' : isGoodN ? 'bg-slate-200 text-slate-700 shadow-slate-300 border border-slate-300' : isFairN ? 'bg-orange-100 text-orange-800 shadow-orange-200 border border-orange-300' : 'bg-[#0f4c5c] text-white shadow-sm';
            const badge = n ? <div className={`mt-1 inline-flex items-center justify-center ${badgeBgN} text-[11px] font-black px-2.5 py-1 rounded-full w-max leading-none gap-1`}>{(isExcellentN || isGoodN || isFairN) && <Star size={10} className={isExcellentN ? "fill-amber-900" : isGoodN ? "fill-slate-500" : "fill-orange-600"} />}{n}</div> : null;
            const textSize = combined.length > 25 ? 'text-[9px] md:text-[10px]' : combined.length > 15 ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[12px]';
            return (
              <div key={i} className={`${textSize} font-bold text-purple-800 bg-purple-50 px-2.5 py-2 rounded-lg border border-purple-100 flex flex-col items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center`}>
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
          {items.map((item, i) => {
            const textSize = item.length > 25 ? 'text-[9px] md:text-[10px]' : item.length > 15 ? 'text-[10px] md:text-[11px]' : 'text-[11px] md:text-[12px]';
            return (
              <div key={i} className={`${textSize} font-bold text-emerald-800 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-100 flex items-center justify-center gap-1 leading-snug w-fit max-w-full group relative text-center`}>
                <div className="flex items-center justify-center gap-1 overflow-hidden"><Repeat size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span className="flex-1 min-w-0 break-words whitespace-normal">{item}</span></div>
              </div>
            );
          })}
        </div>
      );
    } catch (err) {
      return <span className="text-xs sm:text-sm text-gray-300 font-medium">-</span>;
    }
  };

  // Kunci data dinamis berdasarkan tab yang aktif (Target vs Capaian)
  const k = homeTab === 'lesson_plan'
    ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' }
    : jurnalKeys;

  // MEMOISASI: Hitung data bayangan satu kali saja tiap kali tanggal/halaqoh berubah,
  // jangan dihitung ulang pada setiap re-render (seperti saat scroll atau mengetik)
  const ghostDataMap = useMemo(() => {
    const ghostData = {};
    const activeDateObj = new Date(activeDate);
    const activeDateDay = Number.isNaN(activeDateObj.getTime()) ? null : activeDateObj.getDay();

    const currentWeekStart = new Date(activeDateObj);
    if (activeDateDay !== null) {
      const diffToMonday = currentWeekStart.getDate() - activeDateDay + (activeDateDay === 0 ? -6 : 1);
      currentWeekStart.setDate(diffToMonday);
      currentWeekStart.setHours(0, 0, 0, 0);
    }

    filteredStudents.forEach(s => {
      const recordedDates = Object.keys(s.records || {})
        .map(d => new Date(d))
        .filter(d => d < activeDateObj)
        .sort((a, b) => b - a); // Urutkan descending

      const ghostRecord = {
        [k.t]: '-',
        [k.h]: '-',
        [k.tNilai]: '-',
        [k.tsNilai]: '-',
        [k.f]: '-',
        [k.af]: '-',
        [k.fNilai]: '-',
        [k.m]: '-',
        [k.c]: '-',
        [k.cT]: '-',
        [k.cF]: '-',
        __dates: {}
      };

      const hasTahsinGhost = () => hasMeaningfulValue(ghostRecord[k.t]) || hasMeaningfulValue(ghostRecord[k.h]);
      const hasTahfidzGhost = () => hasMeaningfulValue(ghostRecord[k.f]) || hasMeaningfulValue(ghostRecord[k.af]);
      const hasMurojaahGhost = () => hasMeaningfulValue(ghostRecord[k.m]);
      const hasCatatanGhost = () => hasMeaningfulValue(ghostRecord[k.cT]) || hasMeaningfulValue(ghostRecord[k.cF]);

      for (const d of recordedDates) {
        const dStr = getDateString(d);
        const rec = s.records[dStr];

        const isFromPreviousWeek = d < currentWeekStart;
        const searchKeys = (homeTab === 'lesson_plan' && isFromPreviousWeek) ? jurnalKeys : k;

        if (rec) {
          const catatan = String(rec[searchKeys.c] || '').toLowerCase();
          if (catatan.includes('libur') || catatan.includes('sakit') || catatan.includes('izin') || catatan.includes('alpa') || catatan.includes('tidak hadir')) continue;

          if (!hasTahsinGhost() && (hasMeaningfulValue(rec[searchKeys.t]) || hasMeaningfulValue(rec[searchKeys.h]))) {
            ghostRecord[k.t] = rec[searchKeys.t] || '-';
            ghostRecord[k.h] = rec[searchKeys.h] || '-';
            ghostRecord[k.tNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.tNilai] || '-';
            ghostRecord[k.tsNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.tsNilai] || '-';
            ghostRecord.__dates.tahsin = dStr;
          }

          if (!hasTahfidzGhost() && (hasMeaningfulValue(rec[searchKeys.f]) || hasMeaningfulValue(rec[searchKeys.af]))) {
            ghostRecord[k.f] = rec[searchKeys.f] || '-';
            ghostRecord[k.af] = rec[searchKeys.af] || '-';
            ghostRecord[k.fNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.fNilai] || '-';
            ghostRecord.__dates.tahfidz = dStr;
          }

          if (!hasMurojaahGhost() && hasMeaningfulValue(rec[searchKeys.m])) {
            ghostRecord[k.m] = rec[searchKeys.m] || '-';
            ghostRecord.__dates.murojaah = dStr;
          }

          if (!hasCatatanGhost() && (hasMeaningfulValue(rec[searchKeys.cT]) || hasMeaningfulValue(rec[searchKeys.cF]))) {
            ghostRecord[k.cT] = rec[searchKeys.cT] || '-';
            ghostRecord[k.cF] = rec[searchKeys.cF] || '-';
            ghostRecord.__dates.catatan = dStr;
          }

          if (hasTahsinGhost() && hasTahfidzGhost() && hasMurojaahGhost() && hasCatatanGhost()) break;
        }
      }

      if (hasTahsinGhost() || hasTahfidzGhost() || hasMurojaahGhost() || hasCatatanGhost()) {
        ghostData[s.id] = {
          ...ghostRecord,
          date: ghostRecord.__dates.tahsin || ghostRecord.__dates.tahfidz || ghostRecord.__dates.murojaah || ghostRecord.__dates.catatan
        };
      }
    });
    return ghostData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents, activeDate, homeTab]);
  // Catatan: K object sengaja diabaikan di deps untuk mencegah render loop.

  // Sinkronisasikan ke window untuk kebutuhan MainApp.jsx
  useEffect(() => {
    window._lastDayData = ghostDataMap;
  }, [ghostDataMap]);

  const getDateStatus = (dateStr) => {
    const targetStudents = studentsInHalaqoh || filteredStudents;
    if (targetStudents.length === 0) return { status: 'none', count: 0 };
    const filledCount = targetStudents.filter(s => {
      const r = s.records?.[dateStr];
      return r && (
        (r[k.t] && r[k.t] !== '-') || (r[k.tNilai] && r[k.tNilai] !== '-') || (r[k.tsNilai] && r[k.tsNilai] !== '-') ||
        (r[k.f] && r[k.f] !== '-') || (r[k.fNilai] && r[k.fNilai] !== '-') ||
        (r[k.m] && r[k.m] !== '-') || (r[k.c] && r[k.c] !== '-') || (r[k.cT] && r[k.cT] !== '-') || (r[k.cF] && r[k.cF] !== '-')
      );
    }).length;

    if (filledCount === 0) return { status: 'none', count: 0 };
    const status = filledCount === targetStudents.length ? 'full' : 'partial';
    return { status, count: filledCount };
  };

  // Helper untuk me-render tabel cetak (Tabel Keseluruhan/Kelas)
  const renderPrintTable = (datesToRender, pageNum, totalPages) => {
    const isThreeDays = datesToRender.length === 3;
    // Agar lebar kolom No, Nama, dan Hari tetap konsisten antara Hal 1 dan Hal 2,
    // kita kecilkan lebar total tabel pada Hal 2 (2 hari) menjadi ±73% dan dipusatkan.
    const tableWidth = isThreeDays ? '100%' : '73%';
    const wNo = isThreeDays ? '3%' : '4.1%'; // 3% dari total halaman
    const wNama = isThreeDays ? '18%' : '24.6%'; // 18% dari total halaman
    const wDay = isThreeDays ? '26.3%' : '35.6%'; // 26.3% dari total halaman

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
                        <td rowSpan={2} className="p-2 align-top bg-white">
                          <div className="flex items-center gap-2.5">
                            {student?.photo && student.photo !== '' ? (
                              <img src={student.photo} alt={student?.name} className="w-9 h-9 rounded-full object-cover border-2 border-green-100 shrink-0 shadow-sm" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-green-50 border-2 border-green-100 text-green-700 flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">{initials}</div>
                            )}
                            <div className="flex flex-col justify-center">
                              <div className="text-[11px] font-black text-gray-800 leading-tight">{String(student?.name || 'Unknown')}</div>
                              <div className="text-[8px] text-gray-400 font-bold uppercase mt-1">Kelas {String(student?.kelas || '-')}</div>
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

                          const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';
                          const valCT = rec?.[k.cT] && rec?.[k.cT] !== '-' ? String(rec[k.cT]) : '';
                          const valCF = rec?.[k.cF] && rec?.[k.cF] !== '-' ? String(rec[k.cF]) : '';

                          const isTahsinAchieved = homeTab === 'lesson_plan' && (valT !== '-' || valTNilai !== '-' || valTSNilai !== '-') && (rec?.jurnalTahsin && rec?.jurnalTahsin !== '-');
                          const isTahfidzAchieved = homeTab === 'lesson_plan' && (valF !== '-' || valFNilai !== '-') && (rec?.jurnalTahfidz && rec?.jurnalTahfidz !== '-');

                          return (
                            <React.Fragment key={dateStr + '-data'}>
                              <td className="p-1.5 text-center text-[9px] font-bold text-emerald-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {renderTextWithHighlights(formatPrintData(valM, '-', null, null))}
                              </td>
                              <td className="relative p-1.5 text-center text-[9px] font-bold text-blue-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {isTahsinAchieved && <Check size={10} className="text-emerald-500 absolute top-1 right-1" strokeWidth={4} />}
                                {renderTextWithHighlights(formatPrintData(valT, valH, valTNilai, valTSNilai))}
                              </td>
                              <td className="relative p-1.5 text-center text-[9px] font-bold text-purple-600 whitespace-pre-wrap leading-snug bg-white align-top">
                                {isTahfidzAchieved && <Check size={10} className="text-emerald-500 absolute top-1 right-1" strokeWidth={4} />}
                                {renderTextWithHighlights(formatPrintData(valF, valAF, null, valFNilai))}
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
                          const valCT = rec?.[k.cT] && rec?.[k.cT] !== '-' ? String(rec[k.cT]) : '';
                          const valCF = rec?.[k.cF] && rec?.[k.cF] !== '-' ? String(rec[k.cF]) : '';
                          const hasPrintCatatan = valC || valCT || valCF;

                          return (
                            <td key={dateStr + '-note'} colSpan={3} className="px-2 py-0.5 text-[7px] text-center bg-white h-auto align-middle">
                              {hasPrintCatatan ? (
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 w-full">
                                  {valCT && valCT !== '-' && <span><span className="text-blue-600 font-black">Tahsin:</span> <span className="text-gray-700 font-bold">{renderTextWithHighlights(valCT)}</span></span>}
                                  {valCF && valCF !== '-' && <span><span className="text-purple-600 font-black">Tahfidz:</span> <span className="text-gray-700 font-bold">{renderTextWithHighlights(valCF)}</span></span>}
                                  {valC && valC !== '-' && <span><span className="text-orange-500 font-black">Umum:</span> <span className="text-red-600 font-bold">{renderTextWithHighlights(valC)}</span></span>}
                                </div>
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
      <style type="text/css" media="print" dangerouslySetInnerHTML={{
        __html: `
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
      `}} />

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
                  <button onClick={handleCopyClassShareLink} className="bg-blue-600 text-white px-5 py-3 md:py-2.5 rounded-2xl md:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-colors">
                    <Link size={18} />
                    <span className="inline">Salin Link</span>
                  </button>
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
                <div className="w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col md:items-center p-0 md:p-4 print:p-0 print:overflow-visible relative">

                  {/* MOBILE VIEW (CARD-BASED) */}
                  <div className="md:hidden w-full flex flex-col gap-4 print:hidden px-4 py-4 pb-24">
                    {filteredStudents.map((student, idx) => (
                      <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-3 border-b border-slate-50 pb-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                            {idx + 1}
                          </div>
                          {student?.photo && student.photo !== '' ? (
                            <img src={student.photo} alt={student?.name} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black shrink-0">{getInitials(student?.name)}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-800 text-sm truncate">{student?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kelas {student?.kelas || '-'}</div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {workDays.map((dateObj) => {
                            const dateStr = getDateString(dateObj);
                            const rec = student?.records?.[dateStr] || {};

                            const valM = formatPrintData(rec?.[k.m], '-', null, null);
                            const valT = formatPrintData(rec?.[k.t], rec?.[k.h], rec?.[k.tNilai], rec?.[k.tsNilai]);
                            const valF = formatPrintData(rec?.[k.f], rec?.[k.af], null, rec?.[k.fNilai]);
                            const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';
                            const valCT = rec?.[k.cT] && rec?.[k.cT] !== '-' ? String(rec[k.cT]) : '';
                            const valCF = rec?.[k.cF] && rec?.[k.cF] !== '-' ? String(rec[k.cF]) : '';

                            const isTahsinAchieved = homeTab === 'lesson_plan' && valT !== '-' && (rec?.jurnalTahsin && rec?.jurnalTahsin !== '-');
                            const isTahfidzAchieved = homeTab === 'lesson_plan' && valF !== '-' && (rec?.jurnalTahfidz && rec?.jurnalTahfidz !== '-');

                            const hasData = valM !== '-' || valT !== '-' || valF !== '-' || valC !== '' || valCT !== '' || valCF !== '';
                            if (!hasData) return null;

                            return (
                              <div key={dateStr} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">{getDayName(dateObj)} <span className="text-slate-400 normal-case font-bold ml-1">{formatShortDate(dateObj)}</span></div>
                                <div className="flex flex-col gap-2">
                                  {valM !== '-' && (
                                    <div>
                                      <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-0.5">Murojaah</div>
                                      <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{renderTextWithHighlights(valM)}</div>
                                    </div>
                                  )}
                                  {valT !== '-' && (
                                    <div>
                                      <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">Tahsin {isTahsinAchieved && <Check size={12} className="text-emerald-500" strokeWidth={4} title="Target Tercapai" />}</div>
                                      <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{renderTextWithHighlights(valT)}</div>
                                    </div>
                                  )}
                                  {valF !== '-' && (
                                    <div>
                                      <div className="text-[9px] text-purple-500 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">Tahfidz {isTahfidzAchieved && <Check size={12} className="text-emerald-500" strokeWidth={4} title="Target Tercapai" />}</div>
                                      <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{renderTextWithHighlights(valF)}</div>
                                    </div>
                                  )}
                                  {valC || valCT || valCF ? (
                                    <div className="col-span-full mt-1">
                                      <div className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">Catatan</div>
                                      <div className="flex flex-col gap-1.5">
                                        {valCT && <div><span className="text-[10px] text-blue-600 font-bold">Tahsin:</span> <span className="text-[11px] font-bold text-slate-700 whitespace-pre-wrap">{renderTextWithHighlights(valCT)}</span></div>}
                                        {valCF && <div><span className="text-[10px] text-purple-600 font-bold">Tahfidz:</span> <span className="text-[11px] font-bold text-slate-700 whitespace-pre-wrap">{renderTextWithHighlights(valCF)}</span></div>}
                                        {valC && <div><span className="text-[10px] text-orange-600 font-bold">Umum:</span> <span className="text-[11px] font-bold text-slate-700 whitespace-pre-wrap">{renderTextWithHighlights(valC)}</span></div>}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}

                          {workDays.every(d => {
                            const rec = student?.records?.[getDateString(d)] || {};
                            return !(rec[k.m] && rec[k.m] !== '-') && !(rec[k.t] && rec[k.t] !== '-') && !(rec[k.f] && rec[k.f] !== '-') && !(rec[k.c] && rec[k.c] !== '-') && !(rec[k.cT] && rec[k.cT] !== '-') && !(rec[k.cF] && rec[k.cF] !== '-');
                          }) && (
                              <div className="text-center py-4 text-slate-400 text-[11px] font-bold italic">
                                Belum ada rekaman pekan ini.
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP & PRINT VIEW (TABLE) */}
                  <div className="absolute top-[-9999px] left-[-9999px] md:static opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto flex flex-col gap-6 sm:gap-8 items-center w-max shrink-0 print:!static print:!opacity-100 print:!pointer-events-auto print:!flex print:w-full">
                    <div className="w-[1000px] min-w-[1000px] shrink-0 print:w-full print:min-w-0 print:shadow-none">
                      <div className="bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
                        {workDays.length >= 1 && renderPrintTable(workDays.slice(0, 3), 1, totalPages)}
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="w-[1000px] min-w-[1000px] shrink-0 print:w-full print:min-w-0 print:shadow-none">
                        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
                          {workDays.length > 3 && renderPrintTable(workDays.slice(3, 5), 2, totalPages)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ===== MODAL SHARE LAPORAN INDIVIDU ===== */}
      {shareStudent && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-start bg-slate-900/80 p-0 md:p-6 pb-32 md:pb-6 overflow-y-auto custom-scrollbar printable-area print:!static print:p-0 print:m-0 print:overflow-visible">

          {/* Tombol Aksi Web (Floating Bottom on Mobile) */}
          <div className="fixed bottom-6 right-6 sm:bottom-auto sm:top-6 sm:right-6 flex flex-col-reverse sm:flex-row gap-3 z-[100000] print:hidden" data-html2canvas-ignore="true">
            <button onClick={handleCopyShareLink} className="bg-blue-600 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-full sm:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-colors" title="Salin Link Orang Tua">
              <Link size={20} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Salin Link Orang Tua</span>
            </button>
            <button onClick={handleDownloadImage} disabled={isDownloading} className="bg-[#00e676] text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-full sm:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-green-600 transition-colors disabled:opacity-50" title="Unduh (JPG)">
              {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <Download size={20} className="sm:w-[18px] sm:h-[18px]" />}
              <span className="hidden sm:inline">{isDownloading ? 'Memproses...' : 'Unduh (JPG)'}</span>
            </button>
            <button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-white text-gray-800 w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-full sm:rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-gray-50 transition-colors disabled:opacity-50 border border-slate-100" title="Download PDF">
              {isDownloading ? <span className="animate-spin text-sm">⏳</span> : <FileText size={20} className="sm:w-[18px] sm:h-[18px]" />}
              <span className="hidden sm:inline">{isDownloading ? 'Memproses...' : 'Download PDF'}</span>
            </button>
            <button onClick={() => setShareStudent(null)} className="bg-slate-800 text-white w-14 h-14 sm:w-auto sm:h-auto sm:p-3 flex items-center justify-center rounded-full sm:rounded-xl shadow-xl hover:bg-slate-900 transition-colors mb-2 sm:mb-0" title="Tutup">
              <X size={24} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>

          {/* KARTU LAPORAN INDIVIDU */}
          <div className="w-full flex justify-center p-0 sm:p-4 print:p-0">
            <div id="share-report-card" className="bg-white w-full max-w-[800px] print:w-[800px] print:min-w-[800px] print:max-w-none shrink-0 sm:shadow-2xl relative sm:my-8 print:shadow-none rounded-none sm:rounded-[32px] overflow-hidden transition-colors">

              {/* HEADER LAPORAN */}
              <div className="bg-[#f2fdf5] p-6 sm:p-8 border-b border-green-100 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <div className="w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-1 sm:mb-2">
                    {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
                  </h1>
                  <p className="text-[#00e676] font-bold text-xs sm:text-sm italic">SDIT Al-Fityan School Bogor</p>
                </div>
                <div className="w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen size={64} className="text-green-600 sm:w-16 sm:h-16" />
                  )}
                </div>
              </div>

              {/* INFO SISWA */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-gray-50 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full sm:w-auto">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#e6fbf0] border-4 sm:border-[5px] border-[#00e676] text-[#00e676] flex items-center justify-center text-4xl sm:text-5xl font-black relative shrink-0 shadow-inner">
                    {shareStudent?.photo ? (
                      <img src={shareStudent.photo} alt={shareStudent?.name || ''} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{getInitials(shareStudent?.name)}</span>
                    )}
                    <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-white rounded-full p-1 text-[#00e676] shadow-sm">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00e676] rounded-full flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className={`font-black text-gray-800 mb-2 sm:mb-3 ${(shareStudent?.name || '').length > 24 ? 'text-lg sm:text-xl' : (shareStudent?.name || '').length > 18 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{String(shareStudent?.name || 'Siswa')}</h2>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1 sm:mt-0">
                      <span className={`bg-[#e6fbf0] text-green-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold uppercase tracking-widest ${String(shareStudent?.kelas || '-').length > 10 ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-xs'}`}>Kelas {String(shareStudent?.kelas || '-')}</span>
                      <span className={`bg-[#e6fbf0] text-green-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold uppercase tracking-widest ${String(activeHalaqoh || '-').length > 20 ? 'text-[8px] sm:text-[10px]' : String(activeHalaqoh || '-').length > 15 ? 'text-[9px] sm:text-[11px]' : 'text-[10px] sm:text-xs'}`}>Kelompok {String(activeHalaqoh || '-')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DAFTAR HARI / JURNAL SISWA */}
              <div className="p-4 sm:p-8 flex flex-col gap-4 sm:gap-5 bg-gray-50/50">
                {weekDates.every((dateObj) => {
                  if (!dateObj || typeof dateObj.getDay !== 'function') return true;
                  if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return true;
                  const dateStr = getDateString(dateObj);
                  const rec = shareStudent?.records?.[dateStr] || {};
                  return !(rec?.[k.t] && rec?.[k.t] !== '-') && !(rec?.[k.f] && rec?.[k.f] !== '-') && !(rec?.[k.m] && rec?.[k.m] !== '-') && !(rec?.[k.c] && rec?.[k.c] !== '-');
                }) && (
                    <div className="py-12 text-center flex flex-col items-center gap-3 opacity-40">
                      <Calendar size={48} />
                      <p className="font-bold">Belum ada data rekaman pada pekan ini.</p>
                    </div>
                  )}
                {weekDates.map((dateObj) => {
                  if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                  if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
                  const dateStr = getDateString(dateObj);
                  const dayName = getDayName(dateObj).toUpperCase();
                  const displayDate = `${dateObj.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]} ${dateObj.getFullYear()}`;

                  const rec = shareStudent?.records?.[dateStr] || {};

                  const hasData = (rec?.[k.t] && rec?.[k.t] !== '-') || (rec?.[k.f] && rec?.[k.f] !== '-') || (rec?.[k.m] && rec?.[k.m] !== '-') || (rec?.[k.c] && rec?.[k.c] !== '-');
                  if (!hasData) return null;

                  const valM = formatPrintData(rec?.[k.m], '-', null, null);
                  const valT = formatPrintData(rec?.[k.t], rec?.[k.h], rec?.[k.tNilai], rec?.[k.tsNilai]);
                  const valF = formatPrintData(rec?.[k.f], rec?.[k.af], null, rec?.[k.fNilai]);
                  const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';
                  const valCT = rec?.[k.cT] && rec?.[k.cT] !== '-' ? String(rec[k.cT]) : '';
                  const valCF = rec?.[k.cF] && rec?.[k.cF] !== '-' ? String(rec[k.cF]) : '';

                  return (
                    <div key={dateStr} className="bg-white border border-gray-100 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm print:break-inside-avoid transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-5 border-b border-gray-50 pb-3 sm:pb-4">
                        <span className="bg-[#00e676] text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-sm w-max">{dayName}</span>
                        <span className="text-gray-400 font-bold italic text-xs sm:text-sm">{displayDate}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-6">
                        {/* Info TAHSIN */}
                        <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1.5 text-blue-500"><BookOpen size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Tahsin</span></div>
                          <ExpandableText text={valT} />
                        </div>

                        {/* Info TAHFIDZ */}
                        <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1.5 text-purple-500"><Mic size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Tahfidz</span></div>
                          <ExpandableText text={valF} />
                        </div>

                        {/* Info MUROJAAH */}
                        <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1.5 text-emerald-500"><Repeat size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Murojaah</span></div>
                          <ExpandableText text={valM} />
                        </div>

                        {/* Info CATATAN */}
                        <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1.5 text-orange-500"><FileText size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Catatan</span></div>
                          {renderCatatanDetail(valC, valCT, valCF)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FOOTER LAPORAN */}
              <div className="bg-[#111827] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Users size={14} className="text-gray-300" /></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Ustadz/ah: <strong className="text-white inline ml-1">{String(activeGuru || '-')}</strong></span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-[#00e676]/20 flex items-center justify-center shrink-0"><Calendar size={14} className="text-[#00e676]" /></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Periode: <strong className="text-white inline ml-1">{formatPeriode(weekDates[0], weekDates[weekDates.length - 1] || weekDates[0])}</strong></span>
                </div>
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
                {homeTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Mutabaah Al-Qur'an"}
                </h1>
                <div className="flex flex-wrap sm:flex-row sm:items-center gap-x-3 gap-y-1 text-gray-500 font-medium text-[9px] sm:text-xs mt-0.5 sm:mt-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">Halaqoh:</span> <strong className={`text-green-700 bg-green-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-green-100 whitespace-normal break-words ${(activeHalaqoh || '').length > 20 ? 'text-[8px] sm:text-[10px] leading-tight' : (activeHalaqoh || '').length > 15 ? 'text-[9px] sm:text-[11px] leading-tight' : ''}`}>{String(activeHalaqoh || '-')}</strong>
                  </span>
                  <span className="hidden md:inline text-gray-300 shrink-0">•</span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">Ustadz/ah:</span> <strong className={`text-blue-700 bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-blue-100 transition-colors whitespace-normal break-words ${(activeGuru || '').length > 20 ? 'text-[8px] sm:text-[10px] leading-tight' : (activeGuru || '').length > 15 ? 'text-[9px] sm:text-[11px] leading-tight' : ''}`}>{String(activeGuru || '-')}</strong>
                  </span>
                  <span className="hidden md:inline text-gray-300 shrink-0">•</span>
                  <span className="flex items-center gap-1.5 min-w-0" title="Target Hafalan Sekolah">
                    <span className="shrink-0">Target:</span>
                    <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-amber-100 transition-colors whitespace-normal break-words">
                      {targetReguler || '2 Juz'} {targetAlQuran ? `/ ${targetAlQuran}` : ''}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full md:w-auto gap-2 shrink-0 mt-1 sm:mt-0 transition-all overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              <button onClick={() => handleOpenModal(null, 'full_bulk', homeTab)} disabled={!activeHalaqoh} className="flex-1 md:flex-none border-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm transition-all bg-white text-slate-700 border-slate-200 hover:bg-gray-50 disabled:opacity-50 shrink-0" title="Input Massal">
                <Edit3 size={16} className="text-[#00e676]" /> <span className="hidden sm:inline whitespace-nowrap">Input Massal</span>
              </button>
              <button onClick={() => requestClearAllRecordForDay(null, activeDate, homeTab)} disabled={!activeHalaqoh || filteredStudents.length === 0} className="flex-1 md:flex-none border-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm transition-all bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50 shrink-0" title={`Kosongkan ${homeTab === 'lesson_plan' ? 'Target' : 'Capaian'} Hari Ini`}>
                <Trash2 size={16} /> <span className="hidden sm:inline whitespace-nowrap">Kosongkan</span>
              </button>
              <button onClick={() => setIsClassReportVisible(true)} disabled={!activeHalaqoh || filteredStudents.length === 0} className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 font-black text-xs sm:text-sm transition-all shadow-lg border-2 bg-gray-800 text-white border-transparent hover:bg-gray-700 disabled:opacity-50 shrink-0" title="Laporan Halaqoh">
                <Printer size={16} /> <span className="hidden sm:inline whitespace-nowrap">Laporan Halaqoh</span>
              </button>
            </div>
          </div>
        )}

        {/* BLOK 2: KONTEN UTAMA - AREA SCROLL */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full relative custom-scrollbar bg-slate-50 p-3 sm:p-4 md:p-6 transition-colors duration-500" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                <span className="sm:hidden">Mutabaah</span>
                <span className="hidden sm:inline">Mutabaah</span>
              </button>
              <button
                onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                className="flex items-center justify-center px-2.5 py-1.5 sm:py-2 bg-white text-slate-500 hover:text-emerald-600 rounded-lg sm:rounded-xl shadow-sm border border-gray-200/50 transition-all"
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
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 w-full snap-x" ref={dateNavRef}>
              {weekDates.map((dateObj) => {
                if (!dateObj || typeof dateObj.getDay !== 'function') return null;
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
                if (dateObj.getDay() === 0 || dateObj.getDay() === 6) return null;
                const { status: dateStatus, count: filledCount } = getDateStatus(dateStr);
                const targetStudents = studentsInHalaqoh || filteredStudents;
                return ( // Removed dark mode styles
                  <button key={dateStr} data-active={activeDate === dateStr} onClick={() => setActiveDate(dateStr)} className={`flex-1 flex flex-col shrink-0 min-w-[70px] sm:min-w-[80px] items-center justify-center p-2 rounded-xl border transition-all snap-center relative ${activeDate === dateStr ? 'bg-[#00e676] border-[#00e676] text-white shadow-md transform scale-[1.03]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">{dayName}</span>
                    <span className="text-xs md:text-base font-black">{dateObj.getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][dateObj.getMonth()]}</span>
                    {dateStatus !== 'none' && (
                      <div
                        data-tooltip-id="home-date-tooltip"
                        data-tooltip-content={`${filledCount} dari ${targetStudents.length} siswa terisi`}
                        className={`absolute top-1.5 right-1.5 ${activeDate === dateStr ? 'text-white' : dateStatus === 'full' ? 'text-green-500' : 'text-amber-500'}`}
                      >
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* KOTAK PENCARIAN SISWA (SELALU TAMPIL) */}
            <div className="sticky top-0 z-40 bg-slate-50/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0 py-2 md:py-0 mb-2 md:mb-3 transition-all">
              <div className="relative shadow-sm hover:shadow-md transition-shadow rounded-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  placeholder={activeHalaqoh ? `Ketik nama untuk mencari... (${studentsInHalaqohCount} siswa)` : 'Pilih halaqoh terlebih dahulu'}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  disabled={!activeHalaqoh}
                  className="w-full bg-white border border-gray-200/80 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-700 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                {localSearch && (
                  <button onClick={() => { setLocalSearch(''); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-1 rounded-full transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* PETUNJUK GESER (KHUSUS MOBILE) */}
            {activeHalaqoh && filteredStudents.length > 0 && (
              <div className="hidden text-xs font-bold text-blue-500 flex items-center gap-1.5 px-1 -mt-2">
                <ChevronRight size={14} className="animate-pulse" />
                Geser tabel ke kiri untuk melihat detail
              </div>
            )}

            {/* PROGRESS BAR PENGISIAN JURNAL & RINGKASAN KEHADIRAN */}
            {activeHalaqoh && (studentsInHalaqoh || filteredStudents).length > 0 && (() => {
              const targetStudents = studentsInHalaqoh || filteredStudents;
              let count = 0;
              let total = 0;

              if (homeTab === 'lesson_plan') {
                targetStudents.forEach(s => {
                  const r = s.records?.[activeDate];
                  if (r) {
                    const hasTahsinTarget = (r.tahsin && r.tahsin !== '-') || (r.halAyatTahsin && r.halAyatTahsin !== '-') || (r.tahsinNilai && r.tahsinNilai !== '-') || (r.tahsinSuratNilai && r.tahsinSuratNilai !== '-');
                    const hasTahfidzTarget = (r.tahfidz && r.tahfidz !== '-') || (r.ayatTahfidz && r.ayatTahfidz !== '-') || (r.tahfidzNilai && r.tahfidzNilai !== '-');
                    if (hasTahsinTarget) { total++; if (r.jurnalTahsin && r.jurnalTahsin !== '-') count++; }
                    if (hasTahfidzTarget) { total++; if (r.jurnalTahfidz && r.jurnalTahfidz !== '-') count++; }
                  }
                });
                if (total === 0) total = targetStudents.length;
              } else {
                count = getDateStatus(activeDate).count;
                total = targetStudents.length;
              }

              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const isComplete = count === total && total > 0;

              let absenCount = 0;
              let liburCount = 0;

              targetStudents.forEach(student => {
                const record = student?.records?.[activeDate] || {};
                const valC = record?.[k.c] || '-';
                const isCatatanEmpty = valC === '-';
                const isAbsent = !isCatatanEmpty && ['alpa', 'sakit', 'izin', 'tidak hadir'].some(keyword => String(valC).toLowerCase().includes(keyword));
                const isLibur = !isCatatanEmpty && String(valC).toLowerCase().includes('libur');

                if (isLibur) liburCount++;
                else if (isAbsent) absenCount++;
              });

              const hadirCount = total - absenCount - liburCount;

              return (
                <div className="w-full flex flex-col gap-1.5 mb-3 mt-1 px-1 animate-in fade-in duration-500">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      {homeTab === 'lesson_plan' ? 'Target Tercapai Hari Ini' : 'Progres Mutabaah Hari Ini'}
                      {isComplete && <Check size={14} className="text-[#00e676]" strokeWidth={3} />}
                    </span>
                    <span className={`text-xs sm:text-sm font-black ${isComplete ? 'text-[#00e676]' : 'text-emerald-500'}`}>
                      {percentage}% <span className="text-[10px] text-slate-400 font-bold ml-1">({count}/{total})</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 sm:h-3 bg-slate-200/70 rounded-full overflow-hidden shadow-inner mb-1">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isComplete ? 'bg-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.5)]' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                      style={{ width: `${percentage}%` }}
                    >
                      {isComplete && (
                        <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Kehadiran */}
                  {homeTab !== 'lesson_plan' && (
                    <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-black tracking-wide mt-0.5">
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Hadir: {hadirCount}
                      </div>
                      {absenCount > 0 && (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-50/80 px-2.5 py-1 rounded-md border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Tidak Hadir: {absenCount}
                        </div>
                      )}
                      {liburCount > 0 && (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Libur: {liburCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

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
                          const valCT = record?.[k.cT] || '-';
                          const valCF = record?.[k.cF] || '-';

                          // Jurnal Check for Target Achieved
                          const jT = record?.jurnalTahsin || '-';
                          const jF = record?.jurnalTahfidz || '-';

                          // Inisial untuk avatar web
                          const initials = getInitials(student?.name);

                          // Ambil data referensi pekan lalu
                          const lastRec = ghostDataMap[student.id];
                          const ghostLabel = homeTab === 'lesson_plan' && new Date(activeDate).getDay() === 1 ? 'Jurnal Pekan Lalu' : 'Hari Sebelumnya';
                          const isTahsinNoSurat = valT === '-' && valH === '-';
                          const hasTahsinGrade = valTNilai !== '-' || valTSNilai !== '-';
                          const hasGhostTahsin = isTahsinNoSurat && lastRec && lastRec[k.t] && lastRec[k.t] !== '-';

                          const isTahfidzNoSurat = valF === '-' && valAF === '-';
                          const hasTahfidzGrade = valFNilai !== '-';
                          const hasGhostTahfidz = isTahfidzNoSurat && lastRec && lastRec[k.f] && lastRec[k.f] !== '-';
                          const isMurojaahEmpty = valM === '-';
                          const isCatatanEmpty = !hasAnyCatatan(valC, valCT, valCF);

                          const isTahsinAchieved = homeTab === 'lesson_plan' && !isTahsinNoSurat && jT !== '-';
                          const isTahfidzAchieved = homeTab === 'lesson_plan' && !isTahfidzNoSurat && jF !== '-';

                          const hasGhostMurojaah = isMurojaahEmpty && lastRec && lastRec[k.m] && lastRec[k.m] !== '-';
                          const hasGhostCatatan = isCatatanEmpty && lastRec && hasAnyCatatan(lastRec[k.c], lastRec[k.cT], lastRec[k.cF]);
                          const isAbsent = !isCatatanEmpty && ['alpa', 'sakit', 'izin', 'tidak hadir'].some(keyword => String(valC).toLowerCase().includes(keyword));
                          const isLibur = !isCatatanEmpty && String(valC).toLowerCase().includes('libur');
                          const isUjian = !isCatatanEmpty && String(valC).toLowerCase().includes('ujian kenaikan jilid');
                          return (
                            <tr
                              id={`student-row-${student.id}`}
                              /* Perbaikan Error Warning Key: Hindari Math.random() pada loop render */
                              key={student?.id || `student-row-${index}`}
                              className={`relative transition-all duration-300 group ${!isLoading ? 'animate-row-slide-in' : ''} hover:shadow-xl hover:z-20 ${isUjian ? 'bg-emerald-50/50' : 'hover:bg-white'}`}
                              style={!isLoading ? { animationDelay: `${index * 0.05}s` } : {}}
                            >
                              <td className={`text-center text-xs font-bold p-2 sticky left-0 z-20 group-hover:bg-[#f4f7fa] transition-colors ${isUjian ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400'}`}>{index + 1}</td>
                              <td onClick={() => setActiveStudentId(student.id)} className={`p-2.5 sm:p-3 pl-2 text-left sticky left-[40px] sm:left-[50px] z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-all border-r cursor-pointer border-l-4 border-gray-50 group-hover:bg-[#f4f7fa] ${isUjian ? 'bg-emerald-50 border-l-emerald-500' : 'bg-white border-transparent group-hover:border-l-green-500'}`}>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {student?.photo ? (
                                    <img src={student.photo} alt={student?.name || ''} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 shrink-0 shadow-sm transition-all ${(isAbsent || isLibur) ? 'grayscale opacity-50' : isUjian ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`} />
                                  ) : (
                                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[9px] sm:text-[11px] font-black shrink-0 border transition-all ${(isAbsent || isLibur) ? 'bg-gray-100 text-gray-400 border-gray-200 grayscale opacity-50' : isUjian ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                      {initials}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className={`font-extrabold transition-colors ${(student?.name || '').length > 24 ? 'text-[10px] sm:text-[11px] leading-tight break-words whitespace-normal line-clamp-2' : (student?.name || '').length > 18 ? 'text-[11px] sm:text-xs leading-tight break-words whitespace-normal line-clamp-2' : 'text-[13px] sm:text-sm truncate'} ${(isAbsent || isLibur) ? 'text-gray-400' : isUjian ? 'text-emerald-700 group-hover:text-emerald-800' : 'text-gray-800 group-hover:text-slate-950'}`}>{String(student?.name || 'Unknown')}</span>
                                    <span className={`text-[10px] font-bold uppercase transition-colors ${(isAbsent || isLibur) ? 'text-gray-300' : isUjian ? 'text-emerald-500 group-hover:text-emerald-600' : 'text-gray-400 group-hover:text-slate-600'}`}>Kelas {String(student?.kelas || '-')}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahsin', homeTab); }} className={`min-h-[60px] flex flex-col items-center justify-center border hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50 ${isTahsinAchieved ? 'border-emerald-300 bg-emerald-50/40' : 'border-transparent'}`}>
                                  {isTahsinAchieved && (
                                    <div className="absolute top-1 left-1 text-emerald-600 bg-emerald-100 p-0.5 rounded-md border border-emerald-200 z-10 shadow-sm" title="Target Tercapai (Jurnal Terisi)">
                                      <Check size={12} strokeWidth={4} />
                                    </div>
                                  )}
                                  {!isTahsinNoSurat ? (
                                    renderTahsinCard(valT, valH, student?.id, activeDate, valTNilai, valTSNilai)
                                  ) : hasGhostTahsin ? (
                                    <div className={`pointer-events-none origin-center transition-all ${hasTahsinGrade ? 'opacity-100' : 'opacity-30 grayscale blur-[0.5px] scale-90 group-hover/cell:opacity-70 group-hover/cell:blur-none group-hover/cell:grayscale-0'}`} title={`Dari tgl ${getGhostDateLabel(lastRec, 'tahsin')}`}>
                                      <div className="flex items-center justify-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                                        <History size={10} /> {ghostLabel}
                                      </div>
                                      {renderTahsinCard(lastRec[k.t], lastRec[k.h], student?.id, 'ghost', hasTahsinGrade ? valTNilai : lastRec[k.tNilai], hasTahsinGrade ? valTSNilai : lastRec[k.tsNilai])}
                                    </div>
                                  ) : hasTahsinGrade ? (
                                    renderTahsinCard('-', '-', student?.id, activeDate, valTNilai, valTSNilai)
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {(!isTahsinNoSurat || hasTahsinGrade) ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'tahsin_all', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-blue-500 bg-blue-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className="p-2">
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'tahfidz', homeTab); }} className={`min-h-[60px] flex flex-col items-center justify-center border hover:border-gray-200 rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50 ${isTahfidzAchieved ? 'border-emerald-300 bg-emerald-50/40' : 'border-transparent'}`}>
                                  {isTahfidzAchieved && (
                                    <div className="absolute top-1 left-1 text-emerald-600 bg-emerald-100 p-0.5 rounded-md border border-emerald-200 z-10 shadow-sm" title="Target Tercapai (Jurnal Terisi)">
                                      <Check size={12} strokeWidth={4} />
                                    </div>
                                  )}
                                  {!isTahfidzNoSurat ? (
                                    renderTahfidzCard(valF, valAF, student?.id, activeDate, valFNilai)
                                  ) : hasGhostTahfidz ? (
                                    <div className={`pointer-events-none origin-center transition-all ${hasTahfidzGrade ? 'opacity-100' : 'opacity-30 grayscale blur-[0.5px] scale-90 group-hover/cell:opacity-70 group-hover/cell:blur-none group-hover/cell:grayscale-0'}`} title={`Dari tgl ${getGhostDateLabel(lastRec, 'tahfidz')}`}>
                                      <div className="flex items-center justify-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                                        <History size={10} /> {ghostLabel}
                                      </div>
                                      {renderTahfidzCard(lastRec[k.f], lastRec[k.af], student?.id, 'ghost', hasTahfidzGrade ? valFNilai : lastRec[k.fNilai])}
                                    </div>
                                  ) : hasTahfidzGrade ? (
                                    renderTahfidzCard('-', '-', student?.id, activeDate, valFNilai)
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {(!isTahfidzNoSurat || hasTahfidzGrade) ? (
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
                                    <div className="pointer-events-none opacity-30 grayscale blur-[0.5px] scale-90 origin-center transition-all group-hover/cell:opacity-70 group-hover/cell:blur-none group-hover/cell:grayscale-0" title={`Dari tgl ${getGhostDateLabel(lastRec, 'murojaah')}`}>
                                      <div className="flex items-center justify-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                                        <History size={10} /> {ghostLabel}
                                      </div>
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
                                <div onClick={() => { setActiveStudentId(student.id); handleOpenModal(student, 'catatan', homeTab); }} className={`min-h-[60px] flex flex-col items-center justify-center border rounded-xl cursor-pointer relative group/cell transition-colors active:bg-gray-50 ${isAbsent ? 'bg-red-50/60 border-red-100 hover:bg-red-100/60' : isLibur ? 'bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/60' : isUjian ? 'bg-emerald-100/50 border-emerald-200 hover:bg-emerald-200/50' : 'border-transparent hover:border-gray-200'}`}>
                                  {!isCatatanEmpty ? (
                                    renderCompactCatatan(valC, valCT, valCF, getStatusColor)
                                  ) : hasGhostCatatan ? (
                                    <div className="pointer-events-none opacity-30 grayscale blur-[0.5px] italic scale-90 origin-center transition-all group-hover/cell:opacity-70 group-hover/cell:blur-none group-hover/cell:grayscale-0" title={`Dari tgl ${getGhostDateLabel(lastRec, 'catatan')}`}>
                                      <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-gray-400 w-full px-2 py-1 text-center">
                                        <div className="flex items-center gap-1 font-black uppercase tracking-tighter mb-0.5"><History size={10} /> {ghostLabel}</div>
                                        {lastRec[k.cT] && lastRec[k.cT] !== '-' && <div className="leading-tight line-clamp-1 w-full"><span className="font-black">T:</span> {lastRec[k.cT]}</div>}
                                        {lastRec[k.cF] && lastRec[k.cF] !== '-' && <div className="leading-tight line-clamp-1 w-full"><span className="font-black">F:</span> {lastRec[k.cF]}</div>}
                                        {lastRec[k.c] && lastRec[k.c] !== '-' && <div className="leading-tight line-clamp-1 w-full">{lastRec[k.c]}</div>}
                                      </div>
                                    </div>
                                  ) : <span className="text-gray-300 group-hover:text-slate-400 transition-colors">-</span>}
                                  {!isCatatanEmpty ? (
                                    <button onClick={(e) => handleRemoveData(e, student?.id, activeDate, 'catatan', homeTab)} className="absolute right-1 top-1 text-red-500 opacity-0 lg:group-hover/cell:opacity-100 transition-opacity"><X size={12} /></button>
                                  ) : (
                                    <button className="absolute top-1 right-1 opacity-0 lg:group-hover/cell:opacity-100 text-orange-500 bg-orange-50 p-1 rounded-md transition-opacity"><Plus size={12} /></button>
                                  )}
                                </div>
                              </td>

                              <td className={`p-2.5 sm:p-3 sticky right-0 z-10 transition-all border-l shadow-[-10px_0_15px_rgba(0,0,0,0.02)] border-gray-200 group-hover:bg-gray-50 ${isUjian ? 'bg-emerald-50' : 'bg-white'}`}>
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
                      const valCT = record?.[k.cT] || '-';
                      const valCF = record?.[k.cF] || '-';

                      const jT = record?.jurnalTahsin || '-';
                      const jF = record?.jurnalTahfidz || '-';

                      const lastRec = ghostDataMap[student.id];
                      const isTahsinNoSurat = valT === '-' && valH === '-';
                      const hasTahsinGrade = valTNilai !== '-' || valTSNilai !== '-';
                      const hasGhostTahsin = isTahsinNoSurat && lastRec && lastRec[k.t] && lastRec[k.t] !== '-';

                      const isTahfidzNoSurat = valF === '-' && valAF === '-';
                      const hasTahfidzGrade = valFNilai !== '-';
                      const hasGhostTahfidz = isTahfidzNoSurat && lastRec && lastRec[k.f] && lastRec[k.f] !== '-';
                      const isMurojaahEmpty = valM === '-';
                      const isCatatanEmpty = valC === '-' && valCT === '-' && valCF === '-';

                      const isTahsinAchieved = homeTab === 'lesson_plan' && !isTahsinNoSurat && jT !== '-';
                      const isTahfidzAchieved = homeTab === 'lesson_plan' && !isTahfidzNoSurat && jF !== '-';
                      const hasGhostMurojaah = isMurojaahEmpty && lastRec && lastRec[k.m] && lastRec[k.m] !== '-';
                      const hasGhostCatatan = isCatatanEmpty && lastRec && (lastRec[k.c] !== '-' || lastRec[k.cT] !== '-' || lastRec[k.cF] !== '-');
                      const isAbsent = !isCatatanEmpty && ['alpa', 'sakit', 'izin', 'tidak hadir'].some(keyword => String(valC).toLowerCase().includes(keyword));
                      const isLibur = !isCatatanEmpty && String(valC).toLowerCase().includes('libur');
                      const isUjian = !isCatatanEmpty && String(valC).toLowerCase().includes('ujian kenaikan jilid');

                      return (
                        <div key={student.id} id={`student-card-${student.id}`} className={`p-4 flex flex-col gap-4 animate-row-slide-in ${isUjian ? 'bg-emerald-50/80 border-t border-emerald-300 shadow-sm relative' : 'bg-white'}`} style={{ animationDelay: `${index * 0.05}s` }}>
                          {isUjian && (
                            <div className="absolute top-0 right-4 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-b-md shadow-sm">Ujian Jilid</div>
                          )}
                          {/* Info Siswa & Aksi Cepat */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                              {student?.photo ? (
                                <img src={student.photo} className={`w-10 h-10 rounded-full object-cover border transition-all ${(isAbsent || isLibur) ? 'grayscale opacity-50' : isUjian ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`} alt="" />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border transition-all ${(isAbsent || isLibur) ? 'bg-gray-100 text-gray-400 border-gray-200 grayscale opacity-50' : isUjian ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{getInitials(student?.name)}</div>
                              )}
                              <div>
                                <h4 className={`font-extrabold leading-tight transition-colors ${student.name.length > 24 ? 'text-[11px]' : student.name.length > 18 ? 'text-[13px]' : 'text-sm md:text-base'} ${(isAbsent || isLibur) ? 'text-gray-400' : isUjian ? 'text-emerald-700' : 'text-gray-800'}`}>{student.name}</h4>
                                <p className={`text-[10px] font-bold uppercase transition-colors ${(isAbsent || isLibur) ? 'text-gray-300' : isUjian ? 'text-emerald-500' : 'text-gray-400'}`}>Kelas {student.kelas}</p>
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
                            <div onClick={() => handleOpenModal(student, 'tahsin', homeTab)} className={`p-3 bg-blue-50/30 border ${isTahsinAchieved ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.3)]' : 'border-blue-100'} rounded-2xl flex flex-col items-center justify-center min-h-[90px] h-full text-center active:scale-95 transition-all relative`}>
                              {isTahsinAchieved && (
                                <div className="absolute top-2 left-2 text-emerald-600 bg-emerald-100 p-0.5 rounded-md z-10 shadow-sm" title="Target Tercapai">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}
                              <div className="flex items-center gap-1 mb-1.5 text-blue-500 font-black uppercase text-[8px] tracking-widest"><BookOpen size={12} /> Tahsin</div>
                              {!isTahsinNoSurat ? (
                                renderTahsinCard(valT, valH, student.id, activeDate, valTNilai, valTSNilai)
                              ) : hasGhostTahsin ? (
                                <div className={`pointer-events-none transition-all ${hasTahsinGrade ? 'opacity-100' : 'opacity-30 grayscale blur-[0.5px] scale-90'}`} title={`Dari tgl ${getGhostDateLabel(lastRec, 'tahsin')}`}>
                                  {renderTahsinCard(lastRec[k.t], lastRec[k.h], student.id, 'ghost', hasTahsinGrade ? valTNilai : lastRec[k.tNilai], hasTahsinGrade ? valTSNilai : lastRec[k.tsNilai])}
                                </div>
                              ) : hasTahsinGrade ? (
                                renderTahsinCard('-', '-', student.id, activeDate, valTNilai, valTSNilai)
                              ) : <span className="text-gray-300">-</span>}

                              {(!isTahsinNoSurat || hasTahsinGrade) && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'tahsin_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Tahfidz */}
                            <div onClick={() => handleOpenModal(student, 'tahfidz', homeTab)} className={`p-3 bg-purple-50/30 border ${isTahfidzAchieved ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.3)]' : 'border-purple-100'} rounded-2xl flex flex-col items-center justify-center min-h-[90px] h-full text-center active:scale-95 transition-all relative`}>
                              {isTahfidzAchieved && (
                                <div className="absolute top-2 left-2 text-emerald-600 bg-emerald-100 p-0.5 rounded-md z-10 shadow-sm" title="Target Tercapai">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}
                              <div className="flex items-center gap-1 mb-1.5 text-purple-500 font-black uppercase text-[8px] tracking-widest"><Mic size={12} /> Tahfidz</div>
                              {!isTahfidzNoSurat ? (
                                renderTahfidzCard(valF, valAF, student.id, activeDate, valFNilai)
                              ) : hasGhostTahfidz ? (
                                <div className={`pointer-events-none transition-all ${hasTahfidzGrade ? 'opacity-100' : 'opacity-30 grayscale blur-[0.5px] scale-90'}`} title={`Dari tgl ${getGhostDateLabel(lastRec, 'tahfidz')}`}>
                                  {renderTahfidzCard(lastRec[k.f], lastRec[k.af], student.id, 'ghost', hasTahfidzGrade ? valFNilai : lastRec[k.fNilai])}
                                </div>
                              ) : hasTahfidzGrade ? (
                                renderTahfidzCard('-', '-', student.id, activeDate, valFNilai)
                              ) : <span className="text-gray-300">-</span>}

                              {(!isTahfidzNoSurat || hasTahfidzGrade) && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'tahfidz_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Murojaah */}
                            <div onClick={() => handleOpenModal(student, 'murojaah', homeTab)} className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center min-h-[90px] h-full text-center active:scale-95 transition-all relative">
                              <div className="flex items-center gap-1 mb-1.5 text-emerald-500 font-black uppercase text-[8px] tracking-widest"><Repeat size={12} /> Murojaah</div>
                              {!isMurojaahEmpty ? renderMurojaahCard(valM, student.id, activeDate) : (hasGhostMurojaah ? <div className="pointer-events-none opacity-30 grayscale blur-[0.5px] scale-90 transition-all" title={`Dari tgl ${getGhostDateLabel(lastRec, 'murojaah')}`}>{renderMurojaahCard(lastRec[k.m], student.id, 'ghost')}</div> : <span className="text-gray-300">-</span>)
                              }
                              {!isMurojaahEmpty && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveData(e, student.id, activeDate, 'murojaah_all', homeTab); }} className="absolute top-1 right-1 p-1 bg-red-50 text-red-500 rounded-lg">
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            {/* Catatan */}
                            <div onClick={() => handleOpenModal(student, 'catatan', homeTab)} className={`p-3 border rounded-2xl flex flex-col items-center justify-center min-h-[90px] h-full text-center active:scale-95 transition-all relative ${isAbsent ? 'bg-red-50/80 border-red-200' : isLibur ? 'bg-emerald-50/80 border-emerald-200' : 'bg-orange-50/30 border-orange-100'}`}>
                              <div className={`flex items-center gap-1 mb-1.5 font-black uppercase text-[8px] tracking-widest ${isAbsent ? 'text-red-500' : isLibur ? 'text-emerald-500' : 'text-orange-500'}`}><FileText size={12} /> Catatan</div>
                              {!isCatatanEmpty ? (
                                renderCompactCatatan(valC, valCT, valCF, getStatusColor)
                              ) : (hasGhostCatatan ? (
                                <div className="pointer-events-none text-[10px] text-gray-400 opacity-40 blur-[0.5px] italic line-clamp-2 transition-all" title={`Dari tgl ${getGhostDateLabel(lastRec, 'catatan')}`}>
                                  {lastRec[k.cT] && lastRec[k.cT] !== '-' && <div><span className="font-black">T:</span> {lastRec[k.cT]}</div>}
                                  {lastRec[k.cF] && lastRec[k.cF] !== '-' && <div><span className="font-black">F:</span> {lastRec[k.cF]}</div>}
                                  {lastRec[k.c] && lastRec[k.c] !== '-' && <div>{lastRec[k.c]}</div>}
                                </div>
                              ) : <span className="text-gray-300">-</span>)}

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

        {/* Toggle Scroll Navigasi Siswa Mengambang */}
        {filteredStudents.length > 0 && (
          <div className="fixed bottom-24 md:bottom-8 left-4 md:left-8 z-50 flex flex-col items-start gap-3 print:hidden">
            {isNavMenuOpen && currentNavStudent && (
              <div className="flex items-center bg-white p-1.5 sm:p-2 rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
                <button
                  onClick={() => handleScrollToNextStudent(-1)}
                  disabled={currentNavStudent.index === 0}
                  className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm disabled:opacity-30 disabled:hover:bg-blue-50 disabled:hover:text-blue-600 shrink-0"
                  title="Siswa Sebelumnya (Naik)"
                >
                  <ChevronUp size={24} strokeWidth={3} />
                </button>

                <div className="flex flex-col items-center justify-center w-[120px] sm:w-[150px] px-2 text-center overflow-hidden">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Siswa {currentNavStudent.index + 1}/{filteredStudents.length}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 truncate w-full">{currentNavStudent.name}</span>
                </div>

                <button
                  onClick={() => handleScrollToNextStudent(1)}
                  disabled={currentNavStudent.index === filteredStudents.length - 1}
                  className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm disabled:opacity-30 disabled:hover:bg-blue-50 disabled:hover:text-blue-600 shrink-0"
                  title="Siswa Selanjutnya (Turun)"
                >
                  <ChevronDown size={24} strokeWidth={3} />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
              className={`p-3 sm:p-3.5 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isNavMenuOpen ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1'}`}
              title="Navigasi Cepat Siswa"
            >
              {isNavMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <div className="flex items-center gap-2"><div className="bg-white/20 p-1 rounded-full"><ChevronsUpDown size={18} className="sm:w-5 sm:h-5" /></div><span className="text-xs sm:text-sm font-black hidden sm:inline pr-2">Navigasi Scroll</span></div>}
            </button>
          </div>
        )}

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

        {/* ===== MODAL SUCCESS COPY LINK ===== */}
        {copySuccessModal.isOpen && (
          <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/30 relative z-10">
                  <CheckCircle2 size={40} className="text-white drop-shadow-md" />
                </div>
                <h3 className="text-2xl font-black tracking-tight drop-shadow-sm relative z-10">{copySuccessModal.title}</h3>
              </div>
              
              <div className="p-6 bg-white flex flex-col gap-4">
                <p className="text-slate-600 text-sm font-medium leading-relaxed text-center">
                  {copySuccessModal.message}
                </p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tautan Laporan</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{copySuccessModal.link}</p>
                  </div>
                  <button 
                    onClick={() => {
                      copyTextToClipboard(copySuccessModal.link);
                      if (showToast) showToast("Tautan disalin!");
                    }} 
                    className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shrink-0"
                    title="Salin Tautan Saja"
                  >
                    <Link size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => setCopySuccessModal({ isOpen: false, title: '', message: '', link: '' })} 
                  className="w-full mt-2 py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-black shadow-lg shadow-slate-200 active:scale-95 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomeView;
