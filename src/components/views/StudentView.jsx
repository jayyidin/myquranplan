// File: src/components/views/StudentView.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, Settings, Plus, Edit3, Trash2, Camera, GripVertical, Search, X, ChevronUp, ChevronDown, ArrowUp, User, Save, FolderPlus, Database, Download, Printer, List, LayoutGrid, ArrowUpDown, ClipboardCheck, BarChart3, AlertTriangle, ArrowRightLeft } from 'lucide-react';

// Helper: normalize gender
const normalizeGender = (value) => {
  const text = String(value || '').trim().toUpperCase();
  if (!text) return 'L';
  if (text === 'P' || text.includes('PEREMPUAN') || text.includes('PUTRI') || text.includes('AKHWAT') || text.includes('WANITA')) return 'P';
  return 'L';
};

// Helper: check for near-duplicate names
const findDuplicates = (student, allStudents) => {
  if (!allStudents || !student?.name) return [];
  const name = student.name.trim().toLowerCase();
  return allStudents.filter(s => s.id !== student.id && s.name.trim().toLowerCase() === name);
};

const getStudentNameClass = (name) => {
  const length = String(name || '').trim().length;
  if (length > 38) return 'text-[11px] sm:text-sm md:text-base';
  if (length > 28) return 'text-xs sm:text-sm md:text-base';
  if (length > 20) return 'text-[13px] sm:text-base md:text-lg';
  return 'text-sm sm:text-base md:text-lg';
};

const HALAQOH_SESSION_OPTIONS = ['1', '2', '3'];

