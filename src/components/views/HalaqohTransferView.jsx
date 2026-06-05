import React, { useMemo, useState } from 'react';
import { ArrowUpDown, BookOpen, Check, GripVertical, Layers, Mic, Search, ShieldCheck, SlidersHorizontal, Unlink2, Users, X } from 'lucide-react';

const UNASSIGNED = '__unassigned__';

const isGraduatedStudent = (student) => {
  const status = String(student?.student_status || '').trim().toLowerCase();
  return status === 'lulus' || status === 'alumni';
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

const StudentCard = ({ student, progress, selected, dragging, disabled, onToggle, onDragStart, onDragEnd, onTouchStart }) => {
  const showPreviousShadow = !hasValue(student.halaqoh) && hasValue(student.previous_halaqoh);
  const previousText = [student.previous_halaqoh, student.previous_teacher].filter(hasValue).join(' - ');

  return (
    <div
      draggable={!disabled}
      data-transfer-student-id={student.id}
      onDragStart={(e) => !disabled && onDragStart(e, student.id)}
      onDragEnd={onDragEnd}
      className={`rounded-lg border bg-white dark:bg-slate-800 p-2 shadow-sm transition-all ${
        disabled ? 'cursor-default opacity-90' : 'cursor-grab active:cursor-grabbing'
      } ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'
      } ${dragging ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <button
          type="button"
          disabled={disabled}
          onTouchStart={() => !disabled && onTouchStart(student.id)}
          className="touch-none shrink-0 w-6 h-6 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center disabled:opacity-30"
          title={disabled ? 'Alumni tidak bisa dipindahkan' : 'Pindahkan'}
        >
          <GripVertical size={13} />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggle(student.id)}
          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors ${
            selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'
          } disabled:opacity-30`}
          title={disabled ? 'Alumni tidak bisa dipilih untuk mutasi' : 'Pilih siswa'}
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
            {disabled && (
              <span className="max-w-full rounded border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-1 py-0.5 text-[8px] font-black text-amber-700 dark:text-amber-300 leading-tight break-words">
                Alumni {student.graduation_year || ''}
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

const HalaqohColumn = ({ group, students, progressMap, selectedIds, draggingIds, dragOver, onToggle, onDragStart, onDragEnd, onDragOver, onDrop, onTouchStart }) => (
  <section
    data-transfer-halaqoh={group.value}
    onDragOver={(e) => onDragOver(e, group.value)}
    onDrop={(e) => onDrop(e, group.value)}
    className={`flex flex-col min-h-[210px] rounded-xl border bg-slate-50/80 dark:bg-slate-900/40 p-2 transition-all ${
      dragOver ? 'border-emerald-400 ring-4 ring-emerald-100 dark:ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'
    }`}
  >
    <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <h2 className={`font-black text-slate-900 dark:text-slate-100 leading-tight break-words ${group.label.length > 22 ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
          {group.label}
        </h2>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{group.teacher}</p>
      </div>
      <span className="shrink-0 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[9px] font-black text-slate-500 dark:text-slate-300">
        {students.length}
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
        />
      ))}
      {students.length === 0 && (
        <div className="min-h-[92px] rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-300">
          Kosong
        </div>
      )}
    </div>
  </section>
);

const HalaqohTransferView = ({ isSuperAdmin, students = [], guruHalaqohData = {}, guruList = [], kelasList = [], onMoveStudents, onStartNewSchoolYear }) => {
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

  const activeCount = useMemo(() => students.filter(student => !isGraduatedStudent(student)).length, [students]);
  const alumniCount = useMemo(() => students.filter(isGraduatedStudent).length, [students]);

  const visibleStudentsByStatus = useMemo(() => {
    if (statusFilter === 'alumni') return students.filter(isGraduatedStudent);
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
      { value: UNASSIGNED, label: 'Belum Ada Halaqoh', teacher: 'Master Siswa' },
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

  const handleTouchStart = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (isGraduatedStudent(student)) return;
    setDraggingIds(getMoveIds(studentId));
  };

  const handleTouchMove = (e) => {
    if (draggingIds.length === 0) return;
    const touch = e.touches[0];
    const dropZone = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-transfer-halaqoh]');
    const value = dropZone?.getAttribute('data-transfer-halaqoh') || '';
    if (value && value !== dragOverHalaqoh) setDragOverHalaqoh(value);
  };

  const handleTouchEnd = async () => {
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
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 p-3 sm:p-5 md:p-8 transition-colors" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="max-w-7xl mx-auto pb-24 md:pb-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpDown size={23} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Mutasi Halaqoh</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">Atur komposisi siswa untuk semester baru dengan data capaian terakhir.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                type="button"
                onClick={onStartNewSchoolYear}
                disabled={!onStartNewSchoolYear || activeCount === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-[10px] sm:text-xs font-black text-red-600 dark:text-red-300 shadow-sm transition-all hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40"
                title="Lepaskan semua siswa dari halaqoh untuk tahun ajaran baru"
              >
                <Unlink2 size={15} />
                <span className="hidden sm:inline">Naik Kelas & Alumni</span>
                <span className="sm:hidden">Tahun Baru</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={15} />
                Super Admin
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Aktif', value: activeCount, icon: Users, tone: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
              { label: 'Alumni', value: alumniCount, icon: Layers, tone: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300' },
              { label: 'Terpilih', value: selectedIds.length, icon: Check, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
              { label: 'Kosong', value: unassignedCount, icon: Layers, tone: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300' }
            ].map(item => (
              <div key={item.label} className={`rounded-xl border px-2.5 py-2 sm:px-4 sm:py-3 ${item.tone}`}>
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">
                  <item.icon size={13} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="mt-1 text-xl sm:text-2xl font-black leading-none">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky top-0 z-30 -mx-3 sm:mx-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md px-3 sm:px-0 py-2 sm:py-3 mb-3 sm:mb-4">
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
                {teacherFilter && <span className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-600 dark:text-emerald-300">{teacherFilter}</span>}
                {statusFilter !== 'active' && <span className="shrink-0 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-600 dark:text-amber-300">{statusFilter === 'alumni' ? 'Alumni' : 'Semua'}</span>}
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
                      {availableTeacherFilters.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
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
                      { value: 'alumni', label: 'Alumni' },
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
                        <span className="block max-w-[120px] truncate text-[10px] font-black leading-tight">{item.teacher}</span>
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
              {availableTeacherFilters.map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
            </select>
            <div className="grid grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              {[
                { value: 'active', label: 'Aktif' },
                { value: 'alumni', label: 'Alumni' },
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
                <span className="block max-w-[150px] truncate text-[10px] sm:text-xs font-black leading-tight">{item.teacher}</span>
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
            <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-2">
              <span className="rounded-lg bg-white/80 dark:bg-slate-900/60 px-2 py-1 text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-200">
                {selectedIds.length} terpilih
              </span>
              <select
                value={bulkTarget}
                onChange={(e) => setBulkTarget(e.target.value)}
                className="min-w-0 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-slate-800 px-2 py-2 text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-100 outline-none"
              >
                <option value="">Pilih tujuan</option>
                {halaqohGroups.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.value === UNASSIGNED ? 'Lepas dari halaqoh' : `${group.label} - ${group.teacher}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => finishMove(bulkTarget, selectedIds)}
                disabled={!bulkTarget}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] sm:text-xs font-black text-white shadow-sm disabled:opacity-40"
              >
                Pindahkan
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-1 md:flex md:items-start gap-3 sm:gap-4 md:min-w-max">
            {visibleGroups.map(group => (
              <div key={group.value} className="md:w-[260px] md:shrink-0">
                <HalaqohColumn
                  group={group}
                  students={studentsByHalaqoh[group.value] || []}
                  progressMap={progressMap}
                  selectedIds={selectedIds}
                  draggingIds={draggingIds}
                  dragOver={dragOverHalaqoh === group.value}
                  onToggle={toggleSelected}
                  onDragStart={handleDragStart}
                  onDragEnd={() => { setDraggingIds([]); setDragOverHalaqoh(''); }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onTouchStart={handleTouchStart}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HalaqohTransferView;
