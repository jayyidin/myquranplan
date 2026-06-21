import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Award, Plus, Trash2, Settings, ClipboardList, Loader2, BookOpen, Mic, Printer, Search, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, X, Download, FileText, ArrowLeft, Check, CalendarDays, Calendar, Users, Edit3, GripVertical, History, Maximize2, Presentation } from 'lucide-react';
import SurahSelector from '../SurahSelector';
import AyatSelector from '../AyatSelector';
import { surahList, ghoribList, tajwidList } from '../../data/constants';

const normalizeSurahText = (value) => String(value || '')
    .toLowerCase()
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/\bayat\b.*$/i, '')
    .replace(/\b\d+\s*-\s*\d+\b/g, '')
    .replace(/\b\d+\b/g, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const getTahfidzSurahNo = (materialName) => {
    const text = String(materialName || '');
    const explicitNo = text.match(/^\s*(\d{1,3})\s*\./);
    if (explicitNo) {
        const no = parseInt(explicitNo[1], 10);
        if (no >= 1 && no <= 114) return no;
    }

    const normalized = normalizeSurahText(text);
    const match = surahList.find(surah => normalized.includes(normalizeSurahText(surah.name)));
    return match?.no || null;
};

const sortTahfidzMaterials = (list = []) => [...list].sort((a, b) => {
    const aNo = getTahfidzSurahNo(a?.name);
    const bNo = getTahfidzSurahNo(b?.name);

    if (aNo && bNo && aNo !== bNo) return bNo - aNo;
    if (aNo && !bNo) return -1;
    if (!aNo && bNo) return 1;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'id', { numeric: true, sensitivity: 'base' });
});

const TahsinSelector = ({ value, onChange, onAdd, onEnter, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm(value || '');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value]);

    const filteredOptions = useMemo(() => {
        if (!isOpen) return [];
        const allGroups = [
            { label: 'Materi Utama (Satu Nilai)', items: ['Tilawah', 'Fashohah', 'Tajwid', 'Ghorib'] },
            { label: 'Sub-Materi Tajwid', items: tajwidList },
            { label: 'Sub-Materi Ghorib', items: ghoribList }
        ];

        if (!searchTerm) return allGroups;

        const lowerTerm = searchTerm.toLowerCase();
        return allGroups.map(group => ({
            label: group.label,
            items: group.items.filter(item => item.toLowerCase().includes(lowerTerm))
        })).filter(group => group.items.length > 0);
    }, [searchTerm, isOpen]);

    const handleSelect = (item) => {
        if (onAdd) {
            onAdd(item);
            setSearchTerm('');
            onChange('');
        } else {
            onChange(item);
        }
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onAdd && searchTerm.trim()) {
                onAdd(searchTerm.trim());
                setSearchTerm('');
                onChange('');
                setIsOpen(false);
            } else if (onEnter && searchTerm.trim()) {
                onEnter();
                setIsOpen(false);
            }
        }
    };

    return (
        <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`} ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value); // Sinkronisasi langsung untuk custom text
                    setIsOpen(true); // Memastikan dropdown otomatis terbuka saat diketik
                }}
                onFocus={() => setIsOpen(true)}
                onClick={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
            />
            <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredOptions.map((group, idx) => (
                        <div key={idx} className="p-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-3 py-1.5">{group.label}</div>
                            {group.items.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(item)}
                                    className="px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Komponen Dropdown Kustom untuk Tahfidz (Mendukung Input Teks Bebas & Pencarian)
const TahfidzSelector = ({ value, onChange, onAdd, onEnter, placeholder, className, surahList }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm(value || '');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value]);

    const filteredOptions = useMemo(() => {
        if (!isOpen) return [];
        const allGroups = [
            { label: 'Kategori Umum', items: ['Juz 30', 'Juz 29', 'Juz 28', 'Surat Pilihan'] },
            { label: 'Daftar Surat', items: surahList.map(s => `${s.no}. ${s.name}`) }
        ];

        if (!searchTerm) return allGroups;

        const lowerTerm = searchTerm.toLowerCase();
        return allGroups.map(group => ({
            label: group.label,
            items: group.items.filter(item => item.toLowerCase().includes(lowerTerm))
        })).filter(group => group.items.length > 0);
    }, [searchTerm, isOpen, surahList]);

    const handleSelect = (item) => {
        if (onAdd) {
            onAdd(item);
            setSearchTerm('');
            onChange('');
        } else {
            onChange(item);
        }
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onAdd && searchTerm.trim()) {
                onAdd(searchTerm.trim());
                setSearchTerm('');
                onChange('');
                setIsOpen(false);
            } else if (onEnter && searchTerm.trim()) {
                onEnter();
                setIsOpen(false);
            }
        }
    };

    return (
        <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`} ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value); // Sinkronisasi langsung untuk custom text
                    setIsOpen(true); // Memastikan dropdown otomatis terbuka saat diketik
                }}
                onFocus={() => setIsOpen(true)}
                onClick={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
            />
            <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredOptions.map((group, idx) => (
                        <div key={idx} className="p-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                            <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-3 py-1.5">{group.label}</div>
                            {group.items.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(item)}
                                    className="px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sub-komponen Input Nilai agar lebih ringan dan tidak lag saat mengetik
const ScoreInput = React.memo(({ studentId, rowIndex, material, initialScore, onSave, kkmScore, isMobile = false, disabled = false }) => {
    const [val, setVal] = useState(initialScore ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setVal(initialScore ?? '');
    }, [initialScore]);

    const handleBlur = async () => {
        if (val.toString() !== (initialScore ?? '').toString()) {
            setIsSaving(true);
            await onSave(studentId, material, val);
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 1500); // Tampilkan indikator hijau sukses selama 1.5 detik
        }
    };

    // Fitur Navigasi Keyboard ala Excel
    const handleKeyDown = (e) => {
        const matId = material.replace(/[^a-zA-Z0-9]/g, ''); // Buat ID aman
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (isMobile) {
                const inputs = Array.from(document.querySelectorAll('input[data-score-input="true"][data-is-mobile="true"]'));
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    e.target.blur();
                }
            } else {
                const nextInput = document.querySelector(`input[data-mat-id="${matId}"][data-row-index="${rowIndex + 1}"]:not([data-is-mobile="true"])`);
                if (nextInput) nextInput.focus();
                else e.target.blur(); // Blur (simpan) jika sudah berada di baris paling bawah
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isMobile) {
                const inputs = Array.from(document.querySelectorAll('input[data-score-input="true"][data-is-mobile="true"]'));
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex > 0) {
                    inputs[currentIndex - 1].focus();
                }
            } else {
                const prevInput = document.querySelector(`input[data-mat-id="${matId}"][data-row-index="${rowIndex - 1}"]:not([data-is-mobile="true"])`);
                if (prevInput) prevInput.focus();
            }
        } else if (!isMobile && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            const inputs = Array.from(document.querySelectorAll(`input[data-score-input="true"][data-row-index="${rowIndex}"]:not([data-is-mobile="true"])`));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex === -1) return;
            const nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
            if (inputs[nextIndex]) {
                e.preventDefault();
                inputs[nextIndex].focus();
            }
        }
    };

    const handleFocus = (e) => {
        e.target.select();
        if (isMobile) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    // Logika Kriteria KKM Dinamis
    const numVal = parseFloat(val);
    const isBelowKKM = !isNaN(numVal) && numVal < kkmScore && val.toString().trim() !== '';
    const isPerfect = !isNaN(numVal) && numVal === 100 && val.toString().trim() !== '';

    if (disabled) {
        return (
            <div className={`relative inline-block w-full ${isMobile ? '' : 'max-w-[92px]'}`} title="Siswa ini tidak ditugaskan untuk materi ini.">
                <div className="w-full min-h-[42px] px-1.5 sm:px-2 py-2.5 text-sm rounded-xl font-black text-center text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed">
                    -
                </div>
            </div>
        );
    }

    return (
        <div className={`relative inline-block w-full ${isMobile ? '' : 'max-w-[92px]'}`}>
            <input
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                aria-label={`Nilai ${material}`}
                value={val}
                onChange={e => {
                    let newVal = e.target.value;
                    newVal = newVal.replace(',', '.').replace(/[^\d.]/g, '');
                    const firstDot = newVal.indexOf('.');
                    if (firstDot !== -1) {
                        newVal = newVal.slice(0, firstDot + 1) + newVal.slice(firstDot + 1).replace(/\./g, '');
                    }
                    if (newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
                    setVal(newVal);
                }}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onWheel={(e) => e.currentTarget.blur()}
                data-score-input="true"
                data-is-mobile={isMobile ? "true" : "false"}
                data-mat-id={material.replace(/[^a-zA-Z0-9]/g, '')}
                data-row-index={rowIndex}
                className={`w-full min-h-[42px] px-1.5 sm:px-2 ${isMobile ? ((val ?? '').toString().length > 3 ? 'py-2 text-sm' : 'py-2 text-base') + ' shadow-inner rounded-xl' : 'py-2.5 text-sm rounded-xl'} font-black text-center outline-none transition-all duration-300 focus:ring-4 focus:scale-105 focus:z-20 relative !text-black ${isSaving ? 'animate-pulse !bg-amber-50 !border-amber-300 shadow-sm focus:!border-amber-500 focus:!ring-amber-500/20' :
                    isSaved ? 'scale-110 -translate-y-1 !bg-emerald-100 !border-emerald-400 shadow-[0_5px_15px_rgba(16,185,129,0.3)] z-10 relative focus:!border-emerald-500 focus:!ring-emerald-500/30' :
                        isPerfect ? '!bg-yellow-50 !border-yellow-300 focus:!border-yellow-500 focus:!ring-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                            isBelowKKM ? '!bg-red-50 !border-red-300 focus:!border-red-500 focus:!ring-red-500/20' :
                                val.toString().trim() !== '' ? '!bg-emerald-50 !border-emerald-300 focus:!border-emerald-500 focus:!ring-emerald-500/20' :
                                    '!bg-slate-100 !border-slate-300 border-dashed focus:border-solid focus:!border-blue-500 focus:!ring-blue-500/20 hover:!bg-slate-200'
                }`}
                placeholder="-"
            />
            {isPerfect && (
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </div>
            )}
        </div>
    );
}, (prev, next) => prev.studentId === next.studentId && prev.material === next.material && prev.initialScore === next.initialScore && prev.kkmScore === next.kkmScore && prev.rowIndex === next.rowIndex && prev.isMobile === next.isMobile);

const StudentTableRow = React.memo(({ student, index, materials, hasTajwidSub, hasGhoribSub, kkmScore, onSaveScore, onPrintStudent }) => {
    const getAverage = (list) => {
        const scores = materials.tahsin
            .filter(m => list.includes(m.name) && (!m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id))))
            .map(m => parseFloat(student.ujian_records?.[m.name]))
            .filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    };

    const overallAvg = React.useMemo(() => {
        let total = 0;
        let count = 0;
        materials.tahsin.forEach(mat => {
            if (!mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id))) {
                const val = parseFloat(student.ujian_records?.[mat.name]);
                if (!isNaN(val)) {
                    total += val;
                    count++;
                }
            }
        });
        materials.tahfidz.forEach(mat => {
            if (!mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id))) {
                const val = parseFloat(student.ujian_records?.[mat.name]);
                if (!isNaN(val)) {
                    total += val;
                    count++;
                }
            }
        });
        return count > 0 ? (total / count).toFixed(1) : '-';
    }, [student.ujian_records, student.id, materials]);

    const isAvgBelowKKM = overallAvg !== '-' && parseFloat(overallAvg) < kkmScore;

    const studentHasTajwid = React.useMemo(() => materials.tahsin.some(m => tajwidList.includes(m.name) && (!m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id)))), [materials.tahsin, student.id]);
    const studentHasGhorib = React.useMemo(() => materials.tahsin.some(m => ghoribList.includes(m.name) && (!m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id)))), [materials.tahsin, student.id]);

    return (
        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group animate-row-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <td className="p-3 sm:p-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 transition-colors z-10 shadow-[6px_0_16px_rgba(15,23,42,0.06)] border-r border-slate-100 dark:border-slate-800 min-w-[260px] w-[260px] max-w-[260px]">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 overflow-hidden">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 leading-tight whitespace-normal line-clamp-2">{student.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Kelas {student.kelas || '-'}</span>
                    </div>
                </div>
            </td>
            {materials.tahsin.map((mat, i) => {
                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                return (
                    <td key={`t-in-${i}`} className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle">
                        <ScoreInput studentId={student.id} rowIndex={index} material={mat.name} initialScore={student.ujian_records?.[mat.name]} onSave={onSaveScore} kkmScore={kkmScore} disabled={!isAssigned} />
                    </td>
                );
            })}
            {hasTajwidSub && (
                <td className={`p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle font-black ${studentHasTajwid ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/10' : 'text-slate-300 dark:text-slate-700 bg-slate-50/30 dark:bg-slate-800/30'}`}>
                    {studentHasTajwid ? getAverage(tajwidList) : '-'}
                </td>
            )}
            {hasGhoribSub && (
                <td className={`p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle font-black ${studentHasGhorib ? 'text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-500/10' : 'text-slate-300 dark:text-slate-700 bg-slate-50/30 dark:bg-slate-800/30'}`}>
                    {studentHasGhorib ? getAverage(ghoribList) : '-'}
                </td>
            )}

            {materials.tahfidz.map((mat, i) => {
                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                return (
                    <td key={`f-in-${i}`} className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle bg-purple-50/10 dark:bg-purple-500/5">
                        <ScoreInput studentId={student.id} rowIndex={index} material={mat.name} initialScore={student.ujian_records?.[mat.name]} onSave={onSaveScore} kkmScore={kkmScore} disabled={!isAssigned} />
                    </td>
                );
            })}
            {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
                <td className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50/30 dark:bg-slate-800/30">Belum ada materi terjadwal.</td>
            )}
            {(materials.tahsin.length > 0 || materials.tahfidz.length > 0) && (
                <td className={`p-3 text-center border-l border-slate-200 dark:border-slate-700 align-middle font-black ${isAvgBelowKKM ? 'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-500/10' : 'text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/50'}`}>
                    {overallAvg}
                </td>
            )}
            <td className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle">
                <button
                    onClick={() => onPrintStudent(student)}
                    className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all active:scale-90"
                    title="Cetak Raport Al-Qur'an"
                >
                    <Printer size={18} />
                </button>
            </td>
        </tr>
    );
});

const StudentMobileCard = React.memo(({ student, index, materials, hasTajwidSub, hasGhoribSub, kkmScore, onSaveScore, onPrintStudent }) => {
    const studentHasTajwid = React.useMemo(() => materials.tahsin.some(m => tajwidList.includes(m.name) && (!m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id)))), [materials.tahsin, student.id]);
    const studentHasGhorib = React.useMemo(() => materials.tahsin.some(m => ghoribList.includes(m.name) && (!m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id)))), [materials.tahsin, student.id]);

    const getAverage = (list) => {
        const scores = materials.tahsin
            .filter(m => list.includes(m.name))
            .filter(m => !m.students || m.students.includes('all') || m.students.some(id => String(id) === String(student.id)))
            .map(m => parseFloat(student.ujian_records?.[m.name]))
            .filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    };

    const overallAvg = React.useMemo(() => {
        let total = 0;
        let count = 0;
        materials.tahsin.forEach(mat => {
            const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
            if (isAssigned) {
                const val = parseFloat(student.ujian_records?.[mat.name]);
                if (!isNaN(val)) { total += val; count++; }
            }
        });
        materials.tahfidz.forEach(mat => {
            const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
            if (isAssigned) {
                const val = parseFloat(student.ujian_records?.[mat.name]);
                if (!isNaN(val)) { total += val; count++; }
            }
        });
        return count > 0 ? (total / count).toFixed(1) : '-';
    }, [student.ujian_records, student.id, materials]);

    const isAvgBelowKKM = overallAvg !== '-' && parseFloat(overallAvg) < kkmScore;

    return (
        <div id={`student-mob-${student.id}`} className="flex flex-col bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-200/80 dark:border-slate-800 overflow-hidden relative group scroll-mt-24 animate-row-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
            {/* Header Siswa Sticky untuk Mobile */}
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 shadow-[0_4px_10px_rgba(0,0,0,0.02)] transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0 overflow-hidden shadow-sm border border-emerald-200 dark:border-emerald-500/30">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{student.name}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">Kelas {student.kelas || '-'}</span>
                    </div>
                </div>
                {overallAvg !== '-' && (
                    <div className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg border ${isAvgBelowKKM ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400' : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'} shrink-0 ml-auto`}>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-0.5">Rata</span>
                        <span className="text-xs sm:text-sm font-black leading-none">{overallAvg}</span>
                    </div>
                )}
                <button
                    onClick={() => onPrintStudent(student)}
                    className="p-1.5 sm:p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-100 dark:border-emerald-500/20 transition-all active:scale-95 shrink-0 ml-1.5"
                    title="Cetak Raport"
                >
                    <Printer size={18} />
                </button>
            </div>

            <div className="p-3 sm:p-4 flex flex-col gap-4">
                {materials.tahsin.length > 0 && (
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={16} className="text-blue-500" />
                            <h4 className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-widest">Tahsin</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                            {materials.tahsin.map((mat, i) => {
                                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                                if (!isAssigned) return null;
                                return (
                                    <div key={`t-mob-${i}`} className="bg-white dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between items-center gap-1.5 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors min-w-0">
                                        <span className={`${mat.name.length > 20 ? 'text-[8px]' : mat.name.length > 12 ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2 w-full h-6 flex items-center justify-center`} title={mat.name}>{mat.name}</span>
                                        <ScoreInput studentId={student.id} rowIndex={index} material={mat.name} initialScore={student.ujian_records?.[mat.name]} onSave={onSaveScore} kkmScore={kkmScore} isMobile={true} disabled={!isAssigned} />
                                    </div>
                                );
                            })}
                            {hasTajwidSub && studentHasTajwid && (
                                <div className="bg-indigo-50/60 dark:bg-indigo-500/10 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-center items-center gap-0.5 shadow-sm">
                                    <span className="text-[8px] sm:text-[9px] font-bold text-indigo-500 dark:text-indigo-400 text-center leading-tight h-6 flex items-center justify-center">Rata Tajwid</span>
                                    <span className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300 py-1">{getAverage(tajwidList)}</span>
                                </div>
                            )}
                            {hasGhoribSub && studentHasGhorib && (
                                <div className="bg-teal-50/60 dark:bg-teal-500/10 p-1.5 sm:p-2 rounded-xl border border-teal-100 dark:border-teal-500/20 flex flex-col justify-center items-center gap-0.5 shadow-sm">
                                    <span className="text-[8px] sm:text-[9px] font-bold text-teal-500 dark:text-teal-400 text-center leading-tight h-6 flex items-center justify-center">Rata Ghorib</span>
                                    <span className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300 py-1">{getAverage(ghoribList)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {materials.tahfidz.length > 0 && (
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Mic size={16} className="text-purple-500" />
                            <h4 className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-widest">Tahfidz</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                            {materials.tahfidz.map((mat, i) => {
                                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                                if (!isAssigned) return null;
                                return (
                                    <div key={`f-mob-${i}`} className="bg-white dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between items-center gap-1.5 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors min-w-0">
                                        <span className={`${mat.name.length > 20 ? 'text-[8px]' : mat.name.length > 12 ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2 w-full h-6 flex items-center justify-center`} title={mat.name}>{mat.name}</span>
                                        <ScoreInput studentId={student.id} rowIndex={index} material={mat.name} initialScore={student.ujian_records?.[mat.name]} onSave={onSaveScore} kkmScore={kkmScore} isMobile={true} disabled={!isAssigned} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">Belum ada materi terjadwal.</p>
                )}
            </div>
        </div>
    );
});

const PRESENTATION_JOURNAL = {
    tahsin: ['jurnalTahsin', 'tahsin'],
    halTahsin: ['jurnalHalAyatTahsin', 'halAyatTahsin'],
    tahfidz: ['jurnalTahfidz', 'tahfidz'],
    ayatTahfidz: ['jurnalAyatTahfidz', 'ayatTahfidz'],
    catatan: ['jurnalCatatan', 'catatan'],
    catatanTahsin: ['jurnalCatatanTahsin', 'catatanTahsin'],
    catatanTahfidz: ['jurnalCatatanTahfidz', 'catatanTahfidz']
};

const hasPresentationValue = (value) => {
    if (value === undefined || value === null) return false;
    const text = String(value).trim();
    return text !== '' && text !== '-';
};

const getPresentationRecordValue = (record, keys = []) => {
    for (const key of keys) {
        if (hasPresentationValue(record?.[key])) return record[key];
    }
    return '';
};

const cleanPresentationText = (value) => {
    if (!hasPresentationValue(value)) return '-';
    return String(value)
        .replace(/\(Nilai:[^)]+\)/gi, '')
        .replace(/\s+\(([A-C][+-]?|D)\)/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim() || '-';
};

const formatPresentationTahsinPage = (value) => {
    const text = cleanPresentationText(value);
    if (!hasPresentationValue(text)) return '-';
    const pages = [...text.matchAll(/Hal\.\s*([\d,\s]+)/gi)]
        .flatMap((match) => match[1].split(',').map((page) => page.trim()))
        .filter(Boolean);
    if (pages.length === 0) return text.replace(/\s*Brs\s*[\d,\s:]+/gi, '').trim() || '-';
    return `Hal. ${[...new Set(pages)].join(', ')}`;
};

const isPresentationInactiveRecord = (record) => {
    const text = String(getPresentationRecordValue(record, PRESENTATION_JOURNAL.catatan) || '').toLowerCase();
    return ['libur', 'sakit', 'izin', 'alpa', 'tidak hadir'].some((word) => text.includes(word));
};

const hasPresentationDrillNote = (record) => [
    ...PRESENTATION_JOURNAL.catatan,
    ...PRESENTATION_JOURNAL.catatanTahsin,
    ...PRESENTATION_JOURNAL.catatanTahfidz
].some((field) => String(record?.[field] || '').toLowerCase().includes('drill'));

const getPresentationDateLabel = (dateInput) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getPresentationFinalCapaian = (student) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const records = Object.entries(student?.records || {})
        .map(([date, record]) => ({ date, dateObj: new Date(date), record }))
        .filter(({ dateObj, record }) => (
            !Number.isNaN(dateObj.getTime())
            && dateObj <= today
            && !isPresentationInactiveRecord(record)
        ))
        .sort((a, b) => b.dateObj - a.dateObj);

    const latestDrillTime = records.find(({ record }) => hasPresentationDrillNote(record))?.dateObj.getTime() || null;
    let latestTahsin = null;
    let latestTahfidz = null;

    for (const item of records) {
        const tahsin = getPresentationRecordValue(item.record, PRESENTATION_JOURNAL.tahsin);
        const halTahsin = getPresentationRecordValue(item.record, PRESENTATION_JOURNAL.halTahsin);
        const tahfidz = getPresentationRecordValue(item.record, PRESENTATION_JOURNAL.tahfidz);
        const ayatTahfidz = getPresentationRecordValue(item.record, PRESENTATION_JOURNAL.ayatTahfidz);

        if (!latestTahsin && (hasPresentationValue(tahsin) || hasPresentationValue(halTahsin))) {
            const shouldUseDrillPage = hasPresentationDrillNote(item.record) || (latestDrillTime !== null && latestDrillTime >= item.dateObj.getTime());
            latestTahsin = {
                title: cleanPresentationText(tahsin),
                detail: shouldUseDrillPage ? 'Hal. 40' : formatPresentationTahsinPage(halTahsin),
                date: item.date
            };
        }

        if (!latestTahfidz && (hasPresentationValue(tahfidz) || hasPresentationValue(ayatTahfidz))) {
            latestTahfidz = {
                title: cleanPresentationText(tahfidz),
                detail: cleanPresentationText(ayatTahfidz),
                date: item.date
            };
        }

        if (latestTahsin && latestTahfidz) break;
    }

    return {
        tahsin: latestTahsin || { title: '-', detail: '-', date: null },
        tahfidz: latestTahfidz || { title: '-', detail: '-', date: null }
    };
};

const isStudentAssignedToPresentationMaterial = (student, material) => (
    !material?.students
    || material.students.includes('all')
    || material.students.some((id) => String(id) === String(student?.id))
);

const PRESENTATION_TAHSIN_EXTRA_SCORES = [
    { name: 'Tilawah', keys: ['Tilawah'] },
    { name: 'Fashohah', keys: ['Fashohah', 'Fashahah'] }
];

const isPresentationFashohahName = (name) => /^fashohah$|^fashahah$/i.test(String(name || '').trim());
const isPresentationTahsinExtraName = (name, extra) => extra.keys.some((key) => (
    isPresentationFashohahName(key)
        ? isPresentationFashohahName(name)
        : String(name || '').trim().toLowerCase() === String(key).trim().toLowerCase()
));

const getPresentationExamScore = (student, materialName) => {
    const keys = isPresentationFashohahName(materialName)
        ? [...new Set([materialName, 'Fashohah', 'Fashahah'])]
        : [materialName];

    for (const key of keys) {
        const value = student?.ujian_records?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
};

const buildPresentationScoreRow = (student, name, type = 'tahsin') => {
    const rawScore = getPresentationExamScore(student, name);
    const numericScore = parseFloat(rawScore);
    return {
        type,
        name,
        score: rawScore !== undefined && rawScore !== null && String(rawScore).trim() !== '' ? String(rawScore) : '-',
        numericScore: Number.isNaN(numericScore) ? null : numericScore
    };
};

const getPresentationScoreRows = (student, materials = [], type = 'tahsin') => materials
    .filter((material) => isStudentAssignedToPresentationMaterial(student, material))
    .map((material) => buildPresentationScoreRow(student, material.name, type));

const isPresentationSurahScoreKey = (name) => {
    const text = String(name || '').trim();
    if (!text) return false;
    return Boolean(getTahfidzSurahNo(text));
};

const getPresentationSurahScoreKey = (name) => {
    const no = getTahfidzSurahNo(name);
    return no ? `surah-${no}` : normalizeSurahText(name);
};

const getPresentationAdditionalTahfidzRows = (student, baseRows = []) => {
    const existingKeys = new Set(baseRows.map((row) => getPresentationSurahScoreKey(row.name)));

    return Object.entries(student?.ujian_records || {})
        .filter(([name, value]) => (
            hasPresentationValue(value)
            && isPresentationSurahScoreKey(name)
            && !existingKeys.has(getPresentationSurahScoreKey(name))
        ))
        .map(([name]) => buildPresentationScoreRow(student, name, 'tahfidz'));
};

const getAveragePresentationScore = (rows = []) => {
    const scores = rows.map((row) => row.numericScore).filter((score) => score !== null);
    if (scores.length === 0) return '-';
    return (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1);
};

const getPresentationPredicate = (score, kkm = 75) => {
    const num = parseFloat(score);
    if (Number.isNaN(num)) return 'Belum Dinilai';
    if (num >= 92) return 'Mumtaz';
    if (num >= 83) return 'Jayyid Jiddan';
    if (num >= kkm) return 'Jayyid';
    return 'Perlu Penguatan';
};

const getPresentationScorePercent = (score) => {
    const num = parseFloat(score);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, num));
};

const buildRaportPresentationData = (student, tahsinMaterials = [], tahfidzMaterials = [], kkmScore = 75) => {
    const baseTahsinRows = getPresentationScoreRows(student, tahsinMaterials, 'tahsin');
    const extraTahsinRows = PRESENTATION_TAHSIN_EXTRA_SCORES
        .filter((extra) => !baseTahsinRows.some((row) => isPresentationTahsinExtraName(row.name, extra)))
        .map((extra) => buildPresentationScoreRow(student, extra.name, 'tahsin'))
        .filter((row) => row.numericScore !== null);
    const tahsinRows = [...baseTahsinRows, ...extraTahsinRows];
    const baseTahfidzRows = getPresentationScoreRows(student, tahfidzMaterials, 'tahfidz');
    const additionalTahfidzRows = getPresentationAdditionalTahfidzRows(student, baseTahfidzRows);
    const tahfidzRows = [...baseTahfidzRows, ...additionalTahfidzRows];
    const allRows = [...tahsinRows, ...tahfidzRows];
    const tahsinAverage = getAveragePresentationScore(tahsinRows);
    const tahfidzAverage = getAveragePresentationScore(tahfidzRows);
    const overallAverage = getAveragePresentationScore(allRows);
    const scoredCount = allRows.filter((row) => row.numericScore !== null).length;
    const completePercent = allRows.length ? Math.round((scoredCount / allRows.length) * 100) : 0;
    const topScores = allRows
        .filter((row) => row.numericScore !== null)
        .sort((a, b) => b.numericScore - a.numericScore)
        .slice(0, 5);

    return {
        tahsinRows,
        tahfidzRows,
        tahsinAverage,
        tahfidzAverage,
        overallAverage,
        scoredCount,
        totalCount: allRows.length,
        completePercent,
        topScores,
        predicate: getPresentationPredicate(overallAverage, kkmScore),
        capaian: getPresentationFinalCapaian(student)
    };
};

const UjianView = ({ activeHalaqoh, filteredStudents, students, setStudents, showToast, currentUser, institutionLogo }) => {
    const [activeTab, setActiveTab] = useState('penilaian'); // 'penilaian' | 'jadwal' | 'materi'
    const [materials, setMaterials] = useState({ tahsin: [], tahfidz: [], jadwal: [], reportSettings: {}, institutionName: '', institutionLogo: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [kkmScore, setKkmScore] = useState(75);
    const [showUnscoredOnly, setShowUnscoredOnly] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [activePrintStudent, setActivePrintStudent] = useState(null);
    const [isPresentationOpen, setIsPresentationOpen] = useState(false);
    const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, type: '', material: null });

    const [newTahsin, setNewTahsin] = useState('');
    const [newTahfidz, setNewTahfidz] = useState('');
    const [newTahsinAyatStart, setNewTahsinAyatStart] = useState('');
    const [newTahsinAyatEnd, setNewTahsinAyatEnd] = useState('');
    const [newTahfidzAyatStart, setNewTahfidzAyatStart] = useState('');
    const [newTahfidzAyatEnd, setNewTahfidzAyatEnd] = useState('');

    const tahsinSurahMatch = useMemo(() => surahList.find(s => s.name === newTahsin || `${s.no}. ${s.name}` === newTahsin), [newTahsin]);
    const tahfidzSurahMatch = useMemo(() => surahList.find(s => s.name === newTahfidz || `${s.no}. ${s.name}` === newTahfidz), [newTahfidz]);

    const [isAddingJadwal, setIsAddingJadwal] = useState(false);
    const [newJadwal, setNewJadwal] = useState({ tanggal: '', materi: [] });
    const [jadwalFilter, setJadwalFilter] = useState('');

    const [selectedJadwalId, setSelectedJadwalId] = useState('');
    const [dragMatInfo, setDragMatInfo] = useState(null);
    const [dragOverMatInfo, setDragOverMatInfo] = useState(null);

    const currentTahsin = useMemo(() => {
        if (!activeHalaqoh) return (materials.tahsin || []).filter(m => !m.halaqoh || m.halaqoh === 'Semua').filter(m => !(m.students && m.students.includes('HIDDEN')));
        const localNames = (materials.tahsin || []).filter(m => m.halaqoh === activeHalaqoh).map(m => m.name);
        const combined = (materials.tahsin || []).filter(m => {
            if (m.halaqoh === activeHalaqoh) return true;
            if ((!m.halaqoh || m.halaqoh === 'Semua') && !localNames.includes(m.name)) return true;
            return false;
        });
        return combined.filter(m => !(m.students && m.students.includes('HIDDEN')));
    }, [materials.tahsin, activeHalaqoh]);

    const currentTahfidz = useMemo(() => {
        if (!activeHalaqoh) return sortTahfidzMaterials((materials.tahfidz || []).filter(m => !m.halaqoh || m.halaqoh === 'Semua').filter(m => !(m.students && m.students.includes('HIDDEN'))));
        const localNames = (materials.tahfidz || []).filter(m => m.halaqoh === activeHalaqoh).map(m => m.name);
        const combined = (materials.tahfidz || []).filter(m => {
            if (m.halaqoh === activeHalaqoh) return true;
            if ((!m.halaqoh || m.halaqoh === 'Semua') && !localNames.includes(m.name)) return true;
            return false;
        });
        return sortTahfidzMaterials(combined.filter(m => !(m.students && m.students.includes('HIDDEN'))));
    }, [materials.tahfidz, activeHalaqoh]);

    const sortScheduledMateri = React.useCallback((materiList = []) => {
        const tahsinOrder = new Map(currentTahsin.map((m, index) => [m.name, index]));
        const tahfidzOrder = new Map(currentTahfidz.map((m, index) => [m.name, index]));

        return [...materiList].filter(Boolean).sort((a, b) => {
            const aIsTahsin = tahsinOrder.has(a);
            const bIsTahsin = tahsinOrder.has(b);
            const aIsTahfidz = tahfidzOrder.has(a);
            const bIsTahfidz = tahfidzOrder.has(b);

            if (aIsTahsin && bIsTahsin) return tahsinOrder.get(a) - tahsinOrder.get(b);
            if (aIsTahfidz && bIsTahfidz) return tahfidzOrder.get(a) - tahfidzOrder.get(b);
            if (aIsTahsin !== bIsTahsin) return aIsTahsin ? -1 : 1;
            if (aIsTahfidz !== bIsTahfidz) return aIsTahfidz ? 1 : -1;
            return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
        });
    }, [currentTahsin, currentTahfidz]);

    const currentJadwal = useMemo(() => {
        if (!activeHalaqoh) return (materials.jadwal || []).filter(j => (!j.halaqoh || j.halaqoh === 'Semua') && !j.isHidden);
        const localIds = (materials.jadwal || []).filter(j => j.halaqoh === activeHalaqoh).map(j => j.id);
        const combined = (materials.jadwal || []).filter(j => {
            if (j.halaqoh === activeHalaqoh) return true;
            if ((!j.halaqoh || j.halaqoh === 'Semua') && !localIds.includes(j.id)) return true;
            return false;
        });
        return combined.filter(j => !j.isHidden);
    }, [materials.jadwal, activeHalaqoh]);

    const activeJadwal = useMemo(() => {
        if (!selectedJadwalId) return null;
        return currentJadwal.find(j => j.id.toString() === selectedJadwalId.toString()) || null;
    }, [selectedJadwalId, currentJadwal]);

    // Pisahkan jadwal menjadi mendatang dan riwayat (selesai)
    const { upcomingJadwalList, pastJadwalList } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = [];
        const past = [];
        (currentJadwal || []).forEach(j => {
            const examDate = new Date(j.tanggal);
            if (j.tanggal && j.tanggal.includes('-')) {
                const parts = j.tanggal.split('-');
                examDate.setFullYear(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            }
            examDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) upcoming.push({ ...j, daysLeft: diffDays });
            else past.push({ ...j, daysLeft: diffDays });
        });
        upcoming.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        past.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        return { upcomingJadwalList: upcoming, pastJadwalList: past };
    }, [currentJadwal]);

    const scheduledMaterialNames = useMemo(() => {
        const source = activeJadwal ? [activeJadwal] : currentJadwal;
        return new Set(source.flatMap(j => Array.isArray(j.materi) ? j.materi : []).filter(Boolean));
    }, [activeJadwal, currentJadwal]);

    const visibleTahsin = useMemo(() => {
        if (scheduledMaterialNames.size === 0) return [];
        return currentTahsin.filter(m => scheduledMaterialNames.has(m.name));
    }, [currentTahsin, scheduledMaterialNames]);

    const visibleTahfidz = useMemo(() => {
        if (scheduledMaterialNames.size === 0) return [];
        return currentTahfidz.filter(m => scheduledMaterialNames.has(m.name));
    }, [currentTahfidz, scheduledMaterialNames]);

    const hasTajwidSub = useMemo(() => visibleTahsin.some(mat => tajwidList.includes(mat.name)), [visibleTahsin]);
    const hasGhoribSub = useMemo(() => visibleTahsin.some(mat => ghoribList.includes(mat.name)), [visibleTahsin]);
    const scoreColumnCount = visibleTahsin.length + visibleTahfidz.length + (hasTajwidSub ? 1 : 0) + (hasGhoribSub ? 1 : 0);
    const examTableMinWidth = 260 + Math.max(scoreColumnCount, 1) * 142 + (visibleTahsin.length > 0 || visibleTahfidz.length > 0 ? 104 : 150) + 78;
    const renderHeaderLabel = (label) => (
        <span className="block max-w-[128px] mx-auto whitespace-normal break-normal leading-snug line-clamp-3" title={label}>
            {label}
        </span>
    );

    const studentsInHalaqoh = useMemo(() => {
        if (!activeHalaqoh) return students;
        return students.filter(s => s.halaqoh === activeHalaqoh);
    }, [students, activeHalaqoh]);

    const [localRS, setLocalRS] = useState({});
    useEffect(() => {
        const rs = materials.reportSettings || {};
        setLocalRS({
            semester: rs.semester || (new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap'),
            tahunPelajaran: rs.tahunPelajaran || (new Date().getMonth() >= 6 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`),
            namaSekolah: rs.namaSekolah || materials.institutionName || 'SDIT AL FITYAN SCHOOL BOGOR',
            alamatSekolah: rs.alamatSekolah || 'Jl. Bengkel Roda, Kp. Cipiicung.\nDesa Mekarsari. Kec. Cileungsi. Bogor',
            kepalaSekolah: rs.kepalaSekolah || 'Mei Tri Listari, S.Pd.I, M. Pd',
            tempatCetak: rs.tempatCetak || 'Bogor',
            tanggalCetak: rs.tanggalCetak || getIndonesianDate()
        });
    }, [materials.reportSettings, materials.institutionName]);

    const displayedStudents = useMemo(() => {
        let result = filteredStudents;

        if (searchQuery.trim()) {
            result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (visibleTahsin.length > 0 || visibleTahfidz.length > 0) {
            result = result.filter(s => {
                return [...visibleTahsin, ...visibleTahfidz].some(mat => 
                    !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id))
                );
            });
        }

        if (showUnscoredOnly) {
            result = result.filter(s => {
                const hasUngradedTahsin = visibleTahsin.some(mat => {                    
                    const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id));
                    if (!isAssigned) return false;
                    const score = s.ujian_records?.[mat.name];
                    return score === undefined || score === null || score.toString().trim() === '';
                });
                const hasUngradedTahfidz = visibleTahfidz.some(mat => {
                    const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id));
                    if (!isAssigned) return false;
                    const score = s.ujian_records?.[mat.name];
                    return score === undefined || score === null || score.toString().trim() === '';
                });
                return hasUngradedTahsin || hasUngradedTahfidz;
            });
        }

        return result;
    }, [filteredStudents, searchQuery, showUnscoredOnly, visibleTahsin, visibleTahfidz]);

    const presentationStudents = useMemo(() => (
        displayedStudents.length > 0 ? displayedStudents : studentsInHalaqoh
    ), [displayedStudents, studentsInHalaqoh]);

    const presentationMaterials = useMemo(() => ({
        tahsin: visibleTahsin.length > 0 ? visibleTahsin : currentTahsin,
        tahfidz: visibleTahfidz.length > 0 ? visibleTahfidz : currentTahfidz
    }), [visibleTahsin, visibleTahfidz, currentTahsin, currentTahfidz]);

    const studentsRef = useRef(students);
    const currentUserRef = useRef(currentUser);
    const showToastRef = useRef(showToast);

    useEffect(() => {
        studentsRef.current = students;
        currentUserRef.current = currentUser;
        showToastRef.current = showToast;
    }, [students, currentUser, showToast]);

    useEffect(() => {
        let isMounted = true;

        const fetchMaterials = async (retries = 3, delay = 1000) => {
            if (!isMounted) return;
            setIsLoading(true);
            try {
                // Menggunakan select('*') agar tidak error 400 jika kolom belum sempat terbuat di database
                const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
                if (error) throw error;
                
                if (isMounted && data) {
                    if (data.ujian_materials) {                        
                        const isOldFormatTahsin = data.ujian_materials.tahsin && data.ujian_materials.tahsin.length > 0 && typeof data.ujian_materials.tahsin[0] === 'string';
                        const isOldFormatTahfidz = data.ujian_materials.tahfidz && data.ujian_materials.tahfidz.length > 0 && typeof data.ujian_materials.tahfidz[0] === 'string';

                        const newTahsin = isOldFormatTahsin 
                            ? data.ujian_materials.tahsin.map(name => ({ name, students: ['all'] })) 
                            : data.ujian_materials.tahsin || [];
                        
                        const newTahfidz = isOldFormatTahfidz
                            ? data.ujian_materials.tahfidz.map(name => ({ name, students: ['all'] }))
                            : data.ujian_materials.tahfidz || [];

                        setMaterials({
                            tahsin: newTahsin,
                            tahfidz: newTahfidz,
                            jadwal: data.ujian_materials.jadwal || [],
                            reportSettings: data.ujian_materials.reportSettings || {},
                            institutionName: data.institutionname || data.institutionName || '',
                            institutionLogo: data.institutionlogo || data.institutionLogo || ''
                        });

                        if (isOldFormatTahsin || isOldFormatTahfidz) {
                            saveMaterials({ ...data.ujian_materials, tahsin: newTahsin, tahfidz: newTahfidz });
                        }
                    }
                    if (data.kkm_score !== undefined && data.kkm_score !== null) setKkmScore(data.kkm_score);
                }
                if (isMounted) setIsLoading(false);
            } catch (error) {
                console.error("Error fetching settings:", error);
                if (retries > 0 && isMounted) {
                    setTimeout(() => fetchMaterials(retries - 1, delay * 1.5), delay);
                } else if (isMounted) {
                    if (showToastRef.current) showToastRef.current('Koneksi tidak stabil (Gagal memuat materi ujian). Silakan muat ulang halaman.');
                    setIsLoading(false);
                }
            }
        };

        fetchMaterials();

        return () => { isMounted = false; };
    }, []);

    const saveMaterials = async (newMats) => {
        const { error } = await supabase.from('settings').update({ ujian_materials: newMats }).eq('id', 1);
        if (error) {
            showToast('Gagal menyimpan perubahan materi.');
        } else {
            setMaterials(prev => ({ ...newMats, institutionName: prev.institutionName || newMats.institutionName || '' }));
            showToast('Pengaturan berhasil diperbarui!');
        }
    };

    const handleSaveReportSettings = async () => {
        const normalizedKkm = Math.min(100, Math.max(0, parseInt(kkmScore, 10) || 75));
        const updatedMaterials = { ...materials, reportSettings: localRS };
        const { error } = await supabase
            .from('settings')
            .update({ ujian_materials: updatedMaterials, kkm_score: normalizedKkm })
            .eq('id', 1);

        if (error) {
            showToast('Gagal menyimpan pengaturan raport.');
            return;
        }

        setKkmScore(normalizedKkm);
        setMaterials(prev => ({ ...updatedMaterials, institutionName: prev.institutionName || updatedMaterials.institutionName || '' }));
        showToast('Pengaturan raport dan KKM berhasil diperbarui!');
    };

    const handleSaveAssignments = (type, materialName, materialHalaqoh, assignedStudentIds) => {
        let newMaterials = [...materials[type]];
        
        if (!materialHalaqoh || materialHalaqoh === 'Semua') {
            if (activeHalaqoh) {
                newMaterials = newMaterials.filter(m => !(m.name === materialName && m.halaqoh === activeHalaqoh));
                newMaterials.push({
                    name: materialName,
                    students: assignedStudentIds,
                    halaqoh: activeHalaqoh
                });
            } else {
                newMaterials = newMaterials.map(mat => 
                    mat.name === materialName && (!mat.halaqoh || mat.halaqoh === 'Semua')
                    ? { ...mat, students: assignedStudentIds }
                    : mat
                );
            }
        } else {
            newMaterials = newMaterials.map(mat => 
                mat.name === materialName && mat.halaqoh === materialHalaqoh
                ? { ...mat, students: assignedStudentIds }
                : mat
            );
        }

        const updatedMaterials = {
            ...materials,
            [type]: newMaterials
        };
        saveMaterials(updatedMaterials);
        setAssignmentModal({ isOpen: false, type: '', material: null });
    };

    const handleSaveJadwal = () => {
        if (!newJadwal.tanggal || newJadwal.materi.length === 0) {
            showToast('Tanggal dan minimal satu materi harus dipilih!');
            return;
        }
        
        const sortedJadwal = { ...newJadwal, materi: sortScheduledMateri(newJadwal.materi) };
        let updatedJadwal = [...(materials.jadwal || [])];
        if (newJadwal.id) {
            if ((!newJadwal.halaqoh || newJadwal.halaqoh === 'Semua') && activeHalaqoh) {
                updatedJadwal = updatedJadwal.filter(j => !(j.id === newJadwal.id && j.halaqoh === activeHalaqoh));
                updatedJadwal.push({ ...sortedJadwal, halaqoh: activeHalaqoh, isHidden: false });
            } else {
                updatedJadwal = updatedJadwal.map(j => (j.id === newJadwal.id && j.halaqoh === newJadwal.halaqoh) ? sortedJadwal : j);
            }
        } else {
            updatedJadwal.push({ ...sortedJadwal, id: Date.now(), halaqoh: activeHalaqoh || 'Semua' });
        }
        saveMaterials({ ...materials, jadwal: updatedJadwal });
        setNewJadwal({ tanggal: '', materi: [] });
        setIsAddingJadwal(false);
    };

    const handleDeleteJadwal = (jadwalToDelete) => {
        setConfirmDialog({
            isOpen: true,
            message: 'Yakin ingin menghapus jadwal ujian ini? (Catatan: Nilai ujian yang sudah diisi oleh siswa tidak akan ikut terhapus dan tetap aman di sistem).',
            onConfirm: () => {
                const isGlobalExists = (materials.jadwal || []).some(j => (!j.halaqoh || j.halaqoh === 'Semua') && j.id === jadwalToDelete.id);
                if (isGlobalExists && activeHalaqoh) {
                    let updatedJadwal = [...(materials.jadwal || [])];
                    updatedJadwal = updatedJadwal.filter(j => !(j.id === jadwalToDelete.id && j.halaqoh === activeHalaqoh));
                    updatedJadwal.push({ ...jadwalToDelete, halaqoh: activeHalaqoh, isHidden: true });
                    saveMaterials({ ...materials, jadwal: updatedJadwal });
                } else {
                    const updatedJadwal = (materials.jadwal || []).filter(j => !(j.id === jadwalToDelete.id && j.halaqoh === jadwalToDelete.halaqoh));
                    saveMaterials({ ...materials, jadwal: updatedJadwal });
                }
            }
        });
    };

    const handleAddTahsin = () => {
        let valueToAdd = newTahsin.trim();
        
        if (newTahsinAyatStart || newTahsinAyatEnd) {
            const start = newTahsinAyatStart || '';
            const end = newTahsinAyatEnd || '';
            const range = start && end && start !== end ? `${start}-${end}` : (start || end);
            valueToAdd = `${valueToAdd} ${range}`.trim();
        }

        if (!valueToAdd || currentTahsin.some(m => m.name === valueToAdd)) return;
        
        let newTahsinList = [...materials.tahsin];
        const existingLocalIndex = newTahsinList.findIndex(m => m.name === valueToAdd.trim() && m.halaqoh === activeHalaqoh);
        
        if (existingLocalIndex !== -1) {
             newTahsinList[existingLocalIndex] = { name: valueToAdd.trim(), students: ['all'], halaqoh: activeHalaqoh };
        } else {
             newTahsinList.push({ name: valueToAdd.trim(), students: ['all'], halaqoh: activeHalaqoh || 'Semua' });
        }

        const updated = { ...materials, tahsin: newTahsinList };
        saveMaterials(updated);
        setNewTahsin('');
        setNewTahsinAyatStart('');
        setNewTahsinAyatEnd('');
    };

    const handleAddTahfidz = () => {
        let valueToAdd = newTahfidz.trim();
        
        if (newTahfidzAyatStart || newTahfidzAyatEnd) {
            const start = newTahfidzAyatStart || '';
            const end = newTahfidzAyatEnd || '';
            const range = start && end && start !== end ? `${start}-${end}` : (start || end);
            valueToAdd = `${valueToAdd} ${range}`.trim();
        }

        if (!valueToAdd || currentTahfidz.some(m => m.name === valueToAdd)) return;
        
        let newTahfidzList = [...materials.tahfidz];
        const existingLocalIndex = newTahfidzList.findIndex(m => m.name === valueToAdd.trim() && m.halaqoh === activeHalaqoh);
        
        if (existingLocalIndex !== -1) {
             newTahfidzList[existingLocalIndex] = { name: valueToAdd.trim(), students: ['all'], halaqoh: activeHalaqoh };
        } else {
             newTahfidzList.push({ name: valueToAdd.trim(), students: ['all'], halaqoh: activeHalaqoh || 'Semua' });
        }

        const updated = { ...materials, tahfidz: newTahfidzList };
        saveMaterials(updated);
        setNewTahfidz('');
        setNewTahfidzAyatStart('');
        setNewTahfidzAyatEnd('');
    };

    const handleEditMaterialName = (type, matToEdit) => {
        const newName = window.prompt(`Edit nama materi ${type}:`, matToEdit.name);
        if (!newName || newName.trim() === '' || newName.trim() === matToEdit.name) return;
        
        const finalNewName = newName.trim();
        if (materials[type].some(m => m.name === finalNewName && m.halaqoh === matToEdit.halaqoh)) {
            showToast('Nama materi sudah ada!');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            message: `Yakin ingin mengubah nama materi dari "${matToEdit.name}" menjadi "${finalNewName}"? Nilai siswa yang sudah tersimpan akan otomatis disesuaikan.`,
            onConfirm: async () => {
                const isGlobalExists = materials[type].some(m => (!m.halaqoh || m.halaqoh === 'Semua') && m.name === matToEdit.name);
                let newMaterials = [...materials[type]];

                if (isGlobalExists && activeHalaqoh && (!matToEdit.halaqoh || matToEdit.halaqoh === 'Semua')) {
                    newMaterials = newMaterials.filter(m => !(m.name === matToEdit.name && m.halaqoh === activeHalaqoh));
                    const globalIndex = newMaterials.findIndex(m => m.name === matToEdit.name && (!m.halaqoh || m.halaqoh === 'Semua'));
                    newMaterials.push({ name: matToEdit.name, students: ['HIDDEN'], halaqoh: activeHalaqoh });
                    newMaterials.splice(globalIndex !== -1 ? globalIndex + 1 : newMaterials.length, 0, { name: finalNewName, students: matToEdit.students, halaqoh: activeHalaqoh });
                } else {
                    newMaterials = newMaterials.map(m => {
                        if (m.name === matToEdit.name && m.halaqoh === matToEdit.halaqoh) {
                            return { ...m, name: finalNewName };
                        }
                        return m;
                    });
                }

                const updatedMaterialsState = { ...materials, [type]: newMaterials };

                if (updatedMaterialsState.jadwal) {
                    let newJadwalList = [...updatedMaterialsState.jadwal];
                    if (isGlobalExists && activeHalaqoh && (!matToEdit.halaqoh || matToEdit.halaqoh === 'Semua')) {
                        const globalsToOverride = newJadwalList.filter(j => (!j.halaqoh || j.halaqoh === 'Semua') && j.materi.includes(matToEdit.name) && !newJadwalList.some(localJ => localJ.id === j.id && localJ.halaqoh === activeHalaqoh));
                        globalsToOverride.forEach(j => {
                            newJadwalList.push({ ...j, halaqoh: activeHalaqoh, materi: j.materi.map(mName => mName === matToEdit.name ? finalNewName : mName), isHidden: false });
                        });
                        newJadwalList = newJadwalList.map(j => {
                            if (j.halaqoh === activeHalaqoh && j.materi.includes(matToEdit.name)) return { ...j, materi: j.materi.map(mName => mName === matToEdit.name ? finalNewName : mName) };
                            return j;
                        });
                    } else {
                        newJadwalList = newJadwalList.map(j => {
                            if (j.materi.includes(matToEdit.name) && (j.halaqoh === matToEdit.halaqoh || (!matToEdit.halaqoh && !j.halaqoh) || (matToEdit.halaqoh === 'Semua' && j.halaqoh === 'Semua'))) return { ...j, materi: j.materi.map(matName => matName === matToEdit.name ? finalNewName : matName) };
                            return j;
                        });
                    }
                    updatedMaterialsState.jadwal = newJadwalList;
                }

                saveMaterials(updatedMaterialsState);

                const studentsToUpdate = students.filter(s => s.ujian_records && s.ujian_records[matToEdit.name] !== undefined);
                if (studentsToUpdate.length > 0) {
                    const updates = studentsToUpdate.map(s => {
                        if (isGlobalExists && activeHalaqoh && (!matToEdit.halaqoh || matToEdit.halaqoh === 'Semua')) {
                            if (s.halaqoh !== activeHalaqoh) return null;
                        } else if (matToEdit.halaqoh && matToEdit.halaqoh !== 'Semua') {
                            if (s.halaqoh !== matToEdit.halaqoh) return null;
                        }

                        const newRecords = { ...s.ujian_records };
                        newRecords[finalNewName] = newRecords[matToEdit.name];
                        delete newRecords[matToEdit.name];
                        return { id: s.id, ujian_records: newRecords };
                    }).filter(Boolean);

                    if (updates.length > 0) {
                        const CHUNK_SIZE = 250;
                        for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
                            const chunk = updates.slice(i, i + CHUNK_SIZE);
                            await supabase.from('students').upsert(chunk.map(u => ({ id: u.id, ujian_records: u.ujian_records })));
                        }

                        setStudents(prev => {
                            const newStudents = [...prev];
                            updates.forEach(u => {
                                const idx = newStudents.findIndex(s => s.id === u.id);
                                if (idx !== -1) newStudents[idx].ujian_records = u.ujian_records;
                            });
                            return newStudents;
                        });
                    }
                }
            }
        });
    };

    const handleRemoveMaterial = (type, matToDelete) => {
        setConfirmDialog({
            isOpen: true,
            message: 'Yakin ingin menghapus materi ini? Nilai siswa yang sudah diinput untuk materi ini akan tetap tersimpan, namun tidak akan tampil lagi di tabel.',
            onConfirm: () => {
                const isGlobalExists = materials[type].some(m => (!m.halaqoh || m.halaqoh === 'Semua') && m.name === matToDelete.name);
                if (isGlobalExists && activeHalaqoh) {
                    let newMaterials = materials[type].filter(m => !(m.name === matToDelete.name && m.halaqoh === activeHalaqoh));
                    newMaterials.push({ name: matToDelete.name, students: ['HIDDEN'], halaqoh: activeHalaqoh });
                    saveMaterials({ ...materials, [type]: newMaterials });
                } else {
                    const arr = materials[type].filter(m => m !== matToDelete);
                    saveMaterials({ ...materials, [type]: arr });
                }
            }
        });
    };

    const handleDragStartMat = (e, type, name) => {
        e.stopPropagation();
        setDragMatInfo({ type, name });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${type}|${name}`);
    };

    const handleDragOverMat = (e, type, name) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragMatInfo?.type === type && dragOverMatInfo?.name !== name) {
            setDragOverMatInfo({ type, name });
        }
    };

    const handleDropMat = (e, type, targetName) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragMatInfo || dragMatInfo.type !== type || dragMatInfo.name === targetName) {
            setDragMatInfo(null);
            setDragOverMatInfo(null);
            return;
        }
        const draggedName = dragMatInfo.name;
        let newMaterialsList = [...materials[type]];
        let uniqueNames = [...new Set(newMaterialsList.map(m => m.name))];
        const draggedIdx = uniqueNames.indexOf(draggedName);
        const targetIdx = uniqueNames.indexOf(targetName);
        if (draggedIdx !== -1 && targetIdx !== -1) {
            const [draggedItemName] = uniqueNames.splice(draggedIdx, 1);
            uniqueNames.splice(targetIdx, 0, draggedItemName);
            newMaterialsList.sort((a, b) => uniqueNames.indexOf(a.name) - uniqueNames.indexOf(b.name));
            saveMaterials({ ...materials, [type]: newMaterialsList });
        }
        setDragMatInfo(null);
        setDragOverMatInfo(null);
    };

    const handleDragEndMat = () => { setDragMatInfo(null); setDragOverMatInfo(null); };

    const handleTouchStartMat = (e, type, name) => { setDragMatInfo({ type, name }); };

    const handleTouchMoveMat = (e, type) => {
        if (!dragMatInfo || dragMatInfo.type !== type) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const li = target?.closest('[data-mat-name]');
        if (li) {
            const hoverName = li.getAttribute('data-mat-name');
            const hoverType = li.getAttribute('data-mat-type');
            if (hoverType === type && hoverName !== dragOverMatInfo?.name) setDragOverMatInfo({ type, name: hoverName });
        }
    };

    const handleTouchEndMat = () => {
        if (dragMatInfo && dragOverMatInfo && dragMatInfo.type === dragOverMatInfo.type && dragMatInfo.name !== dragOverMatInfo.name) {
            const type = dragMatInfo.type; const draggedName = dragMatInfo.name; const targetName = dragOverMatInfo.name;
            let newMaterialsList = [...materials[type]]; let uniqueNames = [...new Set(newMaterialsList.map(m => m.name))];
            const draggedIdx = uniqueNames.indexOf(draggedName); const targetIdx = uniqueNames.indexOf(targetName);
            if (draggedIdx !== -1 && targetIdx !== -1) {
                const [draggedItemName] = uniqueNames.splice(draggedIdx, 1);
                uniqueNames.splice(targetIdx, 0, draggedItemName);
                newMaterialsList.sort((a, b) => uniqueNames.indexOf(a.name) - uniqueNames.indexOf(b.name));
                saveMaterials({ ...materials, [type]: newMaterialsList });
            }
        }
        setDragMatInfo(null); setDragOverMatInfo(null);
    };

    const formatDateForJadwal = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
                return `${days[d.getDay()]}, ${day} ${months[month]} ${year}`;
            }
        } catch {
            // Fallback ke parser Date bawaan di bawah.
        }
        const d = new Date(dateStr);
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

    const classAverages = useMemo(() => {
        const tahsinAvgs = visibleTahsin.map(mat => {
            const scores = displayedStudents
                .filter(s => !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id)))
                .map(s => parseFloat(s.ujian_records?.[mat.name]))
                .filter(n => !isNaN(n));
            return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        });

        const tahfidzAvgs = visibleTahfidz.map(mat => {
            const scores = displayedStudents
                .filter(s => !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id)))
                .map(s => parseFloat(s.ujian_records?.[mat.name]))
                .filter(n => !isNaN(n));
            return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        });

        const allTajwidScores = displayedStudents.flatMap(s => 
            visibleTahsin
                .filter(m => tajwidList.includes(m.name))
                .filter(m => !m.students || m.students.includes('all') || m.students.some(id => String(id) === String(s.id)))
                .map(m => parseFloat(s.ujian_records?.[m.name]))
                .filter(n => !isNaN(n))
        );
        const tajwidAvg = allTajwidScores.length > 0 ? (allTajwidScores.reduce((a, b) => a + b, 0) / allTajwidScores.length).toFixed(1) : '-';

        const allGhoribScores = displayedStudents.flatMap(s => 
            visibleTahsin
                .filter(m => ghoribList.includes(m.name))
                .filter(m => !m.students || m.students.includes('all') || m.students.some(id => String(id) === String(s.id)))
                .map(m => parseFloat(s.ujian_records?.[m.name]))
                .filter(n => !isNaN(n))
        );
        const ghoribAvg = allGhoribScores.length > 0 ? (allGhoribScores.reduce((a, b) => a + b, 0) / allGhoribScores.length).toFixed(1) : '-';

        let totalAll = 0; let countAll = 0;
        displayedStudents.forEach(s => {
            visibleTahsin.forEach(mat => { if (!mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id))) { const val = parseFloat(s.ujian_records?.[mat.name]); if (!isNaN(val)) { totalAll += val; countAll++; } } });
            visibleTahfidz.forEach(mat => { if (!mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(s.id))) { const val = parseFloat(s.ujian_records?.[mat.name]); if (!isNaN(val)) { totalAll += val; countAll++; } } });
        });
        const overallAvgAll = countAll > 0 ? (totalAll / countAll).toFixed(1) : '-';

        return { tahsinAvgs, tahfidzAvgs, tajwidAvg, ghoribAvg, overallAvgAll };
    }, [displayedStudents, visibleTahsin, visibleTahfidz]);

    const handleSaveScore = React.useCallback(async (studentId, materialName, score) => {
        const student = studentsRef.current.find(s => s.id === studentId);
        if (!student) return;

        const currentRecords = student.ujian_records || {};
        const updatedRecords = { ...currentRecords, [materialName]: score };

        // Update UI seketika
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ujian_records: updatedRecords } : s));

        // Simpan ke DB
        const { error } = await supabase.from('students').update({ ujian_records: updatedRecords }).eq('id', studentId);
        if (error) {
            showToastRef.current('Gagal menyimpan nilai ke server.');
        }
        else {
            try {
                await supabase.from('activity_logs').insert([{
                    guru_name: currentUserRef.current?.name || 'System / Unknown',
                    action: 'Mengisi Nilai Ujian',
                    details: `Siswa: ${student.name}\nMateri: ${materialName}\nNilai: ${score || '[Dikosongkan]'}`
                }]);
            } catch (logErr) {
                console.error('Gagal mencatat log aktivitas:', logErr);
            }
        }
    }, [setStudents]);

    const handleDownloadPDF = async () => {
        setIsDownloadingPdf(true);
        try {
            await document.fonts.ready;
            if (!window.htmlToImage) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
                document.body.appendChild(script);
                await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
            }
            if (!window.jspdf) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.body.appendChild(script);
                await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
            }

            const { jsPDF } = window.jspdf;
            const element = document.getElementById('ujian-report-container');

            if (element) {
                const tableContainer = element.querySelector('.overflow-x-auto');
                let originalOverflow = '';
                if (tableContainer) {
                    originalOverflow = tableContainer.style.overflow;
                    tableContainer.style.overflow = 'visible';
                }

                const imgData = await window.htmlToImage.toJpeg(element, { quality: 0.9, pixelRatio: 1.5, backgroundColor: '#ffffff' });

                if (tableContainer) tableContainer.style.overflow = originalOverflow;

                const img = new Image();
                img.src = imgData;
                await new Promise(r => img.onload = r);

                const pdf = new jsPDF('l', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const fitRatio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
                const finalW = img.width * fitRatio;
                const finalH = img.height * fitRatio;
                const x = (pdfWidth - finalW) / 2;
                const y = (pdfHeight - finalH) / 2;

                pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
                const safeHalaqoh = String(activeHalaqoh || 'Semua').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                pdf.save(`Laporan_Ujian_${safeHalaqoh}.pdf`);
                showToast('Laporan PDF berhasil diunduh!');
            }
        } catch (error) {
            console.error("Gagal mengunduh PDF:", error);
            showToast("Maaf, terjadi kesalahan saat membuat PDF.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleExportCSV = () => {
        const tahsinHeaders = visibleTahsin.map(m => m.name);
        const tahfidzHeaders = visibleTahfidz.map(m => m.name);
        const headers = ['Nama Siswa', ...tahsinHeaders, ...tahfidzHeaders, 'Rata-Rata Akhir'];
        const rows = displayedStudents.map(student => {
            const row = [student.name];
            let total = 0;
            let count = 0;
            visibleTahsin.forEach(mat => {
                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                const val = isAssigned ? (student.ujian_records?.[mat.name] || '-') : 'N/A';
                row.push(val);
                if (isAssigned && val !== '-' && !isNaN(parseFloat(val))) {
                    total += parseFloat(val);
                    count++;
                }
            });
            visibleTahfidz.forEach(mat => {
                const isAssigned = !mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(student.id));
                const val = isAssigned ? (student.ujian_records?.[mat.name] || '-') : 'N/A';
                row.push(val);
                if (isAssigned && val !== '-' && !isNaN(parseFloat(val))) {
                    total += parseFloat(val);
                    count++;
                }
            });
            const avg = count > 0 ? (total / count).toFixed(1) : '-';
            row.push(avg);
            return row.map(cell => `"${cell}"`).join(',');
        });
        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Nilai_Ujian_${activeHalaqoh || 'Semua'}.csv`;
        link.click();
        showToast('Rekap nilai ujian berhasil diunduh!');
    };

    const handlePrint = async () => {
        window.print();
        try {
            await supabase.from('activity_logs').insert([{
                guru_name: currentUser?.name || 'System / Unknown',
                action: 'Mencetak Laporan Ujian',
                details: `Halaqoh: ${activeHalaqoh || 'Semua Kelompok'}`
            }]);
        } catch (logErr) {
            console.error('Gagal mencatat log aktivitas:', logErr);
        }
    };

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center py-20 text-emerald-500"><Loader2 size={40} className="animate-spin mb-4" /></div>;
    }

    if (activePrintStudent) {
        return (
            <QuranReportWizard
                student={activePrintStudent}
                onClose={() => setActivePrintStudent(null)}
                materials={materials}
                showToast={showToast}
                kkmScore={kkmScore}
                activeHalaqoh={activeHalaqoh}
                institutionLogo={institutionLogo}
                reportStudents={studentsInHalaqoh}
                setStudents={setStudents}
            />
        );
    }

    return (
        <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto min-h-full pb-24 md:pb-8 animate-in fade-in duration-500">
            {/* Style khusus untuk cetak halaman ujian */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    html, body {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }

                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                    *, *::before, *::after { box-sizing: border-box !important; }
                    
                    /* Paksa warna tinta tulisan jadi hitam pekat saat mencetak via Dark Mode */
                    body * { color: black !important; }
                    
                    /* Sembunyikan elemen luar main agar tidak makan tempat (Header, FilterBar) */
                    #root > div > :not(main):not(style) { display: none !important; }
                    
                    /* Lepaskan semua container yang membatasi scroll di cetakan */
                    html, body, #root, #root > div, main, main > div { 
                        height: auto !important; 
                        min-height: auto !important;
                        overflow: visible !important; 
                        position: static !important; 
                        display: block !important;
                    }
                    .custom-scrollbar { 
                        height: auto !important; 
                        overflow: visible !important; 
                        position: static !important;
                    }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
            `}} />

            {/* Header Laporan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-5 sm:gap-6 relative overflow-hidden print:hidden transition-colors">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full sm:w-auto">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-[#00e676] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md sm:shadow-lg shadow-emerald-200/50 dark:shadow-none shrink-0 transform -rotate-3"><Award size={28} className="sm:w-8 sm:h-8" /></div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight truncate">Ujian {activeHalaqoh ? `(${activeHalaqoh})` : '(Semua Halaqoh)'}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 line-clamp-1">Kelola Materi &amp; Nilai Akhir Semester</p>
                    </div>
                </div>
                <div className="flex items-center justify-center w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 sm:p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex-1 sm:flex-none px-4 py-1.5 sm:py-2 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</span>
                        <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{filteredStudents.length}</span>
                    </div>
                    <div className="flex-1 sm:flex-none px-4 py-1.5 sm:py-2 flex flex-col items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Terjadwal</span>
                        <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{visibleTahsin.length + visibleTahfidz.length}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigasi & Aksi */}
            <div className="mb-6 print:hidden">
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 sm:p-3 shadow-sm">
                    <div className="flex flex-col gap-3">
                        <div className="rounded-xl bg-slate-100/80 dark:bg-slate-800/80 p-1.5 shadow-inner w-full lg:w-fit">
                            <div className="grid grid-cols-3 gap-1 min-w-0 lg:min-w-[520px]">
                                <button onClick={() => setActiveTab('penilaian')} className={`min-w-0 flex items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-black transition-all duration-300 whitespace-nowrap ${activeTab === 'penilaian' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/70 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                    <ClipboardList size={16} className="shrink-0" /> <span className="hidden sm:inline">Penilaian</span><span className="sm:hidden">Nilai</span>
                                </button>
                                <button onClick={() => setActiveTab('jadwal')} className={`min-w-0 flex items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-black transition-all duration-300 whitespace-nowrap ${activeTab === 'jadwal' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/70 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                    <Calendar size={16} className="shrink-0" /> Jadwal
                                </button>
                                <button onClick={() => setActiveTab('materi')} className={`min-w-0 flex items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-black transition-all duration-300 whitespace-nowrap ${activeTab === 'materi' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/70 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                    <Settings size={16} className="shrink-0" /> <span className="hidden sm:inline">Atur Materi</span><span className="sm:hidden">Materi</span>
                                </button>
                            </div>
                        </div>

                        {activeTab === 'penilaian' && (
                            <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_150px_112px_92px_92px_92px] xl:grid-cols-[minmax(280px,430px)_150px_112px_92px_92px_92px] gap-2 w-full min-w-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                {currentJadwal && currentJadwal.length > 0 ? (
                                    <div className="relative col-span-2 md:col-span-1 min-w-0">
                                        <select
                                            value={selectedJadwalId}
                                            onChange={(e) => setSelectedJadwalId(e.target.value)}
                                            className="w-full h-10 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 pr-9 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 shadow-sm outline-none appearance-none cursor-pointer transition-colors hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Materi Terjadwal</option>
                                            {currentJadwal.map(j => (
                                                <option key={j.id} value={j.id}>Jadwal: {formatDateForJadwal(j.tanggal)} ({j.materi.length} Materi)</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="hidden sm:block" />
                                )}
                                <label className="h-10 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={showUnscoredOnly}
                                        onChange={(e) => setShowUnscoredOnly(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                    />
                                    Belum Dinilai
                                </label>
                                <button onClick={() => setIsPresentationOpen(true)} disabled={presentationStudents.length === 0} className="h-10 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50">
                                    <Presentation size={16} className="shrink-0" /> <span>Presentasi</span>
                                </button>
                                <button onClick={handleExportCSV} className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap">
                                    <Download size={16} className="shrink-0" /> <span>Excel</span>
                                </button>
                                <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50">
                                    {isDownloadingPdf ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileText size={16} className="shrink-0" />}
                                    <span>PDF</span>
                                </button>
                                <button onClick={handlePrint} className="h-10 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-3 flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap">
                                    <Printer size={16} className="shrink-0" /> <span>Cetak</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KOTAK PENCARIAN SISWA (MENGAMBANG) */}
            {activeTab === 'penilaian' && (
                <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 mb-4 transition-all print:hidden border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <div className="relative shadow-sm hover:shadow-md transition-shadow rounded-xl max-w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        <input
                            type="text"
                            inputMode="search"
                            enterKeyHint="search"
                            placeholder="Cari nama siswa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-full transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- TAB MATERI --- */}
            {activeTab === 'materi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
                    {/* Card Tahsin */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-500 rounded-2xl shadow-sm"><BookOpen size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">Materi Tahsin</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">Teori, tajwid, makharijul huruf</p>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3 mb-6">
                            <TahsinSelector value={newTahsin} onChange={setNewTahsin} onEnter={handleAddTahsin} placeholder="Pilih Materi (Tilawah, Tajwid, dll)..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 dark:text-slate-100 placeholder:text-slate-400 pr-10" />
                            <div className="flex items-center gap-2">
                                <AyatSelector 
                                    surahName={tahsinSurahMatch ? `${tahsinSurahMatch.no}. ${tahsinSurahMatch.name}` : newTahsin} 
                                    surahList={surahList} 
                                    value={newTahsinAyatStart} 
                                    onChange={setNewTahsinAyatStart} 
                                    maxAyat={newTahsinAyatEnd} 
                                    placeholder="Ayat Awal" 
                                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 dark:text-slate-100 disabled:opacity-50" 
                                    disabled={!tahsinSurahMatch}
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <AyatSelector 
                                    surahName={tahsinSurahMatch ? `${tahsinSurahMatch.no}. ${tahsinSurahMatch.name}` : newTahsin} 
                                    surahList={surahList} 
                                    value={newTahsinAyatEnd} 
                                    onChange={setNewTahsinAyatEnd} 
                                    minAyat={newTahsinAyatStart} 
                                    placeholder="Akhir" 
                                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 dark:text-slate-100 disabled:opacity-50" 
                                    disabled={!tahsinSurahMatch}
                                />
                            </div>
                            <button onClick={() => handleAddTahsin()} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95 shrink-0"><Plus size={18} /> <span className="lg:hidden">Tambah</span></button>
                        </div>
                        <ul className="space-y-3" onTouchMove={(e) => handleTouchMoveMat(e, 'tahsin')} onTouchEnd={handleTouchEndMat}>
                            {currentTahsin.length === 0 && <li className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada materi Tahsin.</p></li>}
                            {currentTahsin.map((mat, i) => (
                                <li key={i} 
                                    data-mat-name={mat.name}
                                    data-mat-type="tahsin"
                                    draggable
                                    onDragStart={(e) => handleDragStartMat(e, 'tahsin', mat.name)}
                                    onDragOver={(e) => handleDragOverMat(e, 'tahsin', mat.name)}
                                    onDrop={(e) => handleDropMat(e, 'tahsin', mat.name)}
                                    onDragEnd={handleDragEndMat}
                                    className={`flex justify-between items-center bg-white dark:bg-slate-800 px-3 sm:px-5 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border ${dragOverMatInfo?.type === 'tahsin' && dragOverMatInfo?.name === mat.name ? 'border-blue-500 scale-[1.02] shadow-md z-10 relative' : 'border-slate-100 dark:border-slate-700'} shadow-sm group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing ${dragMatInfo?.type === 'tahsin' && dragMatInfo?.name === mat.name ? 'opacity-50 grayscale' : 'opacity-100'} gap-2`}>
                                    <span className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className="text-slate-300 group-hover:text-slate-400 cursor-grab touch-none flex items-center -ml-2 sm:-ml-2 mr-0 sm:mr-1 shrink-0" onTouchStart={(e) => handleTouchStartMat(e, 'tahsin', mat.name)}>
                                            <GripVertical size={16} />
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                        <span className="truncate flex-1 text-xs sm:text-sm" title={mat.name}>{mat.name}</span>
                                    {(!mat.halaqoh || mat.halaqoh === 'Semua') && <span className="ml-1 sm:ml-2 text-[8px] sm:text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0" title="Materi ini berlaku untuk semua halaqoh.">Global</span>}
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                        <button onClick={() => setAssignmentModal({ isOpen: true, type: 'tahsin', material: mat })} className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700">
                                            <Users size={12} />
                                            <span className="hidden sm:inline">{mat.students.includes('all') ? 'Semua Siswa' : `${mat.students.length} Siswa`}</span>
                                            <span className="sm:hidden">{mat.students.includes('all') ? 'Semua' : `${mat.students.length}`}</span>
                                        </button>
                                        <button onClick={() => handleEditMaterialName('tahsin', mat)} className="text-slate-400 sm:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-1.5 sm:p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Edit Nama Materi"><Edit3 size={14} className="sm:w-4 sm:h-4" /></button>
                                        <button onClick={() => handleRemoveMaterial('tahsin', mat)} className="text-slate-400 sm:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 sm:p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Hapus Materi"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Card Tahfidz */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="p-3 bg-purple-50 dark:bg-purple-500/20 text-purple-500 rounded-2xl shadow-sm"><Mic size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">Materi Tahfidz</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">Hafalan surah-surah Al-Qur&apos;an</p>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3 mb-6">
                            <TahfidzSelector value={newTahfidz} onChange={setNewTahfidz} onEnter={handleAddTahfidz} surahList={surahList} placeholder="Pilih Materi (Surat, Juz, dll)..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700 dark:text-slate-100 placeholder:text-slate-400 pr-10" />
                            <div className="flex items-center gap-2">
                                <AyatSelector 
                                    surahName={tahfidzSurahMatch ? `${tahfidzSurahMatch.no}. ${tahfidzSurahMatch.name}` : newTahfidz} 
                                    surahList={surahList} 
                                    value={newTahfidzAyatStart} 
                                    onChange={setNewTahfidzAyatStart} 
                                    maxAyat={newTahfidzAyatEnd} 
                                    placeholder="Ayat Awal" 
                                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700 dark:text-slate-100 disabled:opacity-50" 
                                    disabled={!tahfidzSurahMatch}
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <AyatSelector 
                                    surahName={tahfidzSurahMatch ? `${tahfidzSurahMatch.no}. ${tahfidzSurahMatch.name}` : newTahfidz} 
                                    surahList={surahList} 
                                    value={newTahfidzAyatEnd} 
                                    onChange={setNewTahfidzAyatEnd} 
                                    minAyat={newTahfidzAyatStart} 
                                    placeholder="Akhir" 
                                    className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700 dark:text-slate-100 disabled:opacity-50" 
                                    disabled={!tahfidzSurahMatch}
                                />
                            </div>
                            <button onClick={() => handleAddTahfidz()} className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-xl transition-all shadow-sm shadow-purple-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95 shrink-0"><Plus size={18} /> <span className="lg:hidden">Tambah</span></button>
                        </div>
                        <ul className="space-y-3" onTouchMove={(e) => handleTouchMoveMat(e, 'tahfidz')} onTouchEnd={handleTouchEndMat}>
                            {currentTahfidz.length === 0 && <li className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada materi Tahfidz.</p></li>}
                            {currentTahfidz.map((mat, i) => (
                                <li key={i} 
                                    data-mat-name={mat.name}
                                    data-mat-type="tahfidz"
                                    draggable
                                    onDragStart={(e) => handleDragStartMat(e, 'tahfidz', mat.name)}
                                    onDragOver={(e) => handleDragOverMat(e, 'tahfidz', mat.name)}
                                    onDrop={(e) => handleDropMat(e, 'tahfidz', mat.name)}
                                    onDragEnd={handleDragEndMat}
                                    className={`flex justify-between items-center bg-white dark:bg-slate-800 px-3 sm:px-5 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border ${dragOverMatInfo?.type === 'tahfidz' && dragOverMatInfo?.name === mat.name ? 'border-purple-500 scale-[1.02] shadow-md z-10 relative' : 'border-slate-100 dark:border-slate-700'} shadow-sm group hover:border-purple-200 dark:hover:border-purple-500/30 transition-all cursor-grab active:cursor-grabbing ${dragMatInfo?.type === 'tahfidz' && dragMatInfo?.name === mat.name ? 'opacity-50 grayscale' : 'opacity-100'} gap-2`}>
                                    <span className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                        <div className="text-slate-300 group-hover:text-slate-400 cursor-grab touch-none flex items-center -ml-2 sm:-ml-2 mr-0 sm:mr-1 shrink-0" onTouchStart={(e) => handleTouchStartMat(e, 'tahfidz', mat.name)}>
                                            <GripVertical size={16} />
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></div>
                                        <span className="truncate flex-1 text-xs sm:text-sm" title={mat.name}>{mat.name}</span>
                                    {(!mat.halaqoh || mat.halaqoh === 'Semua') && <span className="ml-1 sm:ml-2 text-[8px] sm:text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0" title="Materi ini berlaku untuk semua halaqoh.">Global</span>}
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                        <button onClick={() => setAssignmentModal({ isOpen: true, type: 'tahfidz', material: mat })} className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border border-slate-200 dark:border-slate-700">
                                            <Users size={12} />
                                            <span className="hidden sm:inline">{mat.students.includes('all') ? 'Semua Siswa' : `${mat.students.length} Siswa`}</span>
                                            <span className="sm:hidden">{mat.students.includes('all') ? 'Semua' : `${mat.students.length}`}</span>
                                        </button>
                                        <button onClick={() => handleEditMaterialName('tahfidz', mat)} className="text-slate-400 sm:text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 p-1.5 sm:p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Edit Nama Materi"><Edit3 size={14} className="sm:w-4 sm:h-4" /></button>
                                        <button onClick={() => handleRemoveMaterial('tahfidz', mat)} className="text-slate-400 sm:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 sm:p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" title="Hapus Materi"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Card Pengaturan Raport */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-md md:col-span-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 rounded-2xl shadow-sm"><Settings size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">Pengaturan Global Raport</h2>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">Identitas sekolah & periode untuk cetak raport</p>
                                </div>
                            </div>
                            <button onClick={handleSaveReportSettings} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95">
                                <Check size={18} /> Simpan Pengaturan
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">KKM Nilai Ujian</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={kkmScore}
                                    onChange={e => {
                                        const rawValue = e.target.value;
                                        if (rawValue === '') {
                                            setKkmScore('');
                                            return;
                                        }
                                        const nextValue = Math.min(100, Math.max(0, parseInt(rawValue, 10) || 0));
                                        setKkmScore(nextValue);
                                    }}
                                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Semester</label>
                                <select value={localRS.semester || ''} onChange={e => setLocalRS({ ...localRS, semester: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all">
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tahun Pelajaran</label>
                                <input type="text" value={localRS.tahunPelajaran || ''} onChange={e => setLocalRS({ ...localRS, tahunPelajaran: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal Raport</label>
                                <input type="text" value={localRS.tanggalCetak || ''} onChange={e => setLocalRS({ ...localRS, tanggalCetak: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tempat Pengesahan</label>
                                <input type="text" value={localRS.tempatCetak || ''} onChange={e => setLocalRS({ ...localRS, tempatCetak: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama Sekolah</label>
                                <input type="text" value={localRS.namaSekolah || ''} onChange={e => setLocalRS({ ...localRS, namaSekolah: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all uppercase" />
                            </div>
                            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nama Kepala Sekolah</label>
                                <input type="text" value={localRS.kepalaSekolah || ''} onChange={e => setLocalRS({ ...localRS, kepalaSekolah: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all" />
                            </div>
                            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Alamat Sekolah</label>
                                <textarea rows={2} value={localRS.alamatSekolah || ''} onChange={e => setLocalRS({ ...localRS, alamatSekolah: e.target.value })} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-100 transition-all leading-relaxed" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB JADWAL --- */}
            {activeTab === 'jadwal' && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500 rounded-2xl shadow-sm"><CalendarDays size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">Jadwal Ujian</h2>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">Jadwalkan ujian berdasarkan materi yang terdaftar</p>
                                </div>
                            </div>
                            {!isAddingJadwal && (
                                <button onClick={() => {
                                    setNewJadwal({ tanggal: '', materi: [] });
                                    setIsAddingJadwal(true);
                                }} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                                    <Plus size={18} /> Tambah Jadwal
                                </button>
                            )}
                        </div>

                        {isAddingJadwal && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-slate-700 dark:text-slate-200">{newJadwal.id ? 'Edit Jadwal Ujian' : 'Buat Jadwal Baru'}</h3>
                                    <button onClick={() => setIsAddingJadwal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                                </div>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <div className="flex flex-col gap-1.5 w-full sm:w-1/2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal Ujian</label>
                                        <input type="date" value={newJadwal.tanggal} onChange={e => setNewJadwal({...newJadwal, tanggal: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-100 transition-all" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Pilih Materi yang Diujikan</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {currentTahsin.map((m, i) => (
                                                <label key={`t-${i}`} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${newJadwal.materi.includes(m.name) ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-500/30 dark:border-indigo-500/50 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 hover:border-indigo-200'}`}>
                                                    <input type="checkbox" className="hidden" checked={newJadwal.materi.includes(m.name)} onChange={(e) => {
                                                        const updated = e.target.checked ? [...newJadwal.materi, m.name] : newJadwal.materi.filter(x => x !== m.name);
                                                        setNewJadwal({...newJadwal, materi: updated});
                                                    }} />
                                                    {m.name}
                                                </label>
                                            ))}
                                            {currentTahfidz.map((m, i) => (
                                                <label key={`f-${i}`} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${newJadwal.materi.includes(m.name) ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-500/30 dark:border-indigo-500/50 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 hover:border-indigo-200'}`}>
                                                    <input type="checkbox" className="hidden" checked={newJadwal.materi.includes(m.name)} onChange={(e) => {
                                                        const updated = e.target.checked ? [...newJadwal.materi, m.name] : newJadwal.materi.filter(x => x !== m.name);
                                                        setNewJadwal({...newJadwal, materi: updated});
                                                    }} />
                                                    {m.name}
                                                </label>
                                            ))}
                                            {currentTahsin.length === 0 && currentTahfidz.length === 0 && (
                                                <span className="text-xs text-slate-400 font-medium">Belum ada materi terdaftar di Atur Materi.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button onClick={handleSaveJadwal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                                        <Check size={18} /> Simpan Jadwal
                                    </button>
                                </div>
                            </div>
                        )}

                        {(!currentJadwal || currentJadwal.length === 0) ? (
                            !isAddingJadwal && (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <CalendarDays size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada jadwal ujian yang dibuat.</p>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari berdasarkan nama materi..." 
                                        value={jadwalFilter}
                                        onChange={(e) => setJadwalFilter(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-100"
                                    />
                                </div>

                                {/* JADWAL MENDATANG */}
                                {upcomingJadwalList.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2 px-1"><Calendar size={18} /> Jadwal Mendatang ({upcomingJadwalList.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {upcomingJadwalList.filter(j => !jadwalFilter || j.materi.some(m => m.toLowerCase().includes(jadwalFilter.toLowerCase()))).map((jadwal, idx) => (
                                            <div key={jadwal.id || idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group shadow-sm hover:shadow-md transition-all overflow-hidden">
                                                <div className={`absolute top-0 right-0 text-[9px] font-black px-2.5 py-1 rounded-bl-xl border-b border-l ${jadwal.daysLeft === 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30' : jadwal.daysLeft === 1 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'}`}>
                                                    {jadwal.daysLeft === 0 ? 'HARI INI' : jadwal.daysLeft === 1 ? 'BESOK' : `${jadwal.daysLeft} HARI LAGI`}
                                                </div>
                                                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                    {(!jadwal.halaqoh || jadwal.halaqoh === 'Semua') && activeHalaqoh && (
                                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-bold">Jadwal Global</span>
                                                    )}
                                                    <button onClick={() => { setNewJadwal({ ...jadwal, materi: sortScheduledMateri(jadwal.materi) }); setIsAddingJadwal(true); }} className="text-slate-300 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-xl transition-colors" title="Edit Jadwal"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDeleteJadwal(jadwal)} className="text-slate-300 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors" title="Hapus Jadwal"><Trash2 size={16} /></button>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3 pr-16">
                                                    <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg"><Calendar size={16} /></div>
                                                    <div className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">{formatDateForJadwal(jadwal.tanggal)}</div>
                                                </div>
                                                <div className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-4">
                                                    Ujian Al-Qur'an
                                                    {(!jadwal.halaqoh || jadwal.halaqoh === 'Semua') && <span className="ml-2 text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full align-middle font-bold">Global</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sortScheduledMateri(jadwal.materi).map((m, i) => (
                                                        <span key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">{m}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}

                                {/* RIWAYAT UJIAN (SELESAI) */}
                                {pastJadwalList.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-base font-black text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2 px-1"><History size={18} /> Riwayat Ujian Selesai ({pastJadwalList.length})</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-80 hover:opacity-100 transition-opacity">
                                        {pastJadwalList.filter(j => !jadwalFilter || j.materi.some(m => m.toLowerCase().includes(jadwalFilter.toLowerCase()))).map((jadwal, idx) => (
                                            <div key={jadwal.id || idx} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group shadow-sm overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-bl-xl border-b border-l border-slate-200 dark:border-slate-600">SELESAI</div>
                                                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                    {(!jadwal.halaqoh || jadwal.halaqoh === 'Semua') && activeHalaqoh && (
                                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-bold">Global</span>
                                                    )}
                                                    <button onClick={() => { setNewJadwal({ ...jadwal, materi: sortScheduledMateri(jadwal.materi) }); setIsAddingJadwal(true); }} className="text-slate-300 hover:text-blue-500 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-xl transition-colors" title="Edit Jadwal"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDeleteJadwal(jadwal)} className="text-slate-300 hover:text-red-500 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors" title="Hapus Jadwal"><Trash2 size={16} /></button>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3 pr-16">
                                                    <div className="bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 p-2 rounded-lg"><Check size={16} /></div>
                                                    <div className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest">{formatDateForJadwal(jadwal.tanggal)}</div>
                                                </div>
                                                <div className="font-bold text-slate-500 dark:text-slate-400 text-base leading-tight mb-4">
                                                    Ujian Al-Qur'an
                                                    {(!jadwal.halaqoh || jadwal.halaqoh === 'Semua') && <span className="ml-2 text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-2 py-0.5 rounded-full align-middle font-bold">Global</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sortScheduledMateri(jadwal.materi).map((m, i) => (
                                                        <span key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">{m}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}

                                {upcomingJadwalList.length === 0 && pastJadwalList.length === 0 && (
                                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <CalendarDays size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tidak ada jadwal yang cocok dengan pencarian.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- TAB PENILAIAN --- */}
            {activeTab === 'penilaian' && (
                <div className="flex flex-col gap-6 sm:gap-8 animate-in slide-in-from-bottom-4 print-area-ujian">
                    {/* Judul khusus cetak */}
                    <div className="hidden print:block text-center mb-6">
                        <h2 className="text-2xl font-black text-slate-800">Laporan Penilaian Ujian Al-Qur&apos;an</h2>
                        <p className="text-slate-500 font-bold mt-1">
                            Halaqoh: {activeHalaqoh || 'Semua Kelompok'}
                            {activeJadwal && ` | Jadwal: ${formatDateForJadwal(activeJadwal.tanggal)}`}
                        </p>
                    </div>

                    {/* TABEL GABUNGAN (TAHSIN & TAHFIDZ) */}
                    <div id="ujian-report-container" className="flex flex-col md:bg-white md:dark:bg-slate-900 md:rounded-3xl md:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:border md:border-slate-200/80 md:dark:border-slate-800 transition-colors">
                        <div className="hidden md:block max-w-full max-h-[calc(100dvh-280px)] min-h-[360px] overflow-auto overflow-x-auto overscroll-y-auto overscroll-x-contain custom-scrollbar rounded-3xl print:!block print:max-h-none print:min-h-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <table className="w-full text-left border-collapse table-auto" style={{ minWidth: `${examTableMinWidth}px` }}>
                                <thead className="bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th rowSpan={2} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md z-30 min-w-[260px] w-[260px] max-w-[260px] shadow-[6px_0_16px_rgba(15,23,42,0.08)] align-middle text-left">Nama Siswa</th>
                                        {visibleTahsin.length > 0 && (
                                            <th colSpan={visibleTahsin.length + (hasTajwidSub ? 1 : 0) + (hasGhoribSub ? 1 : 0)} className="p-3 border-b border-slate-200 dark:border-slate-700 text-center text-blue-600 dark:text-blue-400 border-l border-slate-200/60 dark:border-slate-700/50">Tahsin</th>
                                        )}
                                        {visibleTahfidz.length > 0 && (
                                            <th colSpan={visibleTahfidz.length} className="p-3 border-b border-slate-200 dark:border-slate-700 text-center text-purple-600 dark:text-purple-400 border-l border-slate-200/60 dark:border-slate-700/50 bg-purple-50/50 dark:bg-purple-500/10">Tahfidz</th>
                                        )}
                                        {visibleTahsin.length === 0 && visibleTahfidz.length === 0 && (
                                            <th rowSpan={2} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700/50 min-w-[150px] w-[150px] whitespace-nowrap leading-tight">Materi</th>
                                        )}
                                        {(visibleTahsin.length > 0 || visibleTahfidz.length > 0) && (
                                            <th rowSpan={2} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 align-middle min-w-[104px] w-[104px] whitespace-normal leading-tight">Rata-Rata<br />Akhir</th>
                                        )}
                                        <th rowSpan={2} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 align-middle min-w-[78px] w-[78px]">Rapor</th>
                                    </tr>
                                    <tr>
                                        {visibleTahsin.map((mat, i) => (
                                            <th key={`t-${i}`} className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-700 text-center text-blue-600 dark:text-blue-400 min-w-[142px] w-[142px] max-w-[142px] border-l border-slate-200/60 dark:border-slate-700/50 font-bold align-middle">{renderHeaderLabel(mat.name)}</th>
                                        ))}
                                        {hasTajwidSub && <th className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-700 text-center text-indigo-600 dark:text-indigo-400 min-w-[142px] w-[142px] max-w-[142px] border-l border-slate-200/60 dark:border-slate-700/50 bg-indigo-50/50 dark:bg-indigo-500/10 font-bold align-middle">{renderHeaderLabel('Rata-rata Tajwid')}</th>}
                                        {hasGhoribSub && <th className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-700 text-center text-teal-600 dark:text-teal-400 min-w-[142px] w-[142px] max-w-[142px] border-l border-slate-200/60 dark:border-slate-700/50 bg-teal-50/50 dark:bg-teal-500/10 font-bold align-middle">{renderHeaderLabel('Rata-rata Ghorib')}</th>}

                                        {visibleTahfidz.map((mat, i) => (
                                            <th key={`f-${i}`} className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-700 text-center text-purple-600 dark:text-purple-400 min-w-[142px] w-[142px] max-w-[142px] border-l border-slate-200/60 dark:border-slate-700/50 bg-purple-50/30 dark:bg-purple-900/5 font-bold align-middle">{renderHeaderLabel(mat.name)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {displayedStudents.length === 0 ? (
                                        <tr><td colSpan="100%" className="p-16 text-center text-slate-400 font-bold"><div className="flex flex-col items-center justify-center gap-3"><ClipboardList size={48} className="text-slate-200 dark:text-slate-700" /><p>Belum ada siswa untuk dinilai.</p></div></td></tr>
                                    ) : (
                                        <>
                                            {displayedStudents.map((student, index) => {
                                                return (
                                                    <StudentTableRow key={student.id} student={student} index={index} materials={{tahsin: visibleTahsin, tahfidz: visibleTahfidz}} hasTajwidSub={hasTajwidSub} hasGhoribSub={hasGhoribSub} kkmScore={kkmScore} onSaveScore={handleSaveScore} onPrintStudent={setActivePrintStudent} />
                                                );
                                            })}

                                            {/* Baris Kalkulasi Rata-rata */}
                                            {(visibleTahsin.length > 0 || visibleTahfidz.length > 0) && (
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 font-black border-t-2 border-slate-200 dark:border-slate-700">
                                                    <td className="p-3 sm:p-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-right pr-4 sm:pr-6 shadow-[6px_0_16px_rgba(15,23,42,0.08)] border-r border-slate-200 dark:border-slate-700 min-w-[260px] w-[260px] max-w-[260px]">
                                                        Rata Kelas:
                                                    </td>
                                                    {classAverages.tahsinAvgs.map((avg, i) => {
                                                        return (
                                                            <td key={`t-avg-${i}`} className="p-4 text-center border-l border-slate-200 dark:border-slate-700/50 text-blue-600 dark:text-blue-400">
                                                                {avg}
                                                            </td>
                                                        );
                                                    })}
                                                    {hasTajwidSub && (
                                                        <td className="p-4 text-center border-l border-slate-200 dark:border-slate-700/50 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10">
                                                            {classAverages.tajwidAvg}
                                                        </td>
                                                    )}
                                                    {hasGhoribSub && (
                                                        <td className="p-4 text-center border-l border-slate-200 dark:border-slate-700/50 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-500/10">
                                                            {classAverages.ghoribAvg}
                                                        </td>
                                                    )}
                                                    {classAverages.tahfidzAvgs.map((avg, i) => {
                                                        return (
                                                            <td key={`f-avg-${i}`} className="p-4 text-center border-l border-slate-200 dark:border-slate-700/50 text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-900/5">
                                                                {avg}
                                                            </td>
                                                        );
                                                    })}
                                                    {(visibleTahsin.length > 0 || visibleTahfidz.length > 0) && (
                                                        <td className="p-4 text-center border-l border-slate-200 dark:border-slate-700 font-black text-slate-800 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-800">
                                                            {classAverages.overallAvgAll}
                                                        </td>
                                                    )}
                                                    <td className="p-4 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700"></td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden flex flex-col gap-5 print:hidden">
                            {displayedStudents.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800"><div className="flex flex-col items-center justify-center gap-3"><ClipboardList size={40} className="text-slate-200 dark:text-slate-700" /><p>Belum ada siswa untuk dinilai.</p></div></div>
                            ) : (
                                displayedStudents.map((student, index) => {
                                    return (
                                        <StudentMobileCard key={student.id} student={student} index={index} materials={{tahsin: visibleTahsin, tahfidz: visibleTahfidz}} hasTajwidSub={hasTajwidSub} hasGhoribSub={hasGhoribSub} kkmScore={kkmScore} onSaveScore={handleSaveScore} onPrintStudent={setActivePrintStudent} />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isPresentationOpen && (
                <RaportPresentation
                    students={presentationStudents}
                    materials={presentationMaterials}
                    activeHalaqoh={activeHalaqoh}
                    kkmScore={kkmScore}
                    institutionLogo={institutionLogo || materials.institutionLogo}
                    onClose={() => setIsPresentationOpen(false)}
                />
            )}

            <AssignmentModal 
                isOpen={assignmentModal.isOpen}
                onClose={() => setAssignmentModal({ isOpen: false, type: '', material: null })}
                material={assignmentModal.material}
                type={assignmentModal.type}
                students={studentsInHalaqoh}
                onSave={handleSaveAssignments}
            />

            {/* MODAL KONFIRMASI BERBAHAYA (CUSTOM CONFIRM) */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        <div className="bg-gradient-to-b from-red-500 to-red-600 p-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-5 shadow-inner border border-white/30">
                                <AlertTriangle size={40} className="text-white drop-shadow-md" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight drop-shadow-sm">PERINGATAN!</h3>
                            <p className="text-red-50 text-sm font-medium leading-relaxed drop-shadow-sm">{confirmDialog.message}</p>
                        </div>
                        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 flex gap-3">
                            <button onClick={() => setConfirmDialog({ isOpen: false })} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors active:scale-95">Batal</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false }); }} className="flex-1 py-3.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-black shadow-lg shadow-red-200 dark:shadow-none active:scale-95 transition-all border border-red-500">Ya, Hapus!</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PresentationStatCard = ({ icon, label, value, detail, tone = 'emerald' }) => {
    const toneClass = {
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        purple: 'bg-purple-50 border-purple-100 text-purple-700',
        amber: 'bg-amber-50 border-amber-100 text-amber-700'
    }[tone] || 'bg-slate-50 border-slate-100 text-slate-700';

    return (
        <div className={`rounded-2xl border p-4 min-h-[112px] flex flex-col justify-between ${toneClass}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
                {icon && React.createElement(icon, { size: 19, strokeWidth: 2.8, className: 'shrink-0 opacity-80' })}
            </div>
            <div>
                <div className="text-3xl font-black leading-none tracking-normal">{value}</div>
                <div className="mt-2 text-xs font-bold leading-snug opacity-75 line-clamp-2">{detail}</div>
            </div>
        </div>
    );
};

const PresentationProgress = ({ label, value, tone = 'emerald' }) => {
    const percent = getPresentationScorePercent(value);
    const colorClass = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-400'
    }[tone] || 'bg-slate-500';

    return (
        <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest truncate">{label}</span>
                <span className="text-sm font-black text-slate-900">{value || '-'}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

const RaportPresentation = ({ students, materials, activeHalaqoh, kkmScore, institutionLogo, onClose }) => {
    const studentList = useMemo(() => (Array.isArray(students) ? students.filter(Boolean) : []), [students]);
    const [index, setIndex] = useState(0);
    const presentationRef = useRef(null);
    const tahsinMaterials = useMemo(() => materials?.tahsin || [], [materials?.tahsin]);
    const tahfidzMaterials = useMemo(() => materials?.tahfidz || [], [materials?.tahfidz]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            if (studentList.length <= 1) return;
            if (event.key === 'ArrowRight') {
                setIndex((current) => (current + 1) % studentList.length);
            }
            if (event.key === 'ArrowLeft') {
                setIndex((current) => (current - 1 + studentList.length) % studentList.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, studentList.length]);

    const safeIndex = studentList.length > 0 ? Math.min(index, studentList.length - 1) : 0;
    const selectedStudent = studentList[safeIndex] || null;
    const presentationData = useMemo(
        () => buildRaportPresentationData(selectedStudent, tahsinMaterials, tahfidzMaterials, kkmScore),
        [selectedStudent, tahsinMaterials, tahfidzMaterials, kkmScore]
    );
    const overallPercent = getPresentationScorePercent(presentationData.overallAverage);
    const passed = presentationData.overallAverage !== '-' && parseFloat(presentationData.overallAverage) >= kkmScore;
    const scoreTone = passed ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : presentationData.overallAverage === '-' ? 'text-slate-500 bg-slate-50 border-slate-100' : 'text-amber-700 bg-amber-50 border-amber-100';
    const studentInitial = selectedStudent?.name ? selectedStudent.name.charAt(0).toUpperCase() : '?';
    const tahsinPreview = presentationData.tahsinRows.filter((row) => row.numericScore !== null).slice(0, 4);
    const tahfidzPreview = presentationData.tahfidzRows.filter((row) => row.numericScore !== null).slice(0, 8);

    const goToStudent = (nextIndex) => {
        if (studentList.length === 0) return;
        setIndex((nextIndex + studentList.length) % studentList.length);
    };

    const handleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await presentationRef.current?.requestFullscreen?.();
            }
        } catch (error) {
            console.error('Gagal membuka layar penuh:', error);
        }
    };

    return (
        <div ref={presentationRef} className="fixed inset-0 z-[100000] bg-slate-100 text-slate-950 flex flex-col overflow-hidden print:hidden">
            <div className="h-auto shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur px-3 sm:px-5 py-3 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={onClose} className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors shrink-0" title="Tutup">
                            <X size={20} strokeWidth={3} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <Presentation size={18} className="text-amber-500 shrink-0" />
                                <h2 className="text-base sm:text-lg font-black truncate">Presentasi Raport Al-Qur&apos;an</h2>
                            </div>
                            <p className="text-xs font-bold text-slate-500 truncate">{activeHalaqoh || 'Semua Halaqoh'} · {studentList.length} siswa</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-[42px_minmax(0,1fr)_42px_42px] sm:flex sm:items-center gap-2">
                        <button onClick={() => goToStudent(safeIndex - 1)} disabled={studentList.length <= 1} className="h-10 rounded-xl bg-slate-900 text-white px-3 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95" title="Sebelumnya">
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>
                        <select
                            value={safeIndex}
                            onChange={(event) => setIndex(Number(event.target.value))}
                            className="h-10 min-w-0 sm:min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-black text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        >
                            {studentList.map((student, studentIndex) => (
                                <option key={student.id || studentIndex} value={studentIndex}>{student.name}</option>
                            ))}
                        </select>
                        <button onClick={() => goToStudent(safeIndex + 1)} disabled={studentList.length <= 1} className="h-10 rounded-xl bg-slate-900 text-white px-3 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95" title="Berikutnya">
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                        <button onClick={handleFullscreen} className="h-10 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 flex items-center justify-center transition-all active:scale-95" title="Layar penuh">
                            <Maximize2 size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-7 custom-scrollbar">
                {!selectedStudent ? (
                    <div className="h-full min-h-[420px] rounded-[2rem] bg-white border border-slate-200 flex flex-col items-center justify-center text-center p-8">
                        <Users size={44} className="text-slate-300 mb-4" />
                        <div className="text-xl font-black text-slate-800">Belum ada siswa</div>
                        <div className="text-sm font-bold text-slate-500 mt-1">Data presentasi akan tampil setelah siswa tersedia.</div>
                    </div>
                ) : (
                    <section className="mx-auto w-full max-w-[1500px] rounded-[2rem] bg-white border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.10)] overflow-hidden">
                        <div className="bg-emerald-50 border-b border-emerald-100 px-5 sm:px-7 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                {institutionLogo && institutionLogo !== 'logo.png' ? (
                                    <img src={institutionLogo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                        <BookOpen size={34} strokeWidth={2.6} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Raport Al-Qur&apos;an</div>
                                    <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-normal leading-tight truncate">{selectedStudent.name}</h1>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs sm:text-sm font-black text-slate-600">
                                        <span className="rounded-full bg-white border border-emerald-100 px-3 py-1">Kelas {selectedStudent.kelas || '-'}</span>
                                        <span className="rounded-full bg-white border border-emerald-100 px-3 py-1">{selectedStudent.halaqoh || activeHalaqoh || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`rounded-3xl border px-6 py-4 min-w-[160px] text-center ${scoreTone}`}>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Rata-rata Ujian</div>
                                <div className="text-5xl font-black leading-none mt-1">{presentationData.overallAverage}</div>
                                <div className="text-sm font-black mt-2">{presentationData.predicate}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5 p-5 sm:p-7">
                            <aside className="rounded-3xl bg-slate-950 text-white overflow-hidden flex flex-col min-h-[560px]">
                                <div className="relative h-72 bg-slate-900 flex items-center justify-center overflow-hidden">
                                    {selectedStudent.photo ? (
                                        <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-36 h-36 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-6xl font-black">{studentInitial}</div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Profil Siswa</div>
                                        <div className="mt-2 text-2xl font-black leading-tight">{selectedStudent.name}</div>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
                                            <div className="rounded-2xl bg-white/10 p-3">
                                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Kelas</div>
                                                <div className="text-lg font-black">{selectedStudent.kelas || '-'}</div>
                                            </div>
                                            <div className="rounded-2xl bg-white/10 p-3">
                                                <div className="text-[10px] uppercase tracking-widest text-slate-400">KKM</div>
                                                <div className="text-lg font-black">{kkmScore}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-300">
                                            <span>Kelengkapan Nilai</span>
                                            <span>{presentationData.completePercent}%</span>
                                        </div>
                                        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${presentationData.completePercent}%` }} />
                                        </div>
                                        <div className="mt-2 text-xs font-bold text-slate-400">{presentationData.scoredCount} dari {presentationData.totalCount} nilai terisi</div>
                                    </div>
                                </div>
                            </aside>

                            <div className="min-w-0 flex flex-col gap-5">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <PresentationStatCard icon={FileText} label="Nilai Ujian" value={presentationData.overallAverage} detail={passed ? 'Tuntas dan siap dilaporkan' : presentationData.overallAverage === '-' ? 'Belum ada nilai' : 'Butuh penguatan lanjutan'} tone="emerald" />
                                    <PresentationStatCard icon={BookOpen} label="Tahsin" value={presentationData.tahsinAverage} detail={`${presentationData.tahsinRows.length} materi terjadwal`} tone="blue" />
                                    <PresentationStatCard icon={Mic} label="Tahfidz" value={presentationData.tahfidzAverage} detail={`${presentationData.tahfidzRows.length} materi & tambahan`} tone="purple" />
                                    <PresentationStatCard icon={Award} label="Predikat" value={presentationData.predicate} detail={`Standar KKM ${kkmScore}`} tone="amber" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-5">
                                    <section className="rounded-3xl border border-slate-200 p-5 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-5">
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Hasil Nilai Ujian</div>
                                                <h3 className="text-2xl font-black text-slate-950 mt-1">Ringkasan Akademik</h3>
                                            </div>
                                            <div className="w-20 h-20 rounded-full border-[10px] border-emerald-100 flex items-center justify-center text-lg font-black text-emerald-600 shrink-0">
                                                {overallPercent}%
                                            </div>
                                        </div>
                                        <div className="space-y-5">
                                            <PresentationProgress label="Rata-rata Tahsin" value={presentationData.tahsinAverage} tone="blue" />
                                            <PresentationProgress label="Rata-rata Tahfidz" value={presentationData.tahfidzAverage} tone="purple" />
                                            <PresentationProgress label="Rata-rata Akhir" value={presentationData.overallAverage} tone="emerald" />
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(presentationData.topScores.length > 0 ? presentationData.topScores : [{ name: 'Belum ada nilai tertinggi', score: '-', type: 'tahsin' }]).map((row, rowIndex) => (
                                                <div key={`${row.name}-${rowIndex}`} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 min-w-0">
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${row.type === 'tahfidz' ? 'text-purple-500' : 'text-blue-500'}`}>{row.type === 'tahfidz' ? 'Tahfidz' : 'Tahsin'}</div>
                                                    <div className="mt-1 flex items-center justify-between gap-3">
                                                        <div className="text-sm font-black text-slate-800 truncate">{row.name}</div>
                                                        <div className="text-lg font-black text-slate-950 shrink-0">{row.score}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-3xl border border-slate-200 p-5 bg-slate-50 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-5">
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Capaian Akhir</div>
                                                <h3 className="text-2xl font-black text-slate-950 mt-1">Mutabaah Terakhir</h3>
                                            </div>
                                            <Calendar size={28} className="text-slate-400 shrink-0" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="rounded-2xl bg-white border border-blue-100 p-4">
                                                <div className="flex items-center gap-2 text-blue-600 mb-3">
                                                    <BookOpen size={19} />
                                                    <span className="text-xs font-black uppercase tracking-widest">Tahsin</span>
                                                </div>
                                                <div className="text-xl font-black text-slate-950 leading-tight">{presentationData.capaian.tahsin.title}</div>
                                                <div className="mt-2 text-sm font-black text-blue-600">{presentationData.capaian.tahsin.detail}</div>
                                                <div className="mt-2 text-xs font-bold text-slate-400">{getPresentationDateLabel(presentationData.capaian.tahsin.date)}</div>
                                            </div>
                                            <div className="rounded-2xl bg-white border border-purple-100 p-4">
                                                <div className="flex items-center gap-2 text-purple-600 mb-3">
                                                    <Mic size={19} />
                                                    <span className="text-xs font-black uppercase tracking-widest">Tahfidz</span>
                                                </div>
                                                <div className="text-xl font-black text-slate-950 leading-tight">{presentationData.capaian.tahfidz.title}</div>
                                                <div className="mt-2 text-sm font-black text-purple-600">{presentationData.capaian.tahfidz.detail}</div>
                                                <div className="mt-2 text-xs font-bold text-slate-400">{getPresentationDateLabel(presentationData.capaian.tahfidz.date)}</div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 min-w-0">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-blue-500">Tahsin</div>
                                                <h3 className="text-xl font-black text-slate-950">Detail Nilai & Capaian</h3>
                                            </div>
                                            <Check size={24} className="text-blue-500 shrink-0" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(tahsinPreview.length > 0 ? tahsinPreview : [{ name: 'Belum ada nilai tahsin', score: '-' }]).map((row, rowIndex) => (
                                                <div key={`${row.name}-${rowIndex}`} className="rounded-2xl bg-white/90 border border-blue-100 p-3 min-w-0">
                                                    <div className="text-xs font-black text-slate-800 truncate">{row.name}</div>
                                                    <div className="mt-2 text-2xl font-black text-blue-600">{row.score}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-3xl border border-purple-100 bg-purple-50 p-5 min-w-0">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-purple-500">Tahfidz</div>
                                                <h3 className="text-xl font-black text-slate-950">Detail Nilai & Hafalan</h3>
                                            </div>
                                            <Check size={24} className="text-purple-500 shrink-0" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(tahfidzPreview.length > 0 ? tahfidzPreview : [{ name: 'Belum ada nilai tahfidz', score: '-' }]).map((row, rowIndex) => (
                                                <div key={`${row.name}-${rowIndex}`} className="rounded-2xl bg-white/90 border border-purple-100 p-3 min-w-0">
                                                    <div className="text-xs font-black text-slate-800 truncate">{row.name}</div>
                                                    <div className="mt-2 text-2xl font-black text-purple-600">{row.score}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

const AssignmentModal = ({ isOpen, onClose, material, type, students, onSave }) => {
    const [assigned, setAssigned] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (material) {
            setAssigned(!material.students || material.students.includes('all') ? students.map(s => s.id) : material.students);
        }
    }, [material, students]);

    if (!isOpen || !material) return null;

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    const toggleStudent = (id) => {
        setAssigned(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (search) {
            const idsToAdd = filteredStudents.map(s => s.id);
            setAssigned(prev => [...new Set([...prev, ...idsToAdd])]);
        } else {
            setAssigned(students.map(s => s.id));
        }
    };

    const handleDeselectAll = () => {
        if (search) {
            const idsToRemove = filteredStudents.map(s => s.id);
            setAssigned(prev => prev.filter(id => !idsToRemove.includes(id)));
        } else {
            setAssigned([]);
        }
    };

    const handleSaveClick = () => {
        const finalAssigned = assigned.length === students.length ? ['all'] : assigned;
        onSave(type, material.name, material.halaqoh, finalAssigned);
    };

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Atur Siswa untuk Materi</h3>
                    <p className="text-sm font-bold text-blue-500">{material.name}</p>
                </div>
                <div className="p-5 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama siswa..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm font-bold outline-none focus:border-blue-500" />
                        </div>
                        <button onClick={handleSelectAll} className="text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 rounded-lg hover:bg-blue-100 transition-colors">Pilih Semua</button>
                        <button onClick={handleDeselectAll} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 rounded-lg hover:bg-slate-200 transition-colors">Kosongkan</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {filteredStudents.map(student => (
                            <label key={student.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                                <input type="checkbox" checked={assigned.includes(student.id)} onChange={() => toggleStudent(student.id)} className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500" />
                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{student.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">Batal</button>
                    <button onClick={handleSaveClick} className="flex-1 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-black shadow-lg shadow-blue-200 dark:shadow-none">Simpan ({assigned.length})</button>
                </div>
            </div>
        </div>
    );
};

// --- Dictionaries & Helper Functions for Quran Assessment Report Wizard ---

const SURAH_ARABIC_MAP = {
    "Al-Fatihah": "الفاتحة",
    "Al-Baqarah": "البقرة",
    "Ali 'Imran": "آل عمران",
    "An-Nisa'": "النساء",
    "Al-Ma'idah": "المائدة",
    "Al-An'am": "الأنعام",
    "Al-A'raf": "الأعراف",
    "Al-Anfal": "الأنفال",
    "At-Taubah": "التوبة",
    "Yunus": "يونس",
    "Hud": "هود",
    "Yusuf": "يوسف",
    "Ar-Ra'd": "الرعد",
    "Ibrahim": "إبراهيم",
    "Al-Hijr": "الحجر",
    "An-Nahl": "النحل",
    "Al-Isra'": "الإسراء",
    "Al-Kahf": "الكهف",
    "Maryam": "مريم",
    "Taha": "طه",
    "Al-Anbiya'": "الأنبياء",
    "Al-Hajj": "الحج",
    "Al-Mu'minun": "المؤمنون",
    "An-Nur": "النور",
    "Al-Furqan": "الفرقان",
    "Asy-Syu'ara'": "الشعراء",
    "An-Naml": "النمل",
    "Al-Qasas": "القصص",
    "Al-'Ankabut": "العنكبوت",
    "Ar-Rum": "الروم",
    "Luqman": "لقمان",
    "As-Sajdah": "السجدة",
    "Al-Ahzab": "الأحزاب",
    "Saba'": "سبأ",
    "Fatir": "فاطر",
    "Yasin": "يس",
    "As-Saffat": "الصافات",
    "Sad": "ص",
    "Az-Zumar": "الزمر",
    "Ghafir": "غافر",
    "Fussilat": "فصلت",
    "Asy-Syura": "الشورى",
    "Az-Zukhruf": "الزخرف",
    "Ad-Dukhan": "الدخان",
    "Al-Jasiyah": "الجاثية",
    "Al-Ahqaf": "الأحقاف",
    "Muhammad": "محمد",
    "Al-Fath": "الفتح",
    "Al-Hujurat": "الحجرات",
    "Qaf": "ق",
    "Az-Zariyat": "الذاريات",
    "At-Tur": "الطور",
    "An-Najm": "النجم",
    "Al-Qamar": "القمر",
    "Ar-Rahman": "الرحمن",
    "Al-Waqi'ah": "الواقعة",
    "Al-Hadid": "الحديد",
    "Al-Mujadilah": "المجادلة",
    "Al-Hasyr": "الحشر",
    "Al-Mumtahanah": "الممتحنة",
    "As-Saff": "الصف",
    "Al-Jumu'ah": "الجمعة",
    "Al-Munafiqun": "المنافقون",
    "At-Tagabun": "التغابن",
    "At-Talaq": "الطلاق",
    "At-Tahrim": "التحريم",
    "Al-Mulk": "الملك",
    "Al-Qalam": "القلم",
    "Al-Haqqah": "الحاقة",
    "Al-Ma'arij": "المعارج",
    "Nuh": "نوح",
    "Al-Jinn": "الجن",
    "Al-Muzzammil": "المزمل",
    "Al-Muddassir": "المدثر",
    "Al-Qiyamah": "القيامة",
    "Al-Insan": "الإنسان",
    "Al-Mursalat": "المرسلات",
    "An-Naba'": "النبأ",
    "An-Nazi'at": "النازعات",
    "'Abasa": "عبس",
    "At-Takwir": "التكوير",
    "Al-Infitar": "الانفطار",
    "Al-Mutaffifin": "المطففين",
    "Al-Insyiqaq": "الانشقاق",
    "Al-Buruj": "البروج",
    "At-Tariq": "الطارق",
    "Al-A'la": "الأعلى",
    "Al-Ghasyiyah": "الغاشية",
    "Al-Fajr": "الفجر",
    "Al-Balad": "البلد",
    "Asy-Syams": "الشمس",
    "Al-Lail": "الليل",
    "Ad-Duha": "الضحى",
    "Al-Insyirah": "الانشراح",
    "At-Tin": "التين",
    "Al-'Alaq": "العلق",
    "Al-Qadr": "القدر",
    "Al-Bayyinah": "البينة",
    "Az-Zalzalah": "الزلزلة",
    "Al-'Adiyat": "العاديات",
    "Al-Qari'ah": "القارعة",
    "At-Takasur": "التكاثر",
    "Al-'Asr": "العصر",
    "Al-Humazah": "الهمزة",
    "Al-Fil": "الفيل",
    "Quraisy": "قريش",
    "Al-Ma'un": "الماعون",
    "Al-Kausar": "الكوثر",
    "Al-Kafirun": "الكافرون",
    "An-Nasr": "النصر",
    "Al-Lahab": "اللهب",
    "Al-Ikhlas": "الإخلاص",
    "Al-Falaq": "الفلق",
    "An-Nas": "الناس"
};

const toArabicDigits = (str) => {
    const id = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(str).replace(/[0-9]/g, (w) => id[+w]);
};

const translateToArabicSurah = (text) => {
    if (!text) return '';
    const cleanText = text.trim();
    // Check if there is verse numbers, e.g. "Al-Insan 1-18" or "Al-Insan 18-1"
    const surahMatch = cleanText.match(/^([a-zA-Z\s'-]+)(?:\s+([\d\s-–]+))?$/);
    if (surahMatch) {
        const latinName = surahMatch[1].trim();
        const verses = surahMatch[2] ? surahMatch[2].trim() : '';
        const arabicName = SURAH_ARABIC_MAP[latinName] || latinName;
        if (verses) {
            const parts = verses.split(/[-–]/);
            if (parts.length === 2) {
                const start = toArabicDigits(parts[0].trim());
                const end = toArabicDigits(parts[1].trim());
                return `${arabicName} ${end}-${start}`;
            }
            return `${arabicName} ${toArabicDigits(verses)}`;
        }
        return arabicName;
    }
    return SURAH_ARABIC_MAP[cleanText] || toArabicDigits(cleanText);
};

const toArabicDigitsSafe = (str) => {
    const id = ['\u0660', '\u0661', '\u0662', '\u0663', '\u0664', '\u0665', '\u0666', '\u0667', '\u0668', '\u0669'];
    return String(str).replace(/[0-9]/g, (w) => id[+w]);
};

const decodeArabicMojibake = (value) => {
    const text = String(value || '');
    if (!/[ØÙ]/.test(text) || typeof TextDecoder === 'undefined') return text;
    try {
        const bytes = Uint8Array.from([...text].map(ch => ch.charCodeAt(0) & 0xff));
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        return text;
    }
};

const getArabicSurahNameSafe = (latinName) => {
    const direct = SURAH_ARABIC_MAP[latinName];
    if (direct) return decodeArabicMojibake(direct);

    const normalized = normalizeSurahText(latinName);
    const match = surahList.find(surah => normalizeSurahText(surah.name) === normalized);
    return match ? decodeArabicMojibake(SURAH_ARABIC_MAP[match.name] || match.name) : latinName;
};

const parseSurahMaterial = (text) => {
    const rawText = String(text || '').trim();
    const surahNo = getTahfidzSurahNo(rawText);
    const surahData = surahNo ? surahList.find(surah => surah.no === surahNo) : null;
    const baseName = surahData?.name || rawText.replace(/^\s*\d+\.\s*/, '').replace(/\s+(?:ayat\s*)?\d+\s*[-–]\s*\d+\s*$/i, '').trim();
    const verseRanges = [...rawText.matchAll(/(?:ayat\s*)?(\d{1,3})\s*[-–]\s*(\d{1,3})/gi)]
        .map(match => {
            const start = Number(match[1]);
            const end = Number(match[2]);
            return Number.isFinite(start) && Number.isFinite(end)
                ? { start: Math.min(start, end), end: Math.max(start, end) }
                : null;
        })
        .filter(Boolean);

    return {
        key: surahNo ? `surah-${surahNo}` : normalizeSurahText(baseName),
        surahNo,
        baseName,
        verseRanges
    };
};

const formatVerseRanges = (ranges = []) => {
    if (!ranges.length) return '';
    return ranges
        .sort((a, b) => a.start - b.start || a.end - b.end)
        .map(range => range.start === range.end ? String(range.start) : `${range.start}-${range.end}`)
        .join(', ');
};

const formatArabicVerseRanges = (ranges = []) => {
    const text = formatVerseRanges(ranges);
    return text ? toArabicDigitsSafe(text) : '';
};

const aggregateHafalanRows = (rows = []) => {
    const grouped = new Map();
    const passthrough = [];

    rows.forEach((row, index) => {
        const surah = String(row?.surah || '').trim();
        const scoreText = row?.score !== undefined && row?.score !== null ? String(row.score).trim() : '';
        if (!surah && !scoreText) return;

        const parsed = parseSurahMaterial(surah);
        const canGroup = parsed.key && parsed.baseName;
        if (!canGroup) {
            passthrough.push({ ...row, _order: index });
            return;
        }

        if (!grouped.has(parsed.key)) {
            grouped.set(parsed.key, {
                _order: index,
                surahNo: parsed.surahNo,
                baseName: parsed.baseName,
                verseRanges: [],
                scores: []
            });
        }

        const group = grouped.get(parsed.key);
        group.verseRanges.push(...parsed.verseRanges);
        const score = parseFloat(scoreText);
        if (!Number.isNaN(score)) group.scores.push(score);
    });

    return [...grouped.values(), ...passthrough]
        .sort((a, b) => a._order - b._order)
        .map(item => {
            if (item.surah !== undefined) return { surah: item.surah || '', score: item.score || '' };

            const uniqueRanges = Array.from(
                new Map(item.verseRanges.map(range => [`${range.start}-${range.end}`, range])).values()
            );
            const rangeText = formatVerseRanges(uniqueRanges);
            const surahPrefix = item.surahNo ? `${item.surahNo}. ` : '';
            const score = item.scores.length
                ? (item.scores.reduce((sum, value) => sum + value, 0) / item.scores.length).toFixed(0)
                : '';

            return {
                surah: `${surahPrefix}${item.baseName}${rangeText ? ` ${rangeText}` : ''}`,
                score
            };
        });
};

const padHafalanRows = (rows = [], length = 11) => Array.from({ length }, (_, index) => rows[index] || { surah: '', score: '' });

const translateToArabicSurahSafe = (text) => {
    if (!text) return '';
    const cleanText = String(text).trim();
    if (cleanText === '__legacy__') return translateToArabicSurah(cleanText);
    const parsed = parseSurahMaterial(cleanText);
    const arabicName = getArabicSurahNameSafe(parsed.baseName);
    const verseText = formatArabicVerseRanges(parsed.verseRanges);

    if (parsed.surahNo || SURAH_ARABIC_MAP[parsed.baseName]) {
        return verseText ? `${arabicName} ${verseText}` : arabicName;
    }

    return toArabicDigitsSafe(getArabicSurahNameSafe(cleanText));
};

const getArabicPredicate = (score) => {
    const num = parseFloat(score);
    if (isNaN(num)) return '-';
    if (num >= 92) return 'ممتاز';
    if (num >= 83) return 'جيد جدا';
    if (num >= 75) return 'جيد';
    return '-';
};

const ARABIC_PREDICATE_EXCELLENT = '\u0645\u0645\u062a\u0627\u0632';
const ARABIC_PREDICATE_VERY_GOOD = '\u062c\u064a\u062f\u062c\u062f\u0627';
const ARABIC_PREDICATE_GOOD = '\u062c\u064a\u062f';

const getArabicPredicateLabel = (score) => {
    if (score === '__legacy__') return getArabicPredicate(score);
    const num = parseFloat(score);
    if (isNaN(num)) return '-';
    if (num >= 92) return ARABIC_PREDICATE_EXCELLENT;
    if (num >= 83) return ARABIC_PREDICATE_VERY_GOOD;
    if (num >= 75) return ARABIC_PREDICATE_GOOD;
    return '-';
};

const getExamNoteFeedback = (predicate) => {
    if (predicate === ARABIC_PREDICATE_EXCELLENT) return "Pertahankan prestasimu dalam mempelajari Al Qur'an";
    if (predicate === ARABIC_PREDICATE_VERY_GOOD) return "Tetap semangat dalam mempelajari Al Qur'an";
    if (predicate === ARABIC_PREDICATE_GOOD) return "Lebih giat lagi dalam mempelajari Al Qur'an";
    return "Tetap semangat dalam mempelajari Al Qur'an";
};

const REPORT_TAHSIN_SUBJECTS = [
    { key: 'Tilawah', label: 'Tilawah' },
    { key: 'Fashohah', label: 'Fashohah' },
    { key: 'Ilmu Ghorib', label: 'Ilmu Ghorib', autoList: ghoribList },
    { key: 'Ilmu Tajwid', label: 'Ilmu Tajwid', autoList: tajwidList }
];

const normalizeStudentGender = (value) => {
    const text = String(value || '').trim().toUpperCase();
    if (!text) return 'L';
    if (text === 'P' || text.includes('PEREMPUAN') || text.includes('PUTRI') || text.includes('AKHWAT') || text.includes('WANITA')) return 'P';
    return 'L';
};

const getGenderNoteTerm = (value) => normalizeStudentGender(value) === 'P' ? 'sholihah' : 'sholih';

const getGradeDescription = (score, kkm = 75) => {
    const num = parseFloat(score);
    if (isNaN(num)) return '-';
    return num >= kkm ? 'Tuntas' : 'Belum Tuntas';
};

function getIndonesianDate() {
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const getInitialReportZoom = () => {
    if (typeof window === 'undefined') return 0.85;
    if (window.innerWidth < 380) return 0.68;
    if (window.innerWidth < 480) return 0.72;
    if (window.innerWidth < 768) return 0.78;
    return 0.85;
};

// --- Full Quran Assessment Report Wizard Component ---

const QuranReportWizard = ({ student, reportStudents = [], onClose, materials, showToast, kkmScore, activeHalaqoh, institutionLogo, setStudents }) => {
    const [nis, setNis] = useState(student.nis || '');
    const [kelas, setKelas] = useState(student.kelas || '');
    const [halaqoh, setHalaqoh] = useState(student.halaqoh || activeHalaqoh || '');
    
    const [gender, setGender] = useState(() => normalizeStudentGender(student.gender || student.jenis_kelamin));
    const [bulkCaptureStudent, setBulkCaptureStudent] = useState(null);

    // Reset NIS/Kelas/Gender ketika ganti siswa
    useEffect(() => {
        setNis(student.nis || '');
        setKelas(student.kelas || '');
        setHalaqoh(student.halaqoh || activeHalaqoh || '');
        setGender(normalizeStudentGender(student.gender || student.jenis_kelamin));
    }, [student.id]);

    // Simpan NIS/Kelas/Gender ke data siswa di database saat input kehilangan fokus
    const syncStudentField = async (field, value) => {
        const studentId = activeReportStudent?.id || student?.id;
        if (!studentId) return;
        const { error } = await supabase.from('students').update({ [field]: value }).eq('id', studentId);
        if (!error && setStudents) {
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
        }
    };
    const activeReportStudent = bulkCaptureStudent || student;
    const isBulkCapture = Boolean(bulkCaptureStudent);
    const displayNis = isBulkCapture ? (activeReportStudent.nis || activeReportStudent.no_induk || activeReportStudent.nisn || '') : nis;
    const displayKelas = isBulkCapture ? (activeReportStudent.kelas || '') : kelas;
    const displayGender = isBulkCapture ? normalizeStudentGender(activeReportStudent.gender || activeReportStudent.jenis_kelamin) : gender;

    const rs = materials.reportSettings || {};
    const semester = rs.semester || (new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap');
    const tahunPelajaran = rs.tahunPelajaran || (new Date().getMonth() >= 6 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`);
    const namaSekolah = rs.namaSekolah || materials.institutionName || 'SDIT AL FITYAN SCHOOL BOGOR';
    const alamatSekolah = rs.alamatSekolah || 'Jl. Bengkel Roda, Kp. Cipiicung.\nDesa Mekarsari. Kec. Cileungsi. Bogor';
    const kepalaSekolah = rs.kepalaSekolah || 'Mei Tri Listari, S.Pd.I, M. Pd';
    const tempatCetak = rs.tempatCetak || 'Bogor';
    const tanggalCetak = rs.tanggalCetak || getIndonesianDate();
    const reportInstitutionLogo = institutionLogo || materials.institutionLogo;
    const hasInstitutionLogo = reportInstitutionLogo && reportInstitutionLogo !== 'logo.png';

    const halaqohForFilter = activeReportStudent.halaqoh || activeHalaqoh || '';

    const currentTahfidz = useMemo(() => {
        if (!halaqohForFilter) return sortTahfidzMaterials((materials.tahfidz || []).filter(m => !m.halaqoh || m.halaqoh === 'Semua').filter(m => !(m.students && m.students.includes('HIDDEN'))));
        const localNames = (materials.tahfidz || []).filter(m => m.halaqoh === halaqohForFilter).map(m => m.name);
        const combined = (materials.tahfidz || []).filter(m => {
            if (m.halaqoh === halaqohForFilter) return true;
            if ((!m.halaqoh || m.halaqoh === 'Semua') && !localNames.includes(m.name)) return true;
            return false;
        });
        return sortTahfidzMaterials(combined.filter(m => !(m.students && m.students.includes('HIDDEN'))));
    }, [materials.tahfidz, halaqohForFilter]);

    const getSavedSubjectValue = (sourceStudent, subjectKey) => {
        const legacyKeys = subjectKey === 'Fashohah'
            ? ['Fashohah', 'Fashahah']
            : subjectKey === 'Ilmu Ghorib'
                ? ['Ilmu Ghorib', 'Ghorib']
                : subjectKey === 'Ilmu Tajwid'
                    ? ['Ilmu Tajwid', 'Tajwid']
                    : [subjectKey];
        return legacyKeys
            .map(key => sourceStudent.ujian_records?.[key])
            .find(value => value !== undefined && value !== null && String(value).trim() !== '') || '';
    };

    const getSubAverage = (list) => {
        const scores = list.map(name => parseFloat(activeReportStudent.ujian_records?.[name])).filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '';
    };

    const autoSubjectValues = useMemo(() => {
        return REPORT_TAHSIN_SUBJECTS.reduce((acc, subject) => {
            if (subject.autoList) acc[subject.key] = getSubAverage(subject.autoList);
            return acc;
        }, {});
    }, [activeReportStudent.ujian_records]);

    // Core grades
    const [mainScoreValues, setMainScoreValues] = useState(() => {
        const initial = {};
        REPORT_TAHSIN_SUBJECTS.forEach(subject => {
            initial[subject.key] = getSavedSubjectValue(student, subject.key);
        });
        return initial;
    });
    const [tahfidzOverride, setTahfidzOverride] = useState(student.ujian_records?.['Tahfidz'] || '');

    // Prepopulate recitations (tahfidz scores)
    const [hafalanKelas, setHafalanKelas] = useState([]);
    const [hafalanTambahan, setHafalanTambahan] = useState([]);

    // Target yang tidak tercapai
    const [targets, setTargets] = useState(Array.from({ length: 8 }, () => ''));

    // Adab
    const [adab, setAdab] = useState({
        terhadapAlquran: 'A',
        terhadapGuru: 'A',
        tertib: 'A',
        istiqomah: 'A'
    });

    // Catatan
    const [catatan, setCatatan] = useState('');
    const [isNoteEdited, setIsNoteEdited] = useState(false);
    const [zoom, setZoom] = useState(getInitialReportZoom);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const buildHafalanLists = (sourceStudent) => {
        const tahfidzScores = [];
        currentTahfidz.forEach(mat => {
            if (!mat.students || mat.students.includes('all') || mat.students.some(id => String(id) === String(sourceStudent.id))) {
                const score = sourceStudent.ujian_records?.[mat.name];
                // Selalu masukkan materi tahfidz yang ada di pengaturan ujian, meskipun nilainya kosong
                tahfidzScores.push({ surah: mat.name, score: score !== undefined && score !== null ? score : '' });
            }
        });

        // Also scan student's other records that are surahs
        Object.keys(sourceStudent.ujian_records || {}).forEach(key => {
            if (!currentTahfidz.some(m => m.name === key) && surahList.some(s => s.name === key)) {
                const score = sourceStudent.ujian_records[key];
                if (score !== undefined && score !== null && score.toString().trim() !== '') {
                    // Prevent duplicate
                    if (!tahfidzScores.some(x => x.surah === key)) {
                        tahfidzScores.push({ surah: key, score });
                    }
                }
            }
        });

        const groupedTahfidzScores = aggregateHafalanRows(tahfidzScores);

        const classList = Array.from({ length: 11 }, (_, i) => {
            if (groupedTahfidzScores[i]) {
                return { surah: groupedTahfidzScores[i].surah, score: groupedTahfidzScores[i].score };
            }
            return { surah: '', score: '' };
        });

        const additionalList = Array.from({ length: 11 }, (_, i) => {
            const sourceIndex = i + 11;
            if (groupedTahfidzScores[sourceIndex]) {
                return { surah: groupedTahfidzScores[sourceIndex].surah, score: groupedTahfidzScores[sourceIndex].score };
            }
            return { surah: '', score: '' };
        });

        return { classList, additionalList };
    };

    const bulkHafalanLists = useMemo(() => {
        if (!isBulkCapture) return null;
        return buildHafalanLists(activeReportStudent);
    }, [isBulkCapture, activeReportStudent, currentTahfidz]);

    const displayHafalanKelas = bulkHafalanLists?.classList || hafalanKelas;
    const displayHafalanTambahan = bulkHafalanLists?.additionalList || hafalanTambahan;
    const groupedDisplayHafalan = useMemo(
        () => aggregateHafalanRows([...displayHafalanKelas, ...displayHafalanTambahan]),
        [displayHafalanKelas, displayHafalanTambahan]
    );
    const groupedDisplayHafalanKelas = useMemo(
        () => padHafalanRows(aggregateHafalanRows(displayHafalanKelas), 11),
        [displayHafalanKelas]
    );
    const groupedDisplayHafalanTambahan = useMemo(
        () => padHafalanRows(aggregateHafalanRows(displayHafalanTambahan), 11),
        [displayHafalanTambahan]
    );
    const displayTargets = isBulkCapture ? Array.from({ length: 8 }, () => '') : targets;

    // Initialize lists
    useEffect(() => {
        const { classList, additionalList } = buildHafalanLists(student);
        setHafalanKelas(classList);
        setHafalanTambahan(additionalList);
    }, [student, currentTahfidz]);

    // Compute average tahfidz
    const computedTahfidzAvg = useMemo(() => {
        const allScores = [];
        groupedDisplayHafalan.forEach(h => {
            const num = parseFloat(h.score);
            if (!isNaN(num)) allScores.push(num);
        });
        if (allScores.length === 0) return '';
        return (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(0);
    }, [groupedDisplayHafalan]);

    // Tahfidz final score to display (either computed or overridden)
    const effectiveTahfidzOverride = isBulkCapture ? (activeReportStudent.ujian_records?.['Tahfidz'] || '') : tahfidzOverride;
    const displayTahfidz = effectiveTahfidzOverride !== '' ? effectiveTahfidzOverride : computedTahfidzAvg;

    const reportSubjectRows = useMemo(() => {
        const getSubjectScore = (key) => autoSubjectValues[key] || (isBulkCapture ? getSavedSubjectValue(activeReportStudent, key) : mainScoreValues[key]) || '';
        return [
            { key: 'Tilawah', label: 'Tilawah', score: getSubjectScore('Tilawah') },
            { key: 'Tahfidz', label: 'Tahfidz', score: displayTahfidz },
            { key: 'Fashohah', label: 'Fashohah', score: getSubjectScore('Fashohah') },
            { key: 'Ilmu Ghorib', label: 'Ilmu Ghorib', score: getSubjectScore('Ilmu Ghorib') },
            { key: 'Ilmu Tajwid', label: 'Ilmu Tajwid', score: getSubjectScore('Ilmu Tajwid') }
        ];
    }, [autoSubjectValues, activeReportStudent, isBulkCapture, mainScoreValues, displayTahfidz]);

    // Compute final class average and total
    const { jumlahNilai, rataRata } = useMemo(() => {
        let total = 0;
        let count = 0;

        reportSubjectRows.forEach(row => {
            const val = row.score;
            const num = parseFloat(val);
            if (!isNaN(num)) {
                total += num;
                count++;
            }
        });

        const sum = count > 0 ? total : 0;
        const avg = count > 0 ? (total / count).toFixed(0) : '';
        return { jumlahNilai: sum || '-', rataRata: avg || '-' };
    }, [reportSubjectRows]);

    const defaultCatatan = useMemo(() => {
        const finalPredicateScore = rataRata !== '-' ? rataRata : displayTahfidz;
        const notePredicate = getArabicPredicateLabel(finalPredicateScore);
        const noteGenderTerm = getGenderNoteTerm(displayGender);
        const predicateText = notePredicate === '-' ? 'yang perlu ditingkatkan' : `dengan predikat ${notePredicate}`;
        return `Alhamdulillah ananda ${activeReportStudent.name} yang ${noteGenderTerm} telah menyelesaikan materi pembelajaran Al Qur'an ${predicateText}. ${getExamNoteFeedback(notePredicate)}.`;
    }, [activeReportStudent.name, displayGender, rataRata, displayTahfidz]);

    const displayedCatatan = isBulkCapture ? defaultCatatan : (isNoteEdited ? catatan : defaultCatatan);

    // Auto-update note if not edited
    useEffect(() => {
        if (!isNoteEdited) {
            setCatatan(defaultCatatan);
        }
    }, [defaultCatatan, isNoteEdited]);

    const handleHafalanChange = (idx, field, val) => {
        let newVal = val;
        if (field === 'score' && newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
        const updated = [...hafalanKelas];
        updated[idx] = { ...updated[idx], [field]: newVal };
        setHafalanKelas(updated);
    };

    const handleHafalanTambahanChange = (idx, field, val) => {
        let newVal = val;
        if (field === 'score' && newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
        const updated = [...hafalanTambahan];
        updated[idx] = { ...updated[idx], [field]: newVal };
        setHafalanTambahan(updated);
    };

    const handleTargetChange = (idx, val) => {
        const updated = [...targets];
        updated[idx] = val;
        setTargets(updated);
    };

    const ensurePdfLibraries = async () => {
        await document.fonts.ready;
        if (!window.htmlToImage) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
            document.body.appendChild(script);
            await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
        }
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.body.appendChild(script);
            await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; });
        }
    };

    const waitForReportPaint = async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (document.fonts?.ready) await document.fonts.ready;
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            await ensurePdfLibraries();

            const { jsPDF } = window.jspdf;
            const element = document.getElementById('individual-raport-capture');

            if (element) {
                const imgData = await window.htmlToImage.toJpeg(element, {
                    quality: 0.98,
                    pixelRatio: 2.5,
                    backgroundColor: '#ffffff'
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Raport_AlQuran_${activeReportStudent.name.replace(/\s+/g, '_')}.pdf`);
                showToast('Raport PDF berhasil diunduh!');
            }
        } catch (error) {
            console.error("Gagal mengunduh PDF:", error);
            showToast("Maaf, terjadi kesalahan saat membuat PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadAllPDF = async () => {
        const studentsToExport = (reportStudents.length > 0 ? reportStudents : [student]).filter(Boolean);
        if (studentsToExport.length === 0) {
            showToast('Tidak ada siswa untuk dibuatkan PDF.');
            return;
        }

        setIsDownloadingAll(true);
        try {
            await ensurePdfLibraries();
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < studentsToExport.length; i += 1) {
                setBulkCaptureStudent(studentsToExport[i]);
                await waitForReportPaint();

                const element = document.getElementById('individual-raport-capture');
                if (!element) continue;

                const imgData = await window.htmlToImage.toJpeg(element, {
                    quality: 0.98,
                    pixelRatio: 2.5,
                    backgroundColor: '#ffffff'
                });

                if (i > 0) pdf.addPage('a4', 'portrait');
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            setBulkCaptureStudent(null);
            const safeHalaqoh = String(activeHalaqoh || 'Semua').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            pdf.save(`Raport_AlQuran_Semua_${safeHalaqoh}.pdf`);
            showToast(`PDF massal ${studentsToExport.length} raport berhasil diunduh!`);
        } catch (error) {
            console.error("Gagal mengunduh PDF massal:", error);
            showToast("Maaf, terjadi kesalahan saat membuat PDF massal.");
        } finally {
            setBulkCaptureStudent(null);
            setIsDownloadingAll(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 sm:bg-slate-900 flex flex-col h-[100dvh] text-slate-100 overflow-hidden font-sans print:static print:h-auto print:overflow-visible print:bg-white print:text-black">
            {/* Stylesheet specifically to print A4 page beautifully */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
                
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                    
                    /* Sembunyikan elemen utama aplikasi yang merender UI selain modal ini */
                    #root > div > :not(main):not(style) { display: none !important; }
                    
                    /* Lepaskan semua pembatas scroll & flex agar bisa memanjang sesuai ukuran kertas */
                    #root, #root > div, main, main > div {
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: auto !important;
                        overflow: hidden !important;
                        position: static !important;
                        display: block !important;
                        background: white !important;
                    }

                    /* Hapus efek zoom di print */
                    #zoom-wrapper {
                        transform: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        overflow: hidden !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    #individual-raport-capture {
                        position: relative !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        min-width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 auto !important;
                        padding: 5mm 14mm 10mm !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        color: black !important;
                        overflow: hidden !important;
                        page-break-before: avoid !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-before: avoid !important;
                        break-after: avoid !important;
                        break-inside: avoid !important;
                    }
                }
                
                #individual-raport-capture * {
                    color-scheme: light !important;
                }
                
                .font-arabic {
                    font-family: 'Amiri', serif !important;
                }
            `}} />

            {/* Top Navigation Bar */}
            <div className="bg-slate-900 sm:bg-slate-800 border-b border-slate-800 sm:border-slate-700 px-3 sm:px-6 py-2.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 z-10 shrink-0 print:hidden shadow-lg shadow-black/10">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 p-2.5 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all font-bold text-sm shrink-0 border border-red-500/20 hover:border-red-500"
                        title="Tutup Pratinjau"
                    >
                        <ArrowLeft size={18} className="hidden sm:block" />
                        <X size={20} className="sm:hidden" />
                        <span className="hidden sm:inline">Tutup</span>
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">Cetak Raport Al-Qur&apos;an</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5 truncate">Siswa: {activeReportStudent.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* Zoom Slider */}
                    <div className="hidden lg:flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-700 mr-2">
                        <span className="text-xs font-bold text-slate-400">Zoom:</span>
                        <input
                            type="range"
                            min="0.3"
                            max="1.2"
                            step="0.05"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-24 accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-slate-600 outline-none"
                        />
                        <span className="text-xs font-black text-emerald-400 w-8 text-right">{Math.round(zoom * 100)}%</span>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading || isDownloadingAll}
                        className="min-w-0 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDownloading ? <Loader2 size={16} className="animate-spin sm:w-4 sm:h-4 w-3.5 h-3.5" /> : <FileText size={16} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Unduh PDF</span>
                        <span className="sm:hidden">PDF</span>
                    </button>

                    <button
                        onClick={handleDownloadAllPDF}
                        disabled={isDownloading || isDownloadingAll}
                        className="min-w-0 sm:flex-none bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 disabled:opacity-50"
                        title="Unduh seluruh raport siswa dalam satu file PDF"
                    >
                        {isDownloadingAll ? <Loader2 size={16} className="animate-spin sm:w-4 sm:h-4 w-3.5 h-3.5" /> : <Download size={16} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">PDF Semua</span>
                        <span className="sm:hidden">Semua</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={isDownloading || isDownloadingAll}
                        className="min-w-0 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Printer size={16} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cetak (Browser)</span>
                        <span className="sm:hidden">Cetak</span>
                    </button>
                </div>
            </div>

            {/* Split Main Screen */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar print:overflow-visible print:block">

                {/* Left Panel: Sidebar Editors */}
                <div className="order-last lg:order-none w-full lg:w-[450px] bg-slate-950 sm:bg-slate-900 lg:border-r border-b border-slate-800 flex flex-col lg:h-full lg:min-h-0 lg:overflow-y-auto overscroll-y-contain custom-scrollbar shrink-0 p-3 sm:p-6 gap-3.5 sm:gap-6 print:hidden" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {/* 1. DATA IDENTITAS CARD */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">1. Identitas Raport</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No. Induk (NIS)</label>
                                <input
                                    type="text"
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    onBlur={() => syncStudentField('nis', nis)}
                                    placeholder="2122.1.008"
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kelas</label>
                                <input
                                    type="text"
                                    value={kelas}
                                    onChange={(e) => setKelas(e.target.value)}
                                    onBlur={() => syncStudentField('kelas', kelas)}
                                    placeholder="5D"
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Halaqoh</label>
                                <input
                                    type="text"
                                    value={halaqoh}
                                    onChange={(e) => setHalaqoh(e.target.value)}
                                    placeholder="Abu Bakar"
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jenis Kelamin</label>
                                <select
                                    value={gender}
                                    onChange={(e) => { setGender(e.target.value); syncStudentField('gender', e.target.value); }}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                >
                                <option value="L">L</option>
                                <option value="P">P</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. NILAI UTAMA (TABLE 1) */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">2. Nilai Sub Bidang Studi</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {REPORT_TAHSIN_SUBJECTS.map((subject) => {
                                const autoValue = autoSubjectValues[subject.key] || '';
                                return (
                                <div key={subject.key} className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider" title={subject.label}>{subject.label}</label>
                                    <input
                                        type="text"
                                        value={autoValue || mainScoreValues[subject.key] || ''}
                                        disabled={Boolean(autoValue)}
                                        onChange={(e) => {
                                            let newVal = e.target.value;
                                            if (newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
                                            setMainScoreValues(prev => ({ ...prev, [subject.key]: newVal }));
                                        }}
                                        placeholder={autoValue ? 'Otomatis dari rata-rata materi' : '-'}
                                        title={autoValue ? 'Nilai otomatis dari rata-rata materi yang sudah dinilai di halaman ujian' : 'Isi manual jika belum ada nilai detail'}
                                        className={`bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 text-center font-bold outline-none focus:border-emerald-500 ${autoValue ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                );
                            })}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tahfidz (Rata-rata)</label>
                                <input
                                    type="text"
                                    value={tahfidzOverride}
                                    onChange={(e) => {
                                        let newVal = e.target.value;
                                        if (newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
                                        setTahfidzOverride(newVal);
                                    }}
                                    placeholder={computedTahfidzAvg || '-'}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 text-center font-bold outline-none focus:border-emerald-500"
                                    title="Kosongkan untuk menggunakan rata-rata hafalan otomatis"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. RINCIAN SETORAN HAFALAN */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-purple-400 font-bold text-sm uppercase tracking-wider">3. I. Hafalan Kelas (Max 11)</span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                            {hafalanKelas.map((h, i) => (
                                <div key={i} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                                    <span className="text-xs font-black text-slate-500 w-5 text-center">{i + 1}</span>
                                    <input
                                        type="text"
                                        list="surah-list-options"
                                        value={h.surah}
                                        onChange={(e) => handleHafalanChange(i, 'surah', e.target.value)}
                                        placeholder="Nama surat"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 flex-1 text-xs outline-none focus:border-purple-500 text-slate-200 font-bold"
                                    />
                                    <input
                                        type="text"
                                        value={h.score}
                                        onChange={(e) => handleHafalanChange(i, 'score', e.target.value)}
                                        placeholder="Nilai"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 w-12 text-center text-xs outline-none focus:border-purple-500 text-slate-200 font-black"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. HAFALAN TAMBAHAN */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-fuchsia-400 font-bold text-sm uppercase tracking-wider">4. II. Hafalan Tambahan (Max 11)</span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                            {hafalanTambahan.map((h, i) => (
                                <div key={i} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                                    <span className="text-xs font-black text-slate-500 w-5 text-center">{i + 1}</span>
                                    <input
                                        type="text"
                                        list="surah-list-options"
                                        value={h.surah}
                                        onChange={(e) => handleHafalanTambahanChange(i, 'surah', e.target.value)}
                                        placeholder="Nama surat"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 flex-1 text-xs outline-none focus:border-fuchsia-500 text-slate-200 font-bold"
                                    />
                                    <input
                                        type="text"
                                        value={h.score}
                                        onChange={(e) => handleHafalanTambahanChange(i, 'score', e.target.value)}
                                        placeholder="Nilai"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 w-12 text-center text-xs outline-none focus:border-fuchsia-500 text-slate-200 font-black"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. TARGET YANG TIDAK TERCAPAI (Max 8) */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-orange-400 font-bold text-sm uppercase tracking-wider">5. III. Target Tidak Tercapai</span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
                            {targets.map((tgt, i) => (
                                <div key={i} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800 min-w-0">
                                    <span className="text-xs font-black text-slate-500 w-6 text-center shrink-0">{i + 1}</span>
                                    <input
                                        type="text"
                                        list="surah-list-options"
                                        value={tgt}
                                        onChange={(e) => handleTargetChange(i, e.target.value)}
                                        placeholder="Nama surat"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 w-full min-w-0 text-xs outline-none focus:border-orange-500 text-slate-200 font-bold placeholder:text-slate-600"
                                    />
                                </div>
                            ))}
                        </div>
                        <datalist id="surah-list-options">
                            {surahList.map(s => <option key={s.no} value={s.name} />)}
                        </datalist>
                    </div>

                    {/* 6. ADAB DALAM HALAQOH */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-teal-400 font-bold text-sm uppercase tracking-wider">6. IV. Adab Dalam Halaqoh</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {Object.entries({
                                terhadapAlquran: 'Terhadap Al-Qur\'an',
                                terhadapGuru: 'Terhadap Guru',
                                tertib: 'Tertib',
                                istiqomah: 'Istiqomah'
                            }).map(([key, label]) => (
                                <div key={key} className="flex justify-between items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400">{label}</span>
                                    <select
                                        value={adab[key]}
                                        onChange={(e) => setAdab(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none w-16 text-center font-bold focus:border-emerald-500"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 7. CATATAN */}
                    <div className="bg-slate-900 sm:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:border-slate-700/60 flex flex-col gap-4 mb-4 lg:mb-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-rose-400 font-bold text-sm uppercase tracking-wider">7. Catatan</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Catatan Guru</label>
                                    <button
                                        onClick={() => {
                                            setCatatan(defaultCatatan);
                                            setIsNoteEdited(false);
                                        }}
                                        className="text-[9px] font-bold text-emerald-400 hover:underline"
                                    >
                                        Reset Default
                                    </button>
                                </div>
                                <textarea
                                    value={displayedCatatan}
                                    onChange={(e) => {
                                        setCatatan(e.target.value);
                                        setIsNoteEdited(true);
                                    }}
                                    rows={3}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none leading-relaxed focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: A4 Live Preview (with transforms) */}
                <div className="order-first lg:order-none flex-none lg:flex-1 h-[calc(100dvh-142px)] min-h-[560px] lg:h-auto lg:min-h-0 bg-slate-950 flex justify-start sm:justify-center overflow-auto p-3 sm:p-8 pb-40 lg:pb-8 relative items-start select-none custom-scrollbar print:p-0 print:overflow-visible print:bg-white print:block" style={{ WebkitOverflowScrolling: 'touch' }}>

                    <div
                        id="zoom-wrapper"
                        className="origin-top-left transition-transform shadow-2xl duration-200 mb-12 shrink-0 border border-slate-800"
                        style={{ transform: `scale(${zoom})`, height: `${297 * zoom}mm` }}
                    >

                        {/* THE ACTUAL A4 REPORT SHEET (Capturable Node) */}
                        <div
                            id="individual-raport-capture"
                            className="bg-white text-black text-xs font-sans relative flex flex-col justify-between"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                minWidth: '210mm',
                                minHeight: '297mm',
                                padding: '5mm 14mm 10mm',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                            }}
                        >

                            <div>
                                {/* Header */}
                                <div className="text-center font-extrabold leading-tight mb-2 tracking-wide uppercase text-black">
                                    {hasInstitutionLogo && (
                                        <img src={reportInstitutionLogo} alt="Logo Sekolah" className="w-[34mm] h-[34mm] object-contain mx-auto mb-1" />
                                    )}
                                    <div className="text-[12pt] mb-0.5">Laporan Penilaian Hasil Belajar</div>
                                    <div className="text-[10.5pt]">Bidang Studi Al-Qur&apos;an</div>
                                </div>

                                {/* Identity Block */}
                                <div className="flex justify-between text-[9.5px] leading-[1.15] mb-2 font-bold text-black">
                                    <table className="w-[60%] border-none">
                                        <tbody>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">Nama Siswa</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="uppercase font-extrabold text-[10.5px] align-top pb-1">{activeReportStudent.name}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">No. Induk</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="align-top pb-1">{displayNis || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">Jenis Kelamin</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="align-top pb-1">{displayGender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">Nama Sekolah</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="uppercase align-top pb-1">{namaSekolah}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top">Alamat Sekolah</td>
                                                <td className="w-[10px] align-top">:</td>
                                                <td className="font-normal text-[8.5px] align-top leading-tight pr-4"><div className="line-clamp-2">{alamatSekolah}</div></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table className="w-[35%] border-none">
                                        <tbody>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">Kelas</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="font-extrabold text-[10.5px] align-top pb-1">{displayKelas || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1">Semester</td>
                                                <td className="w-[10px] align-top pb-1">:</td>
                                                <td className="align-top pb-1">{semester}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top">Tahun Pelajaran</td>
                                                <td className="w-[10px] align-top">:</td>
                                                <td className="align-top">{tahunPelajaran}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table 1: Sub Bidang Studi */}
                                <table className="w-full border-collapse border-1.5 border-black text-[10px] text-black mb-2 table-fixed">
                                    <thead>
                                        <tr className="bg-gray-100 font-bold h-[24px]">
                                            <th className="border border-black text-center w-[6%] text-black p-0.5 h-[24px] leading-none">No</th>
                                            <th className="border border-black text-left w-[40%] text-black px-2.5 py-0.5 h-[24px] leading-none">Sub Bidang Studi</th>
                                            <th className="border border-black text-center w-[12%] text-black p-0.5 h-[24px] leading-none">KKM</th>
                                            <th className="border border-black text-center w-[15%] text-black p-0.5 h-[24px] leading-none">Nilai</th>
                                            <th className="border border-black text-center w-[27%] text-black p-0.5 h-[24px] leading-none">Deskripsi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportSubjectRows.map((row, idx) => (
                                            <tr key={row.key} className="h-[20px] font-semibold">
                                                <td className="border border-black text-center p-0.5 h-[20px] leading-none">{idx + 1}</td>
                                                <td className="border border-black text-left px-2.5 py-0.5 h-[20px] leading-none truncate">{row.label}</td>
                                                <td className="border border-black text-center p-0.5 h-[20px] leading-none font-bold">{kkmScore}</td>
                                                <td className="border border-black text-center p-0.5 h-[20px] leading-none font-bold">{row.score || '-'}</td>
                                                <td className="border border-black text-center p-0.5 h-[20px] leading-none font-medium truncate">{getGradeDescription(row.score, kkmScore)}</td>
                                            </tr>
                                        ))}
                                        {/* Footer totals */}
                                        <tr className="h-[20px] font-bold">
                                            <td colSpan={3} className="border border-black text-center p-0.5 h-[20px] leading-none">Jumlah Nilai</td>
                                            <td className="border border-black text-center p-0.5 h-[20px] leading-none font-extrabold">{jumlahNilai}</td>
                                            <td className="border border-black text-center p-0.5 h-[20px] leading-none text-gray-500 font-normal">-</td>
                                        </tr>
                                        <tr className="h-[20px] font-bold">
                                            <td colSpan={3} className="border border-black text-center p-0.5 h-[20px] leading-none">Nilai Rata-rata</td>
                                            <td className="border border-black text-center p-0.5 h-[20px] leading-none font-extrabold">{rataRata}</td>
                                            <td className="border border-black text-center p-0.5 h-[20px] leading-none text-gray-500 font-normal">-</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Table 2 section: Setoran Hafalan */}
                                <div className="text-center font-extrabold text-[10pt] uppercase mb-1.5 text-black tracking-wide">
                                    Daftar Rincian Nilai Setoran Hafalan Al Qur&apos;an
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-black text-[9px] mb-2">
                                    {/* Left Table: Hafalan Kelas */}
                                    <div>
                                        <div className="font-extrabold mb-0.5 tracking-tight text-[9.5px] text-black">
                                            I. HAFALAN KELAS
                                        </div>
                                        <table className="w-full border-collapse border border-black table-fixed">
                                            <thead>
                                                <tr className="bg-gray-100 font-bold h-[20px] text-center">
                                                    <td className="border border-black p-0.5 w-[8%] h-[20px] leading-none font-bold">No</td>
                                                    <td className="border border-black p-0.5 w-[54%] h-[20px] leading-none font-bold">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[18%] h-[20px] leading-none font-bold">Nilai</td>
                                                    <td className="border border-black p-0.5 w-[20%] h-[20px] leading-none font-bold">Predikat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const item = groupedDisplayHafalanKelas[i] || { surah: '', score: '' };
                                                    return (
                                                        <tr key={i} className="h-[18px]">
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none font-semibold">{i + 1}</td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {translateToArabicSurahSafe(item.surah)}
                                                            </td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none font-extrabold">{item.score || ''}</td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[11px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {getArabicPredicateLabel(item.score)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Right Table: Hafalan Tambahan */}
                                    <div>
                                        <div className="font-extrabold mb-0.5 tracking-tight text-[9.5px] text-black">
                                            II. HAFALAN TAMBAHAN
                                        </div>
                                        <table className="w-full border-collapse border border-black table-fixed">
                                            <thead>
                                                <tr className="bg-gray-100 font-bold h-[20px] text-center">
                                                    <td className="border border-black p-0.5 w-[8%] h-[20px] leading-none font-bold">No</td>
                                                    <td className="border border-black p-0.5 w-[54%] h-[20px] leading-none font-bold">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[18%] h-[20px] leading-none font-bold">Nilai</td>
                                                    <td className="border border-black p-0.5 w-[20%] h-[20px] leading-none font-bold">Predikat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const item = groupedDisplayHafalanTambahan[i] || { surah: '', score: '' };
                                                    return (
                                                        <tr key={i} className="h-[18px]">
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none font-semibold">{i + 1}</td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {translateToArabicSurahSafe(item.surah)}
                                                            </td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none font-extrabold">{item.score || ''}</td>
                                                            <td className="border border-black text-center p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[11px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {getArabicPredicateLabel(item.score)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section III: Target tidak tercapai */}
                                <div className="font-extrabold mb-0.5 tracking-tight text-[9.5px] text-black">
                                    III. TARGET YANG TIDAK TERCAPAI
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-black text-[9px] mb-2">
                                    {/* Left Table: Target 1-4 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black text-center table-fixed">
                                            <thead>
                                                <tr className="h-[18px] font-extrabold">
                                                    <td className="border border-black p-0.5 w-[12%] h-[18px] leading-none">No</td>
                                                    <td className="border border-black p-0.5 w-[38%] h-[18px] leading-none">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[12%] h-[18px] leading-none">No</td>
                                                    <td className="border border-black p-0.5 w-[38%] h-[18px] leading-none">Nama Surat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[[0, 2], [1, 3]].map(([leftIdx, rightIdx]) => (
                                                    <tr key={`${leftIdx}-${rightIdx}`} className="h-[18px]">
                                                        <td className="border border-black p-0.5 h-[18px] leading-none font-semibold bg-gray-50">{leftIdx + 1}</td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurahSafe(displayTargets[leftIdx])}
                                                        </td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none font-semibold bg-gray-50">{rightIdx + 1}</td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurahSafe(displayTargets[rightIdx])}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Right Table: Target 5-8 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black text-center table-fixed">
                                            <thead>
                                                <tr className="h-[18px] font-extrabold">
                                                    <td className="border border-black p-0.5 w-[12%] h-[18px] leading-none">No</td>
                                                    <td className="border border-black p-0.5 w-[38%] h-[18px] leading-none">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[12%] h-[18px] leading-none">No</td>
                                                    <td className="border border-black p-0.5 w-[38%] h-[18px] leading-none">Nama Surat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[[4, 6], [5, 7]].map(([leftIdx, rightIdx]) => (
                                                    <tr key={`${leftIdx}-${rightIdx}`} className="h-[18px]">
                                                        <td className="border border-black p-0.5 h-[18px] leading-none font-semibold bg-gray-50">{leftIdx + 1}</td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurahSafe(displayTargets[leftIdx])}
                                                        </td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none font-semibold bg-gray-50">{rightIdx + 1}</td>
                                                        <td className="border border-black p-0.5 h-[18px] leading-none overflow-hidden whitespace-nowrap font-arabic text-[12px] font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurahSafe(displayTargets[rightIdx])}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section IV: Adab */}
                                <div className="font-extrabold mb-0.5 tracking-tight text-[9.5px] text-black">
                                    IV. ADAB DALAM HALAQOH
                                </div>
                                <table className="w-full border-collapse border border-black text-[9px] text-black mb-2 table-fixed">
                                    <thead>
                                        <tr className="bg-gray-100 font-bold h-[20px] text-center">
                                            <td className="border border-black p-0.5 w-[8%] font-bold">No</td>
                                            <td className="border border-black p-0.5 w-[72%] text-left px-2.5 font-bold">Adab</td>
                                            <td className="border border-black p-0.5 w-[20%] font-bold">Nilai</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { id: 1, name: 'Terhadap Al Qur\'an', val: adab.terhadapAlquran },
                                            { id: 2, name: 'Terhadap Guru', val: adab.terhadapGuru },
                                            { id: 3, name: 'Tertib', val: adab.tertib },
                                            { id: 4, name: 'Istiqomah', val: adab.istiqomah }
                                        ].map((row) => (
                                            <tr key={row.id} className="h-[18px] text-center font-semibold">
                                                <td className="border border-black p-0.5">{row.id}</td>
                                                <td className="border border-black text-left px-2.5 p-0.5">{row.name}</td>
                                                <td className="border border-black p-0.5 font-extrabold text-center">{row.val}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Catatan Block */}
                                <div className="text-[9.5px] font-extrabold mb-1 text-black">Catatan :</div>
                                <div className="border border-black rounded-sm p-2 w-full text-[9px] font-semibold text-black leading-relaxed min-h-[48px] max-h-[60px] bg-white overflow-hidden">
                                    {displayedCatatan}
                                </div>
                            </div>

                            {/* Footer (Rentan Nilai & Signatures) */}
                            <div className="text-[9px] text-black font-bold mt-2 leading-tight">
                                <div className="flex justify-between items-start">
                                    {/* Rentan Nilai */}
                                    <div className="flex items-center gap-2 text-[8.5px] whitespace-nowrap">
                                        <span className="font-extrabold border-b border-black pb-0.5">Rentan Nilai</span>
                                        <span>75 - 82 : <span className="font-arabic font-bold text-[11px] text-black">جيد</span></span>
                                        <span>83 - 91 : <span className="font-arabic font-bold text-[11px] text-black">جيد جدا</span></span>
                                        <span>92 - 100 : <span className="font-arabic font-bold text-[11px] text-black">ممتاز</span></span>
                                    </div>

                                    <div className="w-[170px] text-[8.5px]">
                                        <div className="grid grid-cols-[58px_7px_1fr] gap-y-0.5 text-left">
                                            <div>Diberikan di</div>
                                            <div>:</div>
                                            <div>{tempatCetak}</div>
                                            <div>Tanggal</div>
                                            <div>:</div>
                                            <div>{tanggalCetak}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-start mt-2">
                                    <div className="w-[120px] h-[74px] flex flex-col justify-between text-center">
                                        <div>Orang Tua / Wali Siswa</div>
                                        <div className="border-b border-black w-full mb-1"></div>
                                    </div>

                                    <div className="w-[150px] h-[74px] flex flex-col justify-between text-center text-[9px]">
                                        <div>Kepala Sekolah</div>
                                        <div className="font-extrabold underline uppercase text-black leading-none">{kepalaSekolah}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Tombol Aksi Melayang (Bawah) */}
            <div className="fixed left-3 right-3 bottom-3 lg:left-auto lg:right-8 lg:bottom-8 z-[100] grid grid-cols-3 lg:flex items-center justify-center lg:justify-end gap-2 print:hidden">
                <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading || isDownloadingAll}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl lg:rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.35)] active:scale-95 transition-all font-black border border-blue-500 disabled:opacity-50 text-sm sm:text-base"
                    title="Download PDF"
                >
                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} strokeWidth={3} />}
                    <span>PDF</span>
                </button>

                <button
                    onClick={handlePrint}
                    disabled={isDownloading || isDownloadingAll}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl lg:rounded-full shadow-[0_10px_25px_rgba(5,150,105,0.35)] active:scale-95 transition-all font-black border border-emerald-500 disabled:opacity-50 text-sm sm:text-base"
                    title="Print Raport"
                >
                    <Printer size={18} strokeWidth={3} />
                    <span>Print</span>
                </button>

                <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl lg:rounded-full shadow-[0_10px_25px_rgba(220,38,38,0.4)] active:scale-95 transition-all font-black border border-red-500 text-sm sm:text-base"
                    title="Tutup Pratinjau"
                >
                    <X size={18} strokeWidth={3} />
                    <span>Tutup</span>
                </button>
            </div>
        </div>
    );
};

export default UjianView;
