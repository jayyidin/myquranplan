import React, { useState, useEffect } from 'react';
import { BookOpen, User, Menu, Home, Users, BarChart3, Settings, LogOut, Loader2, Edit3, Mic, Repeat, FileText, X } from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

// Imports
import { db, appId } from '../config/firebase';
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

const MainApp = ({ currentUser, onLogout }) => {
  if (!currentUser) return null;

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // -- STATE UTAMA --
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeTab, setHomeTab] = useState('lesson_plan');

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

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [activeDate, setActiveDate] = useState(formatDateObj(getMonday(new Date())));
  const weekDates = Array.from({ length: 5 }).map((_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });

  const [toastMessage, setToastMessage] = useState(null);

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

  // -- EFEK INIT --
  useEffect(() => {
    const unsubMaster = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.guruHalaqohData) setGuruHalaqohData(data.guruHalaqohData);
        if (data.kelasList) setKelasList(data.kelasList);
        if (data.institutionName) setInstitutionName(data.institutionName);
        if (data.institutionLogo) setInstitutionLogo(data.institutionLogo);
      }
    });

    const unsubStudents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'students'), (snapshot) => {
      const loadedStudents = [];
      snapshot.forEach(doc => { loadedStudents.push({ ...doc.data(), id: doc.id }); });
      setStudents(loadedStudents);
      setIsDbReady(true);
    });

    let unsubUsers = () => { };
    if (isSuperAdmin) {
      unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), (snap) => {
        const usersList = [];
        snap.forEach(d => usersList.push({ id: d.id, ...d.data() }));
        setAppUsers(usersList);
      });
    }

    return () => { unsubMaster(); unsubStudents(); unsubUsers(); };
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
  const updateMasterDataCloud = async (updates) => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), updates); };
  const changeWeek = (offset) => { const n = new Date(weekStart); n.setDate(n.getDate() + offset); setWeekStart(n); setActiveDate(formatDateObj(n)); };
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';

  // Filter siswa yang sangat ketat: Jika bukan SuperAdmin, hanya tampilkan siswa yang ada di halaqoh guru tersebut
  const filteredStudents = students.filter(s => {
    const isSearchMatch = (s?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const isInActiveHalaqoh = s?.halaqoh && activeHalaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim();

    if (!isSuperAdmin) {
      const searchName = currentUser?.name?.trim().toLowerCase() || "";
      const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
      const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

      return isInActiveHalaqoh && myHalaqohs.includes(activeHalaqoh) && isSearchMatch;
    }
    return isInActiveHalaqoh && isSearchMatch;
  });

  // Hitung jumlah siswa di halaqoh aktif (sebelum difilter oleh pencarian) untuk placeholder
  const studentsInHalaqoh = students.filter(s => {
    const isInActiveHalaqoh = s?.halaqoh && activeHalaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim();

    if (!isSuperAdmin) {
      const searchName = currentUser?.name?.trim().toLowerCase() || "";
      const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
      const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];

      return isInActiveHalaqoh && myHalaqohs.includes(activeHalaqoh);
    }
    return isInActiveHalaqoh;
  });

  // -- FUNGSI PENGATURAN (SETTINGS) --
  const handleApproveUser = async (user) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id), { status: 'active' });
      showToast(`Akun ${user.name} berhasil disetujui!`);
    } catch (error) {
      showToast('Gagal menyetujui akun.');
    }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm('Yakin ingin menolak dan menghapus pendaftaran guru ini?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', userId));
        showToast('Pendaftaran ditolak & dihapus.');
      } catch (error) {
        showToast('Gagal menolak pendaftaran.');
      }
    }
  };

  const handleUpdateUserAccount = async (userId, updatedData) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', userId), updatedData);
      showToast('Akun berhasil diperbarui!');
    } catch (error) {
      showToast('Gagal update akun.');
    }
  };

  const handleBulkSaveStudents = async (studentList) => {
    try {
      const promises = studentList.map(s =>
        addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          name: s.name, kelas: s.kelas || '', halaqoh: s.halaqoh || '', initial: getInitials(s.name), records: {}
        })
      );
      await Promise.all(promises);
      showToast(`${studentList.length} siswa berhasil diimpor!`);
    } catch (err) { showToast('Gagal mengimpor data.'); }
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
    try {
      const student = students.find(s => s.id === studentId); if (!student) return;
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId);
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
      await updateDoc(studentRef, { records: { ...student.records, [dateStr]: rec } });
    } catch (err) { showToast('Gagal menghapus data.'); }
  };

  const requestClearRecord = (e, studentId, dateStr) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm('Yakin ingin mengosongkan data pada tanggal ini?')) {
      const student = students.find(s => s.id === studentId); if (!student) return;
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId);
      const k = homeTab === 'lesson_plan' ? { t: 'tahsin', h: 'halAyatTahsin', tNilai: 'tahsinNilai', tsNilai: 'tahsinSuratNilai', f: 'tahfidz', af: 'ayatTahfidz', fNilai: 'tahfidzNilai', m: 'murojaah', c: 'catatan' } : { t: 'jurnalTahsin', h: 'jurnalHalAyatTahsin', tNilai: 'jurnalTahsinNilai', tsNilai: 'jurnalTahsinSuratNilai', f: 'jurnalTahfidz', af: 'jurnalAyatTahfidz', fNilai: 'jurnalTahfidzNilai', m: 'jurnalMurojaah', c: 'jurnalCatatan' };
      const newRecords = { ...student.records };
      const dayRec = newRecords[dateStr] ? { ...newRecords[dateStr] } : {};
      dayRec[k.t] = '-'; dayRec[k.h] = '-'; dayRec[k.tNilai] = '-'; dayRec[k.tsNilai] = '-'; dayRec[k.f] = '-'; dayRec[k.af] = '-'; dayRec[k.fNilai] = '-'; dayRec[k.m] = '-'; dayRec[k.c] = '-';
      newRecords[dateStr] = dayRec;
      updateDoc(studentRef, { records: newRecords });
      showToast('Data dikosongkan!');
    }
  };

  const setSharingStudent = (student) => { showToast("Fitur Share Gambar akan segera diaktifkan."); };

  // -- FUNGSI SISWA --
  const handleAssignFromMaster = async (student) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), { halaqoh: activeHalaqoh }); showToast(`${student.name} ditambahkan!`); } catch (err) { showToast('Gagal.'); } };
  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { ...newStudent, initial: getInitials(newStudent.name), records: {} });
      setIsAddStudentModalOpen(false);
      showToast('Siswa ditambahkan!');
    } catch (e) { showToast('Gagal menyimpan.'); }
  };
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const { id, ...dataToUpdate } = editStudentData;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), {
        ...dataToUpdate,
        initial: getInitials(dataToUpdate.name)
      });
      setIsEditStudentModalOpen(false);
      showToast('Siswa diperbarui!');
    } catch (e) { showToast('Gagal memperbarui.'); }
  };
  const requestDeleteStudent = (student) => {
    if (isSuperAdmin) {
      if (window.confirm('Yakin ingin menghapus siswa permanen dari sistem?')) {
        deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id));
        showToast('Dihapus.');
      }
    } else {
      if (window.confirm(`Yakin ingin mengeluarkan ${student.name} dari halaqoh ${activeHalaqoh}?`)) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), { halaqoh: '' });
        showToast('Siswa berhasil dikeluarkan.');
      }
    }
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
      const dayData = initialDataForModal;
      let tKategori = '', tSurat = dayData[k.t] || '', tHalaman = [], tBaris = [], tMateri = [], tHalamanTg = [], rawTahsinAyat = dayData[k.h] || '', tahsinAyatOnly = rawTahsinAyat;
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
        id: Date.now(), tanggal: activeDate, murojaah: parseMurojaahList(dayData[k.m]), tahsinKategori: tKategori, tahsinSuratList: parseSuratAyatList(tSurat, tahsinAyatOnly, dayData[k.tsNilai]), tahsinHalaman: tHalaman, tahsinBaris: tBaris, tahsinMateri: tMateri, tahsinHalamanTg: tHalamanTg, tahfidzSuratList: parseSuratAyatList(dayData[k.f], dayData[k.af], dayData[k.fNilai]), lainLain: dayData[k.c] && dayData[k.c] !== '-' ? dayData[k.c] : '', tahsinNilai: dayData[k.tNilai] && dayData[k.tNilai] !== '-' ? dayData[k.tNilai] : ''
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
  const handleSuratChange = (planId, listName, suratId, field, value) => setLessonPlans(plans => plans.map(p => p.id === planId ? { ...p, [listName]: p[listName].map(m => m.id === suratId ? { ...m, [field]: value } : m) } : p));
  const getAyatOptions = (suratString) => { if (!suratString) return []; const match = surahList.find(s => (s.no + '. ' + s.name) === suratString); return match ? Array.from({ length: match.ayat }, (_, i) => String(i + 1)) : []; };
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
      const batchPromises = students.map(student => {
        if (selectedStudents.includes(student.id)) {
          const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
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
          return updateDoc(studentRef, { records: { ...student.records, [plan.tanggal]: finalRecord } });
        }
        return Promise.resolve();
      });
      await Promise.all(batchPromises);
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

  if (!isDbReady) return (<div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]"><Loader2 size={48} className="animate-spin text-[#00e676] mb-4" /></div>);

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 text-gray-800 font-sans flex flex-col overflow-hidden transition-all duration-500">
      {/* Header */}
      <header className="bg-white border-gray-100 shrink-0 z-[60] w-full shadow-sm print:hidden border-b sticky top-0 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 sm:h-28 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xl sm:text-3xl text-green-600">
            <div className="w-8 h-8 sm:w-24 sm:h-24 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              <div className="flex items-center gap-1.5 sm:gap-4 font-bold text-xl sm:text-3xl text-green-600">
                <div className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                <BookOpen className="w-6 h-6 sm:w-14 sm:h-14 text-[#0f4c5c]" />
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-[#0f4c5c]" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-arabic tracking-tight leading-tight transition-all">MyQuranPlan</span>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 -mt-1 sm:-mt-2"></div>
                  <span className="font-extrabold tracking-tight leading-tight transition-all text-slate-800 text-base sm:text-xl">{institutionName}</span>
                  <span className="font-arabic text-green-600 text-sm sm:text-base -mt-1">MyQuranPlan</span>
                </div>
              </div>
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
                  <select value={activeGuru} onChange={(e) => setActiveGuru(e.target.value)} className="bg-gray-50 border rounded-lg p-1.5 text-xs font-bold w-[130px] md:w-auto outline-none focus:ring-2 focus:ring-green-500/20">
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
                  {(guruHalaqohData[activeGuru] || []).map(h => <option key={h} value={h}>{h}</option>)}
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
                setHomeTab={setHomeTab}
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
              <StudentView
                activeHalaqoh={activeHalaqoh} filteredStudents={filteredStudents}
                openAddStudentModal={() => setIsAddStudentModalOpen(true)}
                openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
                requestDeleteStudent={requestDeleteStudent} isSuperAdmin={isSuperAdmin}
              />
            )}
            {currentView === 'laporan' && (
              <ReportView
                activeHalaqoh={activeHalaqoh}
                activeGuru={activeGuru}
                activeDate={activeDate}
                weekDates={weekDates}
                filteredStudents={filteredStudents}
                institutionLogo={institutionLogo}
              />
            )}
            {currentView === 'pengaturan' && (
              <SettingsView
                isSuperAdmin={isSuperAdmin} appUsers={appUsers}
                handleApproveUser={handleApproveUser} handleRejectUser={handleRejectUser} handleUpdateUserAccount={handleUpdateUserAccount}
                institutionLogo={institutionLogo} handleInstitutionLogoUpload={handleInstitutionLogoUpload} setInstitutionLogo={setInstitutionLogo} updateMasterDataCloud={updateMasterDataCloud} showToast={showToast}
                institutionName={institutionName} institutionLogo={institutionLogo} handleInstitutionLogoUpload={handleInstitutionLogoUpload} setInstitutionName={setInstitutionName} updateMasterDataCloud={updateMasterDataCloud} showToast={showToast}
                kelasList={kelasList} newKelasName={newKelasName} setNewKelasName={setNewKelasName} handleAddKelas={handleAddKelas} handleDeleteKelas={handleDeleteKelas}
                newGuruName={newGuruName} setNewGuruName={setNewGuruName} handleAddGuru={handleAddGuru} guruList={isSuperAdmin ? guruList : [currentUser.name]}
                selectedGuruForHalaqoh={selectedGuruForHalaqoh} setSelectedGuruForHalaqoh={setSelectedGuruForHalaqoh} newHalaqohName={newHalaqohName} setNewHalaqohName={setNewHalaqohName} handleAddHalaqoh={handleAddHalaqoh}
                currentUser={currentUser} guruHalaqohData={guruHalaqohData} editingGuru={editingGuru} setEditingGuru={setEditingGuru} handleSaveEditGuru={handleSaveEditGuru} requestDeleteGuru={requestDeleteGuru}
                editingHalaqoh={editingHalaqoh} setEditingHalaqoh={setEditingHalaqoh} handleSaveEditHalaqoh={handleSaveEditHalaqoh} requestDeleteHalaqoh={requestDeleteHalaqoh}
                students={students} openEditStudentModal={(s) => { setEditStudentData({ id: s.id, name: s.name, kelas: s.kelas, halaqoh: s.halaqoh, photo: s.photo || null }); setIsEditStudentModalOpen(true); }}
                requestDeleteStudent={requestDeleteStudent} handleBulkSaveStudents={handleBulkSaveStudents}
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
            isOpen={isModalOpen} onClose={handleCloseModal} modalMode={modalMode} getModalTitle={getModalTitle} lessonPlans={lessonPlans} handlePlanChange={handlePlanChange} handleToggleArray={handleToggleArray} handleAddSurat={handleAddSurat} handleRemoveSurat={handleRemoveSurat} handleSuratChange={handleSuratChange} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} tahsinCategories={tahsinCategories} ghoribList={ghoribList} tajwidList={tajwidList} surahList={surahList} getAyatOptions={getAyatOptions} homeTab={homeTab} handleSave={handleSave} editingId={editingId} selectedStudents={selectedStudents} filteredStudents={filteredStudents} toggleStudent={toggleStudent}
          />

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