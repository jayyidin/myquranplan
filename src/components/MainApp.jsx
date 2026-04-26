import React, { useState, useEffect } from 'react';
import { BookOpen, User, Menu, Home, Users, BarChart3, Settings, LogOut, Loader2, Edit3, Mic, Repeat, FileText, X, AlertTriangle } from 'lucide-react';

// Imports
import { supabase } from './supabase';
import { surahList, tahsinCategories, ghoribList, tajwidList } from '../data/constants';
import { getMonday, formatDateObj, formatShortDate, getStatusColor } from '../utils/helpers';

// Views
import HomeView from './views/HomeView';
import StudentView from './views/StudentView';
import ReportView from './views/ReportView';
import SettingsView from './views/SettingsView';

// Modals
import { AddStudentModal, EditStudentModal } from './modals/StudentModals';
import { JurnalModal } from './modals/JurnalModal';
import ImageCropModal from './modals/ImageCropModal';

const MainApp = ({ currentUser, onLogout }) => {
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // -- STATE UTAMA --
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeTab, setHomeTab] = useState('jurnal');

  const [guruHalaqohData, setGuruHalaqohData] = useState({});
  const guruList = Object.keys(guruHalaqohData);
  const [kelasList, setKelasList] = useState([]);
  const [institutionName, setInstitutionName] = useState('Nama Sekolah Anda');
  const [institutionLogo, setInstitutionLogo] = useState('logo.png');
  const [appUsers, setAppUsers] = useState([]);

  const [activeGuru, setActiveGuru] = useState('');
  const [activeHalaqoh, setActiveHalaqoh] = useState('');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [lessonPlans, setLessonPlans] = useState([{ id: 1, tanggal: '', murojaah: [emptySurat()], tahsinKategori: '', tahsinSuratList: [emptySurat()], tahsinHalaman: [], tahsinBaris: [], tahsinMateri: [], tahsinHalamanTg: [], tahfidzSuratList: [emptySurat()], lainLain: '', tahsinNilai: '' }]);

  // -- STATE UNGGAH FOTO & CROP --
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [studentIdForCrop, setStudentIdForCrop] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // -- EFEK INIT --
  useEffect(() => {
    // Fungsi untuk mengambil data awal dari Supabase
    async function fetchInitialData() {
      // 1. Ambil data pengaturan
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsError) console.error('Error Settings:', settingsError);
      if (settingsData) {
        setGuruHalaqohData(settingsData.guruhalaqohdata || settingsData.guruHalaqohData || {});
        setKelasList(settingsData.kelaslist || settingsData.kelasList || []);
        setInstitutionName(settingsData.institutionname || settingsData.institutionName || 'Nama Sekolah Anda');
        setInstitutionLogo(settingsData.institutionlogo || settingsData.institutionLogo || 'logo.png');
      }

      // 2. Ambil data siswa
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');
      if (studentsError) console.error('Error Students:', studentsError);

      if (studentsData) {
        // Filter nama ganda secara global dan bersihkan otomatis di database
        const uniqueStudentsMap = new Map();
        const duplicateIdsToDelete = [];
        const studentsToUpdateMap = new Map();

        studentsData.forEach(s => {
          const nameKey = (s?.name || '').trim().toLowerCase();
          if (!uniqueStudentsMap.has(nameKey)) {
             uniqueStudentsMap.set(nameKey, s);
          } else {
             const existing = uniqueStudentsMap.get(nameKey);
             // Gabungkan riwayat catatan (records) agar progres lama tidak hilang
             const mergedRecords = { ...(existing.records || {}), ...(s.records || {}) };
             
             if (!existing.halaqoh && s.halaqoh) {
                duplicateIdsToDelete.push(existing.id);
                const keptStudent = { ...s, records: mergedRecords };
                uniqueStudentsMap.set(nameKey, keptStudent);
                studentsToUpdateMap.set(keptStudent.id, keptStudent);
             } else {
                duplicateIdsToDelete.push(s.id);
                const keptStudent = { ...existing, records: mergedRecords };
                uniqueStudentsMap.set(nameKey, keptStudent);
                studentsToUpdateMap.set(keptStudent.id, keptStudent);
             }
          }
        });
        
        // Urutkan berdasarkan kolom sort_order secara lokal agar aman
        setStudents(Array.from(uniqueStudentsMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

        // Eksekusi pembersihan duplikat di latar belakang
        if (duplicateIdsToDelete.length > 0) {
          supabase.from('students').delete().in('id', duplicateIdsToDelete).then();
          studentsToUpdateMap.forEach(student => {
             supabase.from('students').update({ records: student.records }).eq('id', student.id).then();
          });
        }
      }

      // 3. Ambil data pengguna (jika superadmin)
      if (isSuperAdmin) {
        const { data: usersData, error: usersError } = await supabase
          .from('app_users')
          .select('*');
        if (usersData) setAppUsers(usersData);
      }

      setIsDbReady(true);
    }

    fetchInitialData();

    // Setup listener real-time untuk tabel siswa
    const studentsSubscription = supabase.channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        console.log('Perubahan data siswa terdeteksi!', payload);
        fetchInitialData(); // Cara paling sederhana: ambil ulang semua data jika ada perubahan
      })
      .subscribe();

    // Cleanup subscription saat komponen di-unmount
    return () => {
      supabase.removeChannel(studentsSubscription);
    };
  }, [isSuperAdmin]);

  // Efek Loading saat ganti filter halaqoh, tanggal, atau tab
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeHalaqoh, activeDate, homeTab]);

  useEffect(() => {
    if (!isSuperAdmin) {
      const teacherName = currentUser?.name || "";
      if (activeGuru !== teacherName) setActiveGuru(teacherName);
      if (selectedGuruForHalaqoh !== teacherName) setSelectedGuruForHalaqoh(teacherName);

      // Cari data halaqoh secara case-insensitive
      const searchName = teacherName.trim().toLowerCase();
      const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
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
        }
      }
    }
  }, [guruList, guruHalaqohData, isSuperAdmin, currentUser?.name]);

  useEffect(() => { setNewStudent(prev => ({ ...prev, halaqoh: activeHalaqoh, kelas: prev.kelas || (kelasList.length > 0 ? kelasList[0] : '') })); }, [activeHalaqoh, kelasList]);

  // -- FUNGSI UTILITY --
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); };
  const updateMasterDataCloud = async (updates) => {
    // Format ulang ke lowercase untuk PostgreSQL (Supabase)
    const mappedUpdates = {};
    if (updates.guruHalaqohData !== undefined) mappedUpdates.guruhalaqohdata = updates.guruHalaqohData;
    if (updates.kelasList !== undefined) mappedUpdates.kelaslist = updates.kelasList;
    if (updates.institutionName !== undefined) mappedUpdates.institutionname = updates.institutionName;
    if (updates.institutionLogo !== undefined) mappedUpdates.institutionlogo = updates.institutionLogo;

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
  const filteredStudents = students.filter(s => {
    // Dengan RLS, 'students' sudah berisi data yang diizinkan untuk user.
    // Kita hanya perlu filter berdasarkan UI (halaqoh aktif dan pencarian).
    const isSearchMatch = (s?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const isInActiveHalaqoh = !activeHalaqoh || (s?.halaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim());

    if (!isSuperAdmin) {
      const searchName = currentUser?.name?.trim().toLowerCase() || "";
      const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
      const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

      return isInActiveHalaqoh && (myHalaqohs.includes(activeHalaqoh) || !activeHalaqoh) && isSearchMatch;
    }
    return isInActiveHalaqoh && isSearchMatch;
  });

  // Hitung jumlah siswa di halaqoh aktif (sebelum difilter oleh pencarian) untuk placeholder
  const studentsInHalaqoh = students.filter(s => {
    // Logika ini juga disederhanakan karena RLS sudah bekerja.
    const isInActiveHalaqoh = !activeHalaqoh || (s?.halaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim());

    if (!isSuperAdmin) {
      const searchName = currentUser?.name?.trim().toLowerCase() || "";
      const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
      const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

      return isInActiveHalaqoh && (myHalaqohs.includes(activeHalaqoh) || !activeHalaqoh);
    }
    return isInActiveHalaqoh;
  });

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
    }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm('Yakin ingin menolak dan menghapus pendaftaran guru ini?')) {
      try {
        await supabase.from('app_users').delete().eq('id', userId);
        showToast('Pendaftaran ditolak & dihapus.');
      } catch (error) {
        showToast('Gagal menolak pendaftaran.');
      }
    }
  };

  const handleUpdateUserAccount = async (userId, updatedData) => {
    try {
      await supabase.from('app_users').update(updatedData).eq('id', userId);
      showToast('Akun berhasil diperbarui!');
    } catch (error) {
      showToast('Gagal update akun.');
    }
  };

  const handleBulkSaveStudents = async (studentList) => {
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
    
    const { data, error } = await supabase.from('students').insert(studentsToInsert).select();
    if (error) { showToast('Gagal mengimpor data.'); } else {
      if (data) {
         setStudents(prev => [...prev, ...data]);
      }
      showToast(`${uniqueInput.length} siswa berhasil diimpor!`);
    }
  };

  const handleInstitutionLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setInstitutionLogo(base64String);
        await updateMasterDataCloud({ institutionLogo: base64String });
        showToast('Logo berhasil diperbarui!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddKelas = async () => {
    if (!newKelasName.trim() || kelasList.includes(newKelasName.trim())) return;
    const updated = [...kelasList, newKelasName.trim()];
    await updateMasterDataCloud({ kelasList: updated });
    setNewKelasName('');
    showToast('Kelas ditambahkan!');
  };

  const handleDeleteKelas = async (kelas) => {
    if (window.confirm(`Hapus kelas ${kelas}?`)) {
      const updated = kelasList.filter(k => k !== kelas);
      await updateMasterDataCloud({ kelasList: updated });
      showToast('Kelas dihapus!');
    }
  };

  const handleAddGuru = async () => {
    if (!newGuruName.trim() || guruList.includes(newGuruName.trim())) return;
    const updated = { ...guruHalaqohData, [newGuruName.trim()]: [] };
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setNewGuruName('');
    showToast('Pengajar ditambahkan!');
  };

  const handleAddHalaqoh = async () => {
    if (!newHalaqohName.trim() || !selectedGuruForHalaqoh) return;
    const currentHalaqohs = guruHalaqohData[selectedGuruForHalaqoh] || [];
    if (currentHalaqohs.includes(newHalaqohName.trim())) return;
    const updated = { ...guruHalaqohData, [selectedGuruForHalaqoh]: [...currentHalaqohs, newHalaqohName.trim()] };
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setNewHalaqohName('');
    showToast('Halaqoh ditambahkan!');
  };

  const handleSaveEditGuru = async () => {
    if (!editingGuru.newName.trim() || editingGuru.newName === editingGuru.oldName) { setEditingGuru(null); return; }
    const updated = { ...guruHalaqohData };
    updated[editingGuru.newName.trim()] = updated[editingGuru.oldName];
    delete updated[editingGuru.oldName];
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setEditingGuru(null);
    showToast('Nama pengajar diubah!');
  };

  const requestDeleteGuru = async (guru) => {
    if (window.confirm(`Hapus pengajar ${guru} beserta seluruh halaqohnya?`)) {
      const updated = { ...guruHalaqohData };
      delete updated[guru];
      await updateMasterDataCloud({ guruHalaqohData: updated });
      showToast('Pengajar dihapus!');
    }
  };

  const handleSaveEditHalaqoh = async () => {
    if (!editingHalaqoh.newName.trim() || editingHalaqoh.newName === editingHalaqoh.oldName) { setEditingHalaqoh(null); return; }
    const updated = { ...guruHalaqohData };
    const halaqohs = updated[editingHalaqoh.guruName];
    updated[editingHalaqoh.guruName] = halaqohs.map(h => h === editingHalaqoh.oldName ? editingHalaqoh.newName.trim() : h);
    await updateMasterDataCloud({ guruHalaqohData: updated });
    setEditingHalaqoh(null);
    showToast('Nama halaqoh diubah!');
  };

  const requestDeleteHalaqoh = async (guru, halaqoh) => {
    if (window.confirm(`Hapus halaqoh ${halaqoh} dari pengajar ${guru}?`)) {
      const updated = { ...guruHalaqohData };
      updated[guru] = updated[guru].filter(h => h !== halaqoh);
      await updateMasterDataCloud({ guruHalaqohData: updated });
      showToast('Halaqoh dihapus!');
    }
  };

  // -- FUNGSI HAPUS & KOSONGKAN DATA (Tabel) --
  const handleRemoveData = async (e, studentId, dateStr, type, subIndex = null) => {
    e.preventDefault(); e.stopPropagation();
    // ... (Logika internal untuk memodifikasi objek 'rec' tetap sama)
      const student = students.find(s => s.id === studentId); if (!student) return;
      const rec = student.records[dateStr] ? { ...student.records[dateStr] } : {};
      const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

      for (let key of Object.values(k)) if (!rec[key]) rec[key] = '-';

      if (type === 'catatan') { rec[k.c] = '-'; }
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

    if (error) showToast('Gagal menghapus data.');
  };

  const requestClearRecord = async (e, studentId, dateStr) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm('Yakin ingin mengosongkan data pada tanggal ini?')) {
      const student = students.find(s => s.id === studentId); if (!student) return;
      const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };
      const newRecords = { ...student.records };
      const dayRec = newRecords[dateStr] ? { ...newRecords[dateStr] } : {};
      dayRec[k.t] = '-'; dayRec[k.h] = '-'; dayRec[k.tNilai] = '-'; dayRec[k.tsNilai] = '-'; dayRec[k.f] = '-'; dayRec[k.af] = '-'; dayRec[k.fNilai] = '-'; dayRec[k.m] = '-'; dayRec[k.c] = '-';
      newRecords[dateStr] = dayRec;

      const { error } = await supabase.from('students').update({ records: newRecords }).eq('id', studentId);
      if (error) { showToast('Gagal mengosongkan data.'); } else { showToast('Data dikosongkan!'); }
    }
  };

  const setSharingStudent = (student) => { showToast("Fitur Share Gambar akan segera diaktifkan."); };

  // -- FUNGSI SISWA --
  const handleAssignFromMaster = async (student) => {
    const { error } = await supabase.from('students').update({ halaqoh: activeHalaqoh }).eq('id', student.id);
    if (error) { showToast('Gagal.'); } else { showToast(`${student.name} ditambahkan!`); }
  };
  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    try {
      const { photo, ...studentData } = newStudent;
        
        // Mencegah duplikasi nama
        const normalizedName = studentData.name.trim().toLowerCase();
        const isDuplicate = students.some(s => s.name.trim().toLowerCase() === normalizedName);
        if (isDuplicate) {
          showToast('Nama siswa sudah ada di bank data!');
          return;
        }

      let photoUrl = null;

      // 1. Jika ada foto, unggah dulu ke Supabase Storage
      if (photo && photo.startsWith('data:image')) {
        const imageBlob = dataURLtoBlob(photo);
        if (imageBlob) {
          photoUrl = await handleUploadStudentPhoto(null, imageBlob); // Dapatkan URL
        }
      }

      // 2. Masukkan data siswa baru ke tabel, termasuk URL foto jika ada
      const maxSortOrder = students.length > 0 ? Math.max(...students.map(s => s.sort_order || 0)) : 0;
      const newStudentObj = {
        ...studentData,
        initial: getInitials(studentData.name),
        photo: photoUrl,
        records: {},
        sort_order: maxSortOrder + 1
      };

      const { data, error } = await supabase.from('students').insert([newStudentObj]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setStudents(prev => [...prev, data[0]]);
      }
      setIsAddStudentModalOpen(false);
      showToast('Siswa ditambahkan!');
    } catch (e) { console.error("Gagal menyimpan siswa baru:", e); showToast('Gagal menyimpan.'); }
  };
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      let { id, photo, ...studentData } = editStudentData;

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
          supabase.from('students').delete().eq('id', student.id).then(() => showToast('Dihapus.'));
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin mengeluarkan "${student.name}" dari halaqoh ${activeHalaqoh}?`,
        onConfirm: () => {
          supabase.from('students').update({ halaqoh: '' }).eq('id', student.id).then(() => showToast('Siswa berhasil dikeluarkan.'));
        }
      });
    }
  };

  const requestBulkDeleteStudents = async (studentIds) => {
    if (!studentIds || studentIds.length === 0) return;
    if (isSuperAdmin) {
      setConfirmDialog({
        isOpen: true,
        message: `Yakin ingin menghapus ${studentIds.length} siswa secara permanen dari sistem? Awas, tindakan ini tidak bisa dibatalkan!`,
        onConfirm: () => {
          supabase.from('students').delete().in('id', studentIds).then(() => {
            setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
            showToast(`${studentIds.length} siswa dihapus.`);
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
          });
        }
      });
    }
  };

  const requestBulkEditStudents = async (studentIds, updates) => {
    if (!studentIds || studentIds.length === 0) return;
    try {
      const { error } = await supabase.from('students').update(updates).in('id', studentIds);
      if (error) throw error;
      setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { ...s, ...updates } : s));
      showToast(`${studentIds.length} siswa berhasil diperbarui.`);
    } catch (e) {
      console.error(e);
      showToast('Gagal memperbarui siswa secara massal.');
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
      const fileName = `${studentId || 'new'}/${Date.now()}_photo.jpg`;

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
    if (isSuperAdmin) return guruHalaqohData;

    const searchName = currentUser?.name?.trim().toLowerCase() || "";
    const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);

    return guruKey ? { [guruKey]: guruHalaqohData[guruKey] } : { [currentUser?.name || 'Guru']: [] };
  }

  // -- FUNGSI JURNAL MODAL --
  const parseSuratAyatList = (suratText, ayatText, nilaiText) => {
    if ((!suratText || suratText === '-') && (!ayatText || ayatText === '-') && (!nilaiText || nilaiText === '-')) return [emptySurat()];
    const surats = (suratText || '').split(',').map(s => s.trim());
    const ayats = (ayatText || '').split(',').map(s => s.trim());
    const nilais = (nilaiText || '').split(',').map(s => s.trim());
    const len = Math.max(surats.length, ayats.length, 1);
    const list = [];
    for (let i = 0; i < len; i++) { list.push({ id: Date.now() + Math.random(), surat: surats[i] || '', ayatStart: (ayats[i] || '').split('-')[0] || '', ayatEnd: (ayats[i] || '').split('-')[1] || '', nilai: nilais[i] || '' }); }
    return list.length ? list : [emptySurat()];
  };

  const parseMurojaahList = (text) => {
    if (!text || text === '-') return [emptySurat()];
    return text.split(',').map((item) => {
      let s = item.trim(), aStart = '', aEnd = ''; let match = s.match(/(.+?)\s*\((.*?)\)/) || s.match(/(.+?)\s+(\d+(?:-\d+)?)$/);
      if (match) { s = match[1].trim(); aStart = match[2].split('-')[0] || ''; aEnd = match[2].split('-')[1] || ''; }
      return { id: Date.now() + Math.random(), surat: s, ayatStart: aStart, ayatEnd: aEnd };
    });
  };

  const handleOpenModal = (student = null, mode = 'full_bulk') => {
    setActiveDropdown(null); setModalMode(mode);
    const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

    let initialDataForModal = {};
    let studentToProcess = student; // The student whose data we are primarily interested in

    const findLastRecord = (s) => {
      const activeDateObj = new Date(activeDate);
      const recordedDates = Object.keys(s.records || {})
        .map(d => new Date(d))
        .filter(d => d < activeDateObj) // Only dates before the active date
        .sort((a, b) => b - a); // Sort descending

      for (const d of recordedDates) {
        const dStr = formatDateObj(d);
        const rec = s.records[dStr];
        if (rec && ((rec[k.t] && rec[k.t] !== '-') || (rec[k.f] && rec[k.f] !== '-') || (rec[k.m] && rec[k.m] !== '-'))) {
          return { record: rec, date: dStr }; // Found it
        }
      }
      return null; // Not found
    };

    // Logic for 'Lanjutkan Data Terakhir' button (bulk_last)
    if (mode === 'bulk_last') { // This is for the button, not individual cells
      setModalMode('full_bulk'); // UI will be bulk

      // Find the first student with last week's data as a template for bulk
      for (const s of filteredStudents) {
        const lastData = findLastRecord(s);
        if (lastData) {
          initialDataForModal = lastData.record;
          showToast(`Menyalin data terakhir ${s.name.split(' ')[0]} (${formatShortDate(new Date(lastData.date))})`);
          break;
        }
      }
      if (Object.keys(initialDataForModal).length === 0) showToast("Tidak ditemukan data sebelumnya.");
      setEditingId(null); // No specific student is being edited, it's a bulk operation
      setSelectedStudents(filteredStudents.map(s => s.id)); // Select all for bulk

    } else if (mode === 'prefill_last_week_single_student' && studentToProcess) {
      setModalMode('full_edit'); // UI will be single student edit
      setEditingId(studentToProcess.id);
      setSelectedStudents([studentToProcess.id]);
      const lastData = findLastRecord(studentToProcess);
      if (lastData) {
        initialDataForModal = lastData.record;
        showToast(`Mengisi dari data terakhir ${studentToProcess.name.split(' ')[0]} (${formatShortDate(new Date(lastData.date))})`);
      } else {
        showToast("Tidak ditemukan data sebelumnya untuk siswa ini.");
      }

    } else if (studentToProcess) { // Regular single student edit/input
      initialDataForModal = studentToProcess.records[activeDate] || {};
      setEditingId(studentToProcess.id);
      setSelectedStudents([studentToProcess.id]);
    } else { // Regular full_bulk (empty)
      setEditingId(null);
      setSelectedStudents(filteredStudents.map(s => s.id)); // Default to all selected for empty bulk
    }

    if (Object.keys(initialDataForModal).length > 0 || studentToProcess || mode === 'full_bulk') { // Only open if there's data or it's a new bulk
      // FIX: Create a 'clean' data object for the modal.
      // This ensures that only data relevant to the current tab (Target or Jurnal) is used,
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
      } else if (tSurat.includes('Tajwid') || tSurat.includes('Ghorib') || tSurat === 'Gharib') {
        tKategori = tSurat.includes('Tajwid') ? 'Tajwid' : 'Ghorib'; tSurat = tSurat.replace(tKategori + ', ', '').replace(tKategori, '').trim();
        const parts = rawTahsinAyat.split('/');
        if (parts.length > 0) {
          let halMatStr = parts[0].trim(); const tgHalMatch = halMatStr.match(/Hal\.\s+([\d,\s]+)/);
          if (tgHalMatch) { tHalaman = tgHalMatch[1].split(',').map(s => s.trim()); halMatStr = halMatStr.replace(tgHalMatch[0], '').replace(/^[\s-]+|[\s-]+$/g, ''); }
          if (halMatStr) { tMateri = halMatStr.split('|').map(s => s.trim()).filter(Boolean); }
          tahsinAyatOnly = parts.length > 1 ? parts.slice(1).join('/').trim() : '';
        }
      } else if (tSurat && tSurat !== '-') tKategori = 'Al-Qur\'an';

      setLessonPlans([{
        id: Date.now(), tanggal: activeDate, murojaah: parseMurojaahList(cleanData[k.m]), tahsinKategori: tKategori, tahsinSuratList: parseSuratAyatList(tSurat, tahsinAyatOnly, cleanData[k.tsNilai]), tahsinHalaman: tHalaman, tahsinBaris: tBaris, tahsinMateri: tMateri, tahsinHalamanTg: tHalamanTg, tahfidzSuratList: parseSuratAyatList(cleanData[k.f], cleanData[k.af], cleanData[k.fNilai]), lainLain: cleanData[k.c] && cleanData[k.c] !== '-' ? cleanData[k.c] : '', tahsinNilai: cleanData[k.tNilai] && cleanData[k.tNilai] !== '-' ? cleanData[k.tNilai] : ''
      }]);
      setIsModalOpen(true); // Open modal only if there's data or it's a new bulk
    } else {
      showToast("Tidak ada data untuk diisi."); // Or handle as empty modal if desired
    }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); setActiveDropdown(null); setModalMode('full_bulk'); };
  const toggleStudent = (id) => { if (id === 'ALL') { setSelectedStudents(filteredStudents.length === selectedStudents.length ? [] : filteredStudents.map(s => s.id)) } else { setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]); } };

  const handlePlanChange = (id, field, value) => { setLessonPlans(plans => plans.map(p => { if (p.id === id) { let u = { ...p, [field]: value }; if (field === 'tahsinKategori') { u.tahsinHalaman = []; u.tahsinBaris = []; u.tahsinMateri = []; u.tahsinSuratList = [emptySurat()]; } return u; } return p; })); };
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
  const getAyatRangeOrDefault = (surat, start, end) => start && end ? start + '-' + end : start || end || (surahList.find(s => s.no + '. ' + s.name === surat) ? '1-' + surahList.find(s => s.no + '. ' + s.name === surat).ayat : 'Semua Ayat');

  const handleSave = async () => {
    if (!editingId && selectedStudents.length === 0) { showToast('Pilih minimal 1 siswa!'); return; }
    const plan = lessonPlans[0];
    const formatS = (list) => { const v = list.filter(i => i.surat); return { surat: v.map(i => i.surat).join(', ') || '-', ayat: v.map(i => getAyatRangeOrDefault(i.surat, i.ayatStart, i.ayatEnd)).join(', ') || '-', nilai: v.map(i => i.nilai || '-').join(', ') || '-' }; };
    const mS = formatS(plan.murojaah), tS = formatS(plan.tahsinSuratList), fS = formatS(plan.tahfidzSuratList);
    let tahsinKat = plan.tahsinKategori, halAyat = tS.ayat;

    if (['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6'].includes(tahsinKat)) {
      let res = []; const sortedHal = [...plan.tahsinHalaman].sort((a, b) => Number(a) - Number(b)); if (sortedHal.length > 0) res.push('Hal. ' + sortedHal.join(', ')); if (plan.tahsinBaris.length > 0) res.push('Brs ' + plan.tahsinBaris.join(', ')); halAyat = res.length > 0 ? res.join(' ') : '-';
    } else if (['Tajwid', 'Ghorib'].includes(tahsinKat)) {
      const sortedHal = [...plan.tahsinHalaman].sort((a, b) => Number(a) - Number(b)); const hStr = sortedHal.length > 0 ? 'Hal. ' + sortedHal.join(', ') : ''; const mStr = (plan.tahsinMateri || []).length > 0 ? plan.tahsinMateri.join(' | ') : ''; const hm = [hStr, mStr].filter(Boolean).join(' - '); halAyat = (hm && tS.ayat !== '-') ? hm + ' / ' + tS.ayat : hm || tS.ayat; tahsinKat = tS.surat !== '-' ? tahsinKat + ', ' + tS.surat : tahsinKat;
    } else if (tahsinKat === 'Al-Qur\'an') { tahsinKat = tS.surat || '-'; }

    const modalMurojaah = plan.murojaah.filter(m => m.surat).map(m => { const ayat = getAyatRangeOrDefault(m.surat, m.ayatStart, m.ayatEnd); return ayat === 'Semua Ayat' ? m.surat : m.surat + ' ' + ayat; }).join(', ') || '-';
    const modalTahsin = tahsinKat || '-'; const modalHalAyatTahsin = halAyat || '-'; const modalTahfidz = fS.surat || '-'; const modalAyatTahfidz = fS.ayat || '-'; const modalCatatan = plan.lainLain || '-';
    const modalTahsinNilai = plan.tahsinNilai || '-'; const modalTahsinSuratNilai = tS.nilai; const modalTahfidzNilai = fS.nilai;
    const isCategoryEdit = ['tahsin', 'tahfidz', 'murojaah', 'catatan'].includes(modalMode);
    const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };

    try {
      const updates = students.reduce((acc, student) => {
        if (selectedStudents.includes(student.id)) {
          const existingRecord = student.records[plan.tanggal] || {}; let finalRecord = { ...existingRecord };
          for (let key of Object.values(k)) if (!finalRecord[key]) finalRecord[key] = '-';

          if (isCategoryEdit || modalMode === 'full_bulk') {
            if (modalMode === 'tahsin' || modalMode === 'full_bulk') {
              if (modalTahsin !== '-' || modalHalAyatTahsin !== '-') {
                finalRecord[k.t] = modalTahsin;
                finalRecord[k.h] = modalHalAyatTahsin;
                finalRecord[k.tNilai] = modalTahsinNilai;
                finalRecord[k.tsNilai] = modalTahsinSuratNilai;
              }
            }
            if (modalMode === 'tahfidz' || modalMode === 'full_bulk') {
              if (modalTahfidz !== '-' || modalAyatTahfidz !== '-') {
                finalRecord[k.f] = modalTahfidz;
                finalRecord[k.af] = modalAyatTahfidz;
                finalRecord[k.fNilai] = modalTahfidzNilai;
              }
            }
            if (modalMode === 'murojaah' || modalMode === 'full_bulk') {
              if (modalMurojaah !== '-') {
                finalRecord[k.m] = modalMurojaah;
              }
            }
            if (modalMode === 'catatan' || modalMode === 'full_bulk') {
              if (modalCatatan !== '-') {
                finalRecord[k.c] = modalCatatan;
              }
            }
          } else {
            finalRecord[k.t] = modalTahsin;
            finalRecord[k.h] = modalHalAyatTahsin;
            finalRecord[k.tNilai] = modalTahsinNilai;
            finalRecord[k.tsNilai] = modalTahsinSuratNilai;
            finalRecord[k.f] = modalTahfidz;
            finalRecord[k.af] = modalAyatTahfidz;
            finalRecord[k.fNilai] = modalTahfidzNilai;
            finalRecord[k.m] = modalMurojaah;
            finalRecord[k.c] = modalCatatan;
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

  if (!currentUser) return null;
  if (!isDbReady) return (<div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]"><Loader2 size={48} className="animate-spin text-[#00e676] mb-4" /></div>);

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 text-gray-800 font-sans flex flex-col overflow-hidden transition-all duration-500">
      {/* CSS Khusus untuk Menyembunyikan Scrollbar Bawaan (Membuat UI lebih minimalis) */}
      <style>
        {`
          /* Chrome, Safari, Edge, Opera */
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          /* Firefox, IE */
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shrink-0 z-[60] w-full shadow-sm print:hidden sticky top-0 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 sm:h-28 flex items-center justify-between">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              {institutionLogo && institutionLogo !== 'logo.png' ? (
                <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-[#0f4c5c]" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-arabic tracking-tight leading-tight transition-all text-xl sm:text-3xl text-green-600">MyQuranPlan</span>
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 -mt-1 sm:-mt-2"></div>
              <span className="font-extrabold tracking-tight leading-tight transition-all text-slate-800 text-base sm:text-xl">{institutionName}</span>
            </div>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-gray-500">
            <button onClick={() => setCurrentView('home')} className={`relative pb-1 group transition-colors ${currentView === 'home' ? 'text-green-600' : 'hover:text-green-600'}`}>
              Beranda
              <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${currentView === 'home' ? 'w-full' : 'w-0 group-hover:w-full'} bg-green-600`}></span>
            </button>
            <button onClick={() => setCurrentView('siswa')} className={`relative pb-1 group transition-colors ${currentView === 'siswa' ? 'text-green-600' : 'hover:text-green-600'}`}>
              Data Siswa
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'siswa' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => setCurrentView('laporan')} className={`relative pb-1 group transition-colors ${currentView === 'laporan' ? 'text-green-600' : 'hover:text-green-600'}`}>
              Laporan
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'laporan' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => setCurrentView('pengaturan')} className={`relative pb-1 group transition-colors ${currentView === 'pengaturan' ? 'text-green-600' : 'hover:text-green-600'}`}>
              Pengaturan
              <span className={`absolute bottom-0 left-0 h-0.5 bg-green-600 transition-all duration-300 ${currentView === 'pengaturan' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
          </nav>

          {/* Right: User actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border">
              <User size={14} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-600">{currentUser.name}</span>
            </div>
            <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl hidden md:block"><LogOut size={18} /></button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 bg-gray-50 rounded-lg"><Menu size={18} /></button>
          </div>
        </div>
      </header>

          {/* MOBILE MENU OVERLAY (Drawer untuk HP) */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[150] flex justify-end animate-in fade-in duration-300">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="relative w-72 h-full bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 leading-none">{currentUser.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</span>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><X size={20} /></button>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4 mb-2">Navigasi Cepat</p>
                  <button onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'home' ? 'bg-green-50 text-green-600' : 'text-slate-600 hover:bg-slate-50'}`}><Home size={20} /> Beranda</button>
                  <button onClick={() => { setCurrentView('siswa'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'siswa' ? 'bg-green-50 text-green-600' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={20} /> Data Siswa</button>
                  <button onClick={() => { setCurrentView('laporan'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'laporan' ? 'bg-green-50 text-green-600' : 'text-slate-600 hover:bg-slate-50'}`}><BarChart3 size={20} /> Laporan</button>
                  <button onClick={() => { setCurrentView('pengaturan'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${currentView === 'pengaturan' ? 'bg-green-50 text-green-600' : 'text-slate-600 hover:bg-slate-50'}`}><Settings size={20} /> Pengaturan</button>
                </div>

                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="mt-auto flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-black transition-all active:scale-95 shadow-sm border border-red-100"
                >
                  <LogOut size={20} /> Keluar Aplikasi
                </button>
              </div>
            </div>
          )}

          {/* Area Filter Halaqoh & Guru */}
          {currentView !== 'pengaturan' && (
            <div className="bg-white/95 border-gray-200 border-b px-3 md:px-6 py-1 flex justify-between items-center shrink-0 z-50 print:hidden h-11 shadow-sm transition-all duration-500 backdrop-blur-md sticky top-[56px] sm:top-[112px]">
              <div className="flex items-center gap-2">
                {isSuperAdmin ? (
                  <select value={activeGuru} onChange={(e) => { setActiveGuru(e.target.value); setActiveHalaqoh(''); }} className="bg-gray-50 border rounded-lg p-1.5 text-xs font-bold w-[130px] md:w-auto outline-none focus:ring-2 focus:ring-green-500/20">
                    <option value="">Semua Guru</option>
                    {guruList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-sm">
                    <User size={14} className="shrink-0" />
                    <span className="text-xs font-black truncate max-w-[120px] md:max-w-none">{currentUser.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:inline">Kelompok:</span>
                <select value={activeHalaqoh} onChange={(e) => setActiveHalaqoh(e.target.value)} className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-1.5 text-xs font-bold w-[130px] md:w-auto outline-none focus:ring-2 focus:ring-green-500/20">
                  <option value="">Semua Halaqoh</option>
                  {(activeGuru ? (guruHalaqohData[activeGuru] || []) : Array.from(new Set(students.map(s => s.halaqoh).filter(Boolean)))).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          )}

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
                setSharingStudent={setSharingStudent}
                handleRemoveData={handleRemoveData}
                getStatusColor={getStatusColor}
                institutionLogo={institutionLogo}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                studentsInHalaqohCount={studentsInHalaqoh.length}
                isLoading={isLoading}
              />
            )}
            {currentView === 'siswa' && (
              <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50">
                <StudentView
                  activeHalaqoh={activeHalaqoh} filteredStudents={filteredStudents}
                  openAddStudentModal={() => setIsAddStudentModalOpen(true)}
                  openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
                  requestDeleteStudent={requestDeleteStudent} isSuperAdmin={isSuperAdmin}
                  openCropModal={openCropModal}
                  uploadingPhotoId={uploadingPhotoId}
                  uploadProgress={uploadProgress}
                  onReorderStudents={handleReorderStudents}
                />
              </div>
            )}
            {currentView === 'laporan' && (
              <ReportView
                activeHalaqoh={activeHalaqoh}
                activeGuru={activeGuru}
                activeDate={activeDate}
                setActiveDate={setActiveDate}
                weekDates={weekDates}
                changeWeek={changeWeek}
                filteredStudents={filteredStudents}
                institutionLogo={institutionLogo}
              />
            )}
            {currentView === 'pengaturan' && (
              <SettingsView
                isSuperAdmin={isSuperAdmin} appUsers={appUsers}
                handleApproveUser={handleApproveUser} handleRejectUser={handleRejectUser} handleUpdateUserAccount={handleUpdateUserAccount}
                institutionName={institutionName} setInstitutionName={setInstitutionName} institutionLogo={institutionLogo} handleInstitutionLogoUpload={handleInstitutionLogoUpload} setInstitutionLogo={setInstitutionLogo} updateMasterDataCloud={updateMasterDataCloud} showToast={showToast}
                kelasList={kelasList} newKelasName={newKelasName} setNewKelasName={setNewKelasName} handleAddKelas={handleAddKelas} handleDeleteKelas={handleDeleteKelas}
                newGuruName={newGuruName} setNewGuruName={setNewGuruName} handleAddGuru={handleAddGuru} guruList={isSuperAdmin ? guruList : [currentUser.name]}
                selectedGuruForHalaqoh={selectedGuruForHalaqoh} setSelectedGuruForHalaqoh={setSelectedGuruForHalaqoh} newHalaqohName={newHalaqohName} setNewHalaqohName={setNewHalaqohName} handleAddHalaqoh={handleAddHalaqoh}
                currentUser={currentUser} guruHalaqohData={guruHalaqohData} editingGuru={editingGuru} setEditingGuru={setEditingGuru} handleSaveEditGuru={handleSaveEditGuru} requestDeleteGuru={requestDeleteGuru}
                editingHalaqoh={editingHalaqoh} setEditingHalaqoh={setEditingHalaqoh} handleSaveEditHalaqoh={handleSaveEditHalaqoh} requestDeleteHalaqoh={requestDeleteHalaqoh}
                students={students} openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
                requestDeleteStudent={requestDeleteStudent} requestBulkDeleteStudents={requestBulkDeleteStudents} requestBulkEditStudents={requestBulkEditStudents} handleBulkSaveStudents={handleBulkSaveStudents} onLogout={onLogout}
              />
            )}
          </main>

          {/* RENDER MODALS */}
          <AddStudentModal
            isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} isSuperAdmin={isSuperAdmin} addStudentMode={addStudentMode} setAddStudentMode={setAddStudentMode}
            masterSearchQuery={masterSearchQuery} setMasterSearchQuery={setMasterSearchQuery} students={students} activeHalaqoh={activeHalaqoh} handleAssignFromMaster={handleAssignFromMaster} newStudent={newStudent} setNewStudent={setNewStudent} handlePhotoUpload={handlePhotoUpload} kelasList={kelasList} handleSaveNewStudent={handleSaveNewStudent} getInitials={getInitials}
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
            isOpen={isModalOpen} onClose={handleCloseModal} modalMode={modalMode} getModalTitle={getModalTitle} lessonPlans={lessonPlans} handlePlanChange={handlePlanChange} handleToggleArray={handleToggleArray} handleAddSurat={handleAddSurat} handleRemoveSurat={handleRemoveSurat} handleSuratChange={handleSuratChange} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} tahsinCategories={tahsinCategories} ghoribList={ghoribList} tajwidList={tajwidList} surahList={surahList} homeTab={homeTab} handleSave={handleSave} editingId={editingId} selectedStudents={selectedStudents} filteredStudents={filteredStudents} toggleStudent={toggleStudent}
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

          {toastMessage && (<div className="fixed top-4 md:top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl shadow-2xl z-[9999] font-bold text-xs md:text-sm animate-bounce">{toastMessage}</div>)}

          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center h-[70px] z-40 print:hidden">
            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-green-600' : 'text-gray-400'}`}><Home size={20} /><span className="text-[9px] font-bold">Beranda</span></button>
            <button onClick={() => setCurrentView('siswa')} className={`flex flex-col items-center gap-1 ${currentView === 'siswa' ? 'text-green-600' : 'text-gray-400'}`}><Users size={20} /><span className="text-[9px] font-bold">Siswa</span></button>
            <button onClick={() => setCurrentView('laporan')} className={`flex flex-col items-center gap-1 ${currentView === 'laporan' ? 'text-green-600' : 'text-gray-400'}`}><BarChart3 size={20} /><span className="text-[9px] font-bold">Laporan</span></button>
            <button onClick={() => setCurrentView('pengaturan')} className={`flex flex-col items-center gap-1 ${currentView === 'pengaturan' ? 'text-green-600' : 'text-gray-400'}`}><Settings size={20} /><span className="text-[9px] font-bold">Setelan</span></button>
          </nav>
        </div>
        );
};

        export default MainApp;