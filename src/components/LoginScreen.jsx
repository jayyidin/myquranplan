// File: src/components/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  BookOpen, UserPlus, GraduationCap, User, Lock, Calendar, Mic, Repeat, FileText,
  Eye, EyeOff, Loader2, ShieldAlert, CheckCircle2, HelpCircle, Download, Printer, Users,
  ChevronLeft, ChevronRight, Search, SearchCode, RotateCcw, LayoutGrid, X, Link, Star, Sun, Moon, Check
} from 'lucide-react';
import { supabase } from './supabase';
import { formatShortDate, getInitials, formatPeriode, formatPrintData, getMonday, formatDateObj, getMonthYear, getDayName, copyTextToClipboard } from '../utils/helpers';

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
  if (!text || text === '-') return <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">-</div>;

  const safeText = String(text);
  const isLong = safeText.length > 50 || safeText.split('\n').length > 2;
  const textSizeClass = safeText.length > 40 ? 'text-[10px] sm:text-xs leading-snug' : safeText.length > 25 ? 'text-[11px] sm:text-[13px] leading-snug' : 'text-xs sm:text-sm leading-relaxed';

  return (
    <div className="flex flex-col items-start w-full">
      <div className={`${textSizeClass} font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2 print:line-clamp-none' : ''}`}>
        {renderTextWithHighlights(safeText)}
      </div>
      {isLong && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-1 active:scale-95 transition-all bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md print:hidden"
          data-html2canvas-ignore="true"
        >
          {isExpanded ? 'Tutup' : 'Lihat Selengkapnya'}
        </button>
      )}
    </div>
  );
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