// --- STATS BAR ---
const StatsBar = ({ students }) => {
  const stats = useMemo(() => {
    const total = students.length;
    const male = students.filter(s => normalizeGender(s.gender || s.jenis_kelamin) === 'L').length;
    const female = total - male;
    const classes = [...new Set(students.map(s => s.kelas).filter(Boolean))].length;
    const halaqohs = [...new Set(students.map(s => s.halaqoh).filter(Boolean))].length;
    return { total, male, female, classes, halaqohs };
  }, [students]);

  return (
    <div className="flex sm:grid sm:grid-cols-5 gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1 print:hidden">
      {[
        { label: 'Total', value: stats.total, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
        { label: 'Laki-laki', value: stats.male, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
        { label: 'Perempuan', value: stats.female, bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
        { label: 'Kelas', value: stats.classes, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
        { label: 'Halaqoh', value: stats.halaqohs, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
      ].map(s => (
        <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2.5 sm:p-3 min-w-[88px] sm:min-w-0 flex flex-col items-center text-center shadow-sm animate-student-card`}>
          <span className={`text-lg sm:text-xl font-black leading-none ${s.text}`}>{s.value}</span>
          <span className="mt-1 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 truncate max-w-full">{s.label}</span>
        </div>
      ))}
    </div>
  );
};

// --- HALAQOH MANAGEMENT SECTION (for teachers) ---
const HalaqohSection = ({
  newHalaqohName, setNewHalaqohName, newHalaqohSesi, setNewHalaqohSesi, handleAddHalaqoh,
  guruHalaqohData, currentUser, editingHalaqoh, setEditingHalaqoh,
  handleSaveEditHalaqoh, requestDeleteHalaqoh, handleReorderHalaqoh
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [dragHalaqohInfo, setDragHalaqohInfo] = useState(null);
  const [dragOverHalaqohInfo, setDragOverHalaqohInfo] = useState(null);
  const guruName = currentUser?.name?.trim() || '';
  const guruDataKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === guruName.toLowerCase());
  const halaqohsForGuru = guruDataKey ? (guruHalaqohData[guruDataKey] || []) : [];

  const handleDragStart = (e, halaqoh) => { setDragHalaqohInfo({ guru: guruDataKey || guruName, halaqoh }); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `${guruDataKey || guruName}|${halaqoh}`); };
  const handleDragOver = (e, halaqoh) => { e.preventDefault(); if (dragHalaqohInfo?.guru === (guruDataKey || guruName) && dragOverHalaqohInfo?.halaqoh !== halaqoh) setDragOverHalaqohInfo({ guru: guruDataKey || guruName, halaqoh }); };
  const handleDrop = (e, targetHalaqoh) => { e.preventDefault(); if (!dragHalaqohInfo || dragHalaqohInfo.guru !== (guruDataKey || guruName) || dragHalaqohInfo.halaqoh === targetHalaqoh) { setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); return; } const halaqohs = guruHalaqohData[guruDataKey || guruName] || []; const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh); const targetIdx = halaqohs.indexOf(targetHalaqoh); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...halaqohs]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderHalaqoh) handleReorderHalaqoh(guruDataKey || guruName, newList); } setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };
  const handleDragEnd = () => { setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };
  const handleTouchStart = (e, halaqoh) => { setDragHalaqohInfo({ guru: guruDataKey || guruName, halaqoh }); };
  const handleTouchMove = (e) => { if (!dragHalaqohInfo) return; const touch = e.touches[0]; const target = document.elementFromPoint(touch.clientX, touch.clientY); const card = target?.closest('[data-halaqoh-id]'); if (card) { const hoverId = card.getAttribute('data-halaqoh-id'); const hoverGuru = card.getAttribute('data-guru-id'); if (hoverGuru === (guruDataKey || guruName) && hoverId !== dragOverHalaqohInfo?.halaqoh) setDragOverHalaqohInfo({ guru: hoverGuru, halaqoh: hoverId }); } };
  const handleTouchEnd = () => { if (dragHalaqohInfo && dragOverHalaqohInfo && dragHalaqohInfo.guru === dragOverHalaqohInfo.guru && dragHalaqohInfo.halaqoh !== dragOverHalaqohInfo.halaqoh) { const halaqohs = guruHalaqohData[guruDataKey || guruName] || []; const draggedIdx = halaqohs.indexOf(dragHalaqohInfo.halaqoh); const targetIdx = halaqohs.indexOf(dragOverHalaqohInfo.halaqoh); if (draggedIdx !== -1 && targetIdx !== -1) { const newList = [...halaqohs]; const [draggedItem] = newList.splice(draggedIdx, 1); newList.splice(targetIdx, 0, draggedItem); if (handleReorderHalaqoh) handleReorderHalaqoh(guruDataKey || guruName, newList); } } setDragHalaqohInfo(null); setDragOverHalaqohInfo(null); };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4 print:hidden">
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2.5"><span className="w-1.5 h-5 rounded-full bg-indigo-500" /><h2 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.18em]">Kelola Halaqoh</h2><span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{halaqohsForGuru.length}</span></div>
        {isCollapsed ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
      </button>
      {!isCollapsed && (
      <>
      <div className="p-4 sm:p-5 bg-white border-b border-slate-100">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tambah Halaqoh Baru</label>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-2">
            <input type="text" placeholder="Nama kelompok..." value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="min-w-0 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            <div className="relative min-w-0">
              <select value={newHalaqohSesi || ''} onChange={e => setNewHalaqohSesi(e.target.value)} className="min-w-0 w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer">
                <option value="">Sesi</option>
                {HALAQOH_SESSION_OPTIONS.map(sesi => <option key={sesi} value={sesi}>Sesi {sesi}</option>)}
              </select>
              <ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={handleAddHalaqoh} disabled={!newHalaqohName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:bg-slate-200 w-full transition-colors flex justify-center items-center gap-2 active:scale-95"><Save size={16} /> Simpan</button>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5 bg-slate-50" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="flex flex-wrap gap-2.5">
          {halaqohsForGuru.length > 0 ? halaqohsForGuru.map(halaqoh => (
            <React.Fragment key={halaqoh}>
              {editingHalaqoh?.oldName === halaqoh && editingHalaqoh?.guruName === (guruDataKey || guruName) ? (
                <div className="bg-indigo-50 border border-indigo-200 p-1.5 rounded-xl flex items-center gap-1.5 shadow-sm w-full sm:w-auto">
                  <input type="text" autoFocus value={editingHalaqoh.newName} onChange={e => setEditingHalaqoh({ ...editingHalaqoh, newName: e.target.value })} className="flex-1 sm:w-32 bg-white border border-indigo-100 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                  <div className="relative w-24 shrink-0">
                    <select value={editingHalaqoh.newSesi || ''} onChange={e => setEditingHalaqoh({ ...editingHalaqoh, newSesi: e.target.value })} className="w-full bg-white border border-indigo-100 rounded-lg pl-2.5 pr-7 py-2 text-xs font-bold outline-none appearance-none cursor-pointer">
                      <option value="">Sesi</option>
                      {HALAQOH_SESSION_OPTIONS.map(sesi => <option key={sesi} value={sesi}>Sesi {sesi}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <button onClick={handleSaveEditHalaqoh} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Save size={14} /></button>
                  <button onClick={() => setEditingHalaqoh(null)} className="p-2 text-slate-400 hover:bg-slate-200 bg-white rounded-lg border border-slate-200"><X size={14} /></button>
                </div>
              ) : (
                <div data-halaqoh-id={halaqoh} data-guru-id={guruDataKey || guruName} draggable onDragStart={(e) => handleDragStart(e, halaqoh)} onDragOver={(e) => handleDragOver(e, halaqoh)} onDrop={(e) => handleDrop(e, halaqoh)} onDragEnd={handleDragEnd}
                  className={`bg-slate-50 border ${dragOverHalaqohInfo?.halaqoh === halaqoh && dragOverHalaqohInfo?.guru === (guruDataKey || guruName) ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105' : 'border-slate-200'} pl-2 pr-1.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between gap-1.5 transition-all hover:border-indigo-300 hover:bg-indigo-50 group/badge cursor-grab active:cursor-grabbing max-w-full ${dragHalaqohInfo?.halaqoh === halaqoh ? 'opacity-50 grayscale' : ''}`}>
                  <div className="text-slate-300 group-hover/badge:text-slate-400 cursor-grab touch-none flex items-center shrink-0" onTouchStart={(e) => handleTouchStart(e, halaqoh)}><GripVertical size={14} /></div>
                  <span className="truncate py-0.5 select-none min-w-0">{halaqoh}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/badge:opacity-100 transition-opacity bg-white/80 rounded-lg p-0.5 shrink-0 ml-1.5">
                    <button onClick={() => { const m = halaqoh.match(/^(.+)\s\(Sesi\s+(.+)\)$/); setEditingHalaqoh({ guruName: guruDataKey || guruName, oldName: halaqoh, newName: m ? m[1].trim() : halaqoh, newSesi: m ? m[2].trim() : '' }); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md"><Edit3 size={14} /></button>
                    <button onClick={() => requestDeleteHalaqoh(guruDataKey || guruName, halaqoh)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-md"><X size={14} /></button>
                  </div>
                </div>
              )}
            </React.Fragment>
          )) : (
            <div className="w-full text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300"><p className="text-xs text-slate-400 font-bold">Belum ada kelompok halaqoh.</p></div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
};

// --- STUDENT DATA MANAGEMENT SECTION (for teachers) ---
const StudentDataSection = ({ students, openEditStudentModal, requestDeleteStudent, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents, kelasList, guruHalaqohData, currentUser, showToast }) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [localStudentSearch, setLocalStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('unassigned');
  const [filterKelas, setFilterKelas] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ kelas: '', halaqoh: '', gender: '' });
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([{ name: '', nis: '', kelas: '', halaqoh: '', gender: 'L' }]);
  const bulkTableRef = useRef(null);
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(() => typeof window === 'undefined' ? true : window.innerWidth >= 640);

  useEffect(() => { const timer = setTimeout(() => setStudentSearch(localStudentSearch), 300); return () => clearTimeout(timer); }, [localStudentSearch]);
  useEffect(() => {
    const timer = setTimeout(() => setVisibleCount(20), 0);
    return () => clearTimeout(timer);
  }, [studentSearch, filterStatus, filterKelas]);

  const guruName = currentUser?.name?.trim().toLowerCase() || '';
  const guruKey = Object.keys(guruHalaqohData).find(k => k !== '_order_' && k.trim().toLowerCase() === guruName);
  const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];
  const allHalaqohs = Array.from(new Set(Object.keys(guruHalaqohData).filter(k => k !== '_order_').flatMap(k => guruHalaqohData[k]).filter(Boolean)));

  const filteredStudents = students.filter(s => {
    const halaqoh = (s?.halaqoh || '').trim();
    const isKosong = halaqoh === '' || halaqoh.toLowerCase() === 'unassigned';
    const isMyHalaqoh = myHalaqohs.some(h => h.trim().toLowerCase() === halaqoh.toLowerCase());
    if (!isKosong && !isMyHalaqoh) return false;
    if (filterStatus === 'unassigned' && !isKosong) return false;
    if (filterStatus === 'assigned' && isKosong) return false;
    if (filterKelas && s.kelas !== filterKelas) return false;
    const query = (studentSearch || '').toLowerCase();
    return (s?.name || '').toLowerCase().includes(query) || halaqoh.toLowerCase().includes(query) || (s?.kelas || '').toLowerCase().includes(query) || (s?.nis || '').toLowerCase().includes(query);
  });
  const activeFilterCount = [studentSearch, filterStatus !== 'all' ? filterStatus : '', filterKelas].filter(Boolean).length;
  const displayedStudents = filteredStudents.slice(0, visibleCount);
  const toggleSelectStudent = (id) => setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  const toggleSelectAll = () => { if (selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0) setSelectedStudentIds([]); else setSelectedStudentIds(displayedStudents.map(s => s.id)); };
  const handleBulkDelete = () => requestBulkDeleteStudents(selectedStudentIds, () => { setSelectedStudentIds([]); setIsBulkEditOpen(false); });

  const handleExecuteBulkEdit = () => {
    const updates = {};
    if (bulkEditData.kelas) updates.kelas = bulkEditData.kelas === 'CLEAR_KELAS' ? '' : bulkEditData.kelas;
    if (bulkEditData.halaqoh) updates.halaqoh = bulkEditData.halaqoh === 'CLEAR_HALAQOH' ? '' : bulkEditData.halaqoh;
    if (bulkEditData.gender) updates.gender = bulkEditData.gender === 'CLEAR_GENDER' ? '' : bulkEditData.gender;
    if (Object.keys(updates).length === 0) { showToast('Pilih minimal kelas, halaqoh, atau jenis kelamin baru.'); return; }
    requestBulkEditStudents(selectedStudentIds, updates, () => { setSelectedStudentIds([]); setIsBulkEditOpen(false); setBulkEditData({ kelas: '', halaqoh: '', gender: '' }); });
  };

  const processBulkImport = () => {
    const parsed = bulkRows.filter(r => r.name && r.name.trim() !== '');
    if (parsed.length === 0) { showToast('Data tidak valid! Isi minimal 1 nama.'); return; }
    handleBulkSaveStudents(parsed, () => { setBulkRows([{ name: '', nis: '', kelas: '', halaqoh: '', gender: 'L' }]); setIsBulkImportOpen(false); });
  };

  const updateBulkRow = (index, field, value) => {
    setBulkRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { name: '', nis: '', kelas: '', halaqoh: '', gender: 'L' }]);
  };

  const removeBulkRow = (index) => {
    setBulkRows(prev => prev.length <= 1 ? [{ name: '', nis: '', kelas: '', halaqoh: '', gender: 'L' }] : prev.filter((_, i) => i !== index));
  };

  const handleBulkPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    const parsed = rows.map(row => {
      const cols = row.split('\t');
      return {
        name: (cols[0] || '').trim(),
        nis: (cols[1] || '').trim(),
        kelas: (cols[2] || '').trim(),
        halaqoh: (cols[3] || '').trim(),
        gender: normalizeGender(cols[4] || 'L')
      };
    }).filter(r => r.name);
    if (parsed.length > 0) {
      setBulkRows(prev => {
        const emptyRow = prev.length === 1 && !prev[0].name;
        return emptyRow ? parsed : [...prev, ...parsed];
      });
      showToast(`${parsed.length} baris data ditempel dari clipboard!`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nama Siswa', 'Kelas', 'Halaqoh', 'Jenis Kelamin'];
    const csvContent = [headers.join(','), ...filteredStudents.map(s => `"${s.name}","${s.kelas || ''}","${s.halaqoh || ''}","${normalizeGender(s.gender || s.jenis_kelamin) === 'P' ? 'Perempuan' : 'Laki-laki'}"`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Data_Siswa_${new Date().getTime()}.csv`; link.click();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-2xl shadow-sm overflow-hidden mt-6 animate-student-rise">
      <div className={`p-4 sm:p-5 bg-white/95 backdrop-blur-md sm:sticky sm:top-[60px] md:top-[76px] z-20 ${isDataSectionOpen ? 'border-b border-slate-100' : ''}`}>
        <button type="button" onClick={() => setIsDataSectionOpen(prev => !prev)} className="w-full flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-1.5 h-9 rounded-full bg-gradient-to-b from-purple-500 to-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-[13px] sm:text-sm font-black text-slate-600 uppercase tracking-[0.16em] truncate">Bank Data Siswa</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Cari, filter, impor</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{selectedStudentIds.length} dipilih</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden min-[380px]:inline-flex px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-black uppercase tracking-wider">{filteredStudents.length} hasil</span>
            <span className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
              {isDataSectionOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </span>
          </div>
        </button>
        {isDataSectionOpen && (
          <>
            <div className="mt-4 animate-student-rise bg-slate-50/80 border border-slate-200 rounded-[22px] p-3.5 sm:p-4 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'unassigned', label: 'Belum' },
                  { value: 'assigned', label: 'Sudah' },
                  { value: 'all', label: 'Semua' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterStatus(opt.value)}
                    className={`min-h-[42px] rounded-2xl border text-[10px] sm:text-xs font-black uppercase tracking-[0.08em] transition-all active:scale-95 ${filterStatus === opt.value ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari nama, NIS, kelas..." value={localStudentSearch} onChange={(e) => setLocalStudentSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none" />
              </div>
              <div className="relative min-w-0">
                <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-4 pr-10 text-[13px] sm:text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                  <option value="">Semua Kelas</option>
                  {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
                <ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExportCSV} className="min-h-[50px] rounded-2xl flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:scale-95 transition-all text-xs sm:text-sm font-black uppercase tracking-[0.08em]" title="Ekspor">
                  <Download size={18} strokeWidth={3} /> Ekspor
                </button>
                <button onClick={() => setIsBulkImportOpen(!isBulkImportOpen)} className={`min-h-[50px] rounded-2xl flex items-center justify-center gap-2 ${isBulkImportOpen ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-700'} text-white active:scale-95 transition-all shadow-sm text-xs sm:text-sm font-black uppercase tracking-[0.08em]`} title={isBulkImportOpen ? 'Tutup impor' : 'Impor'}>
                  {isBulkImportOpen ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  {isBulkImportOpen ? 'Tutup' : 'Impor'}
                </button>
              </div>
              {(activeFilterCount > 0 || filteredStudents.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200">{filteredStudents.length} hasil</span>
                  {filterStatus !== 'all' && <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white border border-slate-900">{filterStatus === 'unassigned' ? 'Belum halaqoh' : 'Sudah halaqoh'}</span>}
                  {studentSearch && <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">Cari: {studentSearch}</span>}
                  {filterKelas && <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Kelas {filterKelas}</span>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {isDataSectionOpen && (
      <div className="p-3.5 sm:p-5 bg-slate-50">
        {isBulkImportOpen && (
          <div className="mb-4 bg-white border border-purple-100 rounded-[22px] sm:rounded-2xl overflow-hidden shadow-sm shadow-purple-100/40">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Database size={16} className="text-purple-500 shrink-0" /> Impor Data Siswa</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0.5 leading-relaxed">Isi manual atau tempel dari Excel. Urutan: Nama, NIS, Kelas, Halaqoh, L/P.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button onClick={() => { setBulkRows([{ name: '', nis: '', kelas: '', halaqoh: '', gender: 'L' }]); setIsBulkImportOpen(false); }} className="px-3 py-3 sm:py-2 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200 active:scale-95">Batal</button>
                  <button onClick={processBulkImport} className="px-3 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-1.5"><Save size={13} /> Impor {bulkRows.filter(r => r.name).length}</button>
                </div>
              </div>
            </div>

            {/* Paste Zone + Table */}
            <div className="p-3 sm:p-4">
              <div tabIndex={0} onPaste={handleBulkPaste} className="sm:hidden space-y-3 outline-none">
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 px-3 py-2.5 text-[10px] font-bold leading-relaxed text-purple-700">
                  Tempel data dari Excel di area ini, atau isi kartu siswa satu per satu.
                </div>
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Siswa {idx + 1}</span>
                      <button onClick={() => removeBulkRow(idx)} className="w-9 h-9 rounded-xl bg-white border border-red-100 text-red-500 flex items-center justify-center active:scale-95">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => updateBulkRow(idx, 'name', e.target.value)}
                      placeholder="Nama siswa *"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={row.nis}
                        onChange={e => updateBulkRow(idx, 'nis', e.target.value)}
                        placeholder="NIS"
                        className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      />
                      <input
                        type="text"
                        value={row.kelas}
                        onChange={e => updateBulkRow(idx, 'kelas', e.target.value)}
                        placeholder="Kelas"
                        className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_86px] gap-2">
                      <input
                        type="text"
                        value={row.halaqoh}
                        onChange={e => updateBulkRow(idx, 'halaqoh', e.target.value)}
                        placeholder="Halaqoh"
                        className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      />
                      <select
                        value={row.gender}
                        onChange={e => updateBulkRow(idx, 'gender', e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 outline-none appearance-none cursor-pointer focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      >
                        <option value="L">L</option>
                        <option value="P">P</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div
                ref={bulkTableRef}
                tabIndex={0}
                onPaste={handleBulkPaste}
                className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
              >
                {/* Table Header */}
                <div className="grid grid-cols-[40px_1fr_120px_80px_120px_90px_40px] sm:grid-cols-[40px_1fr_140px_100px_140px_100px_44px] bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="p-2 text-center">#</div>
                  <div className="p-2 border-l border-slate-200">Nama Siswa *</div>
                  <div className="p-2 border-l border-slate-200">NIS</div>
                  <div className="p-2 border-l border-slate-200">Kelas</div>
                  <div className="p-2 border-l border-slate-200">Halaqoh</div>
                  <div className="p-2 border-l border-slate-200">L/P</div>
                  <div className="p-2 border-l border-slate-200"></div>
                </div>

                {/* Table Body - scrollable */}
                <div className="max-h-[280px] sm:max-h-[360px] overflow-y-auto custom-scrollbar">
                  {bulkRows.map((row, idx) => (
                    <div key={idx} className={`grid grid-cols-[40px_1fr_120px_80px_120px_90px_40px] sm:grid-cols-[40px_1fr_140px_100px_140px_100px_44px] border-b border-slate-100 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-purple-50/30 transition-colors`}>
                      <div className="p-2 text-center text-[10px] font-black text-slate-300">{idx + 1}</div>
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => updateBulkRow(idx, 'name', e.target.value)}
                        placeholder="Nama siswa..."
                        className="p-2 text-xs font-bold text-slate-800 bg-transparent border-l border-slate-100 outline-none placeholder:text-slate-300 focus:bg-purple-50/40"
                      />
                      <input
                        type="text"
                        value={row.nis}
                        onChange={e => updateBulkRow(idx, 'nis', e.target.value)}
                        placeholder="NIS..."
                        className="p-2 text-xs font-bold text-slate-700 bg-transparent border-l border-slate-100 outline-none placeholder:text-slate-300 focus:bg-purple-50/40"
                      />
                      <input
                        type="text"
                        value={row.kelas}
                        onChange={e => updateBulkRow(idx, 'kelas', e.target.value)}
                        placeholder="1A"
                        className="p-2 text-xs font-bold text-slate-700 bg-transparent border-l border-slate-100 outline-none placeholder:text-slate-300 focus:bg-purple-50/40"
                      />
                      <input
                        type="text"
                        value={row.halaqoh}
                        onChange={e => updateBulkRow(idx, 'halaqoh', e.target.value)}
                        placeholder="Halaqoh..."
                        className="p-2 text-xs font-bold text-slate-700 bg-transparent border-l border-slate-100 outline-none placeholder:text-slate-300 focus:bg-purple-50/40"
                      />
                      <select
                        value={row.gender}
                        onChange={e => updateBulkRow(idx, 'gender', e.target.value)}
                        className="p-2 text-xs font-bold text-slate-700 bg-transparent border-l border-slate-100 outline-none cursor-pointer focus:bg-purple-50/40"
                      >
                        <option value="L">L</option>
                        <option value="P">P</option>
                      </select>
                      <button onClick={() => removeBulkRow(idx)} className="p-2 border-l border-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
                <button onClick={addBulkRow} className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                  <Plus size={14} /> Tambah Baris
                </button>
                <p className="text-[10px] font-bold text-slate-400 text-center sm:text-right">
                  Tip: Buka Excel, copy data siswa, lalu tempel (Ctrl+V) di tabel ini. Urutan kolom: Nama, NIS, Kelas, Halaqoh, L/P
                </p>
              </div>
            </div>
          </div>
        )}
        {displayedStudents.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 p-3 sm:p-4 rounded-[20px] sm:rounded-2xl gap-2.5">
              <label className="flex items-center gap-3 cursor-pointer group min-w-0 py-1"><input type="checkbox" checked={selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0} onChange={toggleSelectAll} className="w-5 h-5 rounded border-slate-300 bg-white text-purple-600 cursor-pointer shrink-0" /><span className="text-[13px] sm:text-sm font-black text-slate-700 truncate">Pilih semua</span></label>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 lg:ml-auto shrink-0 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">{displayedStudents.length} / {filteredStudents.length}</div>
              {selectedStudentIds.length > 0 && (
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button onClick={() => setIsBulkEditOpen(!isBulkEditOpen)} className="flex justify-center items-center gap-1.5 px-3 py-3 sm:py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider"><Edit3 size={15} /> Edit {selectedStudentIds.length}</button>
                  <button onClick={handleBulkDelete} className="flex justify-center items-center gap-1.5 px-3 py-3 sm:py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider"><Trash2 size={15} /> Hapus</button>
                </div>
              )}
            </div>
            {isBulkEditOpen && selectedStudentIds.length > 0 && (
              <div className="p-4 bg-white border border-blue-200 rounded-2xl">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Edit Massal (Kelas / Halaqoh / Jenis Kelamin)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="relative"><select value={bulkEditData.kelas} onChange={e => setBulkEditData({ ...bulkEditData, kelas: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"><option value="">-- Kelas --</option><option value="CLEAR_KELAS">-- Kosongkan Kelas --</option>{kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}</select><ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                  <div className="relative"><select value={bulkEditData.halaqoh} onChange={e => setBulkEditData({ ...bulkEditData, halaqoh: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"><option value="">-- Halaqoh --</option><option value="CLEAR_HALAQOH">-- Kosongkan Halaqoh --</option>{allHalaqohs.map(h => <option key={h} value={h}>{h}</option>)}</select><ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                  <div className="relative"><select value={bulkEditData.gender} onChange={e => setBulkEditData({ ...bulkEditData, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"><option value="">-- Jenis Kelamin --</option><option value="CLEAR_GENDER">-- Kosongkan --</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select><ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <button onClick={() => setIsBulkEditOpen(false)} className="px-4 py-3 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-200">Batal</button>
                  <button onClick={handleExecuteBulkEdit} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95">Simpan Perubahan</button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4 sm:pb-0">
          {displayedStudents.map((s, index) => {
            const g = normalizeGender(s.gender || s.jenis_kelamin);
            const initials = (s?.name || '?')
              .split(' ')
              .filter(Boolean)
              .map(part => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <div key={s.id} className={`bg-white border ${selectedStudentIds.includes(s.id) ? 'border-purple-300 ring-2 ring-purple-100 shadow-sm shadow-purple-100' : 'border-slate-200'} rounded-[22px] sm:rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 hover:border-purple-200 hover:shadow-sm group animate-student-card`} style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}>
                <div className="min-w-0 flex-1 w-full flex items-start gap-3">
                  <input type="checkbox" aria-label={`Pilih ${s.name || 'siswa'}`} checked={selectedStudentIds.includes(s.id)} onChange={() => toggleSelectStudent(s.id)} className="w-5 h-5 mt-1.5 rounded border-slate-300 bg-white text-purple-600 cursor-pointer shrink-0" />
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm shadow-sm border ${g === 'P' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className={`font-black text-slate-900 leading-tight line-clamp-2 whitespace-normal break-words [overflow-wrap:anywhere] ${getStudentNameClass(s.name)}`}>{s.name || 'Tanpa nama'}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex max-w-full bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-black uppercase tracking-[0.08em] px-2 py-1.5 rounded-lg leading-none">
                        {s.halaqoh || 'Belum halaqoh'}
                      </span>
                      <span className="inline-flex bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black uppercase tracking-[0.08em] px-2 py-1.5 rounded-lg leading-none">
                        Kelas {s.kelas || '-'}
                      </span>
                      <span className={`inline-flex text-[9px] font-black uppercase tracking-[0.08em] px-2 py-1.5 rounded-lg border leading-none ${g === 'P' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                        {g === 'P' ? 'Perempuan' : 'Laki-laki'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openEditStudentModal(s)} className="flex justify-center items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-black text-xs active:scale-95 transition-all"><Edit3 size={16} /> Edit</button>
                  <button onClick={() => requestDeleteStudent(s)} className="flex justify-center items-center gap-2 p-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-black text-xs active:scale-95 transition-all"><Trash2 size={16} /> Hapus</button>
                </div>
              </div>
            );
          })}
          {displayedStudents.length === 0 && (<div className="md:col-span-2 xl:col-span-3 py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300"><Database size={42} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500 font-black">Data siswa tidak ditemukan.</p></div>)}
        </div>
        {visibleCount < filteredStudents.length && (<div className="mt-5 flex justify-center"><button onClick={() => setVisibleCount(prev => prev + 20)} className="px-7 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95">Muat {filteredStudents.length - visibleCount} Siswa Lainnya</button></div>)}
      </div>
      )}
    </div>
  );
};

// --- PRINT VIEW ---
const PrintStudentList = ({ students, activeHalaqoh, onClose }) => {
  const printRef = useRef(null);
  useEffect(() => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) { onClose(); return; }
    win.document.write(`<html><head><title>Daftar Siswa - ${activeHalaqoh || 'Semua'}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#222}
      h1{font-size:18px;margin-bottom:4px} h2{font-size:13px;color:#666;font-weight:normal;margin-top:0}
      table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
      th{background:#f0f0f0;font-weight:bold;font-size:11px;text-transform:uppercase} td{font-size:12px}
      .badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:bold}
      .badge-l{background:#e0f2fe;color:#0369a1} .badge-p{background:#fce7f3;color:#be185d}
      @media print{body{padding:0}}
    </style></head><body>`);
    win.document.write(`<h1>Daftar Siswa</h1><h2>Halaqoh: ${activeHalaqoh || 'Semua'} | Total: ${students.length} siswa | Dicetak: ${new Date().toLocaleDateString('id-ID')}</h2>`);
    win.document.write('<table><thead><tr><th>No</th><th>Nama Siswa</th><th>Kelas</th><th>Halaqoh</th><th>JK</th></tr></thead><tbody>');
    students.forEach((s, i) => {
      const g = normalizeGender(s.gender || s.jenis_kelamin);
      win.document.write(`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.kelas||'-'}</td><td>${s.halaqoh||'-'}</td><td><span class="badge ${g==='P'?'badge-p':'badge-l'}">${g==='P'?'P':'L'}</span></td></tr>`);
    });
    win.document.write('</tbody></table></body></html>');
    win.document.close();
    win.print();
    onClose();
  }, []);
  return <div ref={printRef} className="hidden" />;
};


// ===================== MAIN STUDENT VIEW =====================
const StudentView = ({
  activeHalaqoh, filteredStudents, allStudents, setCurrentView,
  openAddStudentModal, openEditStudentModal, requestDeleteStudent, isSuperAdmin,
  requestDeleteStudentPhoto, openCropModal, uploadingPhotoId, uploadProgress, onReorderStudents, searchQuery, setSearchQuery,
  // Teacher halaqoh & student management props
  currentUser, newHalaqohName, setNewHalaqohName, newHalaqohSesi, setNewHalaqohSesi, handleAddHalaqoh,
  guruHalaqohData, editingHalaqoh, setEditingHalaqoh, handleSaveEditHalaqoh,
  requestDeleteHalaqoh, handleReorderHalaqoh,
  students, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents,
  kelasList, showToast
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(window.innerWidth >= 768);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  // New feature states
  const [genderFilter, setGenderFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('default');
  const [isPrinting, setIsPrinting] = useState(false);

  // Debounce search
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  useEffect(() => { const timer = setTimeout(() => { setSearchQuery(localSearch); }, 300); return () => clearTimeout(timer); }, [localSearch, setSearchQuery]);
  useEffect(() => {
    if (searchQuery !== '') return undefined;
    const timer = setTimeout(() => setLocalSearch(''), 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Scroll detection
  useEffect(() => {
    const sc = containerRef.current?.closest('.overflow-y-auto');
    if (!sc) return;
    const handleScroll = () => { setShowScrollTop(sc.scrollTop > 300); };
    sc.addEventListener('scroll', handleScroll);
    return () => sc.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => { const sc = containerRef.current?.closest('.overflow-y-auto'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Apply gender filter + sort to filteredStudents
  const displayStudents = useMemo(() => {
    let result = [...filteredStudents];
    // Gender filter
    if (genderFilter !== 'all') {
      result = result.filter(s => normalizeGender(s.gender || s.jenis_kelamin) === genderFilter);
    }
    // Sort
    if (sortBy === 'name-az') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'name-za') result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (sortBy === 'kelas') result.sort((a, b) => (a.kelas || '').localeCompare(b.kelas || ''));
    else if (sortBy === 'gender') result.sort((a, b) => normalizeGender(a.gender || a.jenis_kelamin).localeCompare(normalizeGender(b.gender || b.jenis_kelamin)));
    return result;
  }, [filteredStudents, genderFilter, sortBy]);

  // Drag handlers
  const handleDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); };
  const handleDragOver = (e, id) => { e.preventDefault(); if (dragOverId !== id) setDragOverId(id); };
  const handleDrop = (e, targetId) => { e.preventDefault(); if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; } const di = displayStudents.findIndex(s => s.id === dragId); const ti = displayStudents.findIndex(s => s.id === targetId); if (di !== -1 && ti !== -1) { const nl = [...displayStudents]; const [d] = nl.splice(di, 1); nl.splice(ti, 0, d); if (onReorderStudents) onReorderStudents(nl); } setDragId(null); setDragOverId(null); };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };
  const handleTouchStart = (e, id) => { setDragId(id); };
  const handleTouchMove = (e) => { if (!dragId) return; const touch = e.touches[0]; const target = document.elementFromPoint(touch.clientX, touch.clientY); const card = target?.closest('[data-student-id]'); if (card) { const hId = card.getAttribute('data-student-id'); if (hId !== dragOverId) setDragOverId(hId); } };
  const handleTouchEnd = () => { if (dragId && dragOverId && dragId !== dragOverId) { const di = displayStudents.findIndex(s => s.id === dragId); const ti = displayStudents.findIndex(s => s.id === dragOverId); if (di !== -1 && ti !== -1) { const nl = [...displayStudents]; const [d] = nl.splice(di, 1); nl.splice(ti, 0, d); if (onReorderStudents) onReorderStudents(nl); } } setDragId(null); setDragOverId(null); };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';
  const onPhotoChange = (e, studentId) => { const file = e.target.files[0]; if (file && openCropModal) openCropModal(file, studentId); };

  return (
    <div className="student-mobile-page p-3 sm:p-6 md:p-8 pb-24 sm:pb-8" ref={containerRef}>
      {/* Teacher Halaqoh Management */}
      {!isSuperAdmin && currentUser && newHalaqohName !== undefined && (
        <HalaqohSection newHalaqohName={newHalaqohName} setNewHalaqohName={setNewHalaqohName} newHalaqohSesi={newHalaqohSesi} setNewHalaqohSesi={setNewHalaqohSesi} handleAddHalaqoh={handleAddHalaqoh} guruHalaqohData={guruHalaqohData} currentUser={currentUser} editingHalaqoh={editingHalaqoh} setEditingHalaqoh={setEditingHalaqoh} handleSaveEditHalaqoh={handleSaveEditHalaqoh} requestDeleteHalaqoh={requestDeleteHalaqoh} handleReorderHalaqoh={handleReorderHalaqoh} />
      )}

      {/* Header */}
      {isHeaderVisible && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-gray-100 sm:border-x-0 sm:border-t-0 bg-white/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none rounded-2xl sm:rounded-none p-4 sm:p-0 sm:pb-4 md:pb-6 shadow-sm sm:shadow-none animate-student-rise">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.35rem,7vw,2.25rem)] sm:text-3xl md:text-4xl font-black text-[#1a202c] tracking-tight mb-1.5 md:mb-2 leading-none">Data Siswa</h1>
            <p className="text-gray-500 font-medium text-[11px] sm:text-sm md:text-base break-words whitespace-normal leading-relaxed">Kelola profil dan daftar siswa untuk halaqoh <strong className={`text-green-600 bg-green-50 px-2 py-0.5 rounded-lg inline-block break-words max-w-full ${(activeHalaqoh || '').length > 20 ? 'text-[10px] sm:text-xs' : ''}`}>{activeHalaqoh || '-'}</strong>.</p>
          </div>
          <button onClick={openAddStudentModal} disabled={!activeHalaqoh} className="flex w-full sm:w-auto items-center justify-center gap-1.5 md:gap-2 bg-[#00e676] hover:bg-green-500 text-white px-4 py-3 sm:py-2 md:px-5 md:py-2.5 rounded-xl font-bold transition-all text-xs md:text-sm shadow-md shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-1 sm:mt-0">
            <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5"/> Tambah Siswa Baru
          </button>
        </div>
      )}

      {/* Stats Bar (#8) */}
      {activeHalaqoh && filteredStudents.length > 0 && <StatsBar students={filteredStudents} />}

      {/* Toolbar: Search, Gender Filter (#6), View Toggle (#7), Sort (#9), Print (#11) */}
      {activeHalaqoh && (
        <div className="student-mobile-toolbar sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xl -mx-3 px-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 py-2.5 sm:py-3 mb-4 sm:mb-6 border-b border-gray-200/60 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)] transition-all print:hidden">
          {!isSearchVisible && !searchQuery ? (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              {/* Gender filter pills */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 sm:pb-0">
                {[{ v: 'all', label: 'Semua' }, { v: 'L', label: 'Laki-laki' }, { v: 'P', label: 'Perempuan' }].map(opt => (
                  <button key={opt.v} onClick={() => setGenderFilter(opt.v)} className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-[0.08em] border transition-all active:scale-95 ${genderFilter === opt.v ? (opt.v === 'P' ? 'bg-pink-500 text-white border-pink-500 shadow-sm shadow-pink-100' : opt.v === 'L' ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-100' : 'bg-slate-700 text-white border-slate-700 shadow-sm') : 'bg-white text-slate-500 border-gray-200 hover:border-emerald-300'}`}>{opt.label}</button>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 sm:pb-0">
                {/* Sort */}
                <div className="relative shrink-0">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-gray-200/80 rounded-xl sm:rounded-lg pl-3 pr-7 py-2 sm:py-1.5 text-slate-500 text-[10px] sm:text-xs font-bold outline-none appearance-none cursor-pointer">
                    <option value="default">Urutkan</option>
                    <option value="name-az">Nama A-Z</option>
                    <option value="name-za">Nama Z-A</option>
                    <option value="kelas">Kelas</option>
                    <option value="gender">Jenis Kelamin</option>
                  </select>
                  <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {/* View toggle */}
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="shrink-0 flex items-center gap-1 px-3 sm:px-2.5 py-2 sm:py-1.5 bg-white border border-gray-200/80 rounded-xl sm:rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 text-[10px] sm:text-xs font-bold active:scale-95 transition-all" title={viewMode === 'grid' ? 'Tampilan List' : 'Tampilan Grid'}>
                  {viewMode === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
                  <span className="hidden sm:inline">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                </button>
                {/* Print */}
                <button onClick={() => setIsPrinting(true)} className="shrink-0 flex items-center gap-1 px-3 sm:px-2.5 py-2 sm:py-1.5 bg-white border border-gray-200/80 rounded-xl sm:rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 text-[10px] sm:text-xs font-bold active:scale-95 transition-all" title="Cetak Daftar">
                  <Printer size={14} />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button onClick={() => setIsHeaderVisible(!isHeaderVisible)} className="shrink-0 flex items-center gap-1 px-3 sm:px-2.5 py-2 sm:py-1.5 bg-white border border-gray-200/80 rounded-xl sm:rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-[10px] sm:text-xs font-bold active:scale-95 transition-all" title={isHeaderVisible ? "Sembunyikan Judul" : "Tampilkan Judul"}>
                  {isHeaderVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={() => setIsSearchVisible(true)} className="shrink-0 flex items-center gap-1 px-3 sm:px-2.5 py-2 sm:py-1.5 bg-white border border-gray-200/80 rounded-xl sm:rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-[10px] sm:text-xs font-bold active:scale-95 transition-all">
                  <Search size={14} /> <span className="hidden sm:inline">Cari</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-student-rise">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input autoFocus type="text" placeholder="Cari nama siswa..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="w-full bg-white border border-gray-200/80 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-bold text-slate-700 shadow-sm" />
                <button onClick={() => { setIsSearchVisible(false); setLocalSearch(''); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
                {/* Gender filter in search mode */}
                <div className="flex gap-1">
                  {['all', 'L', 'P'].map(v => (
                    <button key={v} onClick={() => setGenderFilter(v)} className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all active:scale-95 ${genderFilter === v ? (v === 'P' ? 'bg-pink-500 text-white border-pink-500' : v === 'L' ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-700 text-white border-slate-700') : 'bg-white text-slate-400 border-gray-200'}`}>{v === 'all' ? 'All' : v}</button>
                  ))}
                </div>
                <button onClick={() => setIsHeaderVisible(!isHeaderVisible)} className="shrink-0 text-slate-400 hover:text-emerald-500 p-2 rounded-lg bg-white border border-gray-200/80">{isHeaderVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              </div>
            </div>
          )}
          {/* Active filters summary */}
          {(genderFilter !== 'all' || sortBy !== 'default') && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wider">
              {genderFilter !== 'all' && <span className={`px-2 py-0.5 rounded-full border ${genderFilter === 'P' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>{genderFilter === 'P' ? 'Perempuan' : 'Laki-laki'}</span>}
              {sortBy !== 'default' && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Urut: {sortBy === 'name-az' ? 'A-Z' : sortBy === 'name-za' ? 'Z-A' : sortBy === 'kelas' ? 'Kelas' : 'JK'}</span>}
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{displayStudents.length} siswa</span>
            </div>
          )}
        </div>
      )}

      {/* Empty / No results states */}
      {!activeHalaqoh ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Settings size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">Tidak ada Halaqoh yang dipilih.</p>
        </div>
      ) : displayStudents.length === 0 ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Users size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">{searchQuery ? `Siswa "${searchQuery}" tidak ditemukan.` : genderFilter !== 'all' ? `Tidak ada siswa ${genderFilter === 'P' ? 'perempuan' : 'laki-laki'} di ${activeHalaqoh}.` : `Belum ada data siswa di ${activeHalaqoh}.`}</p>
          {!searchQuery && genderFilter === 'all' && <button onClick={openAddStudentModal} className="text-xs text-green-600 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 mt-2 font-bold">Tambahkan Siswa</button>}
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW (#7) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto custom-scrollbar print:shadow-none print:border-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                <th className="text-left p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Kelas</th>
                <th className="text-left p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Halaqoh</th>
                <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">JK</th>
                <th className="text-center p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayStudents.map((student, index) => {
                const g = normalizeGender(student.gender || student.jenis_kelamin);
                const dupes = allStudents ? findDuplicates(student, allStudents) : [];
                return (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors animate-student-card" style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-gray-100 ${student.color || 'bg-blue-100 text-blue-600'}`}>
                          {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : (student.initial || getInitials(student.name))}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-slate-800 truncate ${getStudentNameClass(student.name)}`}>{student.name}</p>
                          {dupes.length > 0 && <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded mt-0.5"><AlertTriangle size={9} /> Duplikat</span>}
                          {student.previous_halaqoh && <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 mt-0.5"><ArrowRightLeft size={9} /> dari {student.previous_halaqoh}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell"><span className="text-xs font-bold text-slate-600">{student.kelas || '-'}</span></td>
                    <td className="p-3 hidden md:table-cell"><span className="text-xs font-bold text-slate-600">{student.halaqoh || '-'}</span></td>
                    <td className="p-3 text-center"><span className={`inline-flex text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${g === 'P' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>{g === 'P' ? 'P' : 'L'}</span></td>
                    <td className="p-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditStudentModal(student)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 size={14}/></button>
                        <button onClick={() => requestDeleteStudent(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW (original with enhancements) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {displayStudents.map((student, index) => {
            const g = normalizeGender(student.gender || student.jenis_kelamin);
            const dupes = allStudents ? findDuplicates(student, allStudents) : [];
            const hasClass = student.kelas && student.kelas !== '-';
            return (
            <div key={student.id} data-student-id={student.id} draggable
              onDragStart={(e) => handleDragStart(e, student.id)} onDragOver={(e) => handleDragOver(e, student.id)}
              onDrop={(e) => handleDrop(e, student.id)} onDragEnd={handleDragEnd}
              className={`student-card-modern bg-white p-3 sm:p-4 md:p-6 min-h-[96px] md:min-h-[130px] rounded-2xl md:rounded-3xl shadow-sm border ${dragOverId === student.id ? 'border-green-500 scale-[1.02] shadow-lg' : 'border-gray-100'} flex flex-col sm:flex-row items-stretch sm:items-start md:items-center justify-between hover:shadow-md transition-all group gap-3 cursor-grab active:cursor-grabbing animate-student-card ${dragId === student.id ? 'opacity-50 grayscale' : ''} print:break-inside-avoid`}
              style={{ animationDelay: `${Math.min(index, 14) * 32}ms` }}
            >
              <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
                <div className="flex flex-col items-center justify-center shrink-0 text-gray-300 group-hover:text-gray-400 cursor-grab touch-none p-0.5 -ml-1 print:hidden" onTouchStart={(e) => handleTouchStart(e, student.id)}>
                  <GripVertical size={18} />
                </div>
                <div className={`w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center font-black text-lg md:text-xl overflow-hidden relative shrink-0 border border-gray-100 group/avatar ${student.color || 'bg-blue-100 text-blue-600'}`}>
                  {student.photo ? (<img src={student.photo} alt="" className="w-full h-full object-cover" />) : (student.initial || getInitials(student.name))}
                  {uploadingPhotoId === student.id ? (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-wait p-2">
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-2"><div className="bg-white h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{Math.round(uploadProgress)}%</span>
                    </div>
                  ) : (
                    <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-center p-2 print:hidden">
                      <Camera size={17} className="mb-0.5 sm:w-5 sm:h-5 sm:mb-1" /><span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Ganti</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoChange(e, student.id)} />
                    </label>
                  )}
                  {student.photo && uploadingPhotoId !== student.id && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestDeleteStudentPhoto?.(student); }}
                      className="absolute right-1 bottom-1 z-10 w-6 h-6 rounded-full bg-red-500 text-white border border-white shadow-md flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/avatar:opacity-100 transition-opacity print:hidden"
                      title="Hapus foto"
                    >
                      <Trash2 size={12} strokeWidth={3} />
                    </button>
                  )}
                  {!student.photo && uploadingPhotoId !== student.id && (
                    <span className="sm:hidden absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-white text-slate-500 border border-gray-100 shadow-sm flex items-center justify-center pointer-events-none print:hidden">
                      <Camera size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1 gap-1.5">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <h3 className={`min-w-0 flex-1 font-extrabold text-gray-800 leading-tight line-clamp-2 whitespace-normal break-words [overflow-wrap:anywhere] ${getStudentNameClass(student.name)}`} title={student.name}>{student.name}</h3>
                    {/* #14: Duplicate warning badge */}
                    {dupes.length > 0 && <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md shrink-0" title={`Nama sama dengan: ${dupes.map(d => `${d.name} (${d.halaqoh || '-'})`).join(', ')}`}><AlertTriangle size={10} /> Duplikat</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 min-w-0">
                    {hasClass && (
                      <span className="inline-flex h-7 max-w-full min-w-0 items-center bg-blue-50 text-blue-600 text-[9px] md:text-[10px] font-black px-2.5 rounded-lg tracking-[0.04em] border border-blue-100 shadow-sm leading-none truncate">
                        Kelas {student.kelas}
                      </span>
                    )}
                    <span className="inline-flex h-7 max-w-[180px] sm:max-w-[210px] md:max-w-full min-w-0 items-center bg-slate-50 text-slate-600 text-[9px] md:text-[10px] font-black px-2.5 rounded-lg tracking-[0.04em] border border-slate-200 shadow-sm leading-none truncate" title={student.halaqoh || '-'}>
                      {student.halaqoh || '-'}
                    </span>
                    <span className={`inline-flex h-7 min-w-7 items-center justify-center text-[9px] md:text-[10px] font-black rounded-lg tracking-[0.04em] border shadow-sm leading-none ${g === 'P' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                      {g === 'P' ? 'P' : 'L'}
                    </span>
                  </div>
                  {/* #13: Transfer history */}
                  {student.previous_halaqoh && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1.5 min-w-0"><ArrowRightLeft size={10} className="shrink-0" /> <span className="truncate">Pindah dari: <span className="text-slate-600 font-black">{student.previous_halaqoh}</span></span></span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 sm:flex sm:flex-col items-center gap-1.5 shrink-0 sm:pl-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 print:hidden">
                <button onClick={() => openEditStudentModal(student)} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-blue-600 hover:bg-blue-100 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title="Edit Data Siswa"><Edit3 size={16}/></button>
                <button onClick={() => requestDeleteStudent(student)} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-white hover:bg-red-500 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title={isSuperAdmin ? "Hapus Siswa (Permanen)" : "Keluarkan dari Halaqoh"}><Trash2 size={16}/></button>
                {/* #10: Quick action to exam */}
                {setCurrentView && (
                  <>
                    <button onClick={() => { setSearchQuery(student.name); setCurrentView('ujian'); }} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title="Lihat Ujian Siswa"><ClipboardCheck size={16}/></button>
                    <button onClick={() => { setSearchQuery(student.name); setCurrentView('laporan'); }} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-purple-600 hover:bg-purple-50 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title="Lihat Laporan Siswa"><BarChart3 size={16}/></button>
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Print trigger */}
      {isPrinting && <PrintStudentList students={displayStudents} activeHalaqoh={activeHalaqoh} onClose={() => setIsPrinting(false)} />}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-24 md:bottom-8 right-6 z-50 p-3 sm:p-3.5 bg-slate-800 text-white rounded-full shadow-2xl hover:bg-slate-900 hover:-translate-y-1 transition-all active:scale-95 print:hidden" title="Scroll ke Atas">
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default StudentView;
