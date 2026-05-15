import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, User, Menu, Home, Users, BarChart3, PieChart, Settings, LogOut, Loader2, Edit3, Mic, Repeat, FileText, X, AlertTriangle, Link, Filter, Activity, Moon, Sun, Archive } from 'lucide-react';

// Imports
import { supabase } from './supabase';
import { surahList, tahsinCategories, ghoribList, tajwidList } from '../data/constants';
import { getMonday, formatDateObj, formatShortDate, copyTextToClipboard } from '../utils/helpers';

// Views
import HomeView from './views/HomeView';
import StudentView from './views/StudentView';
import ReportView from './views/ReportView';
import SettingsView from './views/SettingsView';
import ActivityLogView from './views/ActivityLogView';
import ProgressChartView from './views/ProgressChartView';
import ArchiveView from './views/ArchiveView';

// Modals
import { AddStudentModal, EditStudentModal } from './modals/StudentModals';
import { JurnalModal } from './modals/JurnalModal';
import ImageCropModal from './modals/ImageCropModal';
import AppHeader from './AppHeader';
import MobileMenu from './MobileMenu';
import FilterBar from './FilterBar';
import { useSupabaseSync } from './useSupabaseSync';

const MainApp = ({ currentUser, onLogout, theme, setTheme }) => {
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // -- STATE UTAMA --
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeTab, setHomeTab] = useState('jurnal');

  const [guruHalaqohData, setGuruHalaqohData] = useState({});
  // Menggunakan _order_ karena tipe jsonb di Supabase tidak mempertahankan urutan key
  const guruList = useMemo(() => {
    const order = guruHalaqohData._order_ || [];
    const keys = Object.keys(guruHalaqohData).filter(k => k !== '_order_');
    if (order.length > 0) {
      return keys.sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    return keys;
  }, [guruHalaqohData]);
  const [kelasList, setKelasList] = useState([]);
  const [institutionName, setInstitutionName] = useState('Nama Sekolah Anda');
  const [institutionLogo, setInstitutionLogo] = useState('logo.png');
  const [targetReguler, setTargetReguler] = useState('2 Juz');
  const [targetAlQuran, setTargetAlQuran] = useState('');
  const [appUsers, setAppUsers] = useState([]);

  const [activeGuru, setActiveGuru] = useState('');
  const [activeHalaqoh, setActiveHalaqoh] = useState('');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnfilledOnly, setShowUnfilledOnly] = useState(false);

  const [weekStart, setWeekStart] = useState(getMonday(new Date())); // Tetap mulai dari Senin
  const [activeDate, setActiveDate] = useState(formatDateObj(new Date())); // Tapi tanggal aktif adalah hari ini
  const weekDates = Array.from({ length: 5 }).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });

  const [toastMessage, setToastMessage] = useState(null);

  // -- STATE KONFIRMASI HAPUS --
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

  // -- STATE PENGATURAN --
  const [newGuruName, setNewGuruName] = useState('');
  const [newHalaqohName, setNewHalaqohName] = useState('');
  const [newKelasName, setNewKelasName] = useState('');
  const [selectedGuruForHalaqoh, setSelectedGuruForHalaqoh] = useState('');
  const [editingGuru, setEditingGuru] = useState(null);
  const [editingHalaqoh, setEditingHalaqoh] = useState(null);

  // -- STATE MODAL SISWA --
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState('master');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', kelas: '', halaqoh: '', photo: null });
  const [editStudentData, setEditStudentData] = useState({ id: null, name: '', kelas: '', halaqoh: '', photo: null });

  // -- STATE MODAL JURNAL --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('full_bulk');
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const emptySurat = () => ({ id: Date.now() + Math.random(), surat: '', ayatStart: '', ayatEnd: '', nilai: '' });
  const [lessonPlans, setLessonPlans] = useState([{ id: 1, tanggal: '', murojaah: [emptySurat()], tahsinKategori: '', tahsinSuratList: [emptySurat()], tahsinHalaman: [], tahsinBaris: [], tahsinMateri: [], tahsinHalamanTg: [], tahfidzSuratList: [emptySurat()], lainLain: '', catatanTahsin: '', catatanTahfidz: '', tahsinNilai: '' }]);

  // -- STATE UNGGAH FOTO & CROP --
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [studentIdForCrop, setStudentIdForCrop] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // -- EFEK INIT --
  useSupabaseSync({
    isSuperAdmin,
    setGuruHalaqohData,
    setKelasList,
    setInstitutionName,
    setInstitutionLogo,
    setTargetReguler,
    setTargetAlQuran,
    setStudents,
    setAppUsers,
    setIsDbReady
  });

  // Efek Loading (dipercepat & dihilangkan untuk filter halaqoh agar perubahannya instan!)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, [activeDate, homeTab, showUnfilledOnly]);

  useEffect(() => {
    if (!isSuperAdmin) {
      const teacherName = currentUser?.name || "";
      if (activeGuru !== teacherName) setActiveGuru(teacherName);
      if (selectedGuruForHalaqoh !== teacherName) setSelectedGuruForHalaqoh(teacherName);

      // Cari data halaqoh secara case-insensitive
      const searchName = teacherName.trim().toLowerCase();
      const guruKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === searchName);
      const halaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

      if (halaqohs.length > 0) {
        if (!activeHalaqoh || !halaqohs.includes(activeHalaqoh)) {
          setActiveHalaqoh(halaqohs[0]);
        }
      } else if (activeHalaqoh !== '') {
        setActiveHalaqoh('');
      }
    } else {
      if (!activeGuru && guruList.length > 0) {
        const firstGuru = guruList[0];
        setActiveGuru(firstGuru);
        setActiveHalaqoh((guruHalaqohData[firstGuru] && guruHalaqohData[firstGuru].length > 0) ? guruHalaqohData[firstGuru][0] : '');
      } else if (activeGuru) {
        const halaqohs = guruHalaqohData[activeGuru] || [];
        if (halaqohs.length > 0 && (!activeHalaqoh || !halaqohs.includes(activeHalaqoh))) {
          setActiveHalaqoh(halaqohs[0]);
        } else if (halaqohs.length === 0 && activeHalaqoh !== '') {
          setActiveHalaqoh('');
        }
      }
    }
  }, [guruList, guruHalaqohData, isSuperAdmin, currentUser?.name, activeGuru, activeHalaqoh, selectedGuruForHalaqoh]);

  useEffect(() => { setNewStudent(prev => ({ ...prev, halaqoh: activeHalaqoh, kelas: prev.kelas || (kelasList.length > 0 ? kelasList[0] : '') })); }, [activeHalaqoh, kelasList]);

  // -- FUNGSI UTILITY --
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); };

  // Handler khusus agar saat Ustadz diganti, Halaqoh otomatis melompat ke urutan pertama
  const handleGuruChange = (newGuru) => {
    setActiveGuru(newGuru);
    const halaqohs = guruHalaqohData[newGuru] || [];
    setActiveHalaqoh(halaqohs.length > 0 ? halaqohs[0] : '');
  };

  const updateMasterDataCloud = async (updates) => {
    // Format ulang ke lowercase untuk PostgreSQL (Supabase)
    const mappedUpdates = {};
    if (updates.guruHalaqohData !== undefined) mappedUpdates.guruhalaqohdata = updates.guruHalaqohData;
    if (updates.kelasList !== undefined) mappedUpdates.kelaslist = updates.kelasList;
    if (updates.institutionName !== undefined) mappedUpdates.institutionname = updates.institutionName;
    if (updates.institutionLogo !== undefined) mappedUpdates.institutionlogo = updates.institutionLogo;
    if (updates.targetReguler !== undefined) mappedUpdates.targetreguler = updates.targetReguler;
    if (updates.targetAlQuran !== undefined) mappedUpdates.targetalquran = updates.targetAlQuran;

    const { error } = await supabase
      .from('settings')
      .update(Object.keys(mappedUpdates).length > 0 ? mappedUpdates : updates)
      .eq('id', 1); // Update baris tunggal di tabel settings
    if (error) showToast('Gagal update pengaturan.');
  };
  const changeWeek = (offset) => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + offset);
    setWeekStart(newWeekStart);

    const today = new Date();
    const isCurrentWeek = getMonday(today).getTime() === getMonday(newWeekStart).getTime();

    if (homeTab === 'jurnal' && isCurrentWeek) {
      setActiveDate(formatDateObj(today));
    } else {
      setActiveDate(formatDateObj(newWeekStart));
    }
  };
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';
  const dataURLtoBlob = (dataurl) => {
    if (!dataurl || !dataurl.includes(',')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Filter siswa yang sangat ketat: Jika bukan SuperAdmin, hanya tampilkan siswa yang ada di halaqoh guru tersebut
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Dengan RLS, 'students' sudah berisi data yang diizinkan untuk user.
      // Kita hanya perlu filter berdasarkan UI (halaqoh aktif dan pencarian).
      const isSearchMatch = (s?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const isInActiveHalaqoh = !activeHalaqoh || (s?.halaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim());

      let isUnfilledMatch = true;
      if (showUnfilledOnly && currentView === 'home') {
        const keys = homeTab === 'lesson_plan'
          ? { t: 'tahsin', f: 'tahfidz', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' }
          : { t: 'jurnalTahsin', f: 'jurnalTahfidz', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };
        const r = s.records?.[activeDate];
        const hasData = r && (
          (r[keys.t] && r[keys.t] !== '-') ||
          (r[keys.f] && r[keys.f] !== '-') ||
          (r[keys.m] && r[keys.m] !== '-') ||
          (r[keys.c] && r[keys.c] !== '-') ||
          (r[keys.cT] && r[keys.cT] !== '-') ||
          (r[keys.cF] && r[keys.cF] !== '-')
        );
        isUnfilledMatch = !hasData;
      }

      if (!isSuperAdmin) {
        const searchName = currentUser?.name?.trim().toLowerCase() || "";
        const guruKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === searchName);
        const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

        const isMyStudent = activeHalaqoh ? isInActiveHalaqoh : myHalaqohs.includes(s?.halaqoh?.trim());
        return isMyStudent && isSearchMatch && isUnfilledMatch;
      }
      return isInActiveHalaqoh && isSearchMatch && isUnfilledMatch;
    });
  }, [students, searchQuery, activeHalaqoh, showUnfilledOnly, currentView, homeTab, activeDate, isSuperAdmin, currentUser?.name, guruHalaqohData]);

  // Hitung jumlah siswa di halaqoh aktif (sebelum difilter oleh pencarian) untuk placeholder
  const studentsInHalaqoh = useMemo(() => {
    return students.filter(s => {
      // Logika ini juga disederhanakan karena RLS sudah bekerja.
      const isInActiveHalaqoh = !activeHalaqoh || (s?.halaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim());

      if (!isSuperAdmin) {
        const searchName = currentUser?.name?.trim().toLowerCase() || "";
        const guruKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === searchName);
        const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

        const isMyStudent = activeHalaqoh ? isInActiveHalaqoh : myHalaqohs.includes(s?.halaqoh?.trim());
        return isMyStudent;
      }
      return isInActiveHalaqoh;
    });
  }, [students, activeHalaqoh, isSuperAdmin, currentUser?.name, guruHalaqohData]);

  // -- FUNGSI PENGATURAN (SETTINGS) --
  const handleApproveUser = async (user) => {
    const { error } = await supabase
      .from('app_users')
      .update({ status: 'active' })
      .eq('id', user.id);

    if (error) {
      showToast('Gagal menyetujui akun.');
    } else {
      showToast(`Akun ${user.name} berhasil disetujui!`);

      // --- LOG AKTIVITAS ---
      try {
        await supabase.from('activity_logs').insert([{
          guru_name: currentUser?.name || 'System / Unknown',
          action: 'Menyetujui Pendaftaran Guru',
          details: `Akun: ${user.name} (@${user.username})`
        }]);
      } catch (logErr) {
        console.error('Gagal mencatat log aktivitas:', logErr);
      }
      // ---------------------
    }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm('Yakin ingin menolak dan menghapus pendaftaran guru ini?')) {
      try {
        const userToReject = appUsers.find(u => u.id === userId);

        // Panggil fungsi RPC untuk menghapus user dari auth.users dan app_users
        const { error } = await supabase.rpc('delete_auth_user', { target_user_id: userId });
        if (error) await supabase.from('app_users').delete().eq('id', userId); // Fallback

        showToast('Pendaftaran ditolak & dihapus.');

        // --- LOG AKTIVITAS ---
        if (userToReject) {
          try {
            await supabase.from('activity_logs').insert([{
              guru_name: currentUser?.name || 'System / Unknown',
              action: 'Menolak Pendaftaran Guru',
              details: `Akun: ${userToReject.name} (@${userToReject.username})`
            }]);
          } catch (logErr) {
            console.error('Gagal mencatat log aktivitas:', logErr);
          }
        }
        // ---------------------
      } catch (error) {
        showToast('Gagal menolak pendaftaran.');
      }
    }
  };

  const handleUpdateUserAccount = async (userId, updatedData) => {
    try {
      const originalUser = appUsers.find(u => u.id === userId);
      const isUsernameChanged = updatedData.username && originalUser && updatedData.username !== originalUser.username;

      // Hapus dari auth jika username atau password berubah agar memicu auto-migration di login berikutnya
      if (isUsernameChanged || (updatedData.password && updatedData.password !== originalUser?.password)) {
        await supabase.rpc('reset_auth_user', { target_user_id: userId });
      }

      const { error } = await supabase.from('app_users').update(updatedData).eq('id', userId);
      if (error) throw error;
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
      showToast('Akun berhasil diperbarui!');
    } catch (error) {
      showToast('Gagal update akun.');
    }
  };

  const handleLinkAccount = async (masterGuruName, userId) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('app_users').update({ name: masterGuruName }).eq('id', userId);
      if (error) throw error;
      setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, name: masterGuruName } : u));
      showToast(`Akun berhasil ditautkan ke ${masterGuruName}!`);
    } catch (error) {
      console.error(error);
      showToast('Gagal menautkan akun.');
    }
  };

  const handleResetTeacherPassword = async (user) => {
    const newPassword = window.prompt(`Masukkan password baru untuk Ustadz/ah ${user.name}\n(Minimal 8 karakter):`);
    if (!newPassword) return;
    if (newPassword.length < 8) {
      showToast('Password minimal 8 karakter!');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Hapus dari sistem auth.users agar memicu proses pendaftaran ulang (auto-migration) saat login
      await supabase.rpc('reset_auth_user', { target_user_id: user.id });

      // 2. Update profil menjadi plaintext agar dikenali oleh auto-migration
      const { error } = await supabase.from('app_users').update({
        password: newPassword,
        resetrequested: false
      }).eq('id', user.id);

      if (error) throw error;

      setAppUsers(prev => prev.map(u => u.id === user.id ? { ...u, resetrequested: false } : u));
      showToast(`Berhasil! Password baru untuk ${user.name}: ${newPassword}`);
    } catch (error) {
      showToast('Gagal mereset password.');
    }
    setIsLoading(false);
  };

  const handleBulkSaveStudents = (studentList, onSuccess) => {
    // Mencegah duplikasi nama ganda (Kalau ada yang sama maka jadi 1)
    const existingNames = new Set(students.map(s => s.name.trim().toLowerCase()));
    const uniqueInput = [];
    const seenNames = new Set();

    for (const s of studentList) {
      const normalizedName = s.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName) && !existingNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueInput.push(s);
      }
    }

    if (uniqueInput.length === 0) {
      showToast('Semua siswa sudah ada di sistem (duplikat diabaikan).');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      message: `Sistem akan mengimpor ${uniqueInput.length} siswa baru. Data dengan nama yang sama persis (duplikat) otomatis diabaikan agar tidak ada yang tertimpa.\n\nLanjutkan proses impor?`,
      onConfirm: async () => {
        let currentMaxSort = students.length > 0 ? Math.max(...students.map(s => s.sort_order || 0)) : 0;
        const studentsToInsert = uniqueInput.map(s => {
          currentMaxSort++;
          return {
            name: s.name,
            kelas: s.kelas || '',
            halaqoh: s.halaqoh || '',
            initial: getInitials(s.name),
            records: {},
            sort_order: currentMaxSort
          };
        });

        // PENGAMANAN SKALA BESAR: Pecah insert menjadi beberapa bagian (Chunking) 
        // agar API Supabase tidak menolak payload yang terlalu besar
        const CHUNK_SIZE = 250;
        let allInserted = [];
        for (let i = 0; i < studentsToInsert.length; i += CHUNK_SIZE) {
          const chunk = studentsToInsert.slice(i, i + CHUNK_SIZE);
          const { data, error } = await supabase.from('students').insert(chunk).select();
          if (error) { showToast('Gagal mengimpor sebagian data.'); break; }
          if (data) allInserted = [...allInserted, ...data];
        }

        if (allInserted.length > 0) {
          setStudents(prev => [...prev, ...allInserted]);
          showToast(`${allInserted.length} siswa berhasil diimpor!`);
          if (onSuccess) onSuccess();
        }
      }
    });
  };

  const handleInstitutionLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300; // Kompres ukuran maksimal 300px (Sangat ringan untuk Base64)
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/png', 0.9);

          setInstitutionLogo(compressedBase64);
          await updateMasterDataCloud({ institutionLogo: compressedBase64 });
          showToast('Logo berhasil diperbarui & dikompresi!');
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddKelas = async () => {
    if (!newKelasName.trim() || kelasList.includes(newKelasName.trim())) return;
    const updated = [...kelasList, newKelasName.trim()];
    setKelasList(updated);
    await updateMasterDataCloud({ kelasList: updated });
    setNewKelasName('');
    showToast('Kelas ditambahkan!');
  };

  const handleDeleteKelas = async (kelas) => {
    setConfirmDialog({
      isOpen: true,
      message: `Yakin ingin menghapus kelas ${kelas}?`,
      onConfirm: async () => {
        const updated = kelasList.filter(k => k !== kelas);
        setKelasList(updated);
        await updateMasterDataCloud({ kelasList: updated });

        // Sinkronisasi: Kosongkan kelas siswa yang terkait agar tidak terbengkalai
        await supabase.from('students').update({ kelas: '' }).eq('kelas', kelas);
        setStudents(prev => prev.map(s => s.kelas === kelas ? { ...s, kelas: '' } : s));

        showToast('Kelas dihapus!');
      }
    });
  };

  const handleReorderKelas = async (reorderedList) => {
    setKelasList(reorderedList);
    await updateMasterDataCloud({ kelasList: reorderedList });
  };

  const handleAddGuru = async () => {
    if (!newGuruName.trim() || guruList.includes(newGuruName.trim())) return;
    const updated = { ...guruHalaqohData, [newGuruName.trim()]: [] };
    updated._order_ = [...guruList, newGuruName.trim()];
    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setNewGuruName('');
    showToast('Pengajar ditambahkan!');
  };

  const handleAddHalaqoh = async () => {
    if (!newHalaqohName.trim() || !selectedGuruForHalaqoh) return;
    const currentHalaqohs = guruHalaqohData[selectedGuruForHalaqoh] || [];
    if (currentHalaqohs.includes(newHalaqohName.trim())) return;
    const updated = { ...guruHalaqohData, [selectedGuruForHalaqoh]: [...currentHalaqohs, newHalaqohName.trim()] };
    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setNewHalaqohName('');
    showToast('Halaqoh ditambahkan!');
  };

  const handleSaveEditGuru = async () => {
    if (!editingGuru.newName.trim() || editingGuru.newName === editingGuru.oldName) { setEditingGuru(null); return; }
    const updated = { ...guruHalaqohData };
    updated[editingGuru.newName.trim()] = updated[editingGuru.oldName];
    delete updated[editingGuru.oldName];

    const newOrder = [...guruList];
    const idx = newOrder.indexOf(editingGuru.oldName);
    if (idx !== -1) newOrder[idx] = editingGuru.newName.trim();
    updated._order_ = newOrder;

    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });

    // Sinkronisasi: Perbarui juga nama di tabel app_users agar sesi login guru tidak rusak
    await supabase.from('app_users').update({ name: editingGuru.newName.trim() }).eq('name', editingGuru.oldName);
    setAppUsers(prev => prev.map(u => u.name === editingGuru.oldName ? { ...u, name: editingGuru.newName.trim() } : u));

    // Perbaiki filter jika guru yang sedang aktif adalah guru yang diedit
    if (activeGuru === editingGuru.oldName) setActiveGuru(editingGuru.newName.trim());

    setEditingGuru(null);
    showToast('Nama pengajar diubah!');
  };

  const requestDeleteGuru = async (guru) => {
    setConfirmDialog({
      isOpen: true,
      message: `Hapus pengajar ${guru} beserta seluruh halaqohnya?\n\nSiswa yang berada di halaqoh tersebut akan kehilangan status halaqohnya (menjadi kosong).`,
      onConfirm: async () => {
        const updated = { ...guruHalaqohData };
        const halaqohsToDelete = updated[guru] || [];
        delete updated[guru];

        const newOrder = guruList.filter(g => g !== guru);
        updated._order_ = newOrder;

        setGuruHalaqohData(updated);
        await updateMasterDataCloud({ guruHalaqohData: updated });

        // Sinkronisasi: Keluarkan siswa dari halaqoh yang ikut terhapus
        if (halaqohsToDelete.length > 0) {
          await supabase.from('students').update({ halaqoh: '' }).in('halaqoh', halaqohsToDelete);
          setStudents(prev => prev.map(s => halaqohsToDelete.includes(s.halaqoh) ? { ...s, halaqoh: '' } : s));
        }

        // Reset filter aktif jika guru yang dihapus sedang dipilih
        if (activeGuru === guru) setActiveGuru('');

        showToast('Pengajar dihapus!');
      }
    });
  };

  const handleSaveEditHalaqoh = async () => {
    if (!editingHalaqoh.newName.trim() || editingHalaqoh.newName === editingHalaqoh.oldName) { setEditingHalaqoh(null); return; }
    const updated = { ...guruHalaqohData };
    const halaqohs = updated[editingHalaqoh.guruName];
    updated[editingHalaqoh.guruName] = halaqohs.map(h => h === editingHalaqoh.oldName ? editingHalaqoh.newName.trim() : h);
    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });

    // Sinkronisasi: Perbarui nama halaqoh pada seluruh siswa terkait di database
    await supabase.from('students').update({ halaqoh: editingHalaqoh.newName.trim() }).eq('halaqoh', editingHalaqoh.oldName);
    // Perbarui state lokal agar siswa tidak hilang dari layar
    setStudents(prev => prev.map(s => s.halaqoh === editingHalaqoh.oldName ? { ...s, halaqoh: editingHalaqoh.newName.trim() } : s));

    setEditingHalaqoh(null);
    showToast('Nama halaqoh diubah!');
  };

  const requestDeleteHalaqoh = async (guru, halaqoh) => {
    setConfirmDialog({
      isOpen: true,
      message: `Hapus halaqoh ${halaqoh} dari pengajar ${guru}?\n\nSiswa yang berada di halaqoh tersebut akan kehilangan status halaqohnya (menjadi kosong).`,
      onConfirm: async () => {
        const updated = { ...guruHalaqohData };
        updated[guru] = updated[guru].filter(h => h !== halaqoh);
        setGuruHalaqohData(updated);
        await updateMasterDataCloud({ guruHalaqohData: updated });

        // Sinkronisasi: Keluarkan siswa dari halaqoh yang terhapus
        await supabase.from('students').update({ halaqoh: '' }).eq('halaqoh', halaqoh);
        setStudents(prev => prev.map(s => s.halaqoh === halaqoh ? { ...s, halaqoh: '' } : s));

        showToast('Halaqoh dihapus!');
      }
    });
  };

  const handleReorderHalaqoh = async (guru, reorderedList) => {
    const updated = { ...guruHalaqohData, [guru]: reorderedList };
    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });
  };

  const handleReorderGuru = async (reorderedList) => {
    const updated = { ...guruHalaqohData, _order_: reorderedList };
    setGuruHalaqohData(updated);
    await updateMasterDataCloud({ guruHalaqohData: updated });
  };

  // -- FUNGSI HAPUS & KOSONGKAN DATA (Tabel) --
  const handleRemoveData = async (e, studentId, dateStr, type, subIndex = null) => {
    e.preventDefault(); e.stopPropagation();
    // ... (Logika internal untuk memodifikasi objek 'rec' tetap sama)
    const student = students.find(s => s.id === studentId); if (!student) return;
    const rec = student.records[dateStr] ? { ...student.records[dateStr] } : {};
    const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

    for (let key of Object.values(k)) if (!rec[key]) rec[key] = '-';

    if (type === 'catatan') { rec[k.c] = '-'; rec[k.cT] = '-'; rec[k.cF] = '-'; }
    else if (type === 'tahsin_all') { rec[k.t] = '-'; rec[k.h] = '-'; rec[k.tNilai] = '-'; rec[k.tsNilai] = '-'; }
    else if (type === 'tahfidz_all') { rec[k.f] = '-'; rec[k.af] = '-'; rec[k.fNilai] = '-'; }
    else if (type === 'murojaah_all') { rec[k.m] = '-'; }
    else if (type === 'tahsin_surat') {
      let tList = rec[k.t].split(',').map(s => s.trim()); let aList = rec[k.h] !== '-' ? (rec[k.h] || '').split(',').map(s => s.trim()) : []; let nList = rec[k.tsNilai] !== '-' ? (rec[k.tsNilai] || '').split(',').map(s => s.trim()) : [];
      tList.splice(subIndex, 1);
      if (rec[k.h] !== '-') { while (aList.length < tList.length + 1) aList.push(''); aList.splice(subIndex, 1); }
      if (rec[k.tsNilai] !== '-') { while (nList.length < tList.length + 1) nList.push(''); nList.splice(subIndex, 1); }
      rec[k.t] = tList.length > 0 && tList.join(', ') !== '' ? tList.join(', ') : '-';
      rec[k.h] = tList.length > 0 && rec[k.h] !== '-' ? aList.join(', ') : '-';
      rec[k.tsNilai] = tList.length > 0 && rec[k.tsNilai] !== '-' ? nList.join(', ') : '-';
      if (rec[k.t] === '-') { rec[k.h] = '-'; rec[k.tNilai] = '-'; rec[k.tsNilai] = '-'; }
    }
    else if (type === 'murojaah') {
      let items = rec[k.m].split(',').map(s => s.trim()); items.splice(subIndex, 1);
      rec[k.m] = items.length > 0 && items.join(', ') !== '' ? items.join(', ') : '-';
    }
    else if (type === 'tahfidz') {
      let tList = rec[k.f].split(',').map(s => s.trim()); let aList = rec[k.af] !== '-' ? (rec[k.af] || '').split(',').map(s => s.trim()) : []; let nList = rec[k.fNilai] !== '-' ? (rec[k.fNilai] || '').split(',').map(s => s.trim()) : [];
      tList.splice(subIndex, 1);
      if (rec[k.af] !== '-') { while (aList.length < tList.length + 1) aList.push(''); aList.splice(subIndex, 1); }
      if (rec[k.fNilai] !== '-') { while (nList.length < tList.length + 1) nList.push(''); nList.splice(subIndex, 1); }
      rec[k.f] = tList.length > 0 && tList.join(', ') !== '' ? tList.join(', ') : '-';
      rec[k.af] = tList.length > 0 && rec[k.af] !== '-' ? aList.join(', ') : '-';
      rec[k.fNilai] = tList.length > 0 && rec[k.fNilai] !== '-' ? nList.join(', ') : '-';
      if (rec[k.f] === '-') { rec[k.af] = '-'; rec[k.fNilai] = '-'; }
    }
    // Setelah logika di atas, simpan kembali ke Supabase
    const updatedRecords = { ...student.records, [dateStr]: rec };
    const { error } = await supabase
      .from('students')
      .update({ records: updatedRecords })
      .eq('id', studentId);

    if (error) {
      showToast('Gagal menghapus data.');
    } else {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, records: updatedRecords } : s));

      // --- LOG AKTIVITAS KHUSUS MUTABAAH ---
      try {
        const typeName = homeTab === 'lesson_plan' ? 'Target (Lesson Plan)' : 'Capaian (Mutabaah)';
        let detailMsg = `Tanggal: ${formatShortDate(new Date(dateStr))}\n`;
        detailMsg += `Siswa: ${student.name}\n`;
        detailMsg += `Kategori Hapus: ${type}`;

        await supabase.from('activity_logs').insert([{
          guru_name: currentUser?.name || 'System / Unknown',
          action: `Menghapus Sebagian Item ${typeName}`,
          details: detailMsg.trim()
        }]);
      } catch (logErr) {
        console.error('Gagal mencatat log aktivitas hapus data:', logErr);
      }
      // ------------------------------------
    }
  };

  const requestClearRecord = async (e, studentId, dateStr) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm('Yakin ingin mengosongkan data pada tanggal ini?')) {
      const student = students.find(s => s.id === studentId); if (!student) return;
      const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };
      const newRecords = { ...student.records };
      const dayRec = newRecords[dateStr] ? { ...newRecords[dateStr] } : {};
      dayRec[k.t] = '-'; dayRec[k.h] = '-'; dayRec[k.tNilai] = '-'; dayRec[k.tsNilai] = '-'; dayRec[k.f] = '-'; dayRec[k.af] = '-'; dayRec[k.fNilai] = '-'; dayRec[k.m] = '-'; dayRec[k.c] = '-'; dayRec[k.cT] = '-'; dayRec[k.cF] = '-';
      newRecords[dateStr] = dayRec;

      const { error } = await supabase.from('students').update({ records: newRecords }).eq('id', studentId);
      if (error) { showToast('Gagal mengosongkan data.'); } else {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, records: newRecords } : s));
        showToast('Data dikosongkan!');

        // --- LOG AKTIVITAS KHUSUS MUTABAAH ---
        try {
          const typeName = homeTab === 'lesson_plan' ? 'Target (Lesson Plan)' : 'Capaian (Mutabaah)';
          let detailMsg = `Tanggal: ${formatShortDate(new Date(dateStr))}\n`;
          detailMsg += `Siswa: ${student.name}`;

          await supabase.from('activity_logs').insert([{
            guru_name: currentUser?.name || 'System / Unknown',
            action: `Mengosongkan Data ${typeName}`,
            details: detailMsg.trim()
          }]);
        } catch (logErr) {
          console.error('Gagal mencatat log aktivitas kosongkan data:', logErr);
        }
        // ------------------------------------
      }
    }
  };

  const requestClearAllRecordForDay = async (e, dateStr, tab) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const typeName = tab === 'lesson_plan' ? 'Target (Lesson Plan)' : 'Capaian (Mutabaah)';
    setConfirmDialog({
      isOpen: true,
      message: `Yakin ingin mengosongkan semua data ${typeName} untuk SELURUH SISWA yang tampil saat ini pada tanggal ${formatShortDate(new Date(dateStr))}? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsLoading(true);
        const k = tab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

        try {
          const updates = filteredStudents.map(student => {
            const newRecords = { ...student.records };
            const dayRec = newRecords[dateStr] ? { ...newRecords[dateStr] } : {};
            dayRec[k.t] = '-'; dayRec[k.h] = '-'; dayRec[k.tNilai] = '-'; dayRec[k.tsNilai] = '-'; dayRec[k.f] = '-'; dayRec[k.af] = '-'; dayRec[k.fNilai] = '-'; dayRec[k.m] = '-'; dayRec[k.c] = '-'; dayRec[k.cT] = '-'; dayRec[k.cF] = '-';
            newRecords[dateStr] = dayRec;
            return { ...student, records: newRecords };
          });

          if (updates.length === 0) {
            setIsLoading(false);
            return;
          }

          // PENGAMANAN SKALA BESAR: Chunking Upsert
          const CHUNK_SIZE = 250;
          for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
            const chunk = updates.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase.from('students').upsert(chunk);
            if (error) throw error;
          }

          setStudents(prev => {
            const newStudents = [...prev];
            updates.forEach(u => {
              const idx = newStudents.findIndex(s => s.id === u.id);
              if (idx !== -1) newStudents[idx].records = u.records;
            });
            return newStudents;
          });
          showToast(`Data ${typeName} pada hari tersebut dikosongkan!`);
        } catch (e) {
          console.error(e);
          showToast('Gagal mengosongkan data.');
        }
        setIsLoading(false);
      }
    });
  };

  const handleAutoFillFromGhost = async (ghostData, targetDate, tab, targetStudents) => {
    setConfirmDialog({
      isOpen: true,
      message: `Yakin ingin menyalin riwayat terakhir untuk semua siswa yang BELUM DIISI pada tanggal ${formatShortDate(new Date(targetDate))}? (Siswa yang sudah diisi tidak akan tertimpa)`,
      onConfirm: async () => {
        setIsLoading(true);
        const k = tab === 'lesson_plan'
          ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' }
          : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

        try {
          const updates = targetStudents.reduce((acc, student) => {
            const ghost = ghostData[student.id];
            if (!ghost) return acc;

            const newRecords = { ...student.records };
            const currentRec = newRecords[targetDate] || {};
            let finalRec = { ...currentRec };
            let hasChanges = false;

            Object.values(k).forEach(keyName => {
              // Jangan salin Catatan Umum (Sakit/Izin/dll)
              if (keyName === k.c) return;

              if (!finalRec[keyName] || finalRec[keyName] === '-') {
                if (ghost[keyName] && ghost[keyName] !== '-') {
                  finalRec[keyName] = ghost[keyName];
                  hasChanges = true;
                }
              }
            });

            if (hasChanges) {
              // Pastikan field kosong diberi '-'
              Object.values(k).forEach(keyName => {
                if (!finalRec[keyName]) finalRec[keyName] = '-';
              });
              newRecords[targetDate] = finalRec;
              acc.push({ ...student, records: newRecords });
            }
            return acc;
          }, []);

          if (updates.length === 0) {
            showToast('Tidak ada data yang bisa disalin atau semua sudah terisi.');
            setIsLoading(false);
            return;
          }

          // PENGAMANAN SKALA BESAR: Chunking Upsert
          const CHUNK_SIZE = 250;
          for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
            const chunk = updates.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase.from('students').upsert(chunk);
            if (error) throw error;
          }

          setStudents(prev => {
            const newStudents = [...prev];
            updates.forEach(u => {
              const idx = newStudents.findIndex(s => s.id === u.id);
              if (idx !== -1) newStudents[idx].records = u.records;
            });
            return newStudents;
          });
          showToast(`Berhasil menyalin data otomatis untuk ${updates.length} siswa!`);
        } catch (e) {
          console.error(e);
          showToast('Gagal menyalin data otomatis.');
        }
        setIsLoading(false);
      }
    });
  };

  const setSharingStudent = (student) => { showToast("Fitur Share Gambar akan segera diaktifkan."); };

  const handleCopyPortalLink = async () => {
    if (!activeHalaqoh) {
      showToast('Pilih halaqoh terlebih dahulu!');
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?portalHalaqoh=${encodeURIComponent(activeHalaqoh)}&date=${activeDate}`;
    const textToCopy = `Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nBerikut adalah tautan Portal Pemantauan Hafalan untuk Halaqoh *${activeHalaqoh}*:\n\n${shareUrl}\n\nSilakan klik nama Ananda untuk melihat rincian Lesson Plan dan Mutabaah.\nTerima kasih.`;

    const copied = await copyTextToClipboard(textToCopy);
    if (copied) {
      showToast("Link Portal Halaqoh berhasil disalin!");
    } else {
      showToast("Gagal menyalin link.");
    }
  };

  // -- FUNGSI SISWA --
  const handleAssignFromMaster = async (student) => {
    if (!activeHalaqoh) {
      showToast('Pilih halaqoh tujuan terlebih dahulu di kanan atas!');
      return;
    }
    const { error } = await supabase.from('students').update({ halaqoh: activeHalaqoh }).eq('id', student.id);
    if (error) { showToast('Gagal.'); } else {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, halaqoh: activeHalaqoh } : s));
      showToast(`${student.name} ditambahkan!`);
    }
  };
  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    try {
      const { photo, ...studentData } = newStudent;

      if (!studentData.name || studentData.name.trim() === '') {
        showToast('Nama siswa tidak boleh kosong!');
        return;
      }

      // Mencegah duplikasi nama
      const normalizedName = studentData.name.trim().toLowerCase();
      const duplicateStudent = students.find(s => s.name.trim().toLowerCase() === normalizedName);
      if (duplicateStudent) {
        const proceed = window.confirm(`PERINGATAN: Siswa dengan nama "${studentData.name.trim()}" sudah terdaftar di sistem (Kelas: ${duplicateStudent.kelas || '-'}).\n\nApakah ini adalah siswa yang berbeda dan Anda yakin ingin tetap menambahkannya?`);
        if (!proceed) return;
      }

      const maxSortOrder = students.length > 0 ? Math.max(...students.map(s => s.sort_order || 0)) : 0;
      const newStudentObj = {
        ...studentData,
        initial: getInitials(studentData.name),
        photo: null,
        records: {},
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase.from('students').insert([newStudentObj]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        let insertedStudent = data[0];

        // Jika ada foto, unggah SETELAH kita mendapatkan ID siswa yang baru dari database
        if (photo && photo.startsWith('data:image')) {
          const imageBlob = dataURLtoBlob(photo);
          if (imageBlob) {
            const photoUrl = await handleUploadStudentPhoto(insertedStudent.id, imageBlob);
            if (photoUrl) {
              // Perbarui database dengan URL foto yang benar (berdasarkan ID siswa)
              await supabase.from('students').update({ photo: photoUrl }).eq('id', insertedStudent.id);
              insertedStudent.photo = photoUrl;
            }
          }
        }

        setStudents(prev => [...prev, insertedStudent]);
      }
      setIsAddStudentModalOpen(false);
      setNewStudent({ name: '', kelas: kelasList.length > 0 ? kelasList[0] : '', halaqoh: activeHalaqoh, photo: null });
      showToast('Siswa ditambahkan!');
    } catch (e) { console.error("Gagal menyimpan siswa baru:", e); showToast('Gagal menyimpan.'); }
  };
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      let { id, photo, ...studentData } = editStudentData;

      if (!studentData.name || studentData.name.trim() === '') {
        showToast('Nama siswa tidak boleh kosong!');
        return;
      }

      // Peringatan duplikasi nama saat edit data
      const normalizedName = studentData.name.trim().toLowerCase();
      const duplicateStudent = students.find(s => s.id !== id && s.name.trim().toLowerCase() === normalizedName);
      if (duplicateStudent) {
        const proceed = window.confirm(`PERINGATAN: Siswa dengan nama "${studentData.name.trim()}" sudah terdaftar di sistem (Kelas: ${duplicateStudent.kelas || '-'}).\n\nYakin ingin tetap mengubah namanya menjadi ini?`);
        if (!proceed) return;
      }

      // Jika foto adalah base64 baru, unggah dan ganti dengan URL
      if (photo && photo.startsWith('data:image')) {
        const imageBlob = dataURLtoBlob(photo);
        if (imageBlob) {
          photo = await handleUploadStudentPhoto(id, imageBlob); // photo sekarang berisi URL
        }
      }

      const updatedData = { ...studentData, photo: photo, initial: getInitials(studentData.name) };
      const { error } = await supabase.from('students').update(updatedData).eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
      setIsEditStudentModalOpen(false);
      showToast('Siswa diperbarui!');
    } catch (e) { console.error("Gagal memperbarui siswa:", e); showToast('Gagal memperbarui.'); }
  };
  const requestDeleteStudent = (student) => {
    if (isSuperAdmin) {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin menghapus "${student.name}" secara permanen dari sistem? Data tidak dapat dikembalikan!`,
        onConfirm: () => {
          // Bersihkan file foto dari Supabase Storage (Mencegah Storage Leak)
          if (student.photo) {
            const match = student.photo.match(/student_photos\/(.+?)(\?|$)/);
            if (match && match[1]) {
              supabase.storage.from('student_photos').remove([match[1]]).catch(console.error);
            }
          }
          supabase.from('students').delete().eq('id', student.id).then(() => {
            setStudents(prev => prev.filter(s => s.id !== student.id));
            showToast('Dihapus.');
          });
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin mengeluarkan "${student.name}" dari halaqoh ${activeHalaqoh}?`,
        onConfirm: () => {
          supabase.from('students').update({ halaqoh: '' }).eq('id', student.id).then(() => {
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, halaqoh: '' } : s));
            showToast('Siswa berhasil dikeluarkan.');
          });
        }
      });
    }
  };

  const requestBulkDeleteStudents = (studentIds, onSuccess) => {
    if (!studentIds || studentIds.length === 0) return;
    if (isSuperAdmin) {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin menghapus ${studentIds.length} siswa secara permanen dari sistem? Awas, tindakan ini tidak bisa dibatalkan!`,
        onConfirm: () => {
          // Bersihkan file foto secara massal
          const pathsToRemove = students
            .filter(s => studentIds.includes(s.id) && s.photo)
            .map(s => {
              const match = s.photo.match(/student_photos\/(.+?)(\?|$)/);
              return match ? match[1] : null;
            })
            .filter(Boolean);
          if (pathsToRemove.length > 0) supabase.storage.from('student_photos').remove(pathsToRemove).catch(console.error);

          supabase.from('students').delete().in('id', studentIds).then(() => {
            setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
            showToast(`${studentIds.length} siswa dihapus.`);
            if (onSuccess) onSuccess();
          });
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin mengeluarkan ${studentIds.length} siswa dari halaqoh Anda?`,
        onConfirm: () => {
          supabase.from('students').update({ halaqoh: '' }).in('id', studentIds).then(() => {
            setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { ...s, halaqoh: '' } : s));
            showToast(`${studentIds.length} siswa dikeluarkan.`);
            if (onSuccess) onSuccess();
          });
        }
      });
    }
  };

  const requestBulkEditStudents = (studentIds, updates, onSuccess) => {
    if (!studentIds || studentIds.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      message: `Yakin ingin memperbarui data untuk ${studentIds.length} siswa yang dipilih?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('students').update(updates).in('id', studentIds);
          if (error) throw error;
          setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { ...s, ...updates } : s));
          showToast(`${studentIds.length} siswa berhasil diperbarui.`);
          if (onSuccess) onSuccess();
        } catch (e) {
          console.error(e);
          showToast('Gagal memperbarui siswa secara massal.');
        }
      }
    });
  };

  const handleCleanLessonPlanValues = async () => {
    setConfirmDialog({
      isOpen: true,
      message: 'Yakin ingin membersihkan semua nilai pada Target (Lesson Plan) untuk seluruh siswa di database? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const updates = students.map(student => {
            let hasChanges = false;
            const newRecords = { ...student.records };
            Object.keys(newRecords).forEach(dateStr => {
              const rec = { ...newRecords[dateStr] };
              let recChanged = false;
              if (rec.tahsinNilai && rec.tahsinNilai !== '-') { rec.tahsinNilai = '-'; recChanged = true; }
              if (rec.tahsinSuratNilai && rec.tahsinSuratNilai !== '-') { rec.tahsinSuratNilai = '-'; recChanged = true; }
              if (rec.tahfidzNilai && rec.tahfidzNilai !== '-') { rec.tahfidzNilai = '-'; recChanged = true; }
              if (recChanged) {
                newRecords[dateStr] = rec;
                hasChanges = true;
              }
            });
            if (hasChanges) return { ...student, records: newRecords };
            return null;
          }).filter(Boolean);

          if (updates.length === 0) {
            showToast('Tidak ada data nilai pada Lesson Plan yang perlu dibersihkan.');
            setIsLoading(false);
            return;
          }

          const { error } = await supabase.from('students').upsert(updates);
          if (error) throw error;

          setStudents(prev => {
            const newStudents = [...prev];
            updates.forEach(u => {
              const idx = newStudents.findIndex(s => s.id === u.id);
              if (idx !== -1) newStudents[idx].records = u.records;
            });
            return newStudents;
          });

          showToast(`Berhasil membersihkan nilai Lesson Plan pada ${updates.length} siswa.`);
        } catch (e) {
          console.error(e);
          showToast('Gagal membersihkan nilai Lesson Plan.');
        }
        setIsLoading(false);
      }
    });
  };

  const handleCloseSemester = async () => {
    if (!isSuperAdmin) {
      showToast('Hanya Super Admin yang dapat melakukan Tutup Semester.');
      return;
    }

    const semesterName = window.prompt('Masukkan nama semester yang akan diarsipkan (Contoh: Semester Ganjil 2026/2027):');
    if (!semesterName || semesterName.trim() === '') {
      return; // Dibatalkan atau kosong
    }

    setConfirmDialog({
      isOpen: true,
      message: `PERHATIAN PENTING!\n\nFitur "Tutup Semester" akan MENGHAPUS SELURUH RIWAYAT Mutabaah dan Target untuk SEMUA SISWA dan memindahkannya ke dalam Arsip "${semesterName.trim()}".\n\nYakin ingin memulai semester baru?`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const archiveData = {
            semester_name: semesterName.trim(),
            data: students
          };
          const { error: archiveError } = await supabase.from('archived_semesters').insert([archiveData]);
          if (archiveError) throw archiveError;

          const updates = students.map(student => ({ ...student, records: {} }));

          if (updates.length === 0) {
            showToast('Tidak ada siswa untuk di-reset.');
            setIsLoading(false);
            return;
          }

          // PENGAMANAN SKALA BESAR: Chunking Upsert
          const CHUNK_SIZE = 250;
          for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
            const chunk = updates.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase.from('students').upsert(chunk);
            if (error) throw error;
          }

          setStudents(prev => prev.map(s => ({ ...s, records: {} })));

          try {
            await supabase.from('activity_logs').insert([{
              guru_name: currentUser?.name || 'System / Unknown',
              action: `Tutup Semester`,
              details: `Mengarsipkan data ke "${semesterName.trim()}" dan mengosongkan riwayat ${updates.length} siswa.`
            }]);
          } catch (logErr) {
            console.error('Gagal mencatat log aktivitas:', logErr);
          }

          // Panggil fungsi pembersihan log usang di database
          await supabase.rpc('delete_old_activity_logs');

          showToast(`Berhasil memulai semester baru! Data diarsipkan.`);
        } catch (e) {
          console.error(e);
          showToast('Gagal menutup semester.');
        }
        setIsLoading(false);
      }
    });
  };

  const handleBackupData = () => {
    try {
      const backupData = {
        tanggal_backup: new Date().toISOString(),
        total_siswa: students.length,
        data_siswa: students
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `backup_myquranplan_${formatDateObj(new Date())}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showToast('Backup berhasil diunduh!');
    } catch (err) {
      showToast('Gagal membuat backup data.');
    }
  };

  const handleReorderStudents = (reorderedList) => {
    // Beri index urutan baru berdasarkan posisi mereka di array
    const updates = reorderedList.map((s, index) => ({ ...s, sort_order: index }));

    // Update state React secara instan
    setStudents(prev => {
      const newStudents = [...prev];
      updates.forEach(updated => {
        const idx = newStudents.findIndex(s => s.id === updated.id);
        if (idx !== -1) newStudents[idx] = updated;
      });
      return newStudents.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });

    // Simpan ke Supabase di latar belakang
    updates.forEach(s => { supabase.from('students').update({ sort_order: s.sort_order }).eq('id', s.id).then(); });
  };

  const handlePhotoUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 250;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (isEdit) {
            setEditStudentData(prev => ({ ...prev, photo: resizedDataUrl }));
          } else {
            setNewStudent(prev => ({ ...prev, photo: resizedDataUrl }));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // -- FUNGSI CROP & UPLOAD FOTO --
  const openCropModal = (file, studentId) => {
    if (file && studentId) {
      setStudentIdForCrop(studentId);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
      setIsCropModalOpen(true);
    }
  };

  const handleCroppedImage = async (croppedImageBlob) => {
    if (croppedImageBlob && studentIdForCrop) {
      // Panggil fungsi unggah yang sudah ada dengan gambar hasil crop
      const photoUrl = await handleUploadStudentPhoto(studentIdForCrop, croppedImageBlob);

      if (photoUrl) {
        const { error } = await supabase.from('students').update({ photo: photoUrl }).eq('id', studentIdForCrop);
        if (error) {
          showToast('Gagal menyimpan foto ke profil.');
        } else {
          setStudents(prev => prev.map(s => s.id === studentIdForCrop ? { ...s, photo: photoUrl } : s));
          showToast('Foto berhasil diperbarui!');
        }
      }
    }
    // Reset state setelah memulai unggahan
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setStudentIdForCrop(null);
  };

  const handleUploadStudentPhoto = async (studentId, file) => {
    if (!file) return null;

    setUploadingPhotoId(studentId);
    setUploadProgress(0);

    try {
      // Nama file unik untuk menghindari cache
      const fileName = `${studentId || 'new'}/photo.jpg`;

      // Unggah file ke Supabase Storage
      const { data, error } = await supabase.storage
        .from('student_photos') // Nama bucket Anda
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Timpa file jika ada dengan nama yang sama
        });

      if (error) throw error;

      // Dapatkan URL publik dari file yang baru diunggah
      const { data: { publicUrl } } = supabase.storage.from('student_photos').getPublicUrl(fileName);

      setUploadingPhotoId(null);
      return `${publicUrl}?t=${Date.now()}`; // Tambahkan antrean waktu agar browser memuat foto baru (Bypass Cache)
    } catch (error) {
      console.error("Gagal mengunggah foto:", error);
      showToast('Gagal memproses foto.', 'error');
      setUploadingPhotoId(null);
      return null;
    }
  };
  // Fungsi untuk memfilter daftar halaqoh berdasarkan role user
  function getFilteredHalaqohDataForEdit() {
    const cleanData = { ...guruHalaqohData };
    delete cleanData._order_;

    if (isSuperAdmin) return cleanData;

    const searchName = currentUser?.name?.trim().toLowerCase() || "";
    const guruKey = Object.keys(cleanData).find(k => k.trim().toLowerCase() === searchName);

    return guruKey ? { [guruKey]: cleanData[guruKey] } : { [currentUser?.name || 'Guru']: [] };
  }

  // -- FUNGSI JURNAL MODAL --
  const parseSuratAyatList = (suratText, ayatText, nilaiText) => {
    if ((!suratText || suratText === '-') && (!ayatText || ayatText === '-') && (!nilaiText || nilaiText === '-')) return [emptySurat()];
    const surats = (suratText || '').split(',').map(s => s.trim());
    const ayats = (ayatText || '').split(',').map(s => s.trim());
    const nilais = (nilaiText || '').split(',').map(s => s.trim());
    const len = Math.max(surats.length, ayats.length, 1);
    const list = [];
    for (let i = 0; i < len; i++) {
      const aParts = (ayats[i] || '').split('-');
      list.push({ id: Date.now() + Math.random(), surat: surats[i] || '', ayatStart: aParts[0] || '', ayatEnd: aParts[1] || aParts[0] || '', nilai: nilais[i] || '' });
    }
    return list.length ? list : [emptySurat()];
  };

  const parseMurojaahList = (text) => {
    if (!text || text === '-') return [emptySurat()];
    return text.split(',').map((item) => {
      let s = item.trim(), aStart = '', aEnd = ''; let match = s.match(/(.+?)\s*\((.*?)\)/) || s.match(/(.+?)\s+(\d+(?:-\d+)?)$/);
      if (match) {
        s = match[1].trim();
        const aParts = match[2].split('-');
        aStart = aParts[0] || '';
        aEnd = aParts[1] || aParts[0] || '';
      }
      return { id: Date.now() + Math.random(), surat: s, ayatStart: aStart, ayatEnd: aEnd };
    });
  };

  const handleOpenModal = (student = null, mode = 'full_bulk') => {
    setActiveDropdown(null); setModalMode(mode);
    const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

    let initialDataForModal = {};
    let studentToProcess = student; // The student whose data we are primarily interested in

    const findLastRecord = (s) => {
      const activeDateObj = new Date(activeDate);

      // Untuk Lesson Plan (Selasa-Jumat), batasi pencarian hanya dalam pekan yang sama
      const currentWeekStart = new Date(activeDateObj);
      const dayOfWeek = currentWeekStart.getDay();
      const diffToMonday = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      currentWeekStart.setDate(diffToMonday);
      currentWeekStart.setHours(0, 0, 0, 0);

      const jurnalKeys = { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };

      const recordedDates = Object.keys(s.records || {})
        .map(d => new Date(d))
        .filter(d => d < activeDateObj) // Only dates before the active date
        .sort((a, b) => b - a); // Sort descending

      const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== '-';
      const combinedRecord = {
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
      const hasTahsin = () => hasValue(combinedRecord[k.t]) || hasValue(combinedRecord[k.h]);
      const hasTahfidz = () => hasValue(combinedRecord[k.f]) || hasValue(combinedRecord[k.af]);
      const hasMurojaah = () => hasValue(combinedRecord[k.m]);
      const hasCatatanTfTs = () => hasValue(combinedRecord[k.cT]) || hasValue(combinedRecord[k.cF]);

      for (const d of recordedDates) {
        const dStr = formatDateObj(d);
        const rec = s.records[dStr];

        const isFromPreviousWeek = d < currentWeekStart;
        const searchKeys = (homeTab === 'lesson_plan' && isFromPreviousWeek) ? jurnalKeys : k;

        if (rec) {
          const catatan = String(rec[searchKeys.c] || '').toLowerCase();
          if (catatan.includes('libur') || catatan.includes('sakit') || catatan.includes('izin') || catatan.includes('alpa') || catatan.includes('tidak hadir')) continue;

          if (!hasTahsin() && (hasValue(rec[searchKeys.t]) || hasValue(rec[searchKeys.h]))) {
            combinedRecord[k.t] = rec[searchKeys.t] || '-';
            combinedRecord[k.h] = rec[searchKeys.h] || '-';
            combinedRecord[k.tNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.tNilai] || '-';
            combinedRecord[k.tsNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.tsNilai] || '-';
            combinedRecord.__dates.tahsin = dStr;
          }

          if (!hasTahfidz() && (hasValue(rec[searchKeys.f]) || hasValue(rec[searchKeys.af]))) {
            combinedRecord[k.f] = rec[searchKeys.f] || '-';
            combinedRecord[k.af] = rec[searchKeys.af] || '-';
            combinedRecord[k.fNilai] = homeTab === 'lesson_plan' ? '-' : rec[searchKeys.fNilai] || '-';
            combinedRecord.__dates.tahfidz = dStr;
          }

          if (!hasMurojaah() && hasValue(rec[searchKeys.m])) {
            combinedRecord[k.m] = rec[searchKeys.m] || '-';
            combinedRecord.__dates.murojaah = dStr;
          }

          if (!hasCatatanTfTs() && (hasValue(rec[searchKeys.cT]) || hasValue(rec[searchKeys.cF]))) {
            combinedRecord[k.cT] = rec[searchKeys.cT] || '-';
            combinedRecord[k.cF] = rec[searchKeys.cF] || '-';
            combinedRecord.__dates.catatan = dStr;
          }

          if (hasTahsin() && hasTahfidz() && hasMurojaah() && hasCatatanTfTs()) break;
        }
      }

      if (!hasTahsin() && !hasTahfidz() && !hasMurojaah() && !hasCatatanTfTs()) return null;
      return {
        record: combinedRecord,
        date: combinedRecord.__dates.tahsin || combinedRecord.__dates.tahfidz || combinedRecord.__dates.murojaah || combinedRecord.__dates.catatan
      };
    };

    // Logic for 'Lanjutkan Data Terakhir' button (bulk_last)
    if (mode === 'bulk_last') { // This is for the button, not individual cells
      setModalMode('full_bulk'); // UI will be bulk

      // Find the first student with last week's data as a template for bulk
      for (const s of studentsInHalaqoh) {
        const lastData = findLastRecord(s);
        if (lastData) {
          initialDataForModal = { ...lastData.record, [k.c]: '-' };
          showToast(`Menyalin data terakhir ${s.name.split(' ')[0]} (${formatShortDate(new Date(lastData.date))})`);
          break;
        }
      }
      if (Object.keys(initialDataForModal).length === 0) showToast("Tidak ditemukan data sebelumnya.");
      setEditingId(null); // No specific student is being edited, it's a bulk operation
      setSelectedStudents(studentsInHalaqoh.map(s => s.id)); // Select all for bulk

    } else if (mode === 'prefill_last_week_single_student' && studentToProcess) {
      setModalMode('full_edit'); // UI will be single student edit
      setEditingId(studentToProcess.id);
      setSelectedStudents([studentToProcess.id]);
      const lastData = findLastRecord(studentToProcess);
      if (lastData) {
        initialDataForModal = { ...lastData.record, [k.c]: '-' };
        showToast(`Mengisi dari data terakhir ${studentToProcess.name.split(' ')[0]} (${formatShortDate(new Date(lastData.date))})`);
      } else {
        showToast("Tidak ditemukan data sebelumnya untuk siswa ini.");
      }

    } else if (studentToProcess) { // Regular single student edit/input
      const currentRecord = studentToProcess.records[activeDate] || {};
      initialDataForModal = { ...currentRecord };

      // Ambil data bayangan (ghost data) sebagai saran input jika field masih kosong
      const ghostRecord = window._lastDayData ? window._lastDayData[studentToProcess.id] : null;
      if (ghostRecord) {
        Object.values(k).forEach(keyName => {
          if (!initialDataForModal[keyName] || initialDataForModal[keyName] === '-') {
            if (ghostRecord[keyName] && ghostRecord[keyName] !== '-') {
              initialDataForModal[keyName] = ghostRecord[keyName];
            }
          }
        });
      }

      setEditingId(studentToProcess.id);
      setSelectedStudents([studentToProcess.id]);
    } else { // Regular full_bulk (empty)
      setEditingId(null);
      setSelectedStudents(studentsInHalaqoh.map(s => s.id)); // Default to all selected for empty bulk
    }

    const isBulkCategoryInput = !studentToProcess && ['tahsin', 'tahfidz', 'murojaah', 'catatan'].includes(mode);

    if (Object.keys(initialDataForModal).length > 0 || studentToProcess || mode === 'full_bulk' || isBulkCategoryInput) { // Only open if there's data or it's a new bulk
      // FIX: Create a 'clean' data object for the modal.
      // This ensures that only data relevant to the current tab (Target or Mutabaah) is used,
      // preventing data from the other tab from "leaking" into the modal.
      const cleanData = {};
      if (studentToProcess || mode.includes('last')) {
        Object.values(k).forEach(keyName => {
          if (initialDataForModal[keyName]) {
            cleanData[keyName] = initialDataForModal[keyName];
          }
        });
      }

      let tKategori = '', tSurat = cleanData[k.t] || '', tHalaman = [], tBaris = [], tMateri = [], tHalamanTg = [], rawTahsinAyat = cleanData[k.h] || '', tahsinAyatOnly = rawTahsinAyat;
      if (tSurat === '-') tSurat = '';
      if (rawTahsinAyat === '-') { rawTahsinAyat = ''; tahsinAyatOnly = ''; }

      if (tSurat.includes('Jilid')) {
        tKategori = tahsinCategories.find(c => tSurat.includes(c)) || ''; tSurat = '';
        const halMatch = rawTahsinAyat.match(/Hal\. ([\d, ]+)/); if (halMatch) tHalaman = halMatch[1].split(',').map(s => s.trim());
        const brsMatch = rawTahsinAyat.match(/Brs ([\d, ]+)/); if (brsMatch) tBaris = brsMatch[1].split(',').map(s => s.trim());
        tahsinAyatOnly = '';
      } else if (tSurat.includes('Tajwid') || tSurat.includes('Ghorib') || tSurat.includes('Gharib')) {
        tKategori = tSurat.includes('Tajwid') ? 'Tajwid' : 'Ghorib';
        tSurat = tSurat.replace(/Tajwid,?\s*/gi, '').replace(/Ghorib,?\s*/gi, '').replace(/Gharib,?\s*/gi, '').trim();
        if (tSurat === '-') tSurat = '';
        const parts = rawTahsinAyat.split('/');
        if (parts.length > 0) {
          let halMatStr = parts[0].trim();
          if (/^[0-9\-, ]+$/.test(halMatStr) || halMatStr.includes('Semua Ayat')) {
            tahsinAyatOnly = halMatStr;
            halMatStr = '';
          } else {
            tahsinAyatOnly = parts.length > 1 ? parts.slice(1).join('/').trim() : '';
          }
          const tgHalMatch = halMatStr.match(/Hal\.\s+([\d,\s]+)/);
          if (tgHalMatch) { tHalaman = tgHalMatch[1].split(',').map(s => s.trim()); halMatStr = halMatStr.replace(tgHalMatch[0], '').replace(/^[\s-]+|[\s-]+$/g, ''); }
          if (halMatStr) { tMateri = halMatStr.split('|').map(s => s.trim()).filter(Boolean); }
        }
      } else if (tSurat && tSurat !== '-') tKategori = 'Al-Qur\'an';

      setLessonPlans([{
        id: Date.now(), tanggal: activeDate, murojaah: parseMurojaahList(cleanData[k.m]), tahsinKategori: tKategori, tahsinSuratList: parseSuratAyatList(tSurat, tahsinAyatOnly, cleanData[k.tsNilai]), tahsinHalaman: tHalaman, tahsinBaris: tBaris, tahsinMateri: tMateri, tahsinHalamanTg: tHalamanTg, tahfidzSuratList: parseSuratAyatList(cleanData[k.f], cleanData[k.af], cleanData[k.fNilai]), lainLain: cleanData[k.c] && cleanData[k.c] !== '-' ? cleanData[k.c] : '', catatanTahsin: cleanData[k.cT] && cleanData[k.cT] !== '-' ? cleanData[k.cT] : '', catatanTahfidz: cleanData[k.cF] && cleanData[k.cF] !== '-' ? cleanData[k.cF] : '', tahsinNilai: cleanData[k.tNilai] && cleanData[k.tNilai] !== '-' ? cleanData[k.tNilai] : ''
      }]);
      setIsModalOpen(true); // Open modal only if there's data or it's a new bulk
    } else {
      showToast("Tidak ada data untuk diisi."); // Or handle as empty modal if desired
    }
  };

  const isInactiveAttendanceStatus = (value) => {
    const text = String(value || '').toLowerCase();
    return ['sakit', 'izin', 'alpa', 'tidak hadir'].some(keyword => text.includes(keyword));
  };

  const shouldRestrictApplyToOthers = (catatan = lessonPlans[0]?.lainLain) => (
    homeTab === 'jurnal' && editingId && isInactiveAttendanceStatus(catatan)
  );

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); setActiveDropdown(null); setModalMode('full_bulk'); };
  const toggleStudent = (id) => {
    if (shouldRestrictApplyToOthers()) {
      setSelectedStudents([editingId]);
      return;
    }

    if (id === 'ALL') { setSelectedStudents(studentsInHalaqoh.length === selectedStudents.length ? [] : studentsInHalaqoh.map(s => s.id)) } else { setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]); }
  };

  const handlePlanChange = (id, field, value) => {
    if (field === 'lainLain' && shouldRestrictApplyToOthers(value)) {
      setSelectedStudents([editingId]);
    }

    setLessonPlans(plans => plans.map(p => { if (p.id === id) { let finalValue = (field === 'tahsinNilai' && p[field] === value) ? '' : value; let u = { ...p, [field]: finalValue }; if (field === 'tahsinKategori') { u.tahsinHalaman = []; u.tahsinBaris = []; u.tahsinMateri = []; u.tahsinSuratList = [emptySurat()]; } return u; } return p; }));
  };
  const handleToggleArray = (planId, field, value) => { setLessonPlans(plans => plans.map(p => { if (p.id === planId) { const arr = p[field] || []; let newArr = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]; if (field === 'tahsinBaris' || field === 'tahsinHalaman') newArr.sort((a, b) => Number(a) - Number(b)); return { ...p, [field]: newArr }; } return p; })); };
  const handleAddSurat = (planId, listName) => setLessonPlans(plans => plans.map(p => p.id === planId ? { ...p, [listName]: [...p[listName], emptySurat()] } : p));
  const handleRemoveSurat = (planId, listName, suratId) => setLessonPlans(plans => plans.map(p => p.id === planId ? { ...p, [listName]: p[listName].filter(m => m.id !== suratId) } : p));
  const handleSuratChange = (planId, listName, suratId, field, value) => {
    setLessonPlans(plans => plans.map(p => {
      if (p.id !== planId) return p;

      const newList = p[listName].map(m => {
        if (m.id !== suratId) return m;

        const updated = { ...m, [field]: value };
        // Jika surat diganti, reset ayat awal dan akhir
        if (field === 'surat') {
          updated.ayatStart = '';
          updated.ayatEnd = '';
        }
        // Jika ayat awal diubah, dan ayat akhir jadi tidak valid (lebih kecil), reset ayat akhir
        if (field === 'ayatStart' && updated.ayatEnd && value && Number(value) > Number(updated.ayatEnd)) {
          updated.ayatEnd = '';
        }
        return updated;
      });
      return { ...p, [listName]: newList };
    }));
  };
  const getAyatRangeOrDefault = (surat, start, end) => start && end ? (start === end ? start : start + '-' + end) : start || end || (surahList.find(s => s.no + '. ' + s.name === surat) ? '1-' + surahList.find(s => s.no + '. ' + s.name === surat).ayat : 'Semua Ayat');

  const handleMarkAbsent = async (status = 'Alpa') => {
    const targetStudentIds = homeTab === 'jurnal' && editingId && isInactiveAttendanceStatus(status) ? [editingId] : selectedStudents;

    if (targetStudentIds.length === 0) {
      showToast('Pilih minimal 1 siswa!');
      return;
    }
    const dateStr = lessonPlans[0].tanggal;
    const k = homeTab === 'lesson_plan' ? { c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz', t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah' };

    try {
      const updates = students.reduce((acc, student) => {
        if (targetStudentIds.includes(student.id)) {
          const existingRecord = student.records[dateStr] || {};
          let finalRecord = { ...existingRecord };

          // Reset all fields and set the note to status
          Object.keys(k).forEach(key => { finalRecord[k[key]] = '-'; });
          finalRecord[k.c] = status;

          acc.push({ ...student, records: { ...student.records, [dateStr]: finalRecord } });
        }
        return acc;
      }, []);

      const { error } = await supabase.from('students').upsert(updates);
      if (error) throw error;

      setStudents(prev => {
        const newStudents = [...prev];
        updates.forEach(updatedStudent => { const idx = newStudents.findIndex(s => s.id === updatedStudent.id); if (idx !== -1) newStudents[idx] = updatedStudent; });
        return newStudents;
      });

      handleCloseModal();
      showToast(`${targetStudentIds.length} siswa ditandai ${status.toLowerCase()}.`);
    } catch (e) { console.error(e); showToast(`Gagal menandai ${status.toLowerCase()}.`); }
  };

  const handleSave = async () => {
    if (!editingId && selectedStudents.length === 0) { showToast('Pilih minimal 1 siswa!'); return; }
    const plan = lessonPlans[0];
    const formatS = (list) => { const v = list.filter(i => i.surat); return { surat: v.map(i => i.surat).join(', ') || '-', ayat: v.map(i => getAyatRangeOrDefault(i.surat, i.ayatStart, i.ayatEnd)).join(', ') || '-', nilai: v.map(i => i.nilai || '-').join(', ') || '-' }; };
    const mS = formatS(plan.murojaah), tS = formatS(plan.tahsinSuratList), fS = formatS(plan.tahfidzSuratList);
    let tahsinKat = plan.tahsinKategori, halAyat = tS.ayat;

    if (['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6'].includes(tahsinKat)) {
      let res = []; const sortedHal = [...plan.tahsinHalaman].sort((a, b) => Number(a) - Number(b));
      if (sortedHal.length === 0) plan.tahsinBaris = [];
      if (sortedHal.length > 0) res.push('Hal. ' + sortedHal.join(', ')); if (plan.tahsinBaris.length > 0) res.push('Brs ' + plan.tahsinBaris.join(', ')); halAyat = res.length > 0 ? res.join(' ') : '-';
    } else if (['Tajwid', 'Ghorib', 'Gharib'].includes(tahsinKat)) {
      const sortedHal = [...plan.tahsinHalaman].sort((a, b) => Number(a) - Number(b));
      // BUGS FIXED: Do not clear surah if halaman is empty, users might want to save surah without halaman
      // if (sortedHal.length === 0) {
      //   tS.surat = '-';
      //   tS.ayat = '-';
      //   tS.nilai = '-';
      // }
      const hStr = sortedHal.length > 0 ? 'Hal. ' + sortedHal.join(', ') : ''; const mStr = (plan.tahsinMateri || []).length > 0 ? plan.tahsinMateri.join(' | ') : ''; const hm = [hStr, mStr].filter(Boolean).join(' - '); halAyat = (hm && tS.ayat !== '-') ? hm + ' / ' + tS.ayat : hm || tS.ayat; tahsinKat = tS.surat !== '-' ? tahsinKat + ', ' + tS.surat : tahsinKat;
    } else if (tahsinKat === 'Al-Qur\'an') { tahsinKat = tS.surat || '-'; }

    const modalMurojaah = plan.murojaah.filter(m => m.surat).map(m => { const ayat = getAyatRangeOrDefault(m.surat, m.ayatStart, m.ayatEnd); return ayat === 'Semua Ayat' ? m.surat : m.surat + ' ' + ayat; }).join(', ') || '-';
    const modalTahsin = tahsinKat || '-'; const modalHalAyatTahsin = halAyat || '-'; const modalTahfidz = fS.surat || '-'; const modalAyatTahfidz = fS.ayat || '-'; const modalCatatan = plan.lainLain || '-'; const modalCatatanTahsin = plan.catatanTahsin || '-'; const modalCatatanTahfidz = plan.catatanTahfidz || '-';
    const modalTahsinNilai = plan.tahsinNilai || '-'; const modalTahsinSuratNilai = tS.nilai; const modalTahfidzNilai = fS.nilai;
    const isCategoryEdit = ['tahsin', 'tahfidz', 'murojaah', 'catatan'].includes(modalMode);
    const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan', cT: 'catatanTahsin', cF: 'catatanTahfidz' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan', cT: 'jurnalCatatanTahsin', cF: 'jurnalCatatanTahfidz' };
    const targetStudentIds = shouldRestrictApplyToOthers(modalCatatan) ? [editingId] : selectedStudents;

    try {
      const updates = students.reduce((acc, student) => {
        if (targetStudentIds.includes(student.id)) {
          const existingRecord = student.records[plan.tanggal] || {}; let finalRecord = { ...existingRecord };
          for (let key of Object.values(k)) if (!finalRecord[key]) finalRecord[key] = '-';

          const isOtherStudent = editingId && student.id !== editingId;
          const isJurnalOnlySuratCatatan = isOtherStudent && homeTab === 'jurnal';

          if (isCategoryEdit || modalMode === 'full_bulk') {
            if (modalMode === 'tahsin' || modalMode === 'full_bulk') {
              if (modalTahsin !== '-' || modalHalAyatTahsin !== '-') {
                finalRecord[k.t] = modalTahsin;
                if (!isJurnalOnlySuratCatatan) {
                  finalRecord[k.h] = modalHalAyatTahsin;
                  finalRecord[k.tNilai] = modalTahsinNilai;
                  finalRecord[k.tsNilai] = modalTahsinSuratNilai;
                }
              }
              if (modalCatatanTahsin !== '-' || modalMode === 'tahsin') finalRecord[k.cT] = modalCatatanTahsin;
            }
            if (modalMode === 'tahfidz' || modalMode === 'full_bulk') {
              if (modalTahfidz !== '-' || modalAyatTahfidz !== '-') {
                finalRecord[k.f] = modalTahfidz;
                if (!isJurnalOnlySuratCatatan) {
                  finalRecord[k.af] = modalAyatTahfidz;
                  finalRecord[k.fNilai] = modalTahfidzNilai;
                }
              }
              if (modalCatatanTahfidz !== '-' || modalMode === 'tahfidz') finalRecord[k.cF] = modalCatatanTahfidz;
            }
            if (modalMode === 'murojaah' || modalMode === 'full_bulk') {
              if (modalMurojaah !== '-') {
                finalRecord[k.m] = modalMurojaah;
              }
            }
            if (modalMode === 'catatan' || modalMode === 'full_bulk') {
              if (modalCatatan !== '-' || modalMode === 'catatan') finalRecord[k.c] = modalCatatan;
            }
          } else {
            finalRecord[k.t] = modalTahsin;
            finalRecord[k.f] = modalTahfidz;

            if (!isJurnalOnlySuratCatatan) {
              finalRecord[k.h] = modalHalAyatTahsin;
              finalRecord[k.tNilai] = modalTahsinNilai;
              finalRecord[k.tsNilai] = modalTahsinSuratNilai;
              finalRecord[k.af] = modalAyatTahfidz;
              finalRecord[k.fNilai] = modalTahfidzNilai;
            }

            finalRecord[k.m] = modalMurojaah;
            finalRecord[k.c] = modalCatatan;
            finalRecord[k.cT] = modalCatatanTahsin;
            finalRecord[k.cF] = modalCatatanTahfidz;
          }
          acc.push({
            ...student, // Bawa semua data siswa yang ada
            records: { ...student.records, [plan.tanggal]: finalRecord }
          });
        }
        return acc;
      }, []);

      // Lakukan operasi 'upsert' di Supabase
      const { error } = await supabase.from('students').upsert(updates);
      if (error) throw error;

      // --- LOG AKTIVITAS KHUSUS MUTABAAH ---
      try {
        const typeName = homeTab === 'lesson_plan' ? 'Target (Lesson Plan)' : 'Capaian (Mutabaah)';
        const studentNames = students.filter(s => targetStudentIds.includes(s.id)).map(s => s.name).join(', ');

        let detailMsg = `Tanggal: ${formatShortDate(new Date(plan.tanggal))}\n`;
        detailMsg += `Siswa (${targetStudentIds.length}): ${studentNames}\n\n`;

        if (modalTahsin !== '-' || modalHalAyatTahsin !== '-') detailMsg += `Tahsin: ${modalTahsin} ${modalHalAyatTahsin !== '-' ? '- ' + modalHalAyatTahsin : ''}\n`;
        if (modalTahfidz !== '-' || modalAyatTahfidz !== '-') detailMsg += `Tahfidz: ${modalTahfidz} ${modalAyatTahfidz !== '-' ? '- ' + modalAyatTahfidz : ''}\n`;
        if (modalMurojaah !== '-') detailMsg += `Murojaah: ${modalMurojaah}\n`;
        if (modalCatatan !== '-') detailMsg += `Catatan Umum: ${modalCatatan}\n`;
        if (modalCatatanTahsin !== '-') detailMsg += `Catatan Tahsin: ${modalCatatanTahsin}\n`;
        if (modalCatatanTahfidz !== '-') detailMsg += `Catatan Tahfidz: ${modalCatatanTahfidz}\n`;

        await supabase.from('activity_logs').insert([{
          guru_name: currentUser?.name || 'System / Unknown',
          action: `Menyimpan Data ${typeName}`,
          details: detailMsg.trim()
        }]);
      } catch (logErr) {
        console.error('Gagal mencatat log aktivitas mutabaah:', logErr);
      }
      // ------------------------------------

      // Update state lokal seketika agar data langsung muncul tanpa perlu di-refresh
      setStudents(prev => {
        const newStudents = [...prev];
        updates.forEach(updatedStudent => {
          const idx = newStudents.findIndex(s => s.id === updatedStudent.id);
          if (idx !== -1) newStudents[idx] = updatedStudent;
        });
        return newStudents;
      });

      handleCloseModal(); showToast('Data berhasil disimpan!');
    } catch (e) { console.error(e); showToast('Gagal menyimpan.'); }
  };

  const getModalTitle = () => {
    const nameSuffix = selectedStudents.length === 1 && modalMode === 'full_edit' ? ' - ' + (students.find(s => s.id === selectedStudents[0])?.name || '') : '';
    const prefix = homeTab === 'lesson_plan' ? 'Target' : 'Capaian';
    if (modalMode === 'tahsin') return <><BookOpen size={20} className="text-blue-500" /> {prefix} Tahsin</>;
    if (modalMode === 'tahfidz') return <><Mic size={20} className="text-purple-500" /> {prefix} Tahfidz</>;
    if (modalMode === 'murojaah') return <><Repeat size={20} className="text-emerald-500" /> {prefix} Murojaah</>;
    if (modalMode === 'catatan') return <><FileText size={20} className="text-orange-500" /> Catatan Guru</>;
    return <><Edit3 size={20} className="text-[#00e676]" /> {prefix} Hafalan{nameSuffix}</>;
  };

  const handleTabChange = (tab) => {
    const today = new Date();
    const day = today.getDay();
    const isWeekend = day === 0 || day === 6;

    if (tab === 'jurnal') {
      if (isWeekend) {
        // Jika weekend, buka Senin minggu depan untuk entri baru
        const nextWeekDate = new Date(today);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        const nextMonday = getMonday(nextWeekDate);
        setWeekStart(nextMonday);
        setActiveDate(formatDateObj(nextMonday));
      } else {
        // Jika hari kerja, buka hari ini di minggu ini
        setWeekStart(getMonday(today));
        setActiveDate(formatDateObj(today));
      }
    } else { // lesson_plan
      let targetDate = new Date(today);
      // Jika weekend, targetkan pekan depan untuk perencanaan
      if (isWeekend) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      const targetMonday = getMonday(targetDate);
      setWeekStart(targetMonday);
      setActiveDate(formatDateObj(targetMonday));
    }
    setHomeTab(tab);
  };

  const getStatusColor = (text) => {
    const lowerText = String(text || '').toLowerCase();
    if (lowerText.includes('alpa') || lowerText.includes('tidak hadir')) return 'text-red-600 font-black italic';
    if (lowerText.includes('sakit') || lowerText.includes('izin')) return 'text-amber-500 font-black italic';
    if (lowerText.includes('libur')) return 'text-emerald-600 font-black italic';
    if (lowerText.includes('ulang') || lowerText.includes('belum') || lowerText.includes('kurang')) return 'text-red-600 font-black';
    if (lowerText.includes('lancar') || lowerText.includes('baik') || lowerText.includes('selesai')) return 'text-green-600 font-black';
    return 'text-gray-700';
  };

  if (!currentUser) return null;
  if (!isDbReady) return (<div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]"><Loader2 size={48} className="animate-spin text-[#00e676] mb-4" /></div>);

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 text-gray-800 font-sans flex flex-col overflow-hidden transition-all duration-500">
      {/* CSS Khusus untuk Menyembunyikan Scrollbar Bawaan (Membuat UI lebih minimalis) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Chrome, Safari, Edge, Opera */
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Firefox, IE */
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Header */}
      <AppHeader institutionLogo={institutionLogo} institutionName={institutionName} currentView={currentView} setCurrentView={setCurrentView} isSuperAdmin={isSuperAdmin} currentUser={currentUser} onLogout={onLogout} theme={theme} setTheme={setTheme} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* MOBILE MENU OVERLAY (Drawer untuk HP) */}
      <MobileMenu mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} currentUser={currentUser} theme={theme} setTheme={setTheme} currentView={currentView} setCurrentView={setCurrentView} isSuperAdmin={isSuperAdmin} onLogout={onLogout} />

      {/* Area Filter Halaqoh & Guru */}
      <FilterBar currentView={currentView} isSuperAdmin={isSuperAdmin} activeGuru={activeGuru} setActiveGuru={handleGuruChange} setActiveHalaqoh={setActiveHalaqoh} guruList={guruList} currentUser={currentUser} showUnfilledOnly={showUnfilledOnly} setShowUnfilledOnly={setShowUnfilledOnly} handleCopyPortalLink={handleCopyPortalLink} activeHalaqoh={activeHalaqoh} guruHalaqohData={guruHalaqohData} students={students} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-hidden relative flex flex-col min-h-0 transition-colors duration-500">
        {currentView === 'home' && (
          <HomeView
            activeHalaqoh={activeHalaqoh}
            activeGuru={activeGuru}
            homeTab={homeTab}
            setHomeTab={handleTabChange}
            weekStart={weekStart}
            changeWeek={changeWeek}
            activeDate={activeDate}
            setActiveDate={setActiveDate}
            weekDates={weekDates}
            filteredStudents={filteredStudents}
            handleOpenModal={handleOpenModal}
            requestClearRecord={requestClearRecord}
            requestClearAllRecordForDay={requestClearAllRecordForDay}
            handleAutoFillFromGhost={handleAutoFillFromGhost}
            setSharingStudent={setSharingStudent}
            handleRemoveData={handleRemoveData}
            getStatusColor={getStatusColor}
            institutionLogo={institutionLogo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            studentsInHalaqohCount={studentsInHalaqoh.length}
            studentsInHalaqoh={studentsInHalaqoh}
            isLoading={isLoading}
            targetReguler={targetReguler}
            targetAlQuran={targetAlQuran}
            showToast={showToast}
          />
        )}
        {currentView === 'siswa' && (
          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 pb-24 md:pb-0">
            <StudentView
              activeHalaqoh={activeHalaqoh} filteredStudents={filteredStudents}
              openAddStudentModal={() => {
                setNewStudent({ name: '', kelas: kelasList.length > 0 ? kelasList[0] : '', halaqoh: activeHalaqoh, photo: null });
                setIsAddStudentModalOpen(true);
              }}
              openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
              requestDeleteStudent={requestDeleteStudent} isSuperAdmin={isSuperAdmin}
              openCropModal={openCropModal}
              uploadingPhotoId={uploadingPhotoId}
              uploadProgress={uploadProgress}
              onReorderStudents={handleReorderStudents}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}
        {currentView === 'laporan' && (
          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 pb-24 md:pb-0">
            <ReportView
              activeHalaqoh={activeHalaqoh}
              activeGuru={activeGuru}
              activeDate={activeDate}
              setActiveDate={setActiveDate}
              weekDates={weekDates}
              changeWeek={changeWeek}
              filteredStudents={filteredStudents}
              institutionLogo={institutionLogo}
              guruHalaqohData={guruHalaqohData}
            />
          </div>
        )}
        {currentView === 'arsip' && (
          <ArchiveView
            isSuperAdmin={isSuperAdmin}
            currentUser={currentUser}
            institutionLogo={institutionLogo}
            guruHalaqohData={guruHalaqohData}
          />
        )}
        {currentView === 'pengaturan' && (
          <SettingsView
            isSuperAdmin={isSuperAdmin} appUsers={appUsers}
            handleApproveUser={handleApproveUser} handleRejectUser={handleRejectUser} handleUpdateUserAccount={handleUpdateUserAccount}
            institutionName={institutionName} setInstitutionName={setInstitutionName} institutionLogo={institutionLogo} handleInstitutionLogoUpload={handleInstitutionLogoUpload} setInstitutionLogo={setInstitutionLogo} updateMasterDataCloud={updateMasterDataCloud} showToast={showToast}
            targetReguler={targetReguler} setTargetReguler={setTargetReguler} targetAlQuran={targetAlQuran} setTargetAlQuran={setTargetAlQuran}
            kelasList={kelasList} newKelasName={newKelasName} setNewKelasName={setNewKelasName} handleAddKelas={handleAddKelas} handleDeleteKelas={handleDeleteKelas} handleReorderKelas={handleReorderKelas}
            newGuruName={newGuruName} setNewGuruName={setNewGuruName} handleAddGuru={handleAddGuru} guruList={isSuperAdmin ? guruList : [currentUser.name]}
            selectedGuruForHalaqoh={selectedGuruForHalaqoh} setSelectedGuruForHalaqoh={setSelectedGuruForHalaqoh} newHalaqohName={newHalaqohName} setNewHalaqohName={setNewHalaqohName} handleAddHalaqoh={handleAddHalaqoh}
            currentUser={currentUser} guruHalaqohData={guruHalaqohData} editingGuru={editingGuru} setEditingGuru={setEditingGuru} handleSaveEditGuru={handleSaveEditGuru} requestDeleteGuru={requestDeleteGuru}
            editingHalaqoh={editingHalaqoh} setEditingHalaqoh={setEditingHalaqoh} handleSaveEditHalaqoh={handleSaveEditHalaqoh} requestDeleteHalaqoh={requestDeleteHalaqoh} handleReorderHalaqoh={handleReorderHalaqoh}
            handleReorderGuru={handleReorderGuru}
            students={students} openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
            requestDeleteStudent={requestDeleteStudent} requestBulkDeleteStudents={requestBulkDeleteStudents} requestBulkEditStudents={requestBulkEditStudents} handleBulkSaveStudents={handleBulkSaveStudents} onLogout={onLogout}
            handleCleanLessonPlanValues={handleCleanLessonPlanValues}
            handleResetTeacherPassword={handleResetTeacherPassword}
            handleCloseSemester={handleCloseSemester}
            handleBackupData={handleBackupData}
            handleLinkAccount={handleLinkAccount}
          />
        )}
        {currentView === 'statistik' && (
          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 pb-24 md:pb-0">
            <ProgressChartView
              students={filteredStudents}
              activeHalaqoh={activeHalaqoh}
              allStudents={students}
              weekDates={weekDates}
              changeWeek={changeWeek}
            />
          </div>
        )}
        {currentView === 'log' && isSuperAdmin && (
          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 pb-24 md:pb-0">
            <ActivityLogView />
          </div>
        )}
      </main>

      {/* RENDER MODALS */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} isSuperAdmin={isSuperAdmin} addStudentMode={addStudentMode} setAddStudentMode={setAddStudentMode}
        masterSearchQuery={masterSearchQuery} setMasterSearchQuery={setMasterSearchQuery} students={students.filter(s => !s.halaqoh || s.halaqoh.trim() === '')} activeHalaqoh={activeHalaqoh} handleAssignFromMaster={handleAssignFromMaster} newStudent={newStudent} setNewStudent={setNewStudent} handlePhotoUpload={handlePhotoUpload} kelasList={kelasList} handleSaveNewStudent={handleSaveNewStudent} getInitials={getInitials}
        guruHalaqohData={getFilteredHalaqohDataForEdit()}
      />
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        editStudentData={editStudentData}
        setEditStudentData={setEditStudentData}
        handlePhotoUpload={handlePhotoUpload}
        kelasList={kelasList}
        handleUpdateStudent={handleUpdateStudent}
        guruHalaqohData={getFilteredHalaqohDataForEdit()}
        isSuperAdmin={isSuperAdmin}
        currentUser={currentUser}
      />

      {/* MODAL JURNAL */}
      <JurnalModal
        isOpen={isModalOpen} onClose={handleCloseModal} modalMode={modalMode} getModalTitle={getModalTitle} lessonPlans={lessonPlans} handlePlanChange={handlePlanChange} handleToggleArray={handleToggleArray} handleAddSurat={handleAddSurat} handleRemoveSurat={handleRemoveSurat} handleSuratChange={handleSuratChange} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} tahsinCategories={tahsinCategories} ghoribList={ghoribList} tajwidList={tajwidList} surahList={surahList} homeTab={homeTab} handleSave={handleSave} editingId={editingId} selectedStudents={selectedStudents} filteredStudents={studentsInHalaqoh} toggleStudent={toggleStudent}
        handleMarkAbsent={handleMarkAbsent}
      />

      {/* MODAL CROP GAMBAR */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCroppedImage}
      />

      {/* MODAL KONFIRMASI BERBAHAYA (CUSTOM CONFIRM) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-b from-red-500 to-red-600 p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-5 shadow-inner border border-white/30">
                <AlertTriangle size={40} className="text-white drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight drop-shadow-sm">PERINGATAN!</h3>
              <p className="text-red-50 text-sm font-medium leading-relaxed drop-shadow-sm">{confirmDialog.message}</p>
            </div>
            <div className="p-5 sm:p-6 bg-white flex gap-3">
              <button onClick={() => setConfirmDialog({ isOpen: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors active:scale-95">Batal</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false }); }} className="flex-1 py-3.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-black shadow-lg shadow-red-200 active:scale-95 transition-all border border-red-500">Ya, Lanjutkan!</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (<div className="fixed top-4 md:top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-2xl z-[100010] font-bold text-xs md:text-sm animate-bounce">{toastMessage}</div>)}

      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center h-[70px] z-40 print:hidden">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-green-600' : 'text-gray-400'}`}><Home size={20} /><span className="text-[9px] font-bold">Beranda</span></button>
        <button onClick={() => setCurrentView('siswa')} className={`flex flex-col items-center gap-1 ${currentView === 'siswa' ? 'text-green-600' : 'text-gray-400'}`}><Users size={20} /><span className="text-[9px] font-bold">Siswa</span></button>
        <button onClick={() => setCurrentView('laporan')} className={`flex flex-col items-center gap-1 ${currentView === 'laporan' ? 'text-green-600' : 'text-gray-400'}`}><BarChart3 size={20} /><span className="text-[9px] font-bold">Laporan</span></button>
        <button onClick={() => setCurrentView('arsip')} className={`flex flex-col items-center gap-1 ${currentView === 'arsip' ? 'text-green-600' : 'text-gray-400'}`}><Archive size={20} /><span className="text-[9px] font-bold">Arsip</span></button>
        <button onClick={() => setCurrentView('statistik')} className={`flex flex-col items-center gap-1 ${currentView === 'statistik' ? 'text-green-600' : 'text-gray-400'}`}><PieChart size={20} /><span className="text-[9px] font-bold">Grafik</span></button>
        {isSuperAdmin && (
          <button onClick={() => setCurrentView('log')} className={`flex flex-col items-center gap-1 ${currentView === 'log' ? 'text-green-600' : 'text-gray-400'}`}><Activity size={20} /><span className="text-[9px] font-bold">Log</span></button>
        )}
        <button onClick={() => setCurrentView('pengaturan')} className={`flex flex-col items-center gap-1 ${currentView === 'pengaturan' ? 'text-green-600' : 'text-gray-400'}`}><Settings size={20} /><span className="text-[9px] font-bold">Setelan</span></button>
      </nav>
    </div>
  );
};

export default MainApp;