const LoginScreen = ({ onLogin, theme, setTheme }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [institutionLogo, setInstitutionLogo] = useState(null);
  const [institutionName, setInstitutionName] = useState('Sekolah');
  const [portalAcademicYear, setPortalAcademicYear] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startYear = now.getMonth() >= 6 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  });
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); };


  // State khusus Public View
  const [isParentPortal, setIsParentPortal] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [portalSearch, setPortalSearch] = useState('');

  // --- DEBOUNCE PENCARIAN (MENGURANGI LAG DI HP) ---
  const [localPortalSearch, setLocalPortalSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setPortalSearch(localPortalSearch), 300);
    return () => clearTimeout(timer);
  }, [localPortalSearch]);

  const [kelasList, setKelasList] = useState([]);
  const [portalGuruFilter, setPortalGuruFilter] = useState('');
  const [portalKelasFilter, setPortalKelasFilter] = useState('');
  const [portalHalaqohFilter, setPortalHalaqohFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('portalHalaqoh') || '';
  });
  const [isHalaqohLocked, setIsHalaqohLocked] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('portalHalaqoh');
  });
  const [guruHalaqohMap, setGuruHalaqohMap] = useState({});

  const [publicStudent, setPublicStudent] = useState(null);
  const [publicTeacher, setPublicTeacher] = useState('');
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [publicTab, setPublicTab] = useState('jurnal');
  const [copySuccessModal, setCopySuccessModal] = useState({ isOpen: false, title: '', message: '', link: '' });
  const [ujianMaterials, setUjianMaterials] = useState({ tahsin: [], tahfidz: [], jadwal: [] });

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    // Beri waktu bagi React untuk me-render seluruh daftar riwayat sebelum mencetak
    setTimeout(() => {
      window.print();
      setIsPrintingAll(false);
    }, 500);
  };
  const [publicWeekStart, setPublicWeekStart] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return getMonday(parsed);
      }
    }
    return getMonday(new Date());
  });

  const handleCopyClassShareLink = async () => {
    if (!publicClassHalaqoh) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const dateParam = formatDateObj(publicWeekStart);
    const shareUrl = `${baseUrl}?shareClass=${encodeURIComponent(publicClassHalaqoh)}&date=${dateParam}`;
    const weekStart = publicWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const periode = formatPeriode(weekStart, weekEnd);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Pemantauan Pembelajaran Al-Qur'an Halaqoh *${publicClassHalaqoh}* periode *${periode}*:\n\n${shareUrl}\n\nTerima kasih.`;

    const copied = await copyTextToClipboard(textToCopy);
    if (copied) {
      setCopySuccessModal({
        isOpen: true,
        title: 'Tautan Berhasil Disalin!',
        message: `Tautan laporan halaqoh untuk kelompok ${publicClassHalaqoh} telah disalin ke clipboard. Anda dapat membagikannya kepada wali murid.`,
        link: shareUrl
      });
    } else {
      showToast("Gagal menyalin tautan laporan.");
    }
  };

  const [publicClassHalaqoh, setPublicClassHalaqoh] = useState(null);
  const [publicClassGuru, setPublicClassGuru] = useState('');
  const [publicClassStudents, setPublicClassStudents] = useState([]);

  const handleCopyShareLink = async () => {
    if (!publicStudent) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const dateParam = formatDateObj(publicWeekStart);
    const shareUrl = `${baseUrl}?share=${publicStudent.id}&date=${dateParam}`;
    const weekStart = publicWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const periode = formatPeriode(weekStart, weekEnd);
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Pemantauan Pembelajaran Al-Qur'an ananda *${publicStudent.name}* periode *${periode}*:\n\n${shareUrl}\n\nTerima kasih.`;

    const copied = await copyTextToClipboard(textToCopy);
    if (copied) {
      setCopySuccessModal({
        isOpen: true,
        title: 'Tautan Berhasil Disalin!',
        message: `Tautan laporan individu untuk ${publicStudent.name} telah disalin ke clipboard. Anda dapat membagikannya kepada wali murid.`,
        link: shareUrl
      });
    } else {
      showToast("Gagal menyalin tautan laporan.");
    }
  };

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
        if (data.institutionname || data.institutionName) setInstitutionName(data.institutionname || data.institutionName);
        setGuruHalaqohMap(data.guruhalaqohdata || data.guruHalaqohData || {});
        if (data.kelaslist || data.kelasList) setKelasList(data.kelaslist || data.kelasList);
        if (data.ujian_materials) {
          setUjianMaterials(data.ujian_materials);
          const rawYear = data.ujian_materials?.reportSettings?.tahunPelajaran;
          if (rawYear) setPortalAcademicYear(String(rawYear).replace(/\s*\/\s*/g, '-'));
        }

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
    setPublicTab('jurnal');
    setPublicStudent(student);

    // Cari nama guru secara otomatis
    let foundTeacher = '-';
    for (const [guru, halaqohs] of Object.entries(guruHalaqohMap)) {
      if (guru !== '_order_' && Array.isArray(halaqohs) && halaqohs.includes(student.halaqoh)) {
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
        setPublicTab('jurnal');
        setPublicStudent(sData);

        // Cari guru berdasarkan halaqoh
        for (const [guru, halaqohs] of Object.entries(guruData)) {
          if (guru !== '_order_' && Array.isArray(halaqohs) && halaqohs.includes(sData.halaqoh)) {
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
      // Gunakan ilike untuk case-insensitive match, dan pastikan string bebas dari spasi berlebih
      const safeName = halaqohName.trim();
      const { data: sData } = await supabase.from('students').select('*').ilike('halaqoh', safeName);
      if (sData) {
        setPublicClassStudents(sData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        let foundTeacher = '-';
        for (const [guru, halaqohs] of Object.entries(guruData)) {
          if (guru !== '_order_' && Array.isArray(halaqohs) && halaqohs.some(h => h.toLowerCase() === safeName.toLowerCase())) {
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
    const rawUsername = username.trim();

    // Fungsi mengubah spasi menjadi garis bawah (underscore) agar format email valid
    const generateSafeEmail = (uname) => `${uname.toLowerCase().replace(/\s+/g, '_')}@myquranplan.local`;

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
        if (password.length < 8) {
          setError('Password minimal harus terdiri dari 8 karakter!'); setIsLoading(false); return;
        }

        const cleanName = fullName.trim();

        let { data: userSnap } = await supabase.rpc('get_user_login_data', { lookup_username: normalizedUsername }).maybeSingle();
        if (!userSnap && rawUsername !== normalizedUsername) {
          const { data: altSnap } = await supabase.rpc('get_user_login_data', { lookup_username: rawUsername }).maybeSingle();
          if (altSnap) userSnap = altSnap;
        }

        if (userSnap) {
          setError('Username sudah terdaftar! Gunakan yang lain.');
        } else {
          // Supabase Auth membutuhkan format email, kita gunakan format dummy dengan username
          const dummyEmail = generateSafeEmail(normalizedUsername);
          // 1. Mendaftar menggunakan Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: dummyEmail,
            password: password,
            options: {
              data: { name: cleanName, username: normalizedUsername, role: 'guru' }
            }
          });

          if (authError) {
            setError('Gagal mendaftar: ' + authError.message);
          } else {
            // 2. Simpan profil tambahan ke app_users dan sembunyikan password
            const { error: insertError } = await supabase.from('app_users').insert([{
              id: authData.user?.id,
              username: normalizedUsername,
              password: '[SECURED_BY_SUPABASE]', // Dummy password agar Plaintext aman
              name: cleanName,
              role: 'guru',
              status: 'pending'
            }]);

            if (insertError) {
              setError('Gagal menyimpan profil: ' + insertError.message);
              setIsLoading(false);
              return;
            }

            // 3. Logout paksa karena akun masih pending (Supabase biasanya otomatis login setelah signUp)
            await supabase.auth.signOut();

            setSuccessMsg('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dari Admin Utama.');
            setIsRegistering(false);
            setUsername('');
            setPassword('');
            setFullName('');
            setConfirmPassword('');
          }
        }
      } else {

        // Cek User Profil di Supabase
        let { data: userData } = await supabase.rpc('get_user_login_data', { lookup_username: normalizedUsername }).maybeSingle();
        if (!userData && rawUsername !== normalizedUsername) {
          const { data: altData } = await supabase.rpc('get_user_login_data', { lookup_username: rawUsername }).maybeSingle();
          if (altData) userData = altData;
        }

        if (userData) {
          if (userData.role !== 'superadmin') {
            if (userData.status === 'pending') {
              setError('Akun Anda belum disetujui oleh Admin. Harap tunggu atau hubungi Admin.');
              setIsLoading(false);
              return;
            } else if (userData.status === 'inactive') {
              setError('Akun login ini telah dinonaktifkan. Silakan hubungi Admin Utama.');
              setIsLoading(false);
              return;
            }
          }

          const loginEmail = generateSafeEmail(userData.username);

          // Login menggunakan sistem autentikasi resmi Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
          });

          if (authError) {
            // Auto-Migration: Jika user ada di DB lama (Plaintext) tapi belum ada di Supabase Auth
            if (userData.password === password && userData.password !== '[SECURED_BY_SUPABASE]') {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: loginEmail,
                password: password,
                options: { data: { name: userData.name, username: userData.username, role: userData.role } }
              });

              if (signUpError) {
                if (signUpError.message.toLowerCase().includes('already registered')) {
                  setError('Inkonsistensi data: Akun sudah ada di Supabase Auth tapi passwordnya berbeda. Solusi: Hapus user tersebut dari menu Authentication di Supabase, lalu coba login kembali.');
                } else {
                  setError('Gagal sinkronisasi akun: ' + signUpError.message);
                }
              } else {
                // PENTING: Update app_users untuk menyelesaikan migrasi SEBELUM redirect
                await supabase.from('app_users').update({ id: signUpData.user?.id, password: '[SECURED_BY_SUPABASE]' }).eq('username', userData.username);

                // Paksa login untuk memastikan sesi terbuat (berjaga-jaga jika signUp tertahan oleh email)
                const { error: signInErr } = await supabase.auth.signInWithPassword({
                  email: loginEmail,
                  password: password,
                });
                if (signInErr) setError("Migrasi sukses, tapi auto-login gagal. Pastikan pengaturan 'Confirm email' di Supabase dalam keadaan OFF, lalu coba login lagi.");
                else if (onLogin) {
                  onLogin({ username: userData.username, name: userData.name, role: userData.role });
                }
              }
            } else {
              if (authError.message.toLowerCase().includes('invalid login credentials')) {
                setError('Password yang Anda masukkan salah!');
              } else {
                setError(`Gagal Login: ${authError.message}`);
              }
            }
          } else {
            // BERHASIL LOGIN NORMAL
            // Perbaiki ID & Password jika sebelumnya Auth sukses tapi app_users gagal diupdate
            if (userData.password !== '[SECURED_BY_SUPABASE]') {
              await supabase.from('app_users').update({ id: authData.user?.id, password: '[SECURED_BY_SUPABASE]' }).eq('username', userData.username);
            }
            if (onLogin) {
              onLogin({ username: userData.username, name: userData.name, role: userData.role });
            }

            return; // Supabase auth listener di App.jsx akan menangani transisi halaman SPA secara otomatis
          }
        } else {
          setError('Username tidak ditemukan! Silakan daftar terlebih dahulu.');
        }
      }
    } catch (err) {
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
    const rawUsername = username.trim();

    try {
      let { data: userSnap } = await supabase.rpc('get_user_login_data', { lookup_username: normalizedUsername }).maybeSingle();
      if (!userSnap && rawUsername !== normalizedUsername) {
        const { data: altSnap } = await supabase.rpc('get_user_login_data', { lookup_username: rawUsername }).maybeSingle();
        if (altSnap) userSnap = altSnap;
      }

      if (userSnap) {
        await supabase.from('app_users').update({ resetrequested: true }).eq('username', userSnap.username);
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
    } catch (error) { showToast("Gagal mengunduh gambar."); }
    finally { setIsLoading(false); }
  };

  if (publicClassHalaqoh && !publicStudent) {
    const weekStart = publicWeekStart;
    const weekDates = Array.from({ length: 5 }).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const workDays = weekDates.filter(d => d && d.getDay() !== 0 && d.getDay() !== 6);
    const totalPages = workDays.length > 3 ? 2 : 1;
    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

    return (
      <div className="h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col p-0 md:p-6 printable-area print:!static print:p-0 print:m-0 transition-all duration-500">

        {/* Header Navigasi & Aksi (Sticky Top) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-[100000] print:hidden flex flex-col xl:flex-row justify-between items-center p-4 sm:p-6 gap-4 shadow-sm w-full border-b border-slate-200 dark:border-slate-800" data-html2canvas-ignore="true">

          {/* Bagian Kiri: Minggu */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 shadow-sm w-full sm:w-auto">
              <button onClick={() => changePublicWeek(-7)} className="p-2 sm:p-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap px-4 text-slate-700 dark:text-slate-200">{formatPeriode(weekDates[0], weekDates[4])}</span>
              <button onClick={() => changePublicWeek(7)} className="p-2 sm:p-2 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-lg transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Bagian Kanan: Tombol Unduh & Tutup */}
          <div className="flex flex-wrap justify-center gap-2 w-full xl:w-auto">
            <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex-none bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-3 sm:py-2.5 flex items-center justify-center rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Mode Gelap/Terang">
              {theme === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
            </button>
            <button onClick={handleCopyClassShareLink} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-colors">
              <Link size={16} />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">Salin Link</span>
            </button>
            <button onClick={() => setPublicClassHalaqoh(null)} className="flex-none bg-red-500 text-white px-4 py-3 sm:py-2.5 flex items-center justify-center rounded-xl shadow-lg hover:bg-red-600 transition-colors" title="Tutup">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Kontainer Tabel */}
        <div className="w-full flex-1 overflow-y-auto overscroll-y-contain overflow-x-hidden custom-scrollbar flex flex-col md:items-center p-0 md:p-6 print:p-0 print:m-0 print:overflow-visible relative" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* TAMPILAN NAMA SISWA */}
          <div className="w-full max-w-5xl px-4 py-6 print:hidden min-h-[400px]">
            {isPublicLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-500 animate-in fade-in duration-500">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-bold text-slate-500">Memuat data siswa...</p>
              </div>
            ) : publicClassStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicClassStudents.map((student, idx) => (
                  <button key={student.id} onClick={() => handleSelectStudent(student)} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md dark:hover:shadow-emerald-500/10 transition-all group text-left animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors overflow-hidden">
                      {student?.photo && student.photo !== '' ? (
                        <img src={student.photo} alt={student?.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(student?.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-sm truncate transition-colors">{student?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Kelas {student?.kelas || '-'}</div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-black text-slate-700 dark:text-slate-200">Belum Ada Siswa</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Sistem tidak menemukan siswa di kelompok halaqoh <strong className="text-emerald-600 dark:text-emerald-400">{publicClassHalaqoh}</strong>.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (publicStudent) {
    const weekStart = publicWeekStart;
    const weekDates = Array.from({ length: 5 }).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const k = publicTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

    // Mengambil seluruh tanggal yang memiliki rekaman untuk mode cetak riwayat lengkap
    const allDates = Object.keys(publicStudent.records || {})
      .filter(dateStr => {
        const rec = publicStudent.records[dateStr];
        return (rec[k.t] && rec[k.t] !== '-') || (rec[k.tNilai] && rec[k.tNilai] !== '-') || (rec[k.tsNilai] && rec[k.tsNilai] !== '-') ||
          (rec[k.f] && rec[k.f] !== '-') || (rec[k.fNilai] && rec[k.fNilai] !== '-') ||
          (rec[k.m] && rec[k.m] !== '-') || (rec[k.c] && rec[k.c] !== '-') || (rec[k.cT] && rec[k.cT] !== '-') || (rec[k.cF] && rec[k.cF] !== '-');
      })
      .sort((a, b) => new Date(b) - new Date(a))
      .map(d => new Date(d));

    // --- SOLUSI INPUT JARANG: Ambil Status Terakhir (Hanya Mutabaah) ---
    let latestTahsin = null;
    let latestTahfidz = null;
    let latestMurojaah = null;

    const jurnalK = { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

    const sortedAllDatesStr = Object.keys(publicStudent.records || {})
      .sort((a, b) => new Date(b) - new Date(a));

    for (const dateStr of sortedAllDatesStr) {
      const rec = publicStudent.records[dateStr];
      const isAbsent = ['alpa', 'sakit', 'izin', 'tidak hadir', 'libur'].some(kw => String(rec[jurnalK.c] || rec.catatan || '').toLowerCase().includes(kw));
      if (isAbsent) continue;

      if (!latestTahsin && ((rec[jurnalK.t] && rec[jurnalK.t] !== '-') || (rec[jurnalK.h] && rec[jurnalK.h] !== '-'))) {
        latestTahsin = { date: dateStr, t: rec[jurnalK.t], h: rec[jurnalK.h], tNilai: rec[jurnalK.tNilai], tsNilai: rec[jurnalK.tsNilai] };
      }
      if (!latestTahfidz && ((rec[jurnalK.f] && rec[jurnalK.f] !== '-') || (rec[jurnalK.af] && rec[jurnalK.af] !== '-'))) {
        latestTahfidz = { date: dateStr, f: rec[jurnalK.f], af: rec[jurnalK.af], fNilai: rec[jurnalK.fNilai] };
      }
      if (!latestMurojaah && (rec[jurnalK.m] && rec[jurnalK.m] !== '-')) {
        latestMurojaah = { date: dateStr, m: rec[jurnalK.m] };
      }
      if (latestTahsin && latestTahfidz && latestMurojaah) break;
    }

    const studentJadwal = Array.isArray(ujianMaterials.jadwal) ? (() => {
      const assignedMaterials = [];
      const studentHalaqoh = publicStudent.halaqoh || '';

      const combinedTahsin = (ujianMaterials.tahsin || []).filter(m => {
          if (!studentHalaqoh) return !m.halaqoh || m.halaqoh === 'Semua';
          if (m.halaqoh === studentHalaqoh) return true;
          const localNames = (ujianMaterials.tahsin || []).filter(x => x.halaqoh === studentHalaqoh).map(x => x.name);
          if ((!m.halaqoh || m.halaqoh === 'Semua') && !localNames.includes(m.name)) return true;
          return false;
      });
      const validTahsin = combinedTahsin.filter(m => !(m.students && m.students.includes('HIDDEN')));

      validTahsin.forEach(m => {
          if (typeof m === 'string') {
              assignedMaterials.push(m);
          } else if (m.students && (m.students.includes('all') || m.students.some(id => String(id) === String(publicStudent.id)))) {
              assignedMaterials.push(m.name);
          } else if (!m.students) {
              assignedMaterials.push(m.name);
          }
      });

      const combinedTahfidz = (ujianMaterials.tahfidz || []).filter(m => {
          if (!studentHalaqoh) return !m.halaqoh || m.halaqoh === 'Semua';
          if (m.halaqoh === studentHalaqoh) return true;
          const localNames = (ujianMaterials.tahfidz || []).filter(x => x.halaqoh === studentHalaqoh).map(x => x.name);
          if ((!m.halaqoh || m.halaqoh === 'Semua') && !localNames.includes(m.name)) return true;
          return false;
      });
      const validTahfidz = combinedTahfidz.filter(m => !(m.students && m.students.includes('HIDDEN')));

      validTahfidz.forEach(m => {
          if (typeof m === 'string') {
              assignedMaterials.push(m);
          } else if (m.students && (m.students.includes('all') || m.students.some(id => String(id) === String(publicStudent.id)))) {
              assignedMaterials.push(m.name);
          } else if (!m.students) {
              assignedMaterials.push(m.name);
          }
      });

      const combinedJadwal = (ujianMaterials.jadwal || []).filter(j => {
          if (!studentHalaqoh) return !j.halaqoh || j.halaqoh === 'Semua';
          if (j.halaqoh === studentHalaqoh) return true;
          const localIds = (ujianMaterials.jadwal || []).filter(x => x.halaqoh === studentHalaqoh).map(x => x.id);
          if ((!j.halaqoh || j.halaqoh === 'Semua') && !localIds.includes(j.id)) return true;
          return false;
      });
      const validJadwal = combinedJadwal.filter(j => !j.isHidden);

      const today = new Date();
      today.setHours(0,0,0,0);

      const upcoming = [];
      validJadwal.forEach(j => {
          if (!j.tanggal || !j.materi) return;
          const examDate = new Date(j.tanggal);
          if (j.tanggal && j.tanggal.includes('-')) {
              const parts = j.tanggal.split('-');
              if (parts.length === 3) {
                  examDate.setFullYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              }
          }
          examDate.setHours(0,0,0,0);
          if (examDate >= today) {
              const relevantMaterials = j.materi.filter(mat => assignedMaterials.includes(mat));
              if (relevantMaterials.length > 0) {
                  upcoming.push({ ...j, relevantMaterials });
              }
          }
      });

      return upcoming.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));
    })() : [];

    const datesToDisplay = isPrintingAll ? allDates : weekDates;

    return ( // Public Student View
      <div className="h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 text-gray-800 dark:text-slate-200 flex flex-col items-center p-0 md:p-6 overflow-y-auto overscroll-y-contain custom-scrollbar transition-all duration-500" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="fixed bottom-6 right-6 sm:top-6 sm:right-6 sm:bottom-auto z-[100] flex flex-col-reverse sm:flex-row gap-3 print:hidden">
          <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-14 h-14 sm:w-auto sm:h-auto sm:p-3 rounded-full sm:rounded-xl shadow-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 mb-2 sm:mb-0" title="Ganti Tema">
            {theme === 'dark' ? <Sun size={24} className="sm:w-[20px] sm:h-[20px] text-amber-500" /> : <Moon size={24} className="sm:w-[20px] sm:h-[20px]" />}
          </button>
          <button onClick={handleDownloadImage} className="bg-emerald-500 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2" title="Unduh Gambar (JPG)">
            <Download size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Unduh JPG</span>
          </button>
          <button onClick={handlePrintAll} className="bg-blue-600 text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2" title="Unduh Riwayat Lengkap">
            <FileText size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Riwayat PDF</span>
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 dark:bg-black text-white w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full sm:rounded-xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 border border-slate-700 dark:border-slate-800" title="Cetak">
            <Printer size={24} className="sm:w-[20px] sm:h-[20px]" /> <span className="hidden sm:inline text-sm font-bold">Cetak</span>
          </button>
          <button onClick={() => setPublicStudent(null)} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-14 h-14 sm:w-auto sm:h-auto sm:p-3 rounded-full sm:rounded-xl shadow-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 mb-2 sm:mb-0" title="Tutup">
            <X size={24} className="sm:w-[20px] sm:h-[20px]" />
          </button>
        </div>

        <div className="w-full flex justify-center p-0 sm:p-4 print:p-0">
          <div id="share-report-card" className="bg-white dark:bg-slate-900 w-full max-w-[800px] shrink-0 sm:shadow-2xl relative sm:my-8 print:shadow-none print:w-[800px] print:min-w-[800px] print:max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 transition-colors rounded-none sm:rounded-[32px] overflow-hidden">

            {/* Header Laporan */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-900/20 p-6 sm:p-10 border-b border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-6 text-center sm:text-left relative overflow-hidden">
              <div className="w-full sm:w-auto relative z-10">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 mb-1 sm:mb-2 tracking-tight">
                  {publicTab === 'lesson_plan' ? "Lesson Plan Al-Qur'an" : "Mutabaah Al-Qur'an"}
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm tracking-wide uppercase leading-snug">
                  Pemantauan Pembelajaran Al-Qur'an {institutionName}
                </p>
                <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Tahun Ajaran {portalAcademicYear}
                </p>
              </div>
              <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border border-emerald-100/50 dark:border-emerald-500/20 p-3 sm:p-4 relative z-10">
                {institutionLogo ? <img src={institutionLogo} alt="Logo Instansi" className="w-full h-full object-contain" /> : <BookOpen size={48} className="text-emerald-500" />}
              </div>

              {/* Decorative Shapes */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Info Siswa */}
            <div className="p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-gray-50 dark:border-slate-800 text-center sm:text-left bg-white dark:bg-slate-900 z-10 relative">
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 w-full sm:w-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-[6px] sm:border-[8px] border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-4xl sm:text-5xl font-black shrink-0 overflow-hidden shadow-lg relative">
                  {publicStudent.photo ? <img src={publicStudent.photo} alt={publicStudent.name} className="w-full h-full object-cover" /> : <span>{getInitials(publicStudent.name)}</span>}
                </div>
                <div>
                  <h2 className={`font-black text-slate-800 dark:text-slate-100 mb-3 sm:mb-4 ${publicStudent.name.length > 24 ? 'text-xl sm:text-2xl' : publicStudent.name.length > 18 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} tracking-tight`}>{publicStudent.name}</h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest border border-slate-200/60 dark:border-slate-700 shadow-sm">Kelas {publicStudent.kelas || '-'}</span>
                    <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest border border-emerald-100/60 dark:border-emerald-500/20 shadow-sm">Klp: {publicStudent.halaqoh || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS TERAKHIR (LATEST PROGRESS) - Solusi input jarang */}
            {(latestTahsin || latestTahfidz || latestMurojaah) && !isPrintingAll && (
              <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-6 bg-amber-400 rounded-full"></div>
                  <h3 className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Status Terakhir <span className="text-slate-400 dark:text-slate-500 normal-case text-[10px] sm:text-xs font-bold ml-1">(Pembaruan Terkini)</span></h3>
                </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                  {/* Latest Tahsin */}
                  {latestTahsin && (
                  <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[9px] font-black px-2 py-1 rounded-bl-xl border-b border-l border-blue-100 dark:border-blue-500/20">{formatShortDate(new Date(latestTahsin.date))}</div>
                      <div className="flex items-center gap-2 mb-3 mt-1 sm:mt-0">
                      <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md sm:rounded-lg"><BookOpen size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          Tahsin
                        </span>
                      </div>
                    <div className="pl-0 sm:pl-1"><ExpandableText text={formatPrintData(latestTahsin.t, latestTahsin.h, latestTahsin.tNilai, latestTahsin.tsNilai)} /></div>
                    </div>
                  )}

                  {/* Latest Tahfidz */}
                  {latestTahfidz && (
                  <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-purple-100 dark:border-purple-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 text-[9px] font-black px-2 py-1 rounded-bl-xl border-b border-l border-purple-100 dark:border-purple-500/20">{formatShortDate(new Date(latestTahfidz.date))}</div>
                      <div className="flex items-center gap-2 mb-3 mt-1 sm:mt-0">
                      <div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-md sm:rounded-lg"><Mic size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 flex items-center gap-1">
                          Tahfidz
                        </span>
                      </div>
                    <div className="pl-0 sm:pl-1"><ExpandableText text={formatPrintData(latestTahfidz.f, latestTahfidz.af, null, latestTahfidz.fNilai)} /></div>
                    </div>
                  )}

                  {/* Latest Murojaah */}
                  {latestMurojaah && (
                  <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[9px] font-black px-2 py-1 rounded-bl-xl border-b border-l border-emerald-100 dark:border-emerald-500/20">{formatShortDate(new Date(latestMurojaah.date))}</div>
                      <div className="flex items-center gap-2 mb-3 mt-1 sm:mt-0">
                      <div className="p-1 sm:p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md sm:rounded-lg"><Repeat size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Murojaah</span>
                      </div>
                    <div className="pl-0 sm:pl-1"><ExpandableText text={formatPrintData(latestMurojaah.m, '-', null, null)} /></div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* JADWAL UJIAN MENDATANG */}
            {studentJadwal.length > 0 && !isPrintingAll && (
              <div className="p-6 sm:p-10 bg-indigo-50/30 dark:bg-slate-900/50 border-b border-indigo-100/50 dark:border-slate-800 print:hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Jadwal Ujian Mendatang</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentJadwal.map((jadwal, idx) => {
                     const examDate = new Date(jadwal.tanggal);
                     if (jadwal.tanggal && jadwal.tanggal.includes('-')) {
                         const parts = jadwal.tanggal.split('-');
                         if (parts.length === 3) {
                             examDate.setFullYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                             examDate.setHours(0,0,0,0);
                         }
                     }
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const diffTime = examDate.getTime() - today.getTime();
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                     const formattedDate = `${days[examDate.getDay()]}, ${examDate.getDate()} ${months[examDate.getMonth()]} ${examDate.getFullYear()}`;

                     return (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group">
                           <div className="flex items-center gap-3 mb-4">
                             <div className={`p-2.5 rounded-xl ${diffDays === 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : diffDays === 1 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}><Calendar size={18} strokeWidth={2.5} /></div>
                             <div className="flex flex-col flex-1 min-w-0">
                               <span className={`font-black text-sm uppercase tracking-widest leading-none truncate ${diffDays === 0 ? 'text-red-600 dark:text-red-400' : diffDays === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{formattedDate}</span>
                               {diffDays === 0 ? (
                                <span className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500 text-white w-max">SEDANG BERLANGSUNG</span>
                               ) : diffDays === 1 ? (
                                <span className="mt-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white w-max">BESOK</span>
                               ) : (
                                <span className="text-[10px] font-bold text-slate-400 mt-1">{diffDays} Hari Lagi</span>
                               )}
                             </div>
                           </div>
                           <div className="flex flex-wrap gap-1.5">
                             {jadwal.relevantMaterials.map((m, i) => (
                                <span key={i} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-indigo-100/50 dark:border-indigo-500/20">{m}</span>
                             ))}
                           </div>
                        </div>
                     )
                  })}
                </div>
              </div>
            )}

            {/* Navigasi & Tab (Segmented Control style) */}
            <div className="bg-slate-50/80 dark:bg-slate-900/80 px-4 sm:px-10 py-5 flex flex-col lg:flex-row justify-between items-center gap-5 print:hidden border-b border-slate-100 dark:border-slate-800">
              {/* Navigasi Arsip Mingguan */}
              <div className="flex items-center justify-between w-full lg:w-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 p-1.5">
                <button onClick={() => changePublicWeek(-7)} className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400"><ChevronLeft size={20} /></button>
                <div className="flex flex-col items-center px-4 sm:px-6 min-w-[140px]">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Periode Laporan</span>
                  <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">{formatPeriode(weekDates[0], weekDates[4])}</span>
                </div>
                <button onClick={() => changePublicWeek(7)} className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400"><ChevronRight size={20} /></button>
              </div>

              {/* Tab Toggle */}
              <div className="flex w-full lg:w-auto bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                <button onClick={() => setPublicTab('lesson_plan')} className={`flex-1 lg:flex-none py-2.5 sm:py-3 px-6 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-300 ${publicTab === 'lesson_plan' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Target (Lesson Plan)</button>
                <button onClick={() => setPublicTab('jurnal')} className={`flex-1 lg:flex-none py-2.5 sm:py-3 px-6 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-300 ${publicTab === 'jurnal' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Mutabaah</button>
              </div>
            </div>

            {/* Kembali ke pekan ini */}
            {formatDateObj(weekStart) !== formatDateObj(getMonday(new Date())) && !isPrintingAll && (
              <div className="bg-amber-50/50 dark:bg-amber-500/10 text-center py-2 border-b border-amber-100 dark:border-amber-500/20 print:hidden">
                <button
                  onClick={() => setPublicWeekStart(getMonday(new Date()))}
                  className="text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RotateCcw size={14} /> Kembali ke Pekan Ini
                </button>
              </div>
            )}

            {/* Daftar Hari */}
            <div className="p-4 sm:p-10 flex flex-col gap-5 sm:gap-6 bg-[#f8fafc] dark:bg-slate-950">
              {datesToDisplay.map((dateObj) => {
                const dateStr = formatDateObj(dateObj);
                const rec = publicStudent.records?.[dateStr] || {};

                // Cek apakah ada data di hari tersebut
                const hasData = (rec[k.t] && rec[k.t] !== '-') || (rec[k.f] && rec[k.f] !== '-') || (rec[k.m] && rec[k.m] !== '-') || (rec[k.c] && rec[k.c] !== '-') || (rec[k.cT] && rec[k.cT] !== '-') || (rec[k.cF] && rec[k.cF] !== '-');
                if (!hasData) return null;

                const valT = formatPrintData(rec[k.t], rec[k.h], rec[k.tNilai], rec[k.tsNilai]);
                const valF = formatPrintData(rec[k.f], rec[k.af], null, rec[k.fNilai]);
                const valM = formatPrintData(rec[k.m], '-', null, null);
                const valC = rec[k.c] && rec[k.c] !== '-' ? String(rec[k.c]) : '-';
                const valCT = rec[k.cT] && rec[k.cT] !== '-' ? String(rec[k.cT]) : '-';
                const valCF = rec[k.cF] && rec[k.cF] !== '-' ? String(rec[k.cF]) : '-';

                return (
                  <div key={dateStr} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[20px] sm:rounded-[2rem] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 print:break-inside-avoid relative overflow-hidden group">

                    {/* Indicator Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400 opacity-80"></div>

                <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 pl-1 sm:pl-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Calendar size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex flex-col">
                      <span className="text-[11px] sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider"> {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()]}</span>
                      <span className="text-[9px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">{formatShortDate(dateObj)}</span>
                        </div>
                      </div>
                    </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-5 pl-0 sm:pl-3">
                      {/* Tahsin */}
                  <div className="bg-blue-50/40 dark:bg-blue-500/5 p-3 sm:p-4 rounded-[1rem] sm:rounded-2xl border border-blue-100/50 dark:border-blue-500/20 hover:bg-blue-50/80 dark:hover:bg-blue-500/10 transition-colors flex flex-col h-full">
                    <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md sm:rounded-lg shrink-0"><BookOpen size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-blue-700 dark:text-blue-400 flex items-center gap-1 flex-wrap">
                            Tahsin
                        {publicTab === 'lesson_plan' && rec?.jurnalTahsin && rec?.jurnalTahsin !== '-' && valT !== '-' && <Check size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" strokeWidth={4} title="Target Tercapai" />}
                          </span>
                        </div>
                    <div className="pl-0 sm:pl-1 flex-1"><ExpandableText text={valT} /></div>
                      </div>

                      {/* Tahfidz */}
                  <div className="bg-purple-50/40 dark:bg-purple-500/5 p-3 sm:p-4 rounded-[1rem] sm:rounded-2xl border border-purple-100/50 dark:border-purple-500/20 hover:bg-purple-50/80 dark:hover:bg-purple-500/10 transition-colors flex flex-col h-full">
                    <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-md sm:rounded-lg shrink-0"><Mic size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-purple-700 dark:text-purple-400 flex items-center gap-1 flex-wrap">
                            Tahfidz
                        {publicTab === 'lesson_plan' && rec?.jurnalTahfidz && rec?.jurnalTahfidz !== '-' && valF !== '-' && <Check size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" strokeWidth={4} title="Target Tercapai" />}
                          </span>
                        </div>
                    <div className="pl-0 sm:pl-1 flex-1"><ExpandableText text={valF} /></div>
                      </div>

                      {/* Murojaah */}
                  <div className="bg-emerald-50/40 dark:bg-emerald-500/5 p-3 sm:p-4 rounded-[1rem] sm:rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 transition-colors flex flex-col h-full">
                    <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="p-1 sm:p-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md sm:rounded-lg shrink-0"><Repeat size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1 flex-wrap">Murojaah</span>
                        </div>
                    <div className="pl-0 sm:pl-1 flex-1"><ExpandableText text={valM} /></div>
                      </div>

                      {/* Catatan */}
                  <div className="bg-orange-50/40 dark:bg-orange-500/5 p-3 sm:p-4 rounded-[1rem] sm:rounded-2xl border border-orange-100/50 dark:border-orange-500/20 hover:bg-orange-50/80 dark:hover:bg-orange-500/10 transition-colors flex flex-col h-full">
                    <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="p-1 sm:p-1.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-md sm:rounded-lg shrink-0"><FileText size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5} /></div>
                      <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-orange-700 dark:text-orange-400 flex items-center gap-1 flex-wrap">Catatan</span>
                        </div>
                    <div className="pl-0 sm:pl-1 flex-1">{renderCatatanDetail(valC, valCT, valCF)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Tampilan Jika Pekan Kosong */}
              {datesToDisplay.every(d => { // Add dark mode styles to this empty state
                const ds = formatDateObj(d); // Fix: Use formatDateObj(d) instead of d
                const r = publicStudent.records?.[ds] || {};
                return !((r[k.t] && r[k.t] !== '-') || (r[k.tNilai] && r[k.tNilai] !== '-') || (r[k.tsNilai] && r[k.tsNilai] !== '-') || (r[k.f] && r[k.f] !== '-') || (r[k.fNilai] && r[k.fNilai] !== '-') || (r[k.m] && r[k.m] !== '-') || (r[k.c] && r[k.c] !== '-') || (r[k.cT] && r[k.cT] !== '-') || (r[k.cF] && r[k.cF] !== '-'));
              }) && (
                  <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40 dark:opacity-30">
                    <Calendar size={48} />
                    <p className="font-bold">{isPrintingAll ? 'Tidak ada riwayat rekaman.' : 'Tidak ada data rekaman pada pekan ini.'}</p>
                  </div>
                )}
            </div>

            {/* Footer Laporan */}
            <div className="bg-slate-900 dark:bg-black p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-5 text-white text-center sm:text-left relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' /%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '40px 40px' }}></div>
              <div className="flex items-center justify-center sm:justify-start gap-4 w-full sm:w-auto relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 flex items-center justify-center backdrop-blur-sm border border-white/10 dark:border-white/5 shadow-inner"><Users size={20} className="text-emerald-400" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Guru / Pembimbing</span>
                  <strong className="text-sm sm:text-base font-black text-white">{publicTeacher || '-'}</strong>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4 w-full sm:w-auto relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/10 shadow-inner"><Calendar size={20} className="text-emerald-400" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Periode Evaluasi</span>
                  <strong className="text-sm sm:text-base font-black text-white">{formatPeriode(weekDates[0], weekDates[4])}</strong>
                </div>
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
    const availableGurus = Object.keys(guruHalaqohMap).filter(k => k !== '_order_').sort();
    const availableHalaqohs = portalGuruFilter
      ? (guruHalaqohMap[portalGuruFilter] || []).sort()
      : Array.from(new Set(Object.keys(guruHalaqohMap).filter(k => k !== '_order_').flatMap(k => guruHalaqohMap[k]))).sort();
    const isSearching = portalSearch.trim() !== '' || portalKelasFilter !== '' || portalHalaqohFilter !== '' || portalGuruFilter !== '';

    const filtered = allStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(portalSearch.toLowerCase());
      const matchKelas = portalKelasFilter === '' || s.kelas === portalKelasFilter;
      const matchHalaqoh = portalHalaqohFilter === '' || s.halaqoh === portalHalaqohFilter;
      const matchGuru = portalGuruFilter === '' || (guruHalaqohMap[portalGuruFilter] && guruHalaqohMap[portalGuruFilter].includes(s.halaqoh));
      return matchSearch && matchKelas && matchHalaqoh && matchGuru;
    });

    return (
      <div className="h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center relative overflow-y-auto overscroll-y-contain custom-scrollbar transition-colors duration-300" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* HEADER PORTAL - AKSES LOGIN & DAFTAR */}
        <header className="w-full bg-white/80 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800 backdrop-blur-md border-b px-4 sm:px-8 py-4 flex justify-between items-center z-50 sticky top-0 shadow-sm transition-all duration-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10">
              {institutionLogo ? <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" /> : <BookOpen size={24} className="text-emerald-500" />}
            </div>
            <div className="flex flex-col">
              <span className="font-arabic font-bold text-slate-800 dark:text-slate-100 tracking-tighter text-lg sm:text-2xl transition-all leading-tight">MyQuranPlan</span>
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-70 -mt-1"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { setIsParentPortal(false); setIsRegistering(false); setIsForgotPassword(false); }}
              className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-xl transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsParentPortal(false); setIsRegistering(true); setIsForgotPassword(false); }}
              className="text-[10px] sm:text-xs font-black bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
            >
              Daftar Guru
            </button>
            <button
              onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-500 rounded-xl transition-all active:scale-90 ml-1 sm:ml-2 shadow-sm border border-slate-100 dark:border-slate-700"
              title="Mode Gelap/Terang"
            >
              <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </div>
            </button>
          </div>
        </header>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981'%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' /%3E%3Cpath d='M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z' transform='rotate(45 50 50)' /%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '100px 100px' }}></div>

        <div className="w-full max-w-4xl z-10 px-4 sm:px-8 py-8 md:py-12 flex-1">
          <div className="flex flex-col items-center mb-6 sm:mb-8 text-center px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 transition-transform hover:scale-110 duration-500">
              {institutionLogo ? <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" /> : <BookOpen size={64} className="text-emerald-500" />}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Ahlan wa Sahlan, Ayah & Bunda
            </div>
            <div className="flex flex-col items-center">
              <h1 className="font-arabic text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter mb-1 transition-all">MyQuranPlan</h1>
              <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-2"></div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md leading-relaxed">
              Selamat datang di platform pemantauan pembelajaran Al-Qur'an Ananda. Silakan cari nama Ananda untuk melihat target serta capaian harian Mutabaah.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border-white dark:border-slate-700 rounded-[2.5rem] shadow-xl border p-6 sm:p-8 transition-all duration-500">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Ketik nama Ananda..."
                value={localPortalSearch}
                onChange={(e) => setLocalPortalSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-lg font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16} />
                <select
                  value={portalGuruFilter}
                  onChange={(e) => {
                    const newGuru = e.target.value;
                    setPortalGuruFilter(newGuru);
                    if (newGuru && portalHalaqohFilter) {
                      const guruHalaqohs = guruHalaqohMap[newGuru] || [];
                      if (!guruHalaqohs.includes(portalHalaqohFilter)) {
                        if (!isHalaqohLocked) setPortalHalaqohFilter('');
                      }
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer appearance-none"
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
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer appearance-none"
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
                  disabled={isHalaqohLocked}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer appearance-none ${isHalaqohLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <option value="">Semua Halaqoh</option>
                  {availableHalaqohs.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {isSearching && (
              <button
                onClick={() => { setLocalPortalSearch(''); setPortalSearch(''); setPortalKelasFilter(''); if (!isHalaqohLocked) setPortalHalaqohFilter(''); setPortalGuruFilter(''); }}
                className="mb-6 w-full py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <RotateCcw size={14} /> Reset Pencarian
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-2 transition-colors">
              {isPublicLoading ? (
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-32 sm:w-48 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                          <div className="h-3 w-20 sm:w-32 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
                        </div>
                      </div>
                      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-700 rounded-md opacity-30"></div>
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
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all group animate-row-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black group-hover:border-emerald-500 dark:group-hover:border-emerald-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors overflow-hidden">
                        {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : getInitials(s.name)}
                      </div>
                      <div>
                        <p className={`font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors ${s.name.length > 24 ? 'text-xs sm:text-sm whitespace-normal line-clamp-2 leading-tight' : s.name.length > 18 ? 'text-sm sm:text-[15px] whitespace-normal line-clamp-2 leading-tight' : 'text-base truncate'}`}>{s.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kelas {s.kelas || '-'} • {s.halaqoh || '-'}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
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
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-y-auto overscroll-y-contain custom-scrollbar z-0 transition-all duration-500" style={{ WebkitOverflowScrolling: 'touch' }}>

      <button onClick={() => setTheme && setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-90" title="Mode Gelap/Terang">
        <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}>
          {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
        </div>
      </button>

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
        <div className="bg-white/80 dark:bg-slate-900/80 border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border flex flex-col relative overflow-hidden transition-all duration-500">
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
              <h1 className="font-arabic text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter transition-all">MyQuranPlan</h1>
              <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-1"></div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 text-center">
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
                    onChange={(e) => { setFullName(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
                  onChange={(e) => { setUsername(e.target.value); setError(''); setSuccessMsg(''); }}
                  className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
                      onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                      className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      placeholder="••••••••"
                      required
                      minLength={isRegistering ? 8 : undefined}
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="Ulangi password..."
                    required={isRegistering}
                    minLength={isRegistering ? 8 : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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

          <div className="mt-6 flex flex-col gap-3 text-center border-t border-slate-100 dark:border-slate-800 pt-5">
            {!isRegistering && !isForgotPassword && (
              <button
                onClick={() => setIsParentPortal(true)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Search size={18} /> Kembali ke MyQuranPlan
              </button>
            )}
            <button onClick={() => { if (isForgotPassword) setIsForgotPassword(false); else setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); setConfirmPassword(''); }} className="text-xs text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors">
              {isForgotPassword ? 'Batal dan Kembali ke Login' : isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar sebagai Guru'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-8 text-center drop-shadow-sm transition-colors">&copy; 2026 Juman Jayyidin. All rights reserved.</p>
      </div>

      {/* Modal Error */}
      {error && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-300 border border-transparent dark:border-slate-700">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-5 border-4 border-red-100 dark:border-red-500/20">
              <ShieldAlert size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 transition-colors">{isRegistering ? 'Gagal Mendaftar' : 'Akses Ditolak'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed transition-colors">{error}</p>
            <button onClick={() => setError('')} className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-black py-3.5 rounded-xl transition-colors text-sm active:scale-95 transition-all">Mengerti</button>
          </div>
        </div>
      )}

      {/* Modal Success */}
      {successMsg && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-300 border border-transparent dark:border-slate-700">
            <div className="w-16 h-16 bg-green-50 dark:bg-emerald-500/10 text-green-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-5 border-4 border-green-100 dark:border-emerald-500/20">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 transition-colors">Pendaftaran Berhasil!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed transition-colors">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="w-full bg-[#00e676] hover:bg-green-500 text-white font-black py-3.5 rounded-xl transition-colors text-sm active:scale-95 shadow-md shadow-green-200">Siap, Menunggu</button>
          </div>
        </div>
      )}

      {/* ===== MODAL SUCCESS COPY LINK ===== */}
      {copySuccessModal.isOpen && (
        <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-transparent dark:border-slate-700">
            <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/30 relative z-10">
                <CheckCircle2 size={40} className="text-white drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black tracking-tight drop-shadow-sm relative z-10">{copySuccessModal.title}</h3>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 flex flex-col gap-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed text-center">
                {copySuccessModal.message}
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 overflow-hidden text-left">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Tautan Laporan</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{copySuccessModal.link}</p>
                </div>
                <button
                  onClick={() => {
                    copyTextToClipboard(copySuccessModal.link);
                    if (showToast) showToast("Tautan disalin!");
                  }}
                  className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all shrink-0"
                  title="Salin Tautan Saja"
                >
                  <Link size={18} />
                </button>
              </div>

              <button
                onClick={() => setCopySuccessModal({ isOpen: false, title: '', message: '', link: '' })}
                className="w-full mt-2 py-3.5 bg-slate-900 dark:bg-black text-white hover:bg-slate-800 dark:hover:bg-slate-900 rounded-xl font-black shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (<div className="fixed top-4 md:top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-2xl z-[100010] font-bold text-xs md:text-sm animate-bounce">{toastMessage}</div>)}
    </div>
  );
};

export default LoginScreen;
