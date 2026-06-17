import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpDown, BookOpen, Check, ChevronDown, GripVertical, Layers, Mic, Search, ShieldCheck, SlidersHorizontal, Unlink2, Users, X, Shield, ShieldAlert, UserPlus, FolderPlus, Edit3, Trash2, Save, Plus, User, CheckCircle2, UserCheck, UserX, RotateCcw, AlertTriangle } from 'lucide-react';

const UNASSIGNED = '__unassigned__';
const HALAQOH_SESSION_OPTIONS = ['1', '2', '3'];

const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{children}</label>
);

const SelectShell = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    {children}
    <ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

const isGraduatedStudent = (student) => {
  const status = String(student?.student_status || '').trim().toLowerCase();
  return ['lulus', 'alumni', 'pindah', 'selesai', 'nonaktif'].includes(status);
};

const getStudentStatusLabel = (student) => {
  const status = String(student?.student_status || 'active').trim().toLowerCase();
  if (status === 'pindah') return 'Pindah';
  if (status === 'selesai') return 'Selesai';
  if (status === 'nonaktif') return 'Nonaktif';
  if (status === 'lulus' || status === 'alumni') return `Alumni ${student?.graduation_year || ''}`.trim();
  return 'Aktif';
};

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== '' && text !== '-';
};

const isInactiveRecord = (record, key) => {
  const text = String(record?.[key] || '').toLowerCase();
  return ['libur', 'sakit', 'izin', 'alpa', 'tidak hadir'].some(word => text.includes(word));
};

const getJuzFromSurah = (surahString) => {
  if (!hasValue(surahString)) return '';
  const text = String(surahString);
  const explicitJuz = text.match(/Juz\s*(\d+)/i);
  if (explicitJuz) return `Juz ${explicitJuz[1]}`;

  const match = text.match(/^(\d+)\./);
  if (!match) return '';

  const no = parseInt(match[1], 10);
  if (no >= 78 && no <= 114) return 'Juz 30';
  if (no >= 67 && no <= 77) return 'Juz 29';
  if (no >= 58 && no <= 66) return 'Juz 28';
  if (no >= 51 && no <= 57) return 'Juz 27';
  if (no >= 46 && no <= 50) return 'Juz 26';
  if (no >= 41 && no <= 45) return 'Juz 25';
  if (no >= 39 && no <= 40) return 'Juz 24';
  if (no >= 36 && no <= 38) return 'Juz 23';
  if (no >= 33 && no <= 35) return 'Juz 22';
  if (no >= 29 && no <= 32) return 'Juz 21';
  if (no >= 27 && no <= 28) return 'Juz 20';
  if (no >= 25 && no <= 26) return 'Juz 19';
  if (no >= 23 && no <= 24) return 'Juz 18';
  if (no >= 21 && no <= 22) return 'Juz 17';
  if (no >= 19 && no <= 20) return 'Juz 16';
  if (no >= 17 && no <= 18) return 'Juz 15';
  if (no >= 15 && no <= 16) return 'Juz 14';
  if (no >= 13 && no <= 14) return 'Juz 13';
  if (no === 12) return 'Juz 12';
  if (no >= 10 && no <= 11) return 'Juz 11';
  if (no === 9) return 'Juz 10';
  if (no === 8) return 'Juz 9';
  if (no === 7) return 'Juz 8';
  if (no === 6) return 'Juz 7';
  if (no === 5) return 'Juz 6';
  if (no === 4) return 'Juz 4';
  if (no === 3) return 'Juz 3';
  if (no >= 1 && no <= 2) return 'Juz 1';
  return '';
};

const cleanAyatText = (value) => {
  if (!hasValue(value)) return '';
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(item => item && item !== '-')
    .join(', ');
};

const splitTahsinDetail = (detail) => {
  const text = hasValue(detail) ? String(detail).trim() : '';
  if (!text) return { materi: '', ayat: '' };

  if (text.includes(' / ')) {
    const [materi, ...ayatParts] = text.split(' / ');
    return {
      materi: materi.trim(),
      ayat: ayatParts.join(' / ').trim()
    };
  }

  if (/^[\d,\-\s]+$/.test(text) || /Semua Ayat/i.test(text)) {
    return { materi: '', ayat: text };
  }

  return { materi: text, ayat: '' };
};

const formatSurahTilawahLines = (surahList, ayatText) => {
  const ayatList = hasValue(ayatText) ? String(ayatText).split(',').map(item => item.trim()) : [];
  return surahList
    .map((surah, index) => {
      const ayat = cleanAyatText(ayatList[index] || '');
      return [surah, ayat].filter(hasValue).join(' ');
    })
    .filter(hasValue)
    .join('\n');
};

const formatTahsinSummary = (tahsin, detail) => {
  const tahsinText = hasValue(tahsin) ? String(tahsin).trim() : '';
  const detailText = hasValue(detail) ? String(detail).trim() : '';
  if (!tahsinText && !detailText) return '-';

  const jilidMatch = tahsinText.match(/Jilid\s*([1-6])/i);
  if (jilidMatch) {
    const pageMatch = detailText.match(/Hal\.\s*[\d,\s]+(?:Brs\s*[\d,\s:]+)?/i);
    const pageText = pageMatch ? pageMatch[0].replace(/\s+/g, ' ').trim() : detailText;
    return [`Jilid ${jilidMatch[1]}`, pageText].filter(hasValue).join('\n');
  }

  if (/Tajwid|Ghorib|Gharib/i.test(tahsinText)) {
    const category = /Tajwid/i.test(tahsinText) ? 'Tajwid' : 'Ghorib';
    const surahList = tahsinText.split(',').slice(1).map(item => item.trim()).filter(hasValue);
    const { materi, ayat } = splitTahsinDetail(detailText);
    const tilawah = formatSurahTilawahLines(surahList, ayat);
    return [category, materi, tilawah].filter(hasValue).join('\n');
  }

  const quranSurahList = tahsinText.split(',').map(item => item.trim()).filter(hasValue);
  const quranTilawah = formatSurahTilawahLines(quranSurahList, detailText);
  return quranTilawah || [tahsinText || "Al-Qur'an", cleanAyatText(detailText)].filter(hasValue).join(' ');
};

const formatTahfidzSummary = (tahfidz, detail) => {
  if (!hasValue(tahfidz) && !hasValue(detail)) return '-';
  const surahList = hasValue(tahfidz) ? String(tahfidz).split(',').map(item => item.trim()).filter(hasValue) : [];
  const ayatList = hasValue(detail) ? String(detail).split(',').map(item => item.trim()) : [];

  if (surahList.length === 0) return cleanAyatText(detail);

  return surahList.map((surah, index) => {
    const juz = getJuzFromSurah(surah);
    const ayat = cleanAyatText(ayatList[index] || '');
    return [juz, surah, ayat].filter(hasValue).join(' ');
  }).join('\n');
};

const getLatestProgress = (student) => {
  const dates = Object.keys(student.records || {}).sort((a, b) => new Date(b) - new Date(a));
  const latest = { tahsin: null, tahfidz: null };

  for (const date of dates) {
    const record = student.records?.[date];
    if (!record) continue;

    if (!latest.tahsin && !isInactiveRecord(record, 'jurnalCatatan')) {
      const hasTahsin = hasValue(record.jurnalTahsin) || hasValue(record.jurnalHalAyatTahsin);
      if (hasTahsin) {
        latest.tahsin = formatTahsinSummary(record.jurnalTahsin, record.jurnalHalAyatTahsin);
      }
    }

    if (!latest.tahfidz && !isInactiveRecord(record, 'jurnalCatatan')) {
      const hasTahfidz = hasValue(record.jurnalTahfidz) || hasValue(record.jurnalAyatTahfidz);
      if (hasTahfidz) {
        latest.tahfidz = formatTahfidzSummary(record.jurnalTahfidz, record.jurnalAyatTahfidz);
      }
    }

    if (latest.tahsin && latest.tahfidz) break;
  }

  return {
    tahsin: latest.tahsin || '-',
    tahfidz: latest.tahfidz || '-'
  };
};

