// File: src/components/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, UserPlus, GraduationCap, User, Lock, Calendar, Mic, Repeat, FileText,
  Eye, EyeOff, Loader2, ShieldAlert, CheckCircle2, HelpCircle, Download, Printer, Users,
  ChevronLeft, ChevronRight, Search, SearchCode, RotateCcw, LayoutGrid, X, Link
} from 'lucide-react';
import { supabase } from './supabase';
import { formatShortDate, getInitials, formatPeriode, formatPrintData, getMonday, formatDateObj, getMonthYear, getDayName } from '../utils/helpers';

const ExpandableText = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text || text === '-') return <div className="text-xs sm:text-sm font-bold text-gray-800">-</div>;
  
  const safeText = String(text);
  const isLong = safeText.length > 50 || safeText.split('\n').length > 2;
  const textSizeClass = safeText.length > 40 ? 'text-[10px] sm:text-xs leading-snug' : safeText.length > 25 ? 'text-[11px] sm:text-[13px] leading-snug' : 'text-xs sm:text-sm leading-relaxed';

  return (
    <div className="flex flex-col items-start w-full">
      <div className={`${textSizeClass} font-bold text-gray-800 whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2 print:line-clamp-none' : ''}`}>
        {safeText}
      </div>
      {isLong && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-[9px] sm:text-[10px] font-black text-emerald-500 hover:text-emerald-600 mt-1 active:scale-95 transition-all bg-emerald-50 px-2 py-0.5 rounded-md print:hidden"
          data-html2canvas-ignore="true"
        >
          {isExpanded ? 'Tutup' : 'Lihat Selengkapnya'}
        </button>
      )}
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [institutionLogo, setInstitutionLogo] = useState(null);

  
  // State khusus Public View
  const [isParentPortal, setIsParentPortal] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [portalSearch, setPortalSearch] = useState('');
  const [kelasList, setKelasList] = useState([]);
  const [portalGuruFilter, setPortalGuruFilter] = useState('');
  const [portalKelasFilter, setPortalKelasFilter] = useState('');
  const [portalHalaqohFilter, setPortalHalaqohFilter] = useState('');
  const [guruHalaqohMap, setGuruHalaqohMap] = useState({});
  
  const [publicStudent, setPublicStudent] = useState(null);
  const [publicTeacher, setPublicTeacher] = useState('');
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [publicTab, setPublicTab] = useState('jurnal');

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    // Beri waktu bagi React untuk me-render seluruh daftar riwayat sebelum mencetak
    setTimeout(() => {
      window.print();
      setIsPrintingAll(false);
    }, 500);
  };
  const [publicWeekStart, setPublicWeekStart] = useState(getMonday(new Date()));

  const handleCopyClassShareLink = () => {
    if (!publicClassHalaqoh) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?shareClass=${encodeURIComponent(publicClassHalaqoh)}`;
    const weekStart = publicWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const periode = formatPeriode(weekStart, weekEnd);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Laporan Kelas/Halaqoh *${publicClassHalaqoh}* periode *${periode}*:\n\n${shareUrl}\n\nTerima kasih.`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("Link Laporan Kelas berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error('Gagal menyalin link:', err);
    });
  };

  const [publicClassHalaqoh, setPublicClassHalaqoh] = useState(null);
  const [publicClassGuru, setPublicClassGuru] = useState('');
  const [publicClassStudents, setPublicClassStudents] = useState([]);

  const changePublicWeek = (offset) => {
    const n = new Date(publicWeekStart);
    n.setDate(n.getDate() + offset);
    setPublicWeekStart(n);
  };

  // Deteksi URL Param untuk Public View
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    const shareClass = params.get('shareClass');
    let isMounted = true;

    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (data && isMounted) {
        if (data.institutionlogo || data.institutionLogo) setInstitutionLogo(data.institutionlogo || data.institutionLogo);
        setGuruHalaqohMap(data.guruhalaqohdata || data.guruHalaqohData || {});
        if (data.kelaslist || data.kelasList) setKelasList(data.kelaslist || data.kelasList);
        
        if (shareId && !publicStudent) {
           fetchPublicData(shareId, data.guruhalaqohdata || data.guruHalaqohData || {});
        }
        if (shareClass && !publicClassHalaqoh) {
           fetchPublicClassData(shareClass, data.guruhalaqohdata || data.guruHalaqohData || {});
        }
      }
    };

    fetchSettings();

    const sub = supabase.channel('public:settings_login')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchSettings)
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, []);

  // Ambil semua daftar siswa jika masuk ke Portal Orang Tua
  useEffect(() => {
    let isMounted = true;
    let sub;

    if (isParentPortal && allStudents.length === 0) {
      setIsPublicLoading(true);
      
      const fetchStudents = async () => {
        const { data } = await supabase.from('students').select('*');
        if (data && isMounted) {
          setAllStudents(data.sort((a, b) => a.name.localeCompare(b.name)));
        }
        if (isMounted) setIsPublicLoading(false);
      };
      
      fetchStudents();
      
      sub = supabase.channel('public:students_login')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchStudents)
        .subscribe();
    }
    return () => {
      isMounted = false;
      if (sub) supabase.removeChannel(sub);
    };
  }, [isParentPortal]);

  const handleSelectStudent = (student) => {
    setPublicStudent(student);
    
    // Cari nama guru secara otomatis
    let foundTeacher = '-';
    for (const [guru, halaqohs] of Object.entries(guruHalaqohMap)) {
      if (Array.isArray(halaqohs) && halaqohs.includes(student.halaqoh)) {
        foundTeacher = guru;
        break;
      }
    }
    setPublicTeacher(foundTeacher);
  };

  const fetchPublicData = async (studentId, guruData) => {
    setIsPublicLoading(true);
    try {
      const { data: sData } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
      if (sData) {
        setPublicStudent(sData);
        
        // Cari guru berdasarkan halaqoh
        for (const [guru, halaqohs] of Object.entries(guruData)) {
          if (Array.isArray(halaqohs) && halaqohs.includes(sData.halaqoh)) {
            setPublicTeacher(guru);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat data publik:", err);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const fetchPublicClassData = async (halaqohName, guruData) => {
    setIsPublicLoading(true);
    setPublicClassHalaqoh(halaqohName);
    try {
      const { data: sData } = await supabase.from('students').select('*').eq('halaqoh', halaqohName);
      if (sData) {
        setPublicClassStudents(sData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        let foundTeacher = '-';
        for (const [guru, halaqohs] of Object.entries(guruData)) {
          if (Array.isArray(halaqohs) && halaqohs.includes(halaqohName)) {
            foundTeacher = guru;
            break;
          }
        }
        setPublicClassGuru(foundTeacher);
      }
    } catch (err) { console.error("Gagal memuat data kelas publik:", err); }
    finally { setIsPublicLoading(false); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    
    const normalizedUsername = username.toLowerCase().trim();

    try {
      if (isRegistering) {
         if (!normalizedUsername || !password || !fullName || !confirmPassword) {
            setError('Lengkapi semua data!'); setIsLoading(false); return;
         }
         if (normalizedUsername === 'jumanjayyidin' || normalizedUsername === 'admin') {
            setError('Username ini tidak dapat digunakan.'); setIsLoading(false); return;
         }
         if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok!'); setIsLoading(false); return;
         }
         
         const cleanName = fullName.trim();
         const { data: userSnap } = await supabase.from('app_users').select('*').eq('username', normalizedUsername).maybeSingle();
         
         if (userSnap) {
            setError('Username sudah terdaftar! Gunakan yang lain.');
         } else {
            // Mendaftar dengan status: pending
            await supabase.from('app_users').insert([{ 
               username: normalizedUsername, 
               password, 
               name: cleanName, 
               role: 'guru', 
               status: 'pending'
            }]);
            
            setSuccessMsg('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dari Admin Utama.');
            setIsRegistering(false);
            setUsername('');
            setPassword('');
            setFullName('');
            setConfirmPassword('');
         }
      } else {
         // Admin Utama (Hardcoded Bypass)
         if (normalizedUsername === 'jumanjayyidin' && password === 'offthewallba123') {
           onLogin({ username: 'jumanjayyidin', name: 'Super Admin', role: 'superadmin', status: 'active' });
           setIsLoading(false);
           return;
         }
         
         // Cek User di Supabase
         const { data: userData } = await supabase.from('app_users').select('*').eq('username', normalizedUsername).maybeSingle();
         
         if (userData) {
            if (userData.password === password) {
               if (userData.role !== 'superadmin' && userData.status !== 'active') {
                   setError('Akun Anda belum disetujui oleh Admin. Harap tunggu atau hubungi Admin.');
               } else {
                   onLogin({ username: userData.username, name: userData.name, role: userData.role });
               }
            } else {
               setError('Password yang Anda masukkan salah!');
            }
         } else {
            setError('Username tidak ditemukan! Silakan daftar terlebih dahulu.');
         }
      }
    } catch(err) {
       console.error(err);
       setError('Terjadi kesalahan jaringan. Cek koneksi Anda.');
    }
    setIsLoading(false);
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    const normalizedUsername = username.toLowerCase().trim();

    try {
      const { data: userSnap } = await supabase.from('app_users').select('*').eq('username', normalizedUsername).maybeSingle();

      if (userSnap) {
        await supabase.from('app_users').update({ resetrequested: true }).eq('username', normalizedUsername);
        setSuccessMsg('Permintaan reset password terkirim! Silakan hubungi Admin Utama.');
        setIsForgotPassword(false);
        setUsername('');
      } else {
        setError('Username tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal mengirim permintaan reset.');
    }
    setIsLoading(false);
  };

  // --- FUNGSI UNDUH GAMBAR (DIREPLIKASI DARI HOMEVIEW) ---
  const handleDownloadImage = async () => {
    setIsLoading(true);
    try {
      if (!window.htmlToImage) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
        document.body.appendChild(script);
        await new Promise((resolve) => script.onload = resolve);
      }
      const element = document.getElementById('share-report-card');
      const dataURL = await window.htmlToImage.toJpeg(element, { quality: 0.85, pixelRatio: 1.5, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      // Menghindari crash saat nama siswa tidak terbaca dengan benar
      link.download = `Laporan_${(publicStudent?.name || 'Siswa').replace(/\s/g, '_')}.jpg`;
      link.href = dataURL;
      link.click();
    } catch (error) { alert("Gagal mengunduh gambar."); }
    finally { setIsLoading(false); }
  };

  const handleDownloadClassReportImage = async (pageId, pageNum) => {
    setIsLoading(true);
    try {
      await document.fonts.ready;
      if (!window.htmlToImage) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
        document.body.appendChild(script);
        await new Promise((resolve) => script.onload = resolve);
      }
      const element = document.getElementById(pageId);
      if (element) {
        const dataURL = await window.htmlToImage.toJpeg(element, { quality: 0.85, pixelRatio: 1.5, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        const safeHalaqoh = String(publicClassHalaqoh || 'Kelas').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `Laporan_Halaqoh_${safeHalaqoh}_Hal${pageNum}.jpg`;
        link.href = dataURL;
        link.click();
      }
    } catch (error) { alert("Gagal mengunduh gambar laporan kelas."); }
    finally { setIsLoading(false); }
  };

  const handleDownloadClassReportPdf = async () => {
    setIsLoading(true);
    try {
      await document.fonts.ready;
      if (!window.htmlToImage) { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js'; document.body.appendChild(script); await new Promise((r) => script.onload = r); }
      if (!window.jspdf) { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; document.body.appendChild(script); await new Promise((r) => script.onload = r); }
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const weekDates = Array.from({length: 5}).map((_, i) => { const d = new Date(publicWeekStart); d.setDate(d.getDate() + i); return d; });
      const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);

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
      if (workDays.length > 3) { pdf.addPage(); await addPageToPdf('class-report-page-2'); }
      const safeHalaqoh = String(publicClassHalaqoh || 'Kelas').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`Laporan_Halaqoh_${safeHalaqoh}.pdf`);
    } catch (error) { alert("Gagal mengunduh PDF laporan kelas."); }
    finally { setIsLoading(false); }
  };

  const renderClassPrintTable = (datesToRender, pageNum, totalPages) => {
    const isThreeDays = datesToRender.length === 3;
    const tableWidth = isThreeDays ? '100%' : '73%';
    const wNo = isThreeDays ? '3%' : '4.1%';
    const wNama = isThreeDays ? '18%' : '24.6%';
    const wDay = isThreeDays ? '26.3%' : '35.6%';
    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

    return (
      <div id={`class-report-page-${pageNum}`} className="w-full min-h-screen p-10 flex flex-col justify-between bg-white text-black print-area" style={{ breakAfter: 'page', pageBreakAfter: pageNum < totalPages ? 'always' : 'auto' }}>
        <div>
          {/* MODERN HEADER CETAK */}
          <div className="flex items-center justify-between mb-10 bg-[#f2fdf5] p-6 rounded-[2rem] border border-green-100">
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {publicTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}
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

          {/* INFO BOX CETAK */}
          <div className="grid grid-cols-4 gap-4 w-full mb-8 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100">
            <div className="flex-1 border-l-4 border-[#00e676] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Bulan</p>
              <p className="text-sm font-extrabold text-gray-800">{getMonthYear(publicWeekStart)}</p>
            </div>
            <div className="flex-1 border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Halaqoh</p>
              <p className="text-sm font-extrabold text-gray-800">{String(publicClassHalaqoh || '-')}</p>
            </div>
            <div className="flex-[1.5] border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Periode</p>
              <p className="text-sm font-extrabold text-gray-800">{formatPeriode(datesToRender[0], datesToRender[datesToRender.length - 1] || datesToRender[0])}</p>
            </div>
            <div className="flex-1 border-l-4 border-[#00b050] pl-3">
              <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Ustadz/ah</p>
              <p className="text-sm font-extrabold text-gray-800">{String(publicClassGuru || '-')}</p>
            </div>
          </div>

          {pageNum > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic px-4 bg-white">Halaman {pageNum}: Lanjutan Kamis & Jumat</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
          )}

          <div className="w-full flex justify-center overflow-hidden">
            <table className="border-collapse table-fixed mx-auto w-full" style={{ width: tableWidth }}>
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-slate-200">
                  <th rowSpan={2} className="p-1.5 text-[9px] font-black text-gray-500 text-center uppercase align-middle bg-gray-50" style={{ width: wNo }}>No</th>
                  <th rowSpan={2} className="p-1.5 text-[9px] font-black text-gray-500 text-center uppercase align-middle bg-gray-50" style={{ width: wNama }}>Nama Siswa</th>
                  {datesToRender.map((dateObj, idx) => (
                    <th key={`head-day-${idx}`} colSpan={3} className="p-1.5 text-center bg-gray-50" style={{ width: wDay }}>
                      <div className="text-[10px] font-black text-green-700 uppercase tracking-widest">{getDayName(dateObj)}</div>
                      <div className="text-[8px] font-bold text-gray-400 mt-0.5">{dateObj && typeof dateObj.getDate === 'function' ? `${dateObj.getDate()} ${getMonthYear(dateObj).split(' ')[0]} ${dateObj.getFullYear()}` : '-'}</div>
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
                {publicClassStudents.map((student, idx) => {
                  const initials = getInitials(student?.name);
                  return (
                    <React.Fragment key={(student?.id || idx) + '-row'}>
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
                          const dateStr = formatDateObj(dateObj);
                          const rec = student?.records?.[dateStr] || {};
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
                              <td className="p-1.5 text-center text-[9px] font-bold text-emerald-600 whitespace-pre-wrap leading-snug bg-white align-top">{formatPrintData(valM, '-', null, null)}</td>
                              <td className="p-1.5 text-center text-[9px] font-bold text-blue-600 whitespace-pre-wrap leading-snug bg-white align-top">{formatPrintData(valT, valH, valTNilai, valTSNilai)}</td>
                              <td className="p-1.5 text-center text-[9px] font-bold text-purple-600 whitespace-pre-wrap leading-snug bg-white align-top">{formatPrintData(valF, valAF, null, valFNilai)}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                      <tr className="border-b-2 border-slate-200 last:border-b-0">
                        {datesToRender.map((dateObj, dIdx) => {
                          const dateStr = formatDateObj(dateObj);
                          const rec = student?.records?.[dateStr] || {};
                          const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';
                          return (
                            <td key={dateStr + '-note'} colSpan={3} className="px-2 py-0.5 text-[7px] text-center bg-white h-auto align-middle">
                              {valC ? <span className="text-red-600 font-bold"><span className="text-orange-500 font-black">Catatan:</span> {valC}</span> : <span className="text-transparent">-</span>}
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
        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-4">
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">Membangun Generasi Qurani Dan Pemimpin Masa Depan</div>
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">PAGE {pageNum} OF {totalPages}</div>
          <div className="text-[8px] font-bold text-gray-400 tracking-widest uppercase">DOC ID: SDITALFITYAN-LP-{formatDateObj(datesToRender[0]).replace(/-/g, '')}-{(publicClassHalaqoh || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]/g, '')}</div>
        </div>
      </div>
    );
  };

  if (publicClassHalaqoh) {
    const weekStart = publicWeekStart;
    const weekDates = Array.from({length: 5}).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);
    const totalPages = workDays.length > 3 ? 2 : 1;

    return (
      <div className="min-h-screen bg-slate-900 text-gray-800 flex flex-col p-0 md:p-6 printable-area print:!static print:p-0 print:m-0 transition-all duration-500">
        
        {/* Header Navigasi & Aksi (Sticky Top) */}
        <div className="bg-slate-800/95 backdrop-blur-md sticky top-0 z-[100000] print:hidden flex flex-col xl:flex-row justify-between items-center p-4 sm:p-6 gap-4 shadow-2xl w-full border-b border-slate-700" data-html2canvas-ignore="true">
          
          {/* Bagian Kiri: Tab & Minggu */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={() => setPublicTab('lesson_plan')} className={`flex-1 sm:flex-none px-5 py-3 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all shadow-md ${publicTab === 'lesson_plan' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Target (Lesson Plan)</button>
               <button onClick={() => setPublicTab('jurnal')} className={`flex-1 sm:flex-none px-5 py-3 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all shadow-md ${publicTab === 'jurnal' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Capaian (Jurnal)</button>
            </div>
            <div className="flex items-center justify-between bg-slate-700 rounded-xl px-2 py-1.5 shadow-md w-full sm:w-auto">
               <button onClick={() => changePublicWeek(-7)} className="p-2 sm:p-2.5 text-slate-400 hover:text-emerald-400 transition-colors"><ChevronLeft size={18}/></button>
               <span className="text-xs sm:text-sm font-bold whitespace-nowrap px-4 text-white">{formatPeriode(weekDates[0], weekDates[4])}</span>
               <button onClick={() => changePublicWeek(7)} className="p-2 sm:p-2.5 text-slate-400 hover:text-emerald-400 transition-colors"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Bagian Kanan: Tombol Unduh & Tutup */}
          <div className="flex flex-wrap justify-center gap-2 w-full xl:w-auto">
            <button onClick={handleCopyClassShareLink} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-colors">
              <Link size={16} />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">Salin Link</span>
            </button>
            <button onClick={() => handleDownloadClassReportImage('class-report-page-1', 1)} disabled={isLoading} className="flex-1 sm:flex-none bg-emerald-500 text-white px-4 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isLoading ? <span className="animate-spin text-sm">⏳</span> : <Download size={16} />}
              <span className="text-[11px] sm:text-xs whitespace-nowrap">Unduh Hal. 1</span>
            </button>
            {totalPages > 1 && (
              <button onClick={() => handleDownloadClassReportImage('class-report-page-2', 2)} disabled={isLoading} className="flex-1 sm:flex-none bg-emerald-500 text-white px-4 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {isLoading ? <span className="animate-spin text-sm">⏳</span> : <Download size={16} />}
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Unduh Hal. 2</span>
              </button>
            )}
            <button onClick={handleDownloadClassReportPdf} disabled={isLoading} className="flex-1 sm:flex-none bg-white text-gray-800 px-4 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
              {isLoading ? <span className="animate-spin text-sm">⏳</span> : <FileText size={16} />}
              <span className="text-[11px] sm:text-xs whitespace-nowrap">Unduh PDF</span>
            </button>
            <button onClick={() => setPublicClassHalaqoh(null)} className="flex-none bg-red-500 text-white px-4 py-3 sm:py-2.5 flex items-center justify-center rounded-xl shadow-lg hover:bg-red-600 transition-colors" title="Tutup">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Kontainer Tabel */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col md:items-center p-0 md:p-6 print:p-0 print:m-0 print:overflow-visible relative">
          
          {/* MOBILE VIEW (CARD-BASED) */}
          <div className="md:hidden w-full flex flex-col gap-4 print:hidden px-4 py-4 pb-24">
            {publicClassStudents.map((student, idx) => (
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
                    const dateStr = formatDateObj(dateObj);
                    const rec = student?.records?.[dateStr] || {};
                    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };
                    
                    const valM = formatPrintData(rec?.[k.m], '-', null, null);
                    const valT = formatPrintData(rec?.[k.t], rec?.[k.h], rec?.[k.tNilai], rec?.[k.tsNilai]);
                    const valF = formatPrintData(rec?.[k.f], rec?.[k.af], null, rec?.[k.fNilai]);
                    const valC = rec?.[k.c] && rec?.[k.c] !== '-' ? String(rec[k.c]) : '';

                    const hasData = valM !== '-' || valT !== '-' || valF !== '-' || valC !== '';
                    if (!hasData) return null;

                    return (
                      <div key={dateStr} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">{getDayName(dateObj)} <span className="text-slate-400 normal-case font-bold ml-1">{formatShortDate(dateObj)}</span></div>
                        <div className="flex flex-col gap-2">
                          {valM !== '-' && (
                            <div>
                              <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-0.5">Murojaah</div>
                              <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{valM}</div>
                            </div>
                          )}
                          {valT !== '-' && (
                            <div>
                              <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-0.5">Tahsin</div>
                              <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{valT}</div>
                            </div>
                          )}
                          {valF !== '-' && (
                            <div>
                              <div className="text-[9px] text-purple-500 font-black uppercase tracking-widest mb-0.5">Tahfidz</div>
                              <div className="text-[11px] font-bold text-slate-700 leading-snug whitespace-pre-wrap">{valF}</div>
                            </div>
                          )}
                          {valC && (
                            <div className="mt-1 text-[10px] text-red-600 font-bold leading-snug"><span className="text-orange-500 font-black uppercase tracking-widest text-[9px]">Catatan:</span><br/> {valC}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {workDays.every(d => {
                    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };
                    const rec = student?.records?.[formatDateObj(d)] || {};
                    return !(rec[k.m] && rec[k.m] !== '-') && !(rec[k.t] && rec[k.t] !== '-') && !(rec[k.f] && rec[k.f] !== '-') && !(rec[k.c] && rec[k.c] !== '-');
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
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
                {workDays.length >= 1 && renderClassPrintTable(workDays.slice(0, 3), 1, totalPages)}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="w-[1000px] min-w-[1000px] shrink-0 print:w-full print:min-w-0 print:shadow-none">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
                  {workDays.length > 3 && renderClassPrintTable(workDays.slice(3, 5), 2, totalPages)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (publicStudent) {
    const weekStart = publicWeekStart;
    const weekDates = Array.from({length: 5}).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

    // Mengambil seluruh tanggal yang memiliki rekaman untuk mode cetak riwayat lengkap
    const allDates = Object.keys(publicStudent.records || {})
      .filter(dateStr => {
        const rec = publicStudent.records[dateStr];
        return (rec[k.t] && rec[k.t] !== '-') || (rec[k.f] && rec[k.f] !== '-') || (rec[k.m] && rec[k.m] !== '-') || (rec[k.c] && rec[k.c] !== '-');
      })
      .sort((a, b) => new Date(b) - new Date(a))
      .map(d => new Date(d));

    const datesToDisplay = isPrintingAll ? allDates : weekDates;

    return ( // Public Student View
      <div className="min-h-screen bg-slate-100 text-gray-800 flex flex-col items-center p-0 md:p-6 overflow-y-auto transition-all duration-500">
        <div className="fixed bottom-6 right-6 sm:top-6 sm:right-6 sm:bottom-auto z-[100] flex flex-col-reverse sm:flex-row gap-3 print:hidden">
           <button onClick={handleDownloadImage} className="bg-emerald-500 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2" title="Unduh Gambar (JPG)">
             <Download size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Unduh JPG</span>
           </button>
           <button onClick={handlePrintAll} className="bg-blue-600 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2" title="Unduh Riwayat Lengkap">
             <FileText size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Riwayat PDF</span>
           </button>
           <button onClick={() => window.print()} className="bg-slate-800 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 border border-slate-700" title="Cetak">
             <Printer size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Cetak</span>
           </button>
           <button onClick={() => setPublicStudent(null)} className="bg-white text-slate-600 border border-slate-200 w-14 h-14 sm:w-auto sm:h-auto sm:p-3 rounded-full sm:rounded-xl shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 mb-2 sm:mb-0" title="Tutup">
             <X size={24} className="sm:w-[20px] sm:h-[20px]" />
           </button>
        </div>

        <div className="w-full flex justify-center p-0 sm:p-4 print:p-0">
          <div id="share-report-card" className="bg-white w-full max-w-[800px] shrink-0 sm:shadow-2xl relative sm:my-8 print:shadow-none print:w-[800px] print:min-w-[800px] print:max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 transition-colors rounded-none sm:rounded-[32px] overflow-hidden">
            {/* Header Laporan */}
            <div className="bg-[#f2fdf5] p-6 sm:p-8 border-b border-green-100 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 transition-colors text-center sm:text-left">
               <div className="w-full sm:w-auto">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#111827] mb-1 sm:mb-2">{publicTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Jurnal Harian Al-Qur'an"}</h1>
                  <p className="text-[#00e676] font-bold text-xs sm:text-sm italic">SDIT Al-Fityan School Bogor</p>
               </div>
               <div className="w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                  {institutionLogo ? <img src={institutionLogo} alt="Logo Instansi" className="w-full h-full object-contain transition-all" /> : <BookOpen size={64} className="text-green-600 sm:w-16 sm:h-16" />}
               </div> 
            </div>

            {/* Info Siswa */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-gray-50 transition-colors text-center sm:text-left">
               <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full sm:w-auto">
               <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#e6fbf0] border-4 sm:border-[5px] border-[#00e676] text-[#00e676] flex items-center justify-center text-4xl sm:text-5xl font-black shrink-0 overflow-hidden shadow-inner">
                  {publicStudent.photo ? <img src={publicStudent.photo} alt={publicStudent.name} className="w-full h-full object-cover" /> : <span>{getInitials(publicStudent.name)}</span>}
               </div>
               <div>
                  <h2 className={`font-black text-gray-800 mb-2 sm:mb-3 ${publicStudent.name.length > 24 ? 'text-lg sm:text-xl' : publicStudent.name.length > 18 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{publicStudent.name}</h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1 sm:mt-0">
                     <span className={`bg-[#e6fbf0] text-green-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold uppercase tracking-widest ${String(publicStudent.kelas || '-').length > 10 ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-xs'}`}>Kelas {publicStudent.kelas || '-'}</span>
                     <span className={`bg-[#e6fbf0] text-green-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold uppercase tracking-widest ${String(publicStudent.halaqoh || '-').length > 20 ? 'text-[8px] sm:text-[10px]' : String(publicStudent.halaqoh || '-').length > 15 ? 'text-[9px] sm:text-[11px]' : 'text-[10px] sm:text-xs'}`}>Kelompok {publicStudent.halaqoh || '-'}</span>
                  </div>
               </div>
               </div>
            </div>

            {/* Navigasi Arsip Mingguan */}
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center print:hidden transition-colors">
               <button onClick={() => changePublicWeek(-7)} className="p-2 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-emerald-500" title="Pekan Sebelumnya"><ChevronLeft size={20} className="sm:w-6 sm:h-6"/></button>
               <div className="flex flex-col items-center text-slate-700">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Periode Laporan</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-black text-slate-700"><Calendar size={14} className="text-emerald-500 sm:w-4 sm:h-4"/> {formatPeriode(weekDates[0], weekDates[4])}</div>
                  
                  {/* Tombol Kembali ke Pekan Ini */}
                  {formatDateObj(weekStart) !== formatDateObj(getMonday(new Date())) && !isPrintingAll && (
                    <button 
                      onClick={() => setPublicWeekStart(getMonday(new Date()))}
                      className="mt-1 sm:mt-1.5 text-[9px] font-bold text-emerald-600 hover:text-emerald-700 underline transition-colors animate-in fade-in slide-in-from-top-1 duration-300"
                    >
                      Kembali ke Pekan Ini
                    </button>
                  )}
               </div> 
               <button onClick={() => changePublicWeek(7)} className="p-2 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-emerald-500" title="Pekan Selanjutnya"><ChevronRight size={20} className="sm:w-6 sm:h-6"/></button>
            </div>
            
            {/* Tab Toggle untuk Target / Capaian */}
            <div className="bg-slate-50 border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 print:hidden transition-colors">
               <button onClick={() => setPublicTab('lesson_plan')} className={`flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black rounded-xl transition-all ${publicTab === 'lesson_plan' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50'}`}>Target (Lesson Plan)</button>
               <button onClick={() => setPublicTab('jurnal')} className={`flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black rounded-xl transition-all ${publicTab === 'jurnal' ? 'bg-blue-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50'}`}>Capaian (Jurnal)</button>
            </div>

            {/* Daftar Hari */}
            <div className="p-4 sm:p-8 flex flex-col gap-4 sm:gap-5 bg-gray-50/50">
               {datesToDisplay.map((dateObj) => {
                  const dateStr = formatDateObj(dateObj);
                  const rec = publicStudent.records?.[dateStr] || {};
                  
                  // Cek apakah ada data di hari tersebut
                  const hasData = (rec[k.t] && rec[k.t] !== '-') || (rec[k.f] && rec[k.f] !== '-') || (rec[k.m] && rec[k.m] !== '-') || (rec[k.c] && rec[k.c] !== '-');
                  if (!hasData) return null;
                  
                  const valT = formatPrintData(rec[k.t], rec[k.h], rec[k.tNilai], rec[k.tsNilai]);
                  const valF = formatPrintData(rec[k.f], rec[k.af], null, rec[k.fNilai]);
                  const valM = formatPrintData(rec[k.m], '-', null, null);
                  const valC = rec[k.c] && rec[k.c] !== '-' ? String(rec[k.c]) : '-';

                  return (
                    <div key={dateStr} className="bg-white border border-gray-100 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-sm print:break-inside-avoid transition-colors">
                       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-5 border-b border-gray-50 pb-3 sm:pb-4">
                          <span className="bg-[#00e676] text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest w-max shadow-sm"> {['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][dateObj.getDay()]}</span>
                          <span className="text-gray-400 dark:text-gray-400 font-bold italic text-xs sm:text-sm">{formatShortDate(dateObj)}</span>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-6">
                              <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                             <div className="flex items-center gap-1.5 mb-1.5 text-blue-500"><BookOpen size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Tahsin</span></div>
                                <ExpandableText text={valT} />
                          </div>
                              <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                             <div className="flex items-center gap-1.5 mb-1.5 text-purple-500"><Mic size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Tahfidz</span></div>
                                <ExpandableText text={valF} />
                          </div>
                              <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                             <div className="flex items-center gap-1.5 mb-1.5 text-emerald-500"><Repeat size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Murojaah</span></div>
                                <ExpandableText text={valM} />
                          </div>
                              <div className="bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-transparent h-full flex flex-col">
                             <div className="flex items-center gap-1.5 mb-1.5 text-orange-500"><FileText size={14} /><span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Catatan</span></div>
                                <ExpandableText text={valC} />
                          </div>
                       </div>
                    </div>
                  );
               })}
               
               {/* Tampilan Jika Pekan Kosong */}
               {datesToDisplay.every(d => { // Add dark mode styles to this empty state
                  const ds = formatDateObj(d); // Fix: Use formatDateObj(d) instead of d
                  const r = publicStudent.records?.[ds] || {};
                  return !((r[k.t] && r[k.t] !== '-') || (r[k.f] && r[k.f] !== '-') || (r[k.m] && r[k.m] !== '-') || (r[k.c] && r[k.c] !== '-'));
               }) && ( 
                  <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40">
                     <Calendar size={48} />
                     <p className="font-bold">{isPrintingAll ? 'Tidak ada riwayat rekaman.' : 'Tidak ada data rekaman pada pekan ini.'}</p>
                  </div>
               )}
            </div>

            {/* Footer Laporan */}
            <div className="bg-[#111827] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white text-center sm:text-left">
               <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Users size={14} /></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Ustadz/ah: <strong className="text-white inline ml-1">{publicTeacher || '-'}</strong></span>
               </div> 
               <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-full bg-[#00e676]/20 flex items-center justify-center"><Calendar size={14} className="text-[#00e676]" /></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-400">Periode: <strong className="text-white inline ml-1">{formatPeriode(weekDates[0], weekDates[4])}</strong></span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 mb-12 text-center flex flex-col items-center gap-2">
           <div className="w-12 h-1 overflow-hidden bg-slate-200 rounded-full mb-2">
              <div className="h-full bg-emerald-500 w-1/2 mx-auto"></div>
           </div>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 Juman Jayyidin</p>
        </div>
      </div>
    );
  }

  // --- TAMPILAN PORTAL PENCARIAN ORANG TUA ---
  if (isParentPortal) {
    const availableGurus = Object.keys(guruHalaqohMap).sort();
    const availableHalaqohs = Array.from(new Set(Object.values(guruHalaqohMap).flat())).sort();
    const isSearching = portalSearch.trim() !== '' || portalKelasFilter !== '' || portalHalaqohFilter !== '' || portalGuruFilter !== '';

    const filtered = allStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(portalSearch.toLowerCase());
      const matchKelas = portalKelasFilter === '' || s.kelas === portalKelasFilter;
      const matchHalaqoh = portalHalaqohFilter === '' || s.halaqoh === portalHalaqohFilter;
      const matchGuru = portalGuruFilter === '' || (guruHalaqohMap[portalGuruFilter] && guruHalaqohMap[portalGuruFilter].includes(s.halaqoh));
      return matchSearch && matchKelas && matchHalaqoh && matchGuru;
    });

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center relative overflow-hidden transition-colors duration-300">
         {/* HEADER PORTAL - AKSES LOGIN & DAFTAR */}
         <header className="w-full bg-white/80 border-slate-100 backdrop-blur-md border-b px-4 sm:px-8 py-4 flex justify-between items-center z-50 sticky top-0 shadow-sm transition-all duration-500">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 sm:w-10 sm:h-10">
                  {institutionLogo ? <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" /> : <BookOpen size={24} className="text-emerald-500" />}
               </div>
               <div className="flex flex-col">
                  <span className="font-arabic font-bold text-slate-800 tracking-tighter text-lg sm:text-2xl transition-all leading-tight">MyQuranPlan</span>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-70 -mt-1"></div>
               </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
               <button 
                 onClick={() => { setIsParentPortal(false); setIsRegistering(false); setIsForgotPassword(false); }}
                 className="text-[10px] sm:text-xs font-bold text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl transition-colors"
               > 
                 Masuk
               </button>
               <button 
                 onClick={() => { setIsParentPortal(false); setIsRegistering(true); setIsForgotPassword(false); }}
                 className="text-[10px] sm:text-xs font-black bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
               >
                 Daftar Guru
               </button>
            </div>
         </header>

         <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981'%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' /%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' transform='rotate(45 50 50)' /%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '100px 100px' }}></div>
         
         <div className="w-full max-w-4xl z-10 px-4 sm:px-8 py-8 md:py-12 flex-1">
            <div className="flex flex-col items-center mb-6 sm:mb-8 text-center px-4">
               <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 transition-transform hover:scale-110 duration-500">
                  {institutionLogo ? <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" /> : <BookOpen size={64} className="text-emerald-500" />}
               </div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Ahlan wa Sahlan, Ayah & Bunda 
               </div>
               <div className="flex flex-col items-center">
                  <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-slate-800 tracking-tighter mb-1 transition-all">MyQuranPlan</h1>
                  <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-2"></div>
               </div>
               <p className="text-slate-500 font-medium max-w-md leading-relaxed">
                  Selamat datang di platform pemantauan hafalan Ananda. Silakan cari nama Ananda untuk melihat target (Lesson Plan) serta capaian harian (Jurnal).
               </p>
            </div>

            <div className="bg-white border-white rounded-[2.5rem] shadow-xl border p-6 sm:p-8 transition-all duration-500">
               <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Ketik nama Ananda..." 
                    value={portalSearch}
                    onChange={(e) => setPortalSearch(e.target.value)} 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-lg font-bold text-slate-700 transition-all"
                  />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16} />
                    <select 
                      value={portalGuruFilter} 
                      onChange={(e) => setPortalGuruFilter(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Semua Ustadz/ah</option>
                      {availableGurus.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="relative group">
                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16} />
                    <select 
                      value={portalKelasFilter} 
                      onChange={(e) => setPortalKelasFilter(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Semua Kelas</option>
                      {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16} />
                    <select 
                      value={portalHalaqohFilter} 
                      onChange={(e) => setPortalHalaqohFilter(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Semua Halaqoh</option>
                      {availableHalaqohs.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
               </div>

               {isSearching && (
                 <button 
                   onClick={() => { setPortalSearch(''); setPortalKelasFilter(''); setPortalHalaqohFilter(''); setPortalGuruFilter(''); }} 
                   className="mb-6 w-full py-3.5 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-100 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300"
                 >
                   <RotateCcw size={14} /> Reset Pencarian
                 </button>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-2 transition-colors">
                  {isPublicLoading ? (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                            <div className="flex flex-col gap-2">
                              <div className="h-4 w-32 sm:w-48 bg-slate-200 rounded-md"></div>
                              <div className="h-3 w-20 sm:w-32 bg-slate-100 rounded-md"></div>
                            </div>
                          </div>
                          <div className="w-5 h-5 bg-slate-100 rounded-md opacity-30"></div>
                        </div>
                      ))}
                    </div>
                  ) : !isSearching ? (
                    <div className="col-span-full py-24 text-center flex flex-col items-center gap-4 text-slate-300 animate-in fade-in duration-700">
                       <SearchCode size={48} className="opacity-20" />
                   <p className="font-medium italic max-w-[280px]">Silakan masukkan nama siswa atau gunakan filter di atas untuk melihat laporan.</p>
                    </div>
                  ) : filtered.length > 0 ? (
                    filtered.map((s, index) => (
                      <button 
                        key={s.id} 
                        onClick={() => handleSelectStudent(s)} 
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-2xl transition-all group animate-row-slide-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4 text-left">
                           <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 font-black group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors overflow-hidden">
                              {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : getInitials(s.name)}
                           </div>
                           <div> 
                              <p className={`font-black text-slate-800 group-hover:text-emerald-700 transition-colors ${s.name.length > 24 ? 'text-xs sm:text-sm whitespace-normal line-clamp-2 leading-tight' : s.name.length > 18 ? 'text-sm sm:text-[15px] whitespace-normal line-clamp-2 leading-tight' : 'text-base truncate'}`}>{s.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas {s.kelas || '-'} • {s.halaqoh || '-'}</p>
                           </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </button> 
                    ))
                  ) : (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold">Siswa tidak ditemukan.</div>
                  )}
               </div>
            </div>
         </div>
         {/* Footer for Parent Portal */} 
         <footer className="w-full py-10 text-center z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">&copy; 2026 Juman Jayyidin. All rights reserved.</p>
         </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden z-0 transition-all duration-500">
      {/* Pola Islami Samar (Islamic Geometric Pattern) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-20"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981'%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' /%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' transform='rotate(45 50 50)' /%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      ></div>

      {/* Efek Background Modern (Blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-green-300/30 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[80px] opacity-70 animate-pulse -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[60px] sm:blur-[80px] opacity-70 animate-pulse -z-10" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-[420px] relative z-10 flex flex-col">
        {/* Card Login / Register */}
        <div className="bg-white/80 border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border flex flex-col relative overflow-hidden transition-all duration-500">
          {/* Garis atas dekoratif */} 
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-[#00e676]"></div>
          
          <div className="flex flex-col items-center mb-10 mt-2">
             <div className="w-28 h-28 flex items-center justify-center mb-2 transition-all">
                {institutionLogo && institutionLogo !== 'logo.png' ? (
                  <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-1000" />
                ) : (
                  <div className="text-emerald-500/80 animate-in fade-in duration-500">
                    {isRegistering ? <UserPlus size={64} /> : isForgotPassword ? <HelpCircle size={64} /> : <BookOpen size={64} />}
                  </div>
                )}
             </div> 
            <div className="flex flex-col items-center">
               <h1 className="font-arabic text-2xl sm:text-3xl font-bold text-slate-800 tracking-tighter transition-all">MyQuranPlan</h1>
               <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-1"></div>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-2 text-center">
              {isRegistering ? 'Daftar Akun Pengajar' : isForgotPassword ? 'Permintaan Reset Password' : 'Ahlan wa sahlan! Silakan masuk.'}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleResetRequest : handleAuth} className="flex flex-col gap-4 w-full">
            {isRegistering && (
              <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 transition-colors group-focus-within:text-emerald-500">Nama Lengkap & Gelar</label>
                <div className="relative flex items-center"> 
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => {setFullName(e.target.value); setError(''); setSuccessMsg('');}} 
                    className="w-full border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 placeholder:font-semibold" 
                    placeholder="Ust. / Usth. Ahmad..." 
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 transition-colors group-focus-within:text-emerald-500">Username</label>
              <div className="relative flex items-center"> 
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => {setUsername(e.target.value); setError(''); setSuccessMsg('');}}
                  className="w-full border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 placeholder:font-semibold" 
                  placeholder="Masukkan username..." 
                  required 
                />
              </div>
            </div>

            {!isRegistering && !isForgotPassword && (
              <div className="text-right -mt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            <div className="group">
              {!isForgotPassword && (
                <> 
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 transition-colors group-focus-within:text-emerald-500">Password</label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => {setPassword(e.target.value); setError(''); setSuccessMsg('');}} 
                      className="w-full border-2 border-slate-100 rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 placeholder:font-semibold" 
                      placeholder="••••••••" 
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {isRegistering && (
              <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 transition-colors group-focus-within:text-emerald-500">Konfirmasi Password</label> 
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => {setConfirmPassword(e.target.value); setError(''); setSuccessMsg('');}} 
                    className="w-full border-2 border-slate-100 rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 placeholder:font-semibold" 
                    placeholder="Ulangi password..." 
                    required={isRegistering} 
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 w-full bg-gradient-to-r from-[#00e676] to-emerald-500 hover:from-emerald-500 hover:to-[#00e676] text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : isRegistering ? 'Ajukan Pendaftaran' : isForgotPassword ? 'Kirim Permintaan Reset' : 'Masuk ke Aplikasi'}
            </button>
          </form>
          
          <div className="mt-6 flex flex-col gap-3 text-center border-t border-slate-100 pt-5">
             {!isRegistering && !isForgotPassword && (
               <button 
                onClick={() => setIsParentPortal(true)} 
                className="w-full bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-sm"
               >
                  <Search size={18} /> Kembali ke MyQuranPlan
               </button> 
             )}
             <button onClick={() => { if(isForgotPassword) setIsForgotPassword(false); else setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); setConfirmPassword(''); }} className="text-xs text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
                {isForgotPassword ? 'Batal dan Kembali ke Login' : isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar sebagai Guru'}
             </button>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 font-bold mt-8 text-center drop-shadow-sm transition-colors">&copy; 2026 Juman Jayyidin. All rights reserved.</p>
      </div>

      {/* Modal Error */}
      {error && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-red-100">
              <ShieldAlert size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 transition-colors">{isRegistering ? 'Gagal Mendaftar' : 'Akses Ditolak'}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed transition-colors">{error}</p>
            <button onClick={() => setError('')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black py-3.5 rounded-xl transition-colors text-sm active:scale-95 transition-all">Mengerti</button>
          </div>
        </div>
      )}

      {/* Modal Success */}
      {successMsg && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5 border-4 border-green-100">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 transition-colors">Pendaftaran Berhasil!</h3>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed transition-colors">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="w-full bg-[#00e676] hover:bg-green-500 text-white font-black py-3.5 rounded-xl transition-colors text-sm active:scale-95 shadow-md shadow-green-200">Siap, Menunggu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;