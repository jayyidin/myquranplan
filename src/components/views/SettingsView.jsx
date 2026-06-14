// File: src/components/views/SettingsView.jsx
import React, { useState, useRef } from 'react';
import {
  UserCheck, CheckCircle2, X, ImageIcon, Camera,
  GraduationCap, Plus, User, Edit3, Trash2, Save, Users, Search, ShieldCheck, Database, LayoutGrid, LogOut, ArrowUp, ChevronDown, Wrench, UserPlus, FolderPlus, GripVertical, AlertTriangle, Download
} from 'lucide-react';

const SectionHeader = ({ accent = 'bg-slate-500', title, description, icon: Icon }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className={`w-1.5 h-5 rounded-full ${accent}`} />
        <h2 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.18em]">{title}</h2>
      </div>
      {description && <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>}
    </div>
    {Icon && (
      <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-500 items-center justify-center shadow-sm">
        <Icon size={18} />
      </div>
    )}
  </div>
);

const StatCard = ({ icon, label, value, tone = 'bg-slate-900 text-white' }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 min-w-0">
    <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center shrink-0`}>
      {React.createElement(icon, { size: 18 })}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</p>
      <p className="text-lg font-black text-slate-900 leading-tight truncate">{value}</p>
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{children}</label>
);

const SelectShell = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
    <ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const QuickNavButton = ({ icon: Icon, label, detail, onClick, tone = 'text-slate-500 bg-white border-slate-200 hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`min-w-[150px] flex-1 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.98] ${tone}`}
  >
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-black text-slate-800 truncate">{label}</span>
        <span className="block text-[10px] font-bold text-slate-400 truncate mt-0.5">{detail}</span>
      </span>
    </div>
  </button>
);

const SettingsView = ({
  isSuperAdmin, appUsers = [], handleApproveUser, handleRejectUser, handleUpdateUserAccount,
  institutionName, setInstitutionName, institutionLogo, handleInstitutionLogoUpload, setInstitutionLogo, updateMasterDataCloud, showToast, isUploadingLogo, logoUploadProgress = 0,
  targetReguler, setTargetReguler, targetAlQuran, setTargetAlQuran,
  kelasList = [], newKelasName, setNewKelasName, handleAddKelas, handleDeleteKelas, handleReorderKelas,
  newGuruName, setNewGuruName, handleAddGuru, guruList = [],
  selectedGuruForHalaqoh, setSelectedGuruForHalaqoh, newHalaqohName, setNewHalaqohName, handleAddHalaqoh,
  currentUser, guruHalaqohData = {}, editingGuru, setEditingGuru, handleSaveEditGuru, requestDeleteGuru,
  editingHalaqoh, setEditingHalaqoh, handleSaveEditHalaqoh, requestDeleteHalaqoh, handleReorderHalaqoh, handleReorderGuru,
  students = [], openEditStudentModal, requestDeleteStudent, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents, onLogout, handleCleanLessonPlanValues, handleCloseSemester, handleBackupData, handleLinkAccount, handleResetTeacherPassword
}) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);

  // --- DEBOUNCE PENCARIAN (MENGURANGI LAG DI HP) ---
  const [localStudentSearch, setLocalStudentSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => setStudentSearch(localStudentSearch), 300);
    return () => clearTimeout(timer);
  }, [localStudentSearch]);

  // --- DEBOUNCE PENCARIAN GURU ---
  const [guruSearch, setGuruSearch] = useState('');
  const [localGuruSearch, setLocalGuruSearch] = useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => setGuruSearch(localGuruSearch), 300);
    return () => clearTimeout(timer);
  }, [localGuruSearch]);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [bulkData, setBulkData] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ kelas: '', halaqoh: '' });
  const [filterStatus, setFilterStatus] = useState(isSuperAdmin ? 'kosong' : 'all');
  const [filterKelas, setFilterKelas] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);
  const [dragKelasId, setDragKelasId] = useState(null);
  const [dragOverKelasId, setDragOverKelasId] = useState(null);
  const [dragHalaqohInfo, setDragHalaqohInfo] = useState(null);
  const [dragOverHalaqohInfo, setDragOverHalaqohInfo] = useState(null);
  const [dragGuruId, setDragGuruId] = useState(null);
  const [dragOverGuruId, setDragOverGuruId] = useState(null);
  const [resolvedPendingUserIds, setResolvedPendingUserIds] = useState([]);

  React.useEffect(() => {
    setVisibleCount(20);
  }, [studentSearch, filterStatus, filterKelas]);

  React.useEffect(() => {
    setResolvedPendingUserIds(prev => prev.filter(id => appUsers.some(user => user.id === id && user.status === 'pending')));
  }, [appUsers]);

  const pendingUsers = appUsers.filter(u => u.status === 'pending' && !resolvedPendingUserIds.includes(u.id));
  const allHalaqohs = Array.from(new Set(Object.keys(guruHalaqohData).filter(k => k !== '_order_').flatMap(k => guruHalaqohData[k]).filter(Boolean)));
  const totalHalaqoh = allHalaqohs.length;
  const emptyStudentCount = students.filter(s => {
    const halaqoh = (s?.halaqoh || '').trim().toLowerCase();
    return !halaqoh || halaqoh === 'unassigned';
  }).length;

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hidePendingUser = (id) => {
    setResolvedPendingUserIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const restorePendingUser = (id) => {
    setResolvedPendingUserIds(prev => prev.filter(item => item !== id));
  };

  const handleApprovePendingUser = async (user) => {
    hidePendingUser(user.id);
    try {
      await handleApproveUser(user);
    } catch (err) {
      restorePendingUser(user.id);
      showToast?.('Gagal menerima akun. Coba lagi.');
    }
  };

  const handleRejectPendingUser = async (id) => {
    hidePendingUser(id);
    try {
      await handleRejectUser(id);
    } catch (err) {
      restorePendingUser(id);
      showToast?.('Gagal menolak akun. Coba lagi.');
    }
  };

  const resetStudentFilters = () => {
    setLocalStudentSearch('');
    setStudentSearch('');
    setFilterStatus(isSuperAdmin ? 'kosong' : 'all');
    setFilterKelas('');
    setSelectedStudentIds([]);
    setIsBulkEditOpen(false);
  };

  const processBulkImport = () => {
    const rows = bulkData.split(/\r?\n/).filter(row => row.trim() !== '');
    const parsed = rows.map(row => {
      const parts = row.split(/[,\t]/).map(p => p.trim());
      return { name: parts[0], kelas: parts[1] || '', halaqoh: parts[2] || '' };
    }).filter(s => s.name);

    if (parsed.length === 0) {
      showToast('Data tidak valid! Pastikan minimal memasukkan Nama Siswa.');
      return;
    }

    handleBulkSaveStudents(parsed, () => {
      setBulkData('');
      setIsBulkImportOpen(false);
    });
  };

  const handleStartEditAccount = (user) => {
    setEditingAccount({ id: user.id, name: user.name, username: user.username, password: '', role: user.role });
  };

  const handleSaveAccount = async () => {
    const originalUser = appUsers.find(u => u.id === editingAccount.id);
    const isUsernameChanged = editingAccount.username !== originalUser?.username;

    if (isUsernameChanged && !editingAccount.password && originalUser?.password === '[SECURED_BY_SUPABASE]') {
      showToast("PENTING: Jika mengubah username, Anda WAJIB mengisi Password Baru agar akun bisa sinkronisasi ulang!");
      return;
    }

    const updates = {
      name: editingAccount.name,
      username: editingAccount.username.toLowerCase().replace(/\s+/g, ''),
      role: editingAccount.role,
      resetrequested: false
    };
    if (editingAccount.password) updates.password = editingAccount.password;

    await handleUpdateUserAccount(editingAccount.id, updates);
    setEditingAccount(null);
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(displayedStudents.map(s => s.id));
    }
  };

  const handleBulkDelete = () => {
    requestBulkDeleteStudents(selectedStudentIds, () => {
      setSelectedStudentIds([]);
      setIsBulkEditOpen(false);
    });
  };

  const handleDragStartKelas = (e, kelas) => {
    setDragKelasId(kelas);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", kelas);
  };

  const handleDragOverKelas = (e, kelas) => {
    e.preventDefault();
    if (dragOverKelasId !== kelas) setDragOverKelasId(kelas);
  };

  const handleDropKelas = (e, targetKelas) => {
    e.preventDefault();
    if (!dragKelasId || dragKelasId === targetKelas) {
      setDragKelasId(null); setDragOverKelasId(null);
      return;
    }
    const draggedIdx = kelasList.indexOf(dragKelasId);
    const targetIdx = kelasList.indexOf(targetKelas);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newList = [...kelasList];
      const [draggedItem] = newList.splice(draggedIdx, 1);
      newList.splice(targetIdx, 0, draggedItem);
      if (handleReorderKelas) handleReorderKelas(newList);
    }
    setDragKelasId(null); setDragOverKelasId(null);
  };

  const handleDragEndKelas = () => { setDragKelasId(null); setDragOverKelasId(null); };

  const handleTouchStartKelas = (e, kelas) => {
    setDragKelasId(kelas);
  };

  const handleTouchMoveKelas = (e) => {
    if (!dragKelasId) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-kelas-id]');
    if (card) {
      const hoverId = card.getAttribute('data-kelas-id');
      if (hoverId !== dragOverKelasId) setDragOverKelasId(hoverId);
    }
  };

  const handleTouchEndKelas = () => {
    if (dragKelasId && dragOverKelasId && dragKelasId !== dragOverKelasId) {
      const draggedIdx = kelasList.indexOf(dragKelasId);
      const targetIdx = kelasList.indexOf(dragOverKelasId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const newList = [...kelasList];
        const [draggedItem] = newList.splice(draggedIdx, 1);
        newList.splice(targetIdx, 0, draggedItem);
        if (handleReorderKelas) handleReorderKelas(newList);
      }
    }
    setDragKelasId(null); setDragOverKelasId(null);
  };

  const handleDragStartHalaqoh = (e, guru, halaqoh) => {
    e.stopPropagation();
    setDragHalaqohInfo({ guru, halaqoh });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${guru}|${halaqoh}`);
  };

  const handleDragOverHalaqoh = (e, guru, halaqoh) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragHalaqohInfo?.guru === guru && dragOverHalaqohInfo?.halaqoh !== halaqoh) {
      setDragOverHalaqohInfo({ guru, halaqoh });
    }
  };

  const handleDropHalaqoh = (e, targetGuru, targetHalaqoh) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragHalaqohInfo || dragHalaqohInfo.guru !== targetGuru || dragHalaqohInfo.halaqoh === targetHalaqoh) {
      setDragHalaqohInfo(null); setDragOverHalaqohInfo(null);
      return;
    }
    const guru = dragHalaqohInfo.guru;
    const halaqohs = guruHalaqohData[guru] || [];
    const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh);
    const targetIdx = halaqohs.indexOf(targetHalaqoh);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newList = [...halaqohs];
      const [draggedItem] = newList.splice(draggedIdx, 1);
      newList.splice(targetIdx, 0, draggedItem);
      if (handleReorderHalaqoh) handleReorderHalaqoh(guru, newList);
    }
    setDragHalaqohInfo(null); setDragOverHalaqohInfo(null);
  };

  const handleDragEndHalaqoh = () => { setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };

  const handleTouchStartHalaqoh = (e, guru, halaqoh) => {
    setDragHalaqohInfo({ guru, halaqoh });
  };

  const handleTouchMoveHalaqoh = (e, targetGuru) => {
    if (!dragHalaqohInfo || dragHalaqohInfo.guru !== targetGuru) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-halaqoh-id]');
    if (card) {
      const hoverId = card.getAttribute('data-halaqoh-id');
      const hoverGuru = card.getAttribute('data-guru-id');
      if (hoverGuru === targetGuru && hoverId !== dragOverHalaqohInfo?.halaqoh) {
        setDragOverHalaqohInfo({ guru: hoverGuru, halaqoh: hoverId });
      }
    }
  };

  const handleTouchEndHalaqoh = () => {
    if (dragHalaqohInfo && dragOverHalaqohInfo && dragHalaqohInfo.guru === dragOverHalaqohInfo.guru && dragHalaqohInfo.halaqoh !== dragOverHalaqohInfo.halaqoh) {
      const guru = dragHalaqohInfo.guru;
      const halaqohs = guruHalaqohData[guru] || [];
      const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh);
      const targetIdx = halaqohs.indexOf(dragOverHalaqohInfo.halaqoh);

      if (draggedIdx !== -1 && targetIdx !== -1) {
        const newList = [...halaqohs];
        const [draggedItem] = newList.splice(draggedIdx, 1);
        newList.splice(targetIdx, 0, draggedItem);
        if (handleReorderHalaqoh) handleReorderHalaqoh(guru, newList);
      }
    }
    setDragHalaqohInfo(null); setDragOverHalaqohInfo(null);
  };

  const handleDragStartGuru = (e, guru) => {
    if (guruSearch || !isSuperAdmin) return;
    setDragGuruId(guru);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", guru);
  };

  const handleDragOverGuru = (e, guru) => {
    e.preventDefault();
    if (guruSearch || !isSuperAdmin) return;
    if (dragOverGuruId !== guru) setDragOverGuruId(guru);
  };

  const handleDropGuru = (e, targetGuru) => {
    e.preventDefault();
    if (guruSearch || !isSuperAdmin) return;
    if (!dragGuruId || dragGuruId === targetGuru) {
      setDragGuruId(null); setDragOverGuruId(null);
      return;
    }
    const draggedIdx = guruList.indexOf(dragGuruId);
    const targetIdx = guruList.indexOf(targetGuru);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newList = [...guruList];
      const [draggedItem] = newList.splice(draggedIdx, 1);
      newList.splice(targetIdx, 0, draggedItem);
      if (handleReorderGuru) handleReorderGuru(newList);
    }
    setDragGuruId(null); setDragOverGuruId(null);
  };

  const handleDragEndGuru = () => { setDragGuruId(null); setDragOverGuruId(null); };

  const handleTouchStartGuru = (e, guru) => {
    if (guruSearch || !isSuperAdmin) return;
    setDragGuruId(guru);
  };

  const handleTouchMoveGuru = (e) => {
    if (guruSearch || !isSuperAdmin || !dragGuruId) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-guru-card-id]');
    if (card) {
      const hoverId = card.getAttribute('data-guru-card-id');
      if (hoverId !== dragOverGuruId) setDragOverGuruId(hoverId);
    }
  };

  const handleTouchEndGuru = () => {
    if (guruSearch || !isSuperAdmin) return;
    if (dragGuruId && dragOverGuruId && dragGuruId !== dragOverGuruId) {
      const draggedIdx = guruList.indexOf(dragGuruId);
      const targetIdx = guruList.indexOf(dragOverGuruId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const newList = [...guruList];
        const [draggedItem] = newList.splice(draggedIdx, 1);
        newList.splice(targetIdx, 0, draggedItem);
        if (handleReorderGuru) handleReorderGuru(newList);
      }
    }
    setDragGuruId(null); setDragOverGuruId(null);
  };

  const handleExecuteBulkEdit = () => {
    const updates = {};
    if (bulkEditData.kelas) updates.kelas = bulkEditData.kelas === 'CLEAR_KELAS' ? '' : bulkEditData.kelas;
    if (bulkEditData.halaqoh) updates.halaqoh = bulkEditData.halaqoh === 'CLEAR_HALAQOH' ? '' : bulkEditData.halaqoh;

    if (Object.keys(updates).length === 0) {
      showToast('Pilih minimal kelas atau halaqoh baru.');
      return;
    }

    requestBulkEditStudents(selectedStudentIds, updates, () => {
      setSelectedStudentIds([]);
      setIsBulkEditOpen(false);
      setBulkEditData({ kelas: '', halaqoh: '' });
    });
  };

  const handleExportCSV = () => {
    const headers = ['Nama Siswa', 'Kelas', 'Halaqoh'];
    const csvContent = [
      headers.join(','),
      ...filteredStudentsMaster.map(s => `"${s.name}","${s.kelas || ''}","${s.halaqoh || ''}"`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Siswa_MyQuranPlan_${new Date().getTime()}.csv`;
    link.click();
  };

  const searchName = currentUser?.name?.trim().toLowerCase() || '';
  const guruKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === searchName);
  const myHalaqohs = isSuperAdmin ? [] : (guruKey ? (guruHalaqohData[guruKey] || []) : []);

  const filteredStudentsMaster = students.filter(s => {
    const halaqoh = (s?.halaqoh || '').trim();
    const isKosong = halaqoh === '' || halaqoh.toLowerCase() === 'unassigned';

    if (filterStatus === 'kosong' && !isKosong) return false;
    if (filterStatus === 'assigned' && isKosong) return false;

    if (!isSuperAdmin && !isKosong && !myHalaqohs.some(h => h.trim().toLowerCase() === halaqoh.toLowerCase())) {
      return false;
    }

    if (filterKelas && s.kelas !== filterKelas) return false;

    const query = (studentSearch || '').toLowerCase();
    const nameMatch = (s?.name || '').toLowerCase().includes(query);
    const halaqohMatch = halaqoh.toLowerCase().includes(query);
    return nameMatch || halaqohMatch;
  });

  const displayedStudents = filteredStudentsMaster.slice(0, visibleCount);

  const filteredGuruList = guruList.filter(guru => guru.toLowerCase().includes(guruSearch.toLowerCase()));
  const hasStudentFilters = Boolean(studentSearch || filterKelas || filterStatus !== (isSuperAdmin ? 'kosong' : 'all'));
  const quickSections = [
    ...(isSuperAdmin ? [{ id: 'settings-identity', icon: GraduationCap, label: 'Identitas', detail: 'Logo, kelas, target' }] : []),
    { id: 'settings-halaqoh', icon: Users, label: 'Guru & Halaqoh', detail: `${guruList.length} guru, ${totalHalaqoh} halaqoh` },
    { id: 'settings-students', icon: Database, label: 'Data Siswa', detail: `${filteredStudentsMaster.length} tampil` },
    ...(isSuperAdmin ? [{ id: 'settings-maintenance', icon: Wrench, label: 'Perawatan', detail: 'Backup & semester' }] : [])
  ];

  return (
    <div
      className="flex-1 w-full h-full overflow-y-auto bg-slate-50 custom-scrollbar min-h-0"
      style={{ WebkitOverflowScrolling: 'touch' }}
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-8 py-5 sm:py-7 pb-32">
        <div className="mb-6 sm:mb-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest mb-3">
                <ShieldCheck size={13} />
                {isSuperAdmin ? 'Panel Super Admin' : 'Panel Guru'}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {isSuperAdmin ? 'Pengaturan Sistem' : 'Manajemen Halaqoh'}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mt-2 max-w-2xl">
                {isSuperAdmin
                  ? 'Kelola identitas lembaga, akses pengguna, struktur halaqoh, dan data siswa dari satu tempat.'
                  : 'Atur kelompok halaqoh dan data siswa yang berada di bawah bimbingan Anda.'}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:min-w-[560px]">
              {isSuperAdmin && <StatCard icon={UserCheck} label="Menunggu" value={pendingUsers.length} tone="bg-orange-500 text-white" />}
              <StatCard icon={Users} label="Guru" value={guruList.length} tone="bg-indigo-500 text-white" />
              <StatCard icon={FolderPlus} label="Halaqoh" value={totalHalaqoh} tone="bg-emerald-500 text-white" />
              <StatCard icon={Database} label={isSuperAdmin ? 'Siswa Kosong' : 'Siswa'} value={isSuperAdmin ? emptyStudentCount : filteredStudentsMaster.length} tone="bg-slate-900 text-white" />
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8 sticky top-0 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2 bg-slate-50/95 backdrop-blur-md border-y sm:border border-slate-200 sm:rounded-2xl sm:shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {quickSections.map(section => (
              <QuickNavButton
                key={section.id}
                icon={section.icon}
                label={section.label}
                detail={section.detail}
                onClick={() => scrollToSection(section.id)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-7 sm:space-y-9">
          {isSuperAdmin && pendingUsers.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <SectionHeader
                accent="bg-orange-500"
                title="Persetujuan Menunggu"
                description="Akun baru perlu diterima sebelum bisa menggunakan aplikasi."
                icon={UserCheck}
              />
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {pendingUsers.map(pendingUser => (
                    <div key={pendingUser.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{pendingUser.name}</p>
                        <p className="text-xs font-bold text-orange-600/80 uppercase truncate">@{pendingUser.username}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:w-auto w-full">
                        <button onClick={() => handleApprovePendingUser(pendingUser)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Terima
                        </button>
                        <button onClick={() => handleRejectPendingUser(pendingUser.id)} className="bg-white text-orange-600 border border-orange-200 font-bold px-3 py-2.5 rounded-xl text-xs hover:bg-orange-100 transition-all flex items-center justify-center gap-1.5">
                          <X size={14} /> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {isSuperAdmin && (
            <section id="settings-identity" className="scroll-mt-24">
              <SectionHeader
                accent="bg-blue-500"
                title="Identitas & Kurikulum"
                description="Pengaturan dasar yang dipakai pada laporan dan target hafalan."
                icon={GraduationCap}
              />

              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-5 md:gap-6">
                    <div className="flex md:block justify-center">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center relative group overflow-hidden shrink-0">
                        {isUploadingLogo ? (
                          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-wait p-4">
                            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                              <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${logoUploadProgress}%` }} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{Math.round(logoUploadProgress)}%</span>
                          </div>
                        ) : institutionLogo && institutionLogo !== 'logo.png' ? (
                          <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-95" />
                        ) : (
                          <ImageIcon size={34} className="text-slate-300" />
                        )}
                        {!isUploadingLogo && (
                          <label className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-center p-2">
                            <Camera size={20} className="mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ganti Logo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleInstitutionLogoUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-5 min-w-0">
                      <div className="text-center md:text-left">
                        <h3 className="font-black text-lg text-slate-900">Logo & Nama Lembaga</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">Gunakan logo PNG transparan agar laporan tetap rapi saat dicetak.</p>
                      </div>
                      <div>
                        <FieldLabel>Nama Lembaga</FieldLabel>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={institutionName}
                            onChange={e => setInstitutionName(e.target.value)}
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                          />
                          <button onClick={() => { updateMasterDataCloud({ institutionName }); showToast('Nama lembaga disimpan!'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all w-full sm:w-auto flex justify-center items-center gap-2 font-bold text-sm">
                            <Save size={18} /> Simpan
                          </button>
                        </div>
                      </div>
                      {institutionLogo !== 'logo.png' && (
                        <button onClick={() => { setInstitutionLogo('logo.png'); updateMasterDataCloud({ institutionLogo: 'logo.png' }); showToast('Logo direset.'); }} className="w-full sm:w-auto px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                          Reset Logo Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-900">Daftar Kelas</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Dipakai untuk filter dan profil siswa.</p>
                    </div>
                    <LayoutGrid size={20} className="text-emerald-500 shrink-0" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" placeholder="Misal: 1A" value={newKelasName} onChange={e => setNewKelasName(e.target.value)} className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all" />
                    <button onClick={handleAddKelas} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl transition-all w-full sm:w-auto flex justify-center items-center gap-2 font-bold text-sm">
                      <Plus size={18} /> Tambah
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1"
                    onTouchMove={handleTouchMoveKelas}
                    onTouchEnd={handleTouchEndKelas}>
                    {kelasList.length > 0 ? kelasList.map(kelas => (
                      <div key={kelas}
                        data-kelas-id={kelas}
                        draggable
                        onDragStart={(e) => handleDragStartKelas(e, kelas)}
                        onDragOver={(e) => handleDragOverKelas(e, kelas)}
                        onDrop={(e) => handleDropKelas(e, kelas)}
                        onDragEnd={handleDragEndKelas}
                        className={`group bg-slate-50 border ${dragOverKelasId === kelas ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' : 'border-slate-200'} pl-2 pr-1.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all hover:bg-white hover:border-emerald-200 cursor-grab active:cursor-grabbing ${dragKelasId === kelas ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                        <div className="text-slate-300 group-hover:text-slate-400 cursor-grab touch-none flex items-center" onTouchStart={(e) => handleTouchStartKelas(e, kelas)}>
                          <GripVertical size={14} />
                        </div>
                        <span className="text-xs font-black text-slate-700 select-none">{kelas}</span>
                        <button onClick={() => handleDeleteKelas(kelas)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-0.5" title="Hapus kelas"><X size={13} /></button>
                      </div>
                    )) : (
                      <div className="w-full text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                        Belum ada kelas.
                      </div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Target Kelas Reguler</FieldLabel>
                        <SelectShell>
                          <select
                            value={targetReguler}
                            onChange={e => setTargetReguler(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none appearance-none cursor-pointer transition-all"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(juz => (
                              <option key={juz} value={`${juz} Juz`}>{juz} Juz</option>
                            ))}
                          </select>
                        </SelectShell>
                      </div>
                      <div>
                        <FieldLabel>Target Kelas Al-Qur'an</FieldLabel>
                        <SelectShell>
                          <select
                            value={targetAlQuran}
                            onChange={e => setTargetAlQuran(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none appearance-none cursor-pointer transition-all"
                          >
                            <option value="">Bebas / Sesuai Kesepakatan</option>
                            {[1, 2, 3, 4, 5, 10, 15, 20, 25, 30].map(juz => (
                              <option key={juz} value={`${juz} Juz`}>{juz} Juz</option>
                            ))}
                          </select>
                        </SelectShell>
                      </div>
                    </div>
                    <button onClick={() => { updateMasterDataCloud({ targetReguler, targetAlQuran }); showToast('Target hafalan disimpan!'); }} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl transition-all shrink-0 w-full lg:w-auto flex justify-center items-center gap-2 font-bold text-sm">
                      <Save size={18} /> Simpan Target
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section id="settings-halaqoh" className="scroll-mt-24">
            <SectionHeader
              accent="bg-indigo-500"
              title="Manajemen Guru & Halaqoh"
              description={isSuperAdmin ? 'Kelola akun login, guru, dan kelompok halaqoh.' : 'Tambah dan rapikan kelompok halaqoh Anda.'}
              icon={Users}
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
              {isSuperAdmin && (
                <div className="xl:col-span-4">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col xl:sticky xl:top-4 max-h-[520px]">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 leading-tight">Akses Pengguna</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kelola akun login</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/60">
                      {appUsers.map(user => (
                        <div key={user.id} className={`bg-white border ${user.status === 'pending' ? 'border-orange-200' : 'border-slate-200'} rounded-2xl p-4 transition-all hover:border-indigo-300 hover:shadow-sm`}>
                          {editingAccount?.id === user.id ? (
                            <div className="space-y-3 animate-in fade-in duration-300">
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Nama Lengkap</label>
                                <input type="text" value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Username Login</label>
                                <input type="text" value={editingAccount.username} onChange={e => setEditingAccount({ ...editingAccount, username: e.target.value })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Password Baru</label>
                                <input type="text" value={editingAccount.password} onChange={e => setEditingAccount({ ...editingAccount, password: e.target.value })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Kosongkan jika tak diubah" />
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button onClick={handleSaveAccount} className="bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors">Simpan</button>
                                <button onClick={() => setEditingAccount(null)} className="bg-slate-100 text-slate-500 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Batal</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-sm text-slate-900 truncate flex items-center gap-2">
                                  <span className="truncate">{user.name}</span>
                                  {user.status === 'pending' && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black shrink-0">PENDING</span>}
                                  {user.resetrequested && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse shrink-0">RESET</span>}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">@{user.username} / {user.role}</p>
                              </div>
                              <button onClick={() => handleStartEditAccount(user)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shrink-0" title="Edit akun"><Edit3 size={16} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={isSuperAdmin ? 'xl:col-span-8' : 'xl:col-span-12'}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 bg-white border-b border-slate-100">
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
                      {isSuperAdmin ? (
                        <>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <FieldLabel>Tambah Guru Baru</FieldLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-2">
                              <input type="text" list="approved-gurus" placeholder="Nama lengkap..." value={newGuruName} onChange={e => setNewGuruName(e.target.value)} className="flex-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors" />
                              <button onClick={handleAddGuru} className="bg-slate-900 hover:bg-slate-800 transition-colors text-white py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest w-full active:scale-95 flex items-center justify-center gap-2"><UserPlus size={16} /> Tambah</button>
                              <datalist id="approved-gurus">
                                {appUsers.filter(u => (u.status === 'active' || u.role === 'superadmin') && !guruList.includes(u.name)).map(u => <option key={u.id} value={u.name}>{u.username}</option>)}
                              </datalist>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <FieldLabel>Assign Halaqoh ke Guru</FieldLabel>
                            <div className="space-y-2">
                              <SelectShell className="w-full">
                                <select value={selectedGuruForHalaqoh} onChange={e => setSelectedGuruForHalaqoh(e.target.value)} className="w-full h-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-bold outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                                  <option value="">Pilih guru...</option>
                                  {guruList.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </SelectShell>
                              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px] gap-2">
                                <input type="text" placeholder="Nama halaqoh..." value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="min-w-0 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                <button onClick={handleAddHalaqoh} disabled={!selectedGuruForHalaqoh} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl disabled:bg-slate-200 transition-colors w-full flex justify-center items-center font-bold text-xs uppercase tracking-widest active:scale-95"><Plus size={16} className="sm:hidden mr-2" /> Tambah</button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="lg:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <FieldLabel>Tambah Halaqoh Baru Anda</FieldLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-2">
                            <input type="text" placeholder="Nama kelompok..." value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="min-w-0 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                            <button onClick={handleAddHalaqoh} disabled={!newHalaqohName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:bg-slate-200 w-full transition-colors flex justify-center items-center gap-2 active:scale-95"><Save size={16} /> Simpan</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="p-4 sm:p-5 bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto custom-scrollbar"
                    onTouchMove={handleTouchMoveGuru}
                    onTouchEnd={handleTouchEndGuru}
                  >
                    {guruList.length > 1 && isSuperAdmin && (
                      <div className="col-span-1 lg:col-span-2 relative mb-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Cari nama pengajar..."
                          value={localGuruSearch}
                          onChange={(e) => setLocalGuruSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        />
                      </div>
                    )}

                    {filteredGuruList.map(guru => {
                      const guruDataKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === guru.trim().toLowerCase());
                      const halaqohsForGuru = guruDataKey ? guruHalaqohData[guruDataKey] : [];
                      const linkedUser = appUsers.find(u => u.name?.trim() === guru.trim());
                      return (
                        <div
                          key={guru}
                          data-guru-card-id={guru}
                          draggable={!guruSearch && isSuperAdmin && !editingGuru}
                          onDragStart={(e) => handleDragStartGuru(e, guru)}
                          onDragOver={(e) => handleDragOverGuru(e, guru)}
                          onDrop={(e) => handleDropGuru(e, guru)}
                          onDragEnd={handleDragEndGuru}
                          className={`bg-white border ${dragOverGuruId === guru ? 'border-indigo-500 bg-indigo-50/30 shadow-md scale-[1.02] z-10' : 'border-slate-200'} rounded-2xl p-4 shadow-sm transition-all hover:shadow-md group/card flex flex-col ${dragGuruId === guru ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                            {editingGuru?.oldName === guru ? (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingGuru.newName}
                                  onChange={e => setEditingGuru({ ...editingGuru, newName: e.target.value })}
                                  className="flex-1 w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-2 ring-indigo-500/20"
                                />
                                <div className="grid grid-cols-2 sm:flex gap-2">
                                  <button onClick={handleSaveEditGuru} className="p-2.5 sm:px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex justify-center items-center gap-1.5 font-bold text-xs"><Save size={16} /> Simpan</button>
                                  <button onClick={() => setEditingGuru(null)} className="p-2.5 sm:px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all flex justify-center items-center gap-1.5 font-bold text-xs"><X size={16} /> Batal</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 min-w-0">
                                  {!guruSearch && isSuperAdmin && (
                                    <div
                                      className="text-slate-300 group-hover/card:text-slate-400 cursor-grab touch-none flex items-center shrink-0 -ml-1 mr-1"
                                      onTouchStart={(e) => handleTouchStartGuru(e, guru)}
                                    >
                                      <GripVertical size={16} />
                                    </div>
                                  )}
                                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0"><User size={19} /></div>
                                  <div className="min-w-0">
                                    <h4 className="font-black text-slate-800 text-base truncate tracking-tight">{guru}</h4>
                                    {linkedUser ? (
                                      <p className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> @{linkedUser.username}</p>
                                    ) : isSuperAdmin ? (
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <X size={10} className="text-orange-500 shrink-0" />
                                        <select
                                          value=""
                                          onChange={(e) => { if (e.target.value) handleLinkAccount(guru, e.target.value); }}
                                          className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 rounded-md px-1.5 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-orange-500 max-w-[140px] truncate"
                                        >
                                          <option value="">Pilih Akun Guru...</option>
                                          {appUsers.filter(u => (u.status === 'active' || u.role === 'superadmin') && !guruList.includes(u.name)).map(u => (
                                            <option key={u.id} value={u.id}>@{u.username} ({u.name})</option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{halaqohsForGuru.length} halaqoh</p>
                                    )}
                                  </div>
                                </div>
                                {isSuperAdmin && (
                                  <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => setEditingGuru({ oldName: guru, newName: guru })} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-all" title="Edit nama guru"><Edit3 size={16} /></button>
                                    <button onClick={() => requestDeleteGuru(guru)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all" title="Hapus guru"><Trash2 size={16} /></button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 flex-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FolderPlus size={12} /> Daftar Halaqoh</span>
                            <div className="flex flex-wrap gap-2.5"
                              onTouchMove={(e) => handleTouchMoveHalaqoh(e, guruDataKey || guru)}
                              onTouchEnd={handleTouchEndHalaqoh}>
                              {(halaqohsForGuru || []).map(halaqoh => (
                                <React.Fragment key={halaqoh}>
                                  {editingHalaqoh?.oldName === halaqoh && editingHalaqoh?.guruName === guru ? (
                                    <div className="bg-indigo-50 border border-indigo-200 p-1.5 rounded-xl flex items-center gap-1.5 shadow-sm animate-in zoom-in-95 duration-200 w-full sm:w-auto">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={editingHalaqoh.newName}
                                        onChange={e => setEditingHalaqoh({ ...editingHalaqoh, newName: e.target.value })}
                                        className="flex-1 sm:w-40 bg-white border border-indigo-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                      />
                                      <button onClick={handleSaveEditHalaqoh} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Save size={14} /></button>
                                      <button onClick={() => setEditingHalaqoh(null)} className="p-2 text-slate-400 hover:bg-slate-200 bg-white rounded-lg transition-colors border border-slate-200"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <div
                                      data-halaqoh-id={halaqoh}
                                      data-guru-id={guruDataKey || guru}
                                      draggable
                                      onDragStart={(e) => handleDragStartHalaqoh(e, guruDataKey || guru, halaqoh)}
                                      onDragOver={(e) => handleDragOverHalaqoh(e, guruDataKey || guru, halaqoh)}
                                      onDrop={(e) => handleDropHalaqoh(e, guruDataKey || guru, halaqoh)}
                                      onDragEnd={handleDragEndHalaqoh}
                                      className={`bg-slate-50 border ${dragOverHalaqohInfo?.halaqoh === halaqoh && dragOverHalaqohInfo?.guru === (guruDataKey || guru) ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105' : 'border-slate-200'} pl-2 pr-1.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between gap-1.5 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-sm group/badge cursor-grab active:cursor-grabbing max-w-full ${dragHalaqohInfo?.halaqoh === halaqoh && dragHalaqohInfo?.guru === (guruDataKey || guru) ? 'opacity-50 grayscale' : 'opacity-100'}`}
                                    >
                                      <div className="text-slate-300 group-hover/badge:text-slate-400 cursor-grab touch-none flex items-center shrink-0" onTouchStart={(e) => handleTouchStartHalaqoh(e, guruDataKey || guru, halaqoh)}>
                                        <GripVertical size={14} />
                                      </div>
                                      <span className="truncate py-0.5 select-none min-w-0">{halaqoh}</span>
                                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/badge:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shrink-0 ml-1.5">
                                        {isSuperAdmin && (
                                          <button onClick={() => setEditingHalaqoh({ guruName: guru, oldName: halaqoh, newName: halaqoh })} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" title="Edit halaqoh"><Edit3 size={14} /></button>
                                        )}
                                        <button onClick={() => requestDeleteHalaqoh(guru, halaqoh)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Hapus halaqoh"><X size={14} /></button>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              ))}
                              {(!halaqohsForGuru || halaqohsForGuru.length === 0) && (
                                <div className="w-full text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                  <p className="text-xs text-slate-400 font-bold">Belum ada kelompok halaqoh.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredGuruList.length === 0 && guruList.length > 0 && (
                      <div className="col-span-1 lg:col-span-2 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-xs text-slate-400 font-bold">Pengajar tidak ditemukan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="settings-students" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SectionHeader
              accent="bg-purple-500"
              title={isSuperAdmin ? 'Bank Data Siswa' : 'Data Siswa Saya'}
              description={isSuperAdmin ? 'Cari, filter, impor, dan lakukan edit massal data siswa.' : 'Cari data siswa dari halaqoh yang Anda bimbing.'}
              icon={Database}
            />

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-[76px] z-20 rounded-t-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:items-center">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      inputMode="search"
                      enterKeyHint="search"
                      placeholder="Cari nama atau halaqoh..."
                      value={localStudentSearch}
                      onChange={(e) => setLocalStudentSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
                    <SelectShell className="sm:col-span-1 lg:w-[210px]">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none appearance-none cursor-pointer transition-colors"
                      >
                        <option value="all">Semua (Saya & Kosong)</option>
                        <option value="kosong">Status: Belum Ada Halaqoh</option>
                        <option value="assigned">Status: Punya Halaqoh</option>
                      </select>
                    </SelectShell>
                    <SelectShell className="sm:col-span-1 lg:w-[160px]">
                      <select
                        value={filterKelas}
                        onChange={(e) => setFilterKelas(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none appearance-none cursor-pointer transition-colors"
                      >
                        <option value="">Semua Kelas</option>
                        {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                      </select>
                    </SelectShell>
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-black text-xs uppercase tracking-widest border border-emerald-200"
                      title="Ekspor data siswa ke CSV"
                    >
                      <Download size={18} strokeWidth={3} />
                      Ekspor
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setIsBulkImportOpen(!isBulkImportOpen)}
                        className={`px-4 py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isBulkImportOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} text-white font-black text-xs uppercase tracking-widest`}
                      >
                        {isBulkImportOpen ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                        {isBulkImportOpen ? 'Tutup' : 'Impor'}
                      </button>
                    )}
                    {hasStudentFilters && (
                      <button
                        onClick={resetStudentFilters}
                        className="px-4 py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200 font-black text-xs uppercase tracking-widest border border-slate-200"
                      >
                        <X size={16} strokeWidth={3} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {filteredStudentsMaster.length} hasil
                  </span>
                  {studentSearch && <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">Cari: {studentSearch}</span>}
                  {filterKelas && <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Kelas {filterKelas}</span>}
                  {filterStatus !== (isSuperAdmin ? 'kosong' : 'all') && <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Filter status aktif</span>}
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50">
                {isBulkImportOpen && (
                  <div className="mb-4 p-4 bg-white border border-purple-100 rounded-2xl animate-in zoom-in-95 duration-300">
                    <FieldLabel>Input Massal (Bisa nama saja, atau Format: Nama, Kelas, Halaqoh)</FieldLabel>
                    <textarea
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      placeholder="Ahmad&#10;Siti&#10;Umar, 1A, Abu Bakar&#10;..."
                      className="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400 resize-none mb-3"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button onClick={() => { setBulkData(''); setIsBulkImportOpen(false); }} className="w-full sm:w-auto px-5 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors">Batal</button>
                      <button onClick={processBulkImport} className="w-full sm:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Proses Impor</button>
                    </div>
                  </div>
                )}

                {displayedStudents.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl gap-3">
                      <label className="flex items-start sm:items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0}
                          onChange={toggleSelectAll}
                          className="w-5 h-5 mt-0.5 sm:mt-0 rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                        />
                        <span className="text-[13px] sm:text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-snug">Pilih semua yang tampil</span>
                      </label>

                      <div className="text-xs font-bold text-slate-400 lg:ml-auto">
                        Menampilkan {displayedStudents.length} dari {filteredStudentsMaster.length} siswa
                      </div>

                      {selectedStudentIds.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                          <button
                            onClick={() => setIsBulkEditOpen(!isBulkEditOpen)}
                            className="flex justify-center items-center gap-2 px-4 py-3 sm:py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all"
                          >
                            <Edit3 size={16} /> Edit ({selectedStudentIds.length})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="flex justify-center items-center gap-2 px-4 py-3 sm:py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all"
                          >
                            <Trash2 size={16} /> Hapus ({selectedStudentIds.length})
                          </button>
                        </div>
                      )}
                    </div>

                    {isBulkEditOpen && selectedStudentIds.length > 0 && (
                      <div className="p-4 bg-white border border-blue-200 rounded-2xl animate-in zoom-in-95 duration-200">
                        <FieldLabel>Pindah Kelas / Halaqoh Massal</FieldLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <SelectShell>
                            <select
                              value={bulkEditData.kelas}
                              onChange={e => setBulkEditData({ ...bulkEditData, kelas: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none appearance-none cursor-pointer transition-shadow"
                            >
                              <option value="">-- Jangan Ubah Kelas --</option>
                              <option value="CLEAR_KELAS">-- Kosongkan Kelas --</option>
                              {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                            </select>
                          </SelectShell>
                          <SelectShell>
                            <select
                              value={bulkEditData.halaqoh}
                              onChange={e => setBulkEditData({ ...bulkEditData, halaqoh: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none appearance-none cursor-pointer transition-shadow"
                            >
                              <option value="">-- Jangan Ubah Halaqoh --</option>
                              <option value="CLEAR_HALAQOH">-- Kosongkan Halaqoh --</option>
                              {allHalaqohs.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </SelectShell>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <button onClick={() => setIsBulkEditOpen(false)} className="w-full sm:w-auto px-4 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors">Batal</button>
                          <button onClick={handleExecuteBulkEdit} className="w-full sm:w-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Simpan Perubahan</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {displayedStudents.map(s => {
                    const studentName = s?.name || '-';
                    return (
                      <div key={s.id} className={`bg-white border ${selectedStudentIds.includes(s.id) ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'} rounded-2xl p-4 flex flex-col gap-4 transition-all hover:border-purple-200 hover:shadow-sm group`}>
                        <div className="min-w-0 flex-1 w-full flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={() => toggleSelectStudent(s.id)}
                            className="w-5 h-5 mt-0.5 rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`font-black text-slate-900 leading-tight mb-1.5 ${studentName.length > 26 ? 'text-sm whitespace-normal line-clamp-2' : 'text-base truncate'}`}>{studentName}</p>
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest truncate">
                              Halaqoh: <span className="text-slate-700">{s.halaqoh || 'Unassigned'}</span> / {s.kelas || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => openEditStudentModal(s)} className="flex justify-center items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-all font-bold text-xs"><Edit3 size={16} /> Edit</button>
                          <button onClick={() => requestDeleteStudent(s)} className="flex justify-center items-center gap-2 p-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all font-bold text-xs"><Trash2 size={16} /> Hapus</button>
                        </div>
                      </div>
                    );
                  })}

                  {displayedStudents.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                      <Database size={42} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-black">Data siswa tidak ditemukan.</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Coba ubah kata kunci atau filter yang dipilih.</p>
                    </div>
                  )}
                </div>

                {visibleCount < filteredStudentsMaster.length && (
                  <div className="mt-5 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="w-full sm:w-auto px-7 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Muat {filteredStudentsMaster.length - visibleCount} Siswa Lainnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {
            isSuperAdmin && (
              <section id="settings-maintenance" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SectionHeader
                  accent="bg-rose-500"
                  title="Pemeliharaan Data"
                  description="Aksi perawatan untuk memperbaiki data yang tersimpan tidak sesuai."
                  icon={Wrench}
                />
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-1">Bersihkan Nilai Lesson Plan</h3>
                      <p className="text-sm text-slate-500 font-medium">Hapus semua data nilai yang tidak sengaja tersimpan pada mode Target (Lesson Plan).</p>
                    </div>
                    <button onClick={handleCleanLessonPlanValues} className="w-full md:w-auto px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shrink-0">
                      <Wrench size={16} /> Bersihkan Sekarang
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-1">Backup Database Siswa</h3>
                      <p className="text-sm text-slate-500 font-medium">Unduh seluruh data riwayat siswa ke format JSON sebagai cadangan lokal (sangat disarankan sebelum tutup semester).</p>
                    </div>
                    <button onClick={handleBackupData} className="w-full md:w-auto px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shrink-0">
                      <Database size={16} /> Unduh JSON
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-red-600 mb-1">Tutup Semester / Kenaikan Kelas</h3>
                      <p className="text-sm text-slate-500 font-medium">Mengosongkan seluruh riwayat jurnal dan target untuk semua siswa. Lakukan hanya saat pergantian semester.</p>
                    </div>
                    <button onClick={handleCloseSemester} className="w-full md:w-auto px-6 py-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shrink-0">
                      <AlertTriangle size={16} /> Mulai Semester Baru
                    </button>
                  </div>
                </div>
              </section>
            )
          }

          <div className="md:hidden pt-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-red-100 text-red-600 rounded-2xl font-black shadow-sm active:scale-95 transition-all"
            >
              <LogOut size={20} />
              Keluar dari Akun
            </button>
          </div>
        </div >

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 md:bottom-8 right-5 z-50 p-3 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300"
            title="Scroll ke Atas"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div >
    </div >
  );
};

export default SettingsView;