const getInitials = (name) => {
  if (!name) return 'S';
  return String(name).trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

const getStudentTextSize = (name) => {
  const length = String(name || '').length;
  if (length > 34) return 'text-[9px] sm:text-[10px]';
  if (length > 24) return 'text-[10px] sm:text-[11px]';
  return 'text-[11px] sm:text-xs';
};

const ProgressLine = ({ icon, tone, text }) => {
  const safeText = hasValue(text) ? String(text) : '-';
  const isEmpty = safeText === '-';
  return (
    <div className={`flex items-start gap-1 rounded-md border px-1.5 py-1 min-h-[27px] ${tone.bg} ${tone.border}`}>
      {React.createElement(icon, { size: 11, className: `${tone.icon} shrink-0 mt-0.5` })}
      <p className={`min-w-0 whitespace-pre-wrap break-words leading-snug font-bold ${isEmpty ? 'text-slate-300 text-[9px]' : 'text-slate-700 dark:text-slate-200 text-[9px] sm:text-[10px]'}`}>
        {safeText}
      </p>
    </div>
  );
};

const normalizeGender = (val) => {
  const t = String(val || '').trim().toLowerCase();
  if (['l', 'laki', 'laki-laki', 'male', 'm'].includes(t)) return 'L';
  if (['p', 'perempuan', 'wanita', 'female', 'f'].includes(t)) return 'P';
  return '';
};

const StudentCard = ({ student, progress, selected, dragging, disabled, onToggle, onDragStart, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }) => {
  const showPreviousShadow = !hasValue(student.halaqoh) && hasValue(student.previous_halaqoh);
  const previousText = [student.previous_halaqoh, student.previous_teacher].filter(hasValue).join(' - ');
  const gender = normalizeGender(student.gender || student.jenis_kelamin);

  return (
    <div
      data-transfer-student-id={student.id}
      className={`rounded-lg border bg-white dark:bg-slate-800 p-2 shadow-sm transition-all ${
        disabled ? 'opacity-80' : ''
      } ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'
      } ${dragging ? 'opacity-50 scale-[0.98]' : 'opacity-100'} [touch-action:pan-y]`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <button
          type="button"
          disabled={disabled}
          draggable={!disabled}
          onDragStart={(e) => !disabled && onDragStart(e, student.id)}
          onDragEnd={onDragEnd}
          onTouchStart={(e) => !disabled && onTouchStart(e, student.id)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="shrink-0 w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center disabled:opacity-30 cursor-grab active:cursor-grabbing [touch-action:pan-y]"
          title={disabled ? 'Siswa nonaktif tidak bisa dipindahkan' : 'Pindahkan'}
        >
          <GripVertical size={13} />
        </button>

        <button
          type="button"
          onClick={() => onToggle(student.id)}
          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors ${
            selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'
          }`}
          title="Pilih siswa"
        >
          <Check size={10} strokeWidth={4} />
        </button>

        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center font-black text-[9px] shrink-0 overflow-hidden">
          {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : getInitials(student.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={`${getStudentTextSize(student.name)} font-black text-slate-900 dark:text-slate-100 leading-tight break-words`} title={student.name}>
            {student.name}
          </h3>
          <div className="mt-0.5 flex flex-wrap gap-1">
            <span className="max-w-full rounded border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-1 py-0.5 text-[8px] font-black text-blue-700 dark:text-blue-300 leading-tight break-words">
              Kelas {student.kelas || '-'}
            </span>
            {gender && (
              <span className={`rounded border px-1 py-0.5 text-[8px] font-black leading-tight ${
                gender === 'L'
                  ? 'border-sky-100 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300'
                  : 'border-pink-100 dark:border-pink-500/20 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-300'
              }`}>
                {gender === 'L' ? '♂' : '♀'}
              </span>
            )}
            {disabled && (
              <span className="max-w-full rounded border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-1 py-0.5 text-[8px] font-black text-amber-700 dark:text-amber-300 leading-tight break-words">
                {getStudentStatusLabel(student)}
              </span>
            )}
          </div>
        </div>
      </div>

      {showPreviousShadow && (
        <div className="mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-1.5 py-1">
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Sebelumnya</p>
          <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold leading-tight text-slate-600 dark:text-slate-300 break-words">
            {previousText}
          </p>
        </div>
      )}

      <div className="mt-1.5 grid grid-cols-1 gap-1">
        <ProgressLine icon={BookOpen} tone={{ bg: 'bg-blue-50/70 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', icon: 'text-blue-500' }} text={progress.tahsin} />
        <ProgressLine icon={Mic} tone={{ bg: 'bg-purple-50/70 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: 'text-purple-500' }} text={progress.tahfidz} />
      </div>
    </div>
  );
};

const HalaqohColumn = ({ group, students, progressMap, selectedIds, draggingIds, dragOver, onToggle, onToggleAll, onDragStart, onDragEnd, onDragOver, onDrop, onTouchStart, onTouchMove, onTouchEnd, getTeacherDisplayName }) => {
  const selectableStudents = students.filter(s => !isGraduatedStudent(s));
  const selectableIds = selectableStudents.map(s => s.id);
  const selectedInColumn = selectableIds.filter(id => selectedIds.includes(id));
  const allSelected = selectableIds.length > 0 && selectedInColumn.length === selectableIds.length;
  const someSelected = selectedInColumn.length > 0 && !allSelected;

  return (
    <section
      data-transfer-halaqoh={group.value}
      onDragOver={(e) => onDragOver(e, group.value)}
      onDrop={(e) => onDrop(e, group.value)}
      className={`flex flex-col min-h-[210px] rounded-xl border bg-slate-50/80 dark:bg-slate-900/40 p-2 transition-all ${
        dragOver ? 'border-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0 flex items-center gap-1.5">
          {selectableIds.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleAll?.(selectableIds)}
              className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                allSelected ? 'bg-emerald-500 border-emerald-500 text-white' :
                someSelected ? 'bg-emerald-200 border-emerald-400 text-emerald-700' :
                'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'
              }`}
              title={allSelected ? 'Batal pilih semua' : 'Pilih semua'}
            >
              <Check size={10} strokeWidth={4} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className={`font-black text-slate-900 dark:text-slate-100 leading-tight break-words ${group.label.length > 22 ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
              {group.label}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
              {getTeacherDisplayName?.(group.teacher) || group.teacher}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[9px] font-black text-slate-500 dark:text-slate-300">
          {students.length}{selectedInColumn.length > 0 ? `/${selectedInColumn.length}` : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            progress={progressMap[student.id] || { tahsin: '-', tahfidz: '-' }}
            selected={selectedIds.includes(student.id)}
            dragging={draggingIds.includes(student.id)}
            disabled={isGraduatedStudent(student)}
            onToggle={onToggle}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        ))}
        {students.length === 0 && (
          <div className="min-h-[92px] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 text-slate-300">
            <Users size={18} className="opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-widest">Kosong</span>
          </div>
        )}
      </div>
    </section>
  );
};

const KelolaView = ({ isSuperAdmin, students = [], guruHalaqohData = {}, guruList = [], activeGuruList = [], inactiveGuruList = [], handleDeactivateGuru, handleReactivateGuru, kelasList = [], onMoveStudents, onSetStudentStatus, onStartNewSchoolYear, appUsers = [], handleApproveUser, handleRejectUser, handleUpdateUserAccount, handleCreateSuperAdmin, newGuruName, setNewGuruName, handleAddGuru, selectedGuruForHalaqoh, setSelectedGuruForHalaqoh, newHalaqohName, setNewHalaqohName, newHalaqohSesi, setNewHalaqohSesi, handleAddHalaqoh, editingGuru, setEditingGuru, handleSaveEditGuru, requestDeleteGuru, editingHalaqoh, setEditingHalaqoh, handleSaveEditHalaqoh, requestDeleteHalaqoh, handleReorderHalaqoh, handleReorderGuru, handleLinkAccount, showToast, currentUser, getTeacherDisplayName }) => {
  const [search, setSearch] = useState('');
  const [masterSearch, setMasterSearch] = useState('');
  const [masterKelasFilter, setMasterKelasFilter] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [draggingIds, setDraggingIds] = useState([]);
  const [dragOverHalaqoh, setDragOverHalaqoh] = useState('');
  const touchDragTimerRef = useRef(null);
  const touchDragCandidateRef = useRef(null);

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState('kelola'); // 'kelola' | 'mutasi' | 'tahun'

  // --- MANAGEMENT STATE (moved from SettingsView) ---
  const [editingAccount, setEditingAccount] = useState(null);
  const [newSuperAdmin, setNewSuperAdmin] = useState({ name: '', username: '', password: '' });
  const [isCreatingSuperAdmin, setIsCreatingSuperAdmin] = useState(false);
  const [guruSearch, setGuruSearch] = useState('');
  const [localGuruSearch, setLocalGuruSearch] = useState('');
  const [showInactiveGuru, setShowInactiveGuru] = useState(false);
  const [deactivatingGuru, setDeactivatingGuru] = useState(null); // { name, reassignTo }
  const [dragHalaqohInfo, setDragHalaqohInfo] = useState(null);
  const [dragOverHalaqohInfo, setDragOverHalaqohInfo] = useState(null);
  const [dragGuruId, setDragGuruId] = useState(null);
  const [dragOverGuruId, setDragOverGuruId] = useState(null);

  // Debounce guru search
  React.useEffect(() => {
    const timer = setTimeout(() => setGuruSearch(localGuruSearch), 300);
    return () => clearTimeout(timer);
  }, [localGuruSearch]);

  const filteredGuruList = guruList.filter(guru => guru.toLowerCase().includes(guruSearch.toLowerCase()));
  const displayedGuruList = showInactiveGuru ? filteredGuruList : filteredGuruList.filter(g => !inactiveGuruList.includes(g));

  // Pending user handling
  const [resolvedPendingUserIds, setResolvedPendingUserIds] = useState([]);
  React.useEffect(() => {
    setResolvedPendingUserIds(prev => prev.filter(id => appUsers.some(user => user.id === id && user.status === 'pending')));
  }, [appUsers]);
  const pendingUsers = appUsers.filter(u => u.status === 'pending' && !resolvedPendingUserIds.includes(u.id));
  const hidePendingUser = (id) => setResolvedPendingUserIds(prev => prev.includes(id) ? prev : [...prev, id]);
  const restorePendingUser = (id) => setResolvedPendingUserIds(prev => prev.filter(item => item !== id));
  const handleApprovePendingUser = async (user) => {
    hidePendingUser(user.id);
    try { await handleApproveUser(user); } catch { restorePendingUser(user.id); showToast?.('Gagal menerima akun.'); }
  };
  const handleRejectPendingUser = async (id) => {
    hidePendingUser(id);
    try { await handleRejectUser(id); } catch { restorePendingUser(id); showToast?.('Gagal menolak akun.'); }
  };

  // Account management handlers
  const handleStartEditAccount = (user) => {
    setEditingAccount({ id: user.id, name: user.name, username: user.username, password: '', role: user.role });
  };

  const handleSaveAccount = async () => {
    const originalUser = appUsers.find(u => u.id === editingAccount.id);
    const isUsernameChanged = editingAccount.username !== originalUser?.username;
    if (isUsernameChanged && !editingAccount.password && originalUser?.password === '[SECURED_BY_SUPABASE]') {
      showToast?.("PENTING: Jika mengubah username, Anda WAJIB mengisi Password Baru agar akun bisa sinkronisasi ulang!");
      return;
    }
    const updates = { name: editingAccount.name, username: editingAccount.username.toLowerCase().replace(/\s+/g, ''), role: editingAccount.role, resetrequested: false };
    if (editingAccount.password) updates.password = editingAccount.password;
    await handleUpdateUserAccount(editingAccount.id, updates);
    setEditingAccount(null);
  };

  // Guru drag/drop reorder handlers
  const handleDragStartGuru = (e, guru) => { if (guruSearch || !isSuperAdmin) return; setDragGuruId(guru); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", guru); };
  const handleDragOverGuru = (e, guru) => { e.preventDefault(); if (guruSearch || !isSuperAdmin) return; if (dragOverGuruId !== guru) setDragOverGuruId(guru); };
  const handleDropGuru = (e, targetGuru) => { e.preventDefault(); if (guruSearch || !isSuperAdmin) return; if (!dragGuruId || dragGuruId === targetGuru) { setDragGuruId(null); setDragOverGuruId(null); return; } const draggedIdx = guruList.indexOf(dragGuruId); const targetIdx = guruList.indexOf(targetGuru); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...guruList]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderGuru) handleReorderGuru(newList); } setDragGuruId(null); setDragOverGuruId(null); };
  const handleDragEndGuru = () => { setDragGuruId(null); setDragOverGuruId(null); };
  const handleTouchStartGuru = (e, guru) => { if (guruSearch || !isSuperAdmin) return; setDragGuruId(guru); };
  const handleTouchMoveGuru = (e) => { if (guruSearch || !isSuperAdmin || !dragGuruId) return; const touch = e.touches[0]; const target = document.elementFromPoint(touch.clientX, touch.clientY); const card = target?.closest('[data-guru-card-id]'); if (card) { const hoverId = card.getAttribute('data-guru-card-id'); if (hoverId !== dragOverGuruId) setDragOverGuruId(hoverId); } };
  const handleTouchEndGuru = () => { if (guruSearch || !isSuperAdmin) return; if (dragGuruId && dragOverGuruId && dragGuruId !== dragOverGuruId) { const draggedIdx = guruList.indexOf(dragGuruId); const targetIdx = guruList.indexOf(dragOverGuruId); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...guruList]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderGuru) handleReorderGuru(newList); } } setDragGuruId(null); setDragOverGuruId(null); };

  // Halaqoh drag/drop reorder handlers
  const handleDragStartHalaqoh = (e, guru, halaqoh) => { e.stopPropagation(); setDragHalaqohInfo({ guru, halaqoh }); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `${guru}|${halaqoh}`); };
  const handleDragOverHalaqoh = (e, guru, halaqoh) => { e.preventDefault(); e.stopPropagation(); if (dragHalaqohInfo?.guru === guru && dragOverHalaqohInfo?.halaqoh !== halaqoh) { setDragOverHalaqohInfo({ guru, halaqoh }); } };
  const handleDropHalaqoh = (e, targetGuru, targetHalaqoh) => { e.preventDefault(); e.stopPropagation(); if (!dragHalaqohInfo || dragHalaqohInfo.guru !== targetGuru || dragHalaqohInfo.halaqoh === targetHalaqoh) { setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); return; } const guru = dragHalaqohInfo.guru; const halaqohs = guruHalaqohData[guru] || []; const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh); const targetIdx = halaqohs.indexOf(targetHalaqoh); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...halaqohs]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderHalaqoh) handleReorderHalaqoh(guru, newList); } setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };
  const handleDragEndHalaqoh = () => { setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };
  const handleTouchStartHalaqoh = (e, guru, halaqoh) => { setDragHalaqohInfo({ guru, halaqoh }); };
  const handleTouchMoveHalaqoh = (e, targetGuru) => { if (!dragHalaqohInfo || dragHalaqohInfo.guru !== targetGuru) return; const touch = e.touches[0]; const target = document.elementFromPoint(touch.clientX, touch.clientY); const card = target?.closest('[data-halaqoh-id]'); if (card) { const hoverId = card.getAttribute('data-halaqoh-id'); const hoverGuru = card.getAttribute('data-guru-id'); if (hoverGuru === targetGuru && hoverId !== dragOverHalaqohInfo?.halaqoh) { setDragOverHalaqohInfo({ guru: hoverGuru, halaqoh: hoverId }); } } };
  const handleTouchEndHalaqoh = () => { if (dragHalaqohInfo && dragOverHalaqohInfo && dragHalaqohInfo.guru === dragOverHalaqohInfo.guru && dragHalaqohInfo.halaqoh !== dragOverHalaqohInfo.halaqoh) { const guru = dragHalaqohInfo.guru; const halaqohs = guruHalaqohData[guru] || []; const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh); const targetIdx = halaqohs.indexOf(dragOverHalaqohInfo.halaqoh); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...halaqohs]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderHalaqoh) handleReorderHalaqoh(guru, newList); } } setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };

  const activeCount = useMemo(() => students.filter(student => !isGraduatedStudent(student)).length, [students]);
  const alumniCount = useMemo(() => students.filter(isGraduatedStudent).length, [students]);

  const visibleStudentsByStatus = useMemo(() => {
    if (statusFilter === 'inactive') return students.filter(isGraduatedStudent);
    if (statusFilter === 'all') return students;
    return students.filter(student => !isGraduatedStudent(student));
  }, [students, statusFilter]);

  const halaqohGroups = useMemo(() => {
    const orderedTeachers = guruList.length > 0
      ? guruList
      : Object.keys(guruHalaqohData).filter(key => key !== '_order_');

    const groups = orderedTeachers.flatMap(teacher => (guruHalaqohData[teacher] || []).map(halaqoh => ({
      value: halaqoh,
      label: halaqoh,
      teacher
    })));
    const knownHalaqohs = new Set(groups.map(group => group.value));
    const outsideMasterGroups = Array.from(new Set(visibleStudentsByStatus.map(student => student.halaqoh).filter(hasValue)))
      .filter(halaqoh => !knownHalaqohs.has(halaqoh))
      .map(halaqoh => ({
        value: halaqoh,
        label: halaqoh,
        teacher: 'Di Luar Master'
      }));

    return [
      { value: UNASSIGNED, label: 'Bank Data Siswa', teacher: 'Belum Ada Halaqoh' },
      ...groups,
      ...outsideMasterGroups
    ];
  }, [guruHalaqohData, guruList, visibleStudentsByStatus]);

  const actualHalaqohGroups = useMemo(() => {
    return halaqohGroups.filter(group => group.value !== UNASSIGNED);
  }, [halaqohGroups]);

  const availableTeacherFilters = useMemo(() => {
    return Array.from(new Set(actualHalaqohGroups.map(group => group.teacher).filter(Boolean)));
  }, [actualHalaqohGroups]);

  const progressMap = useMemo(() => {
    return visibleStudentsByStatus.reduce((acc, student) => {
      const latestProgress = getLatestProgress(student);
      const useReleasedShadow = !hasValue(student.halaqoh) && hasValue(student.previous_halaqoh);
      acc[student.id] = {
        tahsin: useReleasedShadow && hasValue(student.previous_tahsin_summary) ? student.previous_tahsin_summary : latestProgress.tahsin,
        tahfidz: useReleasedShadow && hasValue(student.previous_tahfidz_summary) ? student.previous_tahfidz_summary : latestProgress.tahfidz
      };
      return acc;
    }, {});
  }, [visibleStudentsByStatus]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleStudentsByStatus
      .filter(student => {
        const matchesSearch = !query || String(student.name || '').toLowerCase().includes(query);
        const matchesKelas = !kelasFilter || String(student.kelas || '') === kelasFilter;
        return matchesSearch && matchesKelas;
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.name).localeCompare(String(b.name), 'id', { sensitivity: 'base' }));
  }, [visibleStudentsByStatus, search, kelasFilter]);

  const masterFilteredStudentIds = useMemo(() => {
    const query = masterSearch.trim().toLowerCase();
    if (!query && !masterKelasFilter) return null;

    return new Set(
      visibleStudentsByStatus
        .filter(student => !hasValue(student.halaqoh))
        .filter(student => {
          const matchesSearch = !query || String(student.name || '').toLowerCase().includes(query);
          const matchesKelas = !masterKelasFilter || String(student.kelas || '') === masterKelasFilter;
          return matchesSearch && matchesKelas;
        })
        .map(student => student.id)
    );
  }, [visibleStudentsByStatus, masterSearch, masterKelasFilter]);

  const studentsByHalaqoh = useMemo(() => {
    const map = halaqohGroups.reduce((acc, group) => {
      acc[group.value] = [];
      return acc;
    }, {});

    filteredStudents.forEach(student => {
      const halaqoh = hasValue(student.halaqoh) ? student.halaqoh : UNASSIGNED;
      if (halaqoh === UNASSIGNED && masterFilteredStudentIds && !masterFilteredStudentIds.has(student.id)) return;
      if (!map[halaqoh]) {
        map[halaqoh] = [];
      }
      map[halaqoh].push(student);
    });

    return map;
  }, [filteredStudents, halaqohGroups, masterFilteredStudentIds]);

  const teacherStats = useMemo(() => {
    return availableTeacherFilters.map(teacher => {
      const teacherGroups = actualHalaqohGroups.filter(group => group.teacher === teacher);
      const studentCount = teacherGroups.reduce((total, group) => total + (studentsByHalaqoh[group.value]?.length || 0), 0);
      return { teacher, groupCount: teacherGroups.length, studentCount };
    });
  }, [availableTeacherFilters, actualHalaqohGroups, studentsByHalaqoh]);

  const visibleGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    return halaqohGroups.filter(group => {
      const isUnassigned = group.value === UNASSIGNED;
      const matchesTeacher = !teacherFilter || isUnassigned || group.teacher === teacherFilter;
      const matchesGroupSearch = !query || String(group.label || '').toLowerCase().includes(query) || String(group.teacher || '').toLowerCase().includes(query);
      return matchesTeacher && (matchesGroupSearch || (isUnassigned && teacherFilter));
    });
  }, [halaqohGroups, teacherFilter, groupSearch]);

  const unassignedCount = visibleStudentsByStatus.filter(student => !hasValue(student.halaqoh)).length;

  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkTarget('');
  };

  const clearMasterFilters = () => {
    setMasterSearch('');
    setMasterKelasFilter('');
  };

  const toggleAllInColumn = (ids) => {
    const allAlreadySelected = ids.every(id => selectedIds.includes(id));
    if (allAlreadySelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const getMoveIds = (studentId) => {
    if (selectedIds.includes(studentId)) return selectedIds;
    return [studentId];
  };

  const handleDragStart = (e, studentId) => {
    const student = students.find(s => s.id === studentId);
    if (isGraduatedStudent(student)) return;
    const ids = getMoveIds(studentId);
    setDraggingIds(ids);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
  };

  const finishMove = async (targetValue, ids = draggingIds) => {
    const targetHalaqoh = targetValue === UNASSIGNED ? '' : targetValue;
    if (!ids.length || !onMoveStudents) {
      setDraggingIds([]);
      setDragOverHalaqoh('');
      return;
    }

    await onMoveStudents(ids, targetHalaqoh);
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    if (bulkTarget === targetValue) setBulkTarget('');
    setDraggingIds([]);
    setDragOverHalaqoh('');
  };

  const finishSetStudentStatus = async (status, ids = selectedIds) => {
    if (!ids.length || !onSetStudentStatus) return;
    await onSetStudentStatus(ids, status);
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    setBulkTarget('');
  };

  const returnSelectedToBankData = async () => {
    if (statusFilter !== 'active' || selectedIds.length === 0) return;
    await finishMove(UNASSIGNED, selectedIds);
  };

  const handleDragOver = (e, value) => {
    e.preventDefault();
    if (dragOverHalaqoh !== value) setDragOverHalaqoh(value);
  };

  const handleDrop = async (e, value) => {
    e.preventDefault();
    let ids = draggingIds;
    try {
      const parsed = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (Array.isArray(parsed)) ids = parsed;
    } catch {
      // gunakan state draggingIds
    }
    await finishMove(value, ids);
  };

  const clearTouchDragTimer = () => {
    if (touchDragTimerRef.current) {
      clearTimeout(touchDragTimerRef.current);
      touchDragTimerRef.current = null;
    }
  };

  const handleTouchStart = (e, studentId) => {
    const student = students.find(s => s.id === studentId);
    if (isGraduatedStudent(student)) return;
    const touch = e.touches?.[0];
    const ids = getMoveIds(studentId);
    touchDragCandidateRef.current = touch ? { ids, startX: touch.clientX, startY: touch.clientY } : { ids, startX: 0, startY: 0 };
    clearTouchDragTimer();
    touchDragTimerRef.current = setTimeout(() => {
      setDraggingIds(ids);
      touchDragTimerRef.current = null;
    }, 320);
  };

  const handleTouchMove = (e) => {
    if (draggingIds.length === 0) {
      const candidate = touchDragCandidateRef.current;
      const touch = e.touches?.[0];
      if (candidate && touch) {
        const verticalMove = Math.abs(touch.clientY - candidate.startY);
        const horizontalMove = Math.abs(touch.clientX - candidate.startX);
        if (verticalMove > 10 && verticalMove > horizontalMove) {
          clearTouchDragTimer();
          touchDragCandidateRef.current = null;
        }
      }
      return;
    }
    const touch = e.touches[0];
    const dropZone = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-transfer-halaqoh]');
    const value = dropZone?.getAttribute('data-transfer-halaqoh') || '';
    if (value && value !== dragOverHalaqoh) setDragOverHalaqoh(value);
  };

  const handleTouchEnd = async () => {
    clearTouchDragTimer();
    touchDragCandidateRef.current = null;
    if (dragOverHalaqoh) {
      await finishMove(dragOverHalaqoh, draggingIds);
      return;
    }
    setDraggingIds([]);
    setDragOverHalaqoh('');
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 p-4 sm:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-500">
          Halaman ini hanya tersedia untuk Super Admin.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto overscroll-y-contain custom-scrollbar bg-slate-50 dark:bg-slate-950 p-3 sm:p-5 md:p-8 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-8 [touch-action:pan-y] transition-colors" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-7xl mx-auto pb-6 md:pb-0">
        {/* === TAB BAR === */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-0">
          <div className="flex items-center gap-0.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'kelola', label: 'Guru & Halaqoh', icon: Users },
              { id: 'mutasi', label: 'Mutasi Siswa', icon: ArrowUpDown },
              { id: 'tahun', label: 'Tahun Ajaran', icon: Layers },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-black whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all ${
                  activeTab === tab.id ? 'bg-emerald-500' : 'bg-transparent'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'mutasi' && (<>
        {/* Stats Summary */}
        <div className="mb-3 sm:mb-4 grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Aktif', value: activeCount, icon: Users, tone: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
            { label: 'Belum Halaqoh', value: unassignedCount, icon: Layers, tone: 'text-cyan-600 bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300' },
            { label: 'Halaqoh', value: actualHalaqohGroups.length, icon: ShieldCheck, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300' },
            { label: 'Terpilih', value: selectedIds.length, icon: Check, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' }
          ].map(item => (
            <div key={item.label} className={`rounded-xl border px-2.5 py-2 sm:px-3 sm:py-2.5 ${item.tone}`}>
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">
                <item.icon size={13} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="mt-0.5 text-lg sm:text-xl font-black leading-none">{item.value}</div>
            </div>
          ))}
        </div>
        <div className={`relative md:sticky md:top-0 z-20 md:z-30 -mx-3 sm:mx-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md px-3 sm:px-0 py-2 sm:py-3 ${mobileFiltersOpen ? 'mb-5' : 'mb-3 sm:mb-4'}`}>
          <div className="md:hidden flex flex-col gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari siswa..."
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-9 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <X size={15} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(prev => !prev)}
                className={`h-11 rounded-xl border px-3 flex items-center justify-center gap-1.5 text-xs font-black shadow-sm transition-colors ${mobileFiltersOpen ? 'border-emerald-300 bg-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <SlidersHorizontal size={15} />
                Filter
              </button>
            </div>

            {(kelasFilter || teacherFilter || groupSearch || masterSearch || masterKelasFilter || statusFilter !== 'active') && !mobileFiltersOpen && (
              <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                {groupSearch && <span className="shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[9px] font-black text-slate-500 dark:text-slate-300">Halaqoh: {groupSearch}</span>}
                {kelasFilter && <span className="shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2 py-1 text-[9px] font-black text-blue-600 dark:text-blue-300">{kelasFilter}</span>}
                {masterSearch && <span className="shrink-0 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 text-[9px] font-black text-cyan-700 dark:text-cyan-300">Master: {masterSearch}</span>}
                {masterKelasFilter && <span className="shrink-0 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 px-2 py-1 text-[9px] font-black text-cyan-700 dark:text-cyan-300">Master Kelas {masterKelasFilter}</span>}
                {teacherFilter && <span className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-600 dark:text-emerald-300">{getTeacherDisplayName?.(teacherFilter) || teacherFilter}</span>}
                {statusFilter !== 'active' && <span className="shrink-0 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-600 dark:text-amber-300">{statusFilter === 'inactive' ? 'Nonaktif' : 'Semua'}</span>}
              </div>
            )}

            {mobileFiltersOpen && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Cari halaqoh..."
                      className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-9 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                    {groupSearch && (
                      <button type="button" onClick={() => setGroupSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="min-w-0 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-black text-slate-600 dark:text-slate-200 outline-none focus:border-emerald-400">
                      <option value="">Semua Kelas</option>
                      {kelasList.map(kelas => <option key={kelas} value={kelas}>{kelas}</option>)}
                    </select>
                    <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="min-w-0 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-black text-slate-600 dark:text-slate-200 outline-none focus:border-emerald-400">
                      <option value="">Semua Pengajar</option>
                      {availableTeacherFilters.map(teacher => <option key={teacher} value={teacher}>{getTeacherDisplayName?.(teacher) || teacher}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-500/10 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Filter Master Siswa</span>
                      {(masterSearch || masterKelasFilter) && (
                        <button type="button" onClick={clearMasterFilters} className="text-[9px] font-black text-cyan-700 dark:text-cyan-300 underline underline-offset-2">
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
                        <input
                          value={masterSearch}
                          onChange={(e) => setMasterSearch(e.target.value)}
                          placeholder="Cari siswa di master..."
                          className="w-full h-10 rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-white dark:bg-slate-800 pl-9 pr-9 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                        {masterSearch && (
                          <button type="button" onClick={() => setMasterSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      <select value={masterKelasFilter} onChange={(e) => setMasterKelasFilter(e.target.value)} className="h-10 rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-white dark:bg-slate-800 px-3 text-xs font-black text-slate-600 dark:text-slate-200 outline-none focus:border-cyan-400">
                        <option value="">Semua Kelas Master</option>
                        {kelasList.map(kelas => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                    {[
                      { value: 'active', label: 'Aktif' },
                      { value: 'inactive', label: 'Nonaktif' },
                      { value: 'all', label: 'Semua' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => { setStatusFilter(option.value); setSelectedIds([]); }}
                        className={`rounded-lg px-2 py-2 text-[10px] font-black transition-all ${statusFilter === option.value ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={() => setTeacherFilter('')}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black transition-all ${!teacherFilter ? 'border-emerald-300 bg-emerald-500 text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}
                    >
                      Semua ({actualHalaqohGroups.length})
                    </button>
                    {teacherStats.map(item => (
                      <button
                        key={item.teacher}
                        type="button"
                        onClick={() => setTeacherFilter(item.teacher)}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-all ${teacherFilter === item.teacher ? 'border-emerald-300 bg-emerald-500 text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                      >
                        <span className="block max-w-[120px] truncate text-[10px] font-black leading-tight">{getTeacherDisplayName?.(item.teacher) || item.teacher}</span>
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-70 leading-tight">{item.groupCount} h - {item.studentCount} s</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={clearSelection} disabled={selectedIds.length === 0} className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-xs font-black text-slate-500 dark:text-slate-300 disabled:opacity-40">
                    Bersihkan Pilihan
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:grid grid-cols-1 md:grid-cols-[minmax(190px,1fr)_minmax(170px,0.8fr)_150px_180px_190px_auto] gap-2">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siswa..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-9 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Cari halaqoh..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-9 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              {groupSearch && (
                <button type="button" onClick={() => setGroupSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <X size={15} />
                </button>
              )}
            </div>
            <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-200 outline-none focus:border-emerald-400">
              <option value="">Semua Kelas</option>
              {kelasList.map(kelas => <option key={kelas} value={kelas}>{kelas}</option>)}
            </select>
            <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-200 outline-none focus:border-emerald-400">
              <option value="">Semua Pengajar</option>
              {availableTeacherFilters.map(teacher => <option key={teacher} value={teacher}>{getTeacherDisplayName?.(teacher) || teacher}</option>)}
            </select>
            <div className="grid grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              {[
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Nonaktif' },
                { value: 'all', label: 'Semua' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { setStatusFilter(option.value); setSelectedIds([]); }}
                  className={`rounded-lg px-2 py-1.5 text-[10px] sm:text-xs font-black transition-all ${statusFilter === option.value ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
              {option.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={clearSelection} disabled={selectedIds.length === 0} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-500 dark:text-slate-300 disabled:opacity-40">
              Bersihkan
            </button>
          </div>

          <div className="hidden md:flex mt-2 -mx-1 gap-2 overflow-x-auto custom-scrollbar px-1 pb-1">
            <button
              type="button"
              onClick={() => setTeacherFilter('')}
              className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] sm:text-xs font-black transition-all ${!teacherFilter ? 'border-emerald-300 bg-emerald-500 text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}
            >
              Semua Halaqoh <span className="opacity-80">({actualHalaqohGroups.length})</span>
            </button>
            {teacherStats.map(item => (
              <button
                key={item.teacher}
                type="button"
                onClick={() => setTeacherFilter(item.teacher)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-all ${teacherFilter === item.teacher ? 'border-emerald-300 bg-emerald-500 text-white shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <span className="block max-w-[150px] truncate text-[10px] sm:text-xs font-black leading-tight">{getTeacherDisplayName?.(item.teacher) || item.teacher}</span>
                <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-70 leading-tight">{item.groupCount} halaqoh - {item.studentCount} siswa</span>
              </button>
            ))}
          </div>

          <div className="hidden md:grid mt-2 grid-cols-[160px_minmax(220px,1fr)_180px_auto] items-center gap-2 rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-cyan-50/70 dark:bg-cyan-500/10 p-2">
            <div className="px-2 text-[10px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
              Filter Master Siswa
            </div>
            <div className="relative min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" />
              <input
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="Cari siswa yang belum punya halaqoh..."
                className="w-full rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-white dark:bg-slate-800 pl-9 pr-9 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              {masterSearch && (
                <button type="button" onClick={() => setMasterSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <X size={15} />
                </button>
              )}
            </div>
            <select value={masterKelasFilter} onChange={(e) => setMasterKelasFilter(e.target.value)} className="rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-200 outline-none focus:border-cyan-400">
              <option value="">Semua Kelas Master</option>
              {kelasList.map(kelas => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
            </select>
            <button
              type="button"
              onClick={clearMasterFilters}
              disabled={!masterSearch && !masterKelasFilter}
              className="rounded-xl border border-cyan-100 dark:border-cyan-500/20 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-black text-cyan-700 dark:text-cyan-300 disabled:opacity-40"
            >
              Reset
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-2">
              <span className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-2 py-1 text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-200">
                {selectedIds.length} terpilih
              </span>
              <select
                value={bulkTarget}
                onChange={(e) => setBulkTarget(e.target.value)}
                className="min-w-0 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-slate-800 px-2 py-2 text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-100 outline-none"
                disabled={statusFilter !== 'active'}
              >
                <option value="">Pilih tujuan</option>
                {halaqohGroups.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.value === UNASSIGNED ? 'Kembalikan ke Bank Data' : `${group.label} - ${getTeacherDisplayName?.(group.teacher) || group.teacher}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => finishMove(bulkTarget, selectedIds)}
                disabled={!bulkTarget || statusFilter !== 'active'}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
              >
                Pindahkan
              </button>
              <button
                type="button"
                onClick={returnSelectedToBankData}
                disabled={statusFilter !== 'active'}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
              >
                Ke Bank Data
              </button>
              <div className="grid grid-cols-3 gap-1.5 md:w-[260px]">
                <button
                  type="button"
                  onClick={() => finishSetStudentStatus('pindah')}
                  disabled={statusFilter !== 'active'}
                  className="rounded-lg bg-amber-500 px-2 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
                >
                  Pindah
                </button>
                <button
                  type="button"
                  onClick={() => finishSetStudentStatus('selesai')}
                  disabled={statusFilter !== 'active'}
                  className="rounded-lg bg-slate-700 px-2 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
                >
                  Selesai
                </button>
                <button
                  type="button"
                  onClick={() => finishSetStudentStatus('active')}
                  disabled={statusFilter === 'active'}
                  className="rounded-lg bg-blue-600 px-2 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
                >
                  Aktifkan
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-visible md:overflow-x-auto custom-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 scroll-mt-4">
          <div className="grid grid-cols-1 md:flex md:items-start gap-3 sm:gap-4 md:min-w-max">
            {visibleGroups.map(group => (
              <div key={group.value} className="md:w-[290px] md:shrink-0">
                <HalaqohColumn
                  group={group}
                  students={studentsByHalaqoh[group.value] || []}
                  progressMap={progressMap}
                  selectedIds={selectedIds}
                  draggingIds={draggingIds}
                  dragOver={dragOverHalaqoh === group.value}
                  onToggle={toggleSelected}
                  onToggleAll={toggleAllInColumn}
                  onDragStart={handleDragStart}
                  onDragEnd={() => { setDraggingIds([]); setDragOverHalaqoh(''); }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  getTeacherDisplayName={getTeacherDisplayName}
                />
              </div>
            ))}
          </div>
        </div>
        </>)}

        {activeTab === 'tahun' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Unlink2 size={28} />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">Tahun Ajaran Baru</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">
              Lepaskan semua siswa dari halaqoh untuk memulai tahun ajaran baru. Siswa akan masuk ke pool master dan bisa dibagi ulang.
            </p>
            <button
              type="button"
              onClick={onStartNewSchoolYear}
              disabled={!onStartNewSchoolYear || activeCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-40 transition-all"
            >
              <Unlink2 size={18} /> Mulai Tahun Ajaran Baru
            </button>
            <p className="mt-3 text-xs text-slate-400">{activeCount} siswa aktif saat ini</p>
          </div>
        )}

        {activeTab === 'kelola' && (
          <div className="space-y-6">
            {pendingUsers.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4">
                <h3 className="font-black text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2"><UserCheck size={18} /> Persetujuan Menunggu ({pendingUsers.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {pendingUsers.map(pendingUser => (
                    <div key={pendingUser.id} className="bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-slate-100 truncate">{pendingUser.name}</p>
                        <p className="text-xs font-bold text-orange-600/80 dark:text-orange-300 truncate">@{pendingUser.username}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:w-auto w-full">
                        <button onClick={() => handleApprovePendingUser(pendingUser)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Terima</button>
                        <button onClick={() => handleRejectPendingUser(pendingUser.id)} className="bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-500/20 font-bold px-3 py-2.5 rounded-xl text-xs hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all flex items-center justify-center gap-1.5"><X size={14} /> Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
              <div className="xl:col-span-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col xl:sticky xl:top-4 max-h-[520px]">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl"><ShieldCheck size={20} /></div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 leading-tight">Akses Pengguna</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kelola akun login</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/60 dark:bg-slate-900/60">
                    {appUsers.map(user => (
                      <div key={user.id} className={`bg-white dark:bg-slate-800 border ${user.status === 'pending' ? 'border-orange-200 dark:border-orange-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-2xl p-4 transition-all hover:border-indigo-300 hover:shadow-sm`}>
                        {editingAccount?.id === user.id ? (
                          <div className="space-y-3 animate-in fade-in duration-300">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Nama Lengkap</label>
                              <input type="text" value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Username Login</label>
                              <input type="text" value={editingAccount.username} onChange={e => setEditingAccount({ ...editingAccount, username: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Password Baru</label>
                              <input type="text" value={editingAccount.password} onChange={e => setEditingAccount({ ...editingAccount, password: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" placeholder="Kosongkan jika tak diubah" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase">Role Akses</label>
                              <select value={editingAccount.role || 'guru'} onChange={e => setEditingAccount({ ...editingAccount, role: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-900 dark:text-slate-100">
                                <option value="guru">Guru (Pengajar)</option>
                                <option value="superadmin">Super Admin (Akses Penuh)</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button onClick={handleSaveAccount} className="bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors">Simpan</button>
                              <button onClick={() => setEditingAccount(null)} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                                <span className="truncate">{user.name}</span>
                                {user.role === 'superadmin' && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black shrink-0 flex items-center gap-0.5"><Shield size={8} /> ADMIN</span>}
                                {user.status === 'pending' && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black shrink-0">PENDING</span>}
                                {user.resetrequested && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse shrink-0">RESET</span>}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase truncate">@{user.username} {user.role !== 'superadmin' ? `/ ${user.role}` : ''}</p>
                            </div>
                            <button onClick={() => handleStartEditAccount(user)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all shrink-0" title="Edit akun"><Edit3 size={16} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-500/10">
                    {!isCreatingSuperAdmin ? (
                      <button onClick={() => setIsCreatingSuperAdmin(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><Shield size={14} /> Buat Akun Super Admin</button>
                    ) : (
                      <div className="space-y-2.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 mb-1"><ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" /><span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Buat Super Admin Baru</span></div>
                        <input type="text" placeholder="Nama lengkap..." value={newSuperAdmin.name} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, name: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                        <input type="text" placeholder="Username login..." value={newSuperAdmin.username} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, username: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                        <input type="text" placeholder="Password (min. 8 karakter)..." value={newSuperAdmin.password} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, password: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button onClick={async () => { if (!newSuperAdmin.name || !newSuperAdmin.username || !newSuperAdmin.password) { showToast('Lengkapi semua data!'); return; } if (newSuperAdmin.password.length < 8) { showToast('Password minimal 8 karakter!'); return; } await handleCreateSuperAdmin(newSuperAdmin, () => { setNewSuperAdmin({ name: '', username: '', password: '' }); setIsCreatingSuperAdmin(false); }); }} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"><Shield size={12} /> Buat Akun</button>
                          <button onClick={() => { setIsCreatingSuperAdmin(false); setNewSuperAdmin({ name: '', username: '', password: '' }); }} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <FieldLabel>Tambah Guru Baru</FieldLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-2">
                          <input type="text" list="approved-gurus-kelola" placeholder="Nama lengkap..." value={newGuruName} onChange={e => setNewGuruName(e.target.value)} className="flex-1 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors text-slate-900 dark:text-slate-100" />
                          <button onClick={handleAddGuru} className="bg-slate-900 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors text-white py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest w-full active:scale-95 flex items-center justify-center gap-2"><UserPlus size={16} /> Tambah</button>
                          <datalist id="approved-gurus-kelola">{appUsers.filter(u => (u.status === 'active' || u.role === 'superadmin') && !guruList.includes(u.name)).map(u => <option key={u.id} value={u.name}>{u.username}</option>)}</datalist>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <FieldLabel>Assign Halaqoh ke Guru</FieldLabel>
                        <div className="space-y-2">
                          <SelectShell className="w-full">
                            <select value={selectedGuruForHalaqoh} onChange={e => setSelectedGuruForHalaqoh(e.target.value)} className="w-full h-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-4 pr-10 py-3 text-xs font-bold outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-slate-100">
                              <option value="">Pilih guru...</option>
                              {guruList.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </SelectShell>
                          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_80px_100px] gap-2">
                            <input type="text" placeholder="Nama halaqoh..." value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="min-w-0 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-slate-100" />
                            <SelectShell className="min-w-0">
                              <select value={newHalaqohSesi || ''} onChange={e => setNewHalaqohSesi(e.target.value)} className="min-w-0 w-full h-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-slate-100 appearance-none cursor-pointer">
                                <option value="">Sesi</option>
                                {HALAQOH_SESSION_OPTIONS.map(sesi => <option key={sesi} value={sesi}>Sesi {sesi}</option>)}
                              </select>
                            </SelectShell>
                            <button onClick={handleAddHalaqoh} disabled={!selectedGuruForHalaqoh} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl disabled:bg-slate-200 dark:disabled:bg-slate-600 transition-colors w-full flex justify-center items-center font-bold text-xs uppercase tracking-widest active:scale-95"><Plus size={16} /> Tambah</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto custom-scrollbar" onTouchMove={handleTouchMoveGuru} onTouchEnd={handleTouchEndGuru}>
                    <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row gap-2 mb-1">
                      {guruList.length > 1 && (
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="text" placeholder="Cari nama pengajar..." value={localGuruSearch} onChange={(e) => setLocalGuruSearch(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 shadow-sm" />
                        </div>
                      )}
                      {inactiveGuruList.length > 0 && (
                        <button onClick={() => setShowInactiveGuru(!showInactiveGuru)} className={`shrink-0 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showInactiveGuru ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>
                          <UserX size={15} /> {showInactiveGuru ? 'Sembunyikan Nonaktif' : `Nonaktif (${inactiveGuruList.length})`}
                        </button>
                      )}
                    </div>
                    {displayedGuruList.map(guru => {
                      const guruDataKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === guru.trim().toLowerCase());
                      const halaqohsForGuru = guruDataKey ? guruHalaqohData[guruDataKey] : [];
                      const linkedUser = appUsers.find(u => u.name?.trim().toLowerCase() === guru.trim().toLowerCase());
                      const isInactive = inactiveGuruList.includes(guru);
                      return (
                        <div key={guru} data-guru-card-id={guru} draggable={!guruSearch && !editingGuru && !isInactive} onDragStart={(e) => handleDragStartGuru(e, guru)} onDragOver={(e) => handleDragOverGuru(e, guru)} onDrop={(e) => handleDropGuru(e, guru)} onDragEnd={handleDragEndGuru} className={`bg-white dark:bg-slate-800 border ${isInactive ? 'border-slate-300 dark:border-slate-600 opacity-75' : dragOverGuruId === guru ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10 shadow-md scale-[1.02] z-10' : 'border-slate-200 dark:border-slate-700'} rounded-2xl p-4 shadow-sm transition-all hover:shadow-md group/card flex flex-col ${dragGuruId === guru ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                          <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                            {editingGuru?.oldName === guru ? (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                                <input type="text" autoFocus value={editingGuru.newName} onChange={e => setEditingGuru({ ...editingGuru, newName: e.target.value })} className="flex-1 w-full bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                                <div className="grid grid-cols-2 sm:flex gap-2">
                                  <button onClick={handleSaveEditGuru} className="p-2.5 sm:px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex justify-center items-center gap-1.5 font-bold text-xs"><Save size={16} /> Simpan</button>
                                  <button onClick={() => setEditingGuru(null)} className="p-2.5 sm:px-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex justify-center items-center gap-1.5 font-bold text-xs"><X size={16} /> Batal</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3 min-w-0">
                                  {!guruSearch && (<div className="text-slate-300 group-hover/card:text-slate-400 cursor-grab touch-none flex items-center shrink-0 -ml-1 mr-1" onTouchStart={(e) => handleTouchStartGuru(e, guru)}><GripVertical size={16} /></div>)}
                                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0"><User size={19} /></div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-black text-base truncate tracking-tight ${isInactive ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{guru}</h4>
                                      {isInactive && <span className="shrink-0 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-red-200 dark:border-red-500/20">Nonaktif</span>}
                                    </div>
                                    {linkedUser ? (
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> @{linkedUser.username}</p>
                                    ) : (
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <X size={10} className="text-orange-500 shrink-0" />
                                        <select value="" onChange={(e) => { if (e.target.value) handleLinkAccount(guru, e.target.value); }} className="text-[10px] bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-300 rounded-md px-1.5 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-orange-500 max-w-[140px] truncate">
                                          <option value="">Pilih Akun Guru...</option>
                                          {appUsers.filter(u => (u.status === 'active' || u.role === 'superadmin') && !guruList.includes(u.name)).map(u => (<option key={u.id} value={u.id}>@{u.username} ({u.name})</option>))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity shrink-0">
                                  {isInactive ? (
                                    <>
                                      <button onClick={() => handleReactivateGuru(guru)} className="p-2.5 bg-white dark:bg-slate-700 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 rounded-xl transition-all" title="Aktifkan kembali"><RotateCcw size={16} /></button>
                                      <button onClick={() => requestDeleteGuru(guru)} className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 rounded-xl transition-all" title="Hapus guru"><Trash2 size={16} /></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => setEditingGuru({ oldName: guru, newName: guru })} className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 rounded-xl transition-all" title="Edit nama guru"><Edit3 size={16} /></button>
                                      <button onClick={() => setDeactivatingGuru({ name: guru, reassignTo: '' })} className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/20 rounded-xl transition-all" title="Nonaktifkan guru"><UserX size={16} /></button>
                                      <button onClick={() => requestDeleteGuru(guru)} className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 rounded-xl transition-all" title="Hapus guru"><Trash2 size={16} /></button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {/* Deactivation confirm panel */}
                          {deactivatingGuru?.name === guru && (
                            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl animate-in zoom-in-95 duration-200">
                              <div className="flex items-start gap-2 mb-2">
                                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">Nonaktifkan {guru}?</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Akun login guru ini akan dinonaktifkan. Data halaqoh tetap tersimpan.</p>
                                </div>
                              </div>
                              {halaqohsForGuru.length > 0 && (
                                <div className="mb-2">
                                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pindahkan halaqoh ke (opsional)</label>
                                  <select value={deactivatingGuru.reassignTo || ''} onChange={e => setDeactivatingGuru({ ...deactivatingGuru, reassignTo: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-slate-100 cursor-pointer">
                                    <option value="">Jangan pindahkan</option>
                                    {activeGuruList.filter(g => g !== guru).map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button onClick={async () => { await handleDeactivateGuru(guru, deactivatingGuru.reassignTo || null); setDeactivatingGuru(null); }} className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5"><UserX size={13} /> Ya, Nonaktifkan</button>
                                <button onClick={() => setDeactivatingGuru(null)} className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-600 transition-all active:scale-95">Batal</button>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-3 flex-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FolderPlus size={12} /> Daftar Halaqoh</span>
                            <div className="flex flex-wrap gap-2.5" onTouchMove={(e) => handleTouchMoveHalaqoh(e, guruDataKey || guru)} onTouchEnd={handleTouchEndHalaqoh}>
                              {(halaqohsForGuru || []).map(halaqoh => (
                                <React.Fragment key={halaqoh}>
                                  {editingHalaqoh?.oldName === halaqoh && editingHalaqoh?.guruName === guru ? (
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-1.5 rounded-xl flex items-center gap-1.5 shadow-sm w-full sm:w-auto">
                                      <input type="text" autoFocus value={editingHalaqoh.newName} onChange={e => setEditingHalaqoh({ ...editingHalaqoh, newName: e.target.value })} className="flex-1 sm:w-32 bg-white dark:bg-slate-700 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100" />
                                      <SelectShell className="w-24 shrink-0">
                                        <select value={editingHalaqoh.newSesi || ''} onChange={e => setEditingHalaqoh({ ...editingHalaqoh, newSesi: e.target.value })} className="w-full bg-white dark:bg-slate-700 border border-indigo-100 dark:border-indigo-500/20 rounded-lg pl-2.5 pr-7 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer">
                                          <option value="">Sesi</option>
                                          {HALAQOH_SESSION_OPTIONS.map(sesi => <option key={sesi} value={sesi}>Sesi {sesi}</option>)}
                                        </select>
                                      </SelectShell>
                                      <button onClick={handleSaveEditHalaqoh} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Save size={14} /></button>
                                      <button onClick={() => setEditingHalaqoh(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 bg-white dark:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <div data-halaqoh-id={halaqoh} data-guru-id={guruDataKey || guru} draggable onDragStart={(e) => handleDragStartHalaqoh(e, guruDataKey || guru, halaqoh)} onDragOver={(e) => handleDragOverHalaqoh(e, guruDataKey || guru, halaqoh)} onDrop={(e) => handleDropHalaqoh(e, guruDataKey || guru, halaqoh)} onDragEnd={handleDragEndHalaqoh} className={`bg-slate-50 dark:bg-slate-700 border ${dragOverHalaqohInfo?.halaqoh === halaqoh && dragOverHalaqohInfo?.guru === (guruDataKey || guru) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md scale-105' : 'border-slate-200 dark:border-slate-600'} pl-2 pr-1.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-1.5 transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-800 dark:hover:text-indigo-300 hover:shadow-sm group/badge cursor-grab active:cursor-grabbing max-w-full ${dragHalaqohInfo?.halaqoh === halaqoh && dragHalaqohInfo?.guru === (guruDataKey || guru) ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                      <div className="text-slate-300 group-hover/badge:text-slate-400 cursor-grab touch-none flex items-center shrink-0" onTouchStart={(e) => handleTouchStartHalaqoh(e, guruDataKey || guru, halaqoh)}><GripVertical size={14} /></div>
                                      <span className="truncate py-0.5 select-none min-w-0">{halaqoh}</span>
                                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/badge:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shrink-0 ml-1.5">
                                        <button onClick={() => { const m = halaqoh.match(/^(.+)\s\(Sesi\s+(.+)\)$/); setEditingHalaqoh({ guruName: guru, oldName: halaqoh, newName: m ? m[1].trim() : halaqoh, newSesi: m ? m[2].trim() : '' }); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 rounded-md transition-colors" title="Edit halaqoh"><Edit3 size={14} /></button>
                                        <button onClick={() => requestDeleteHalaqoh(guru, halaqoh)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Hapus halaqoh"><X size={14} /></button>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              ))}
                              {(!halaqohsForGuru || halaqohsForGuru.length === 0) && (<div className="w-full text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600"><p className="text-xs text-slate-400 font-bold">Belum ada kelompok halaqoh.</p></div>)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredGuruList.length === 0 && guruList.length > 0 && (<div className="col-span-1 lg:col-span-2 text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600"><p className="text-xs text-slate-400 font-bold">Pengajar tidak ditemukan.</p></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KelolaView;
