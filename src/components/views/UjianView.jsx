import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Award, Plus, Trash2, Settings, ClipboardList, Loader2, BookOpen, Mic, Printer, Search, ChevronDown, AlertTriangle, X, Download, FileText, ArrowLeft, Check, CalendarDays, Calendar } from 'lucide-react';
import SurahSelector from '../SurahSelector';
import { surahList, ghoribList, tajwidList } from '../../data/constants';

const TahsinSelector = ({ value, onChange, placeholder, className }) => {
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

        if (!searchTerm || searchTerm === value) return allGroups;

        const lowerTerm = searchTerm.toLowerCase();
        return allGroups.map(group => ({
            label: group.label,
            items: group.items.filter(item => item.toLowerCase().includes(lowerTerm))
        })).filter(group => group.items.length > 0);
    }, [searchTerm, isOpen, value]);

    const handleSelect = (item) => {
        onChange(item);
        setIsOpen(false);
    };

    return (
        <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`} ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value); // Sinkronisasi langsung untuk custom text
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={className}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={18} />
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
const TahfidzSelector = ({ value, onChange, placeholder, className, surahList }) => {
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
            { label: 'Daftar Surat', items: surahList.map(s => s.name) }
        ];

        if (!searchTerm || searchTerm === value) return allGroups;

        const lowerTerm = searchTerm.toLowerCase();
        return allGroups.map(group => ({
            label: group.label,
            items: group.items.filter(item => item.toLowerCase().includes(lowerTerm))
        })).filter(group => group.items.length > 0);
    }, [searchTerm, isOpen, value, surahList]);

    const handleSelect = (item) => {
        onChange(item);
        setIsOpen(false);
    };

    return (
        <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`} ref={wrapperRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value); // Sinkronisasi langsung untuk custom text
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={className}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={18} />
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
const ScoreInput = React.memo(({ studentId, rowIndex, material, initialScore, onSave, kkmScore, isMobile = false }) => {
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

    return (
        <div className={`relative inline-block w-full ${isMobile ? '' : 'max-w-[80px]'}`}>
            <input
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                value={val}
                onChange={e => {
                    let newVal = e.target.value;
                    if (newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
                    setVal(newVal);
                }}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                data-score-input="true"
                data-is-mobile={isMobile ? "true" : "false"}
                data-mat-id={material.replace(/[^a-zA-Z0-9]/g, '')}
                data-row-index={rowIndex}
                className={`w-full px-1.5 sm:px-2 ${isMobile ? ((val ?? '').toString().length > 3 ? 'py-1.5 text-xs sm:text-sm' : 'py-1.5 text-sm sm:text-base') + ' shadow-inner rounded-lg' : 'py-2.5 text-sm rounded-xl'} font-black text-center outline-none transition-all duration-300 focus:ring-4 focus:scale-105 focus:z-20 relative !text-black ${isSaving ? 'animate-pulse !bg-amber-50 !border-amber-300 shadow-sm focus:!border-amber-500 focus:!ring-amber-500/20' :
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
        const scores = materials.tahsin.filter(m => list.includes(m)).map(m => parseFloat(student.ujian_records?.[m])).filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    };

    const overallAvg = React.useMemo(() => {
        let total = 0;
        let count = 0;
        materials.tahsin.forEach(mat => {
            const val = parseFloat(student.ujian_records?.[mat]);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        });
        materials.tahfidz.forEach(mat => {
            const val = parseFloat(student.ujian_records?.[mat]);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        });
        return count > 0 ? (total / count).toFixed(1) : '-';
    }, [student.ujian_records, materials]);

    const isAvgBelowKKM = overallAvg !== '-' && parseFloat(overallAvg) < kkmScore;

    return (
        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group animate-row-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <td className="p-3 sm:p-5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 transition-colors z-10 shadow-[4px_0_12px_rgba(0,0,0,0.02)] border-r border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-800">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 overflow-hidden">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 leading-tight truncate">{student.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Kelas {student.kelas || '-'}</span>
                    </div>
                </div>
            </td>
            {materials.tahsin.map((mat, i) => {
                return (
                    <td key={`t-in-${i}`} className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle">
                        <ScoreInput studentId={student.id} rowIndex={index} material={mat} initialScore={student.ujian_records?.[mat]} onSave={onSaveScore} kkmScore={kkmScore} />
                    </td>
                );
            })}
            {hasTajwidSub && (
                <td className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/10">
                    {getAverage(tajwidList)}
                </td>
            )}
            {hasGhoribSub && (
                <td className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle font-black text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-500/10">
                    {getAverage(ghoribList)}
                </td>
            )}

            {materials.tahfidz.map((mat, i) => {
                return (
                    <td key={`f-in-${i}`} className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle bg-purple-50/10 dark:bg-purple-500/5">
                        <ScoreInput studentId={student.id} rowIndex={index} material={mat} initialScore={student.ujian_records?.[mat]} onSave={onSaveScore} kkmScore={kkmScore} />
                    </td>
                );
            })}
            {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
                <td className="p-3 text-center border-l border-slate-100/50 dark:border-slate-800/50 align-middle text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50/30 dark:bg-slate-800/30">Belum ada materi.</td>
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
    const getAverage = (list) => {
        const scores = materials.tahsin.filter(m => list.includes(m)).map(m => parseFloat(student.ujian_records?.[m])).filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    };

    const nameSize = student.name.length > 24 ? 'text-sm' : student.name.length > 18 ? 'text-[15px]' : 'text-base sm:text-lg';

    const overallAvg = React.useMemo(() => {
        let total = 0; let count = 0;
        materials.tahsin.forEach(mat => { const val = parseFloat(student.ujian_records?.[mat]); if (!isNaN(val)) { total += val; count++; } });
        materials.tahfidz.forEach(mat => { const val = parseFloat(student.ujian_records?.[mat]); if (!isNaN(val)) { total += val; count++; } });
        return count > 0 ? (total / count).toFixed(1) : '-';
    }, [student.ujian_records, materials]);

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
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                            {materials.tahsin.map((mat, i) => {
                                return (
                                    <div key={`t-mob-${i}`} className="bg-white dark:bg-slate-800/60 p-1.5 sm:p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between items-center gap-1 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                                        <span className={`${mat.length > 20 ? 'text-[8px]' : mat.length > 12 ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2 w-full h-6 flex items-center justify-center`} title={mat}>{mat}</span>
                                        <ScoreInput studentId={student.id} rowIndex={index} material={mat} initialScore={student.ujian_records?.[mat]} onSave={onSaveScore} kkmScore={kkmScore} isMobile={true} />
                                    </div>
                                );
                            })}
                            {hasTajwidSub && (
                                <div className="bg-indigo-50/60 dark:bg-indigo-500/10 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-center items-center gap-0.5 shadow-sm">
                                    <span className="text-[8px] sm:text-[9px] font-bold text-indigo-500 dark:text-indigo-400 text-center leading-tight h-6 flex items-center justify-center">Rata Tajwid</span>
                                    <span className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300 py-1">{getAverage(tajwidList)}</span>
                                </div>
                            )}
                            {hasGhoribSub && (
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                            {materials.tahfidz.map((mat, i) => {
                                return (
                                    <div key={`f-mob-${i}`} className="bg-white dark:bg-slate-800/60 p-1.5 sm:p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between items-center gap-1 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
                                        <span className={`${mat.length > 20 ? 'text-[8px]' : mat.length > 12 ? 'text-[9px]' : 'text-[10px]'} font-bold text-slate-600 dark:text-slate-300 text-center leading-tight line-clamp-2 w-full h-6 flex items-center justify-center`} title={mat}>{mat}</span>
                                        <ScoreInput studentId={student.id} rowIndex={index} material={mat} initialScore={student.ujian_records?.[mat]} onSave={onSaveScore} kkmScore={kkmScore} isMobile={true} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">Belum ada materi ujian.</p>
                )}
            </div>
        </div>
    );
});

const UjianView = ({ activeHalaqoh, filteredStudents, students, setStudents, showToast, currentUser }) => {
    const [activeTab, setActiveTab] = useState('penilaian'); // 'penilaian' | 'jadwal' | 'materi'
    const [materials, setMaterials] = useState({ tahsin: [], tahfidz: [], jadwal: [], reportSettings: {} });
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [kkmScore, setKkmScore] = useState(75);
    const [showUnscoredOnly, setShowUnscoredOnly] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [activePrintStudent, setActivePrintStudent] = useState(null);

    const [newTahsin, setNewTahsin] = useState('');
    const [newTahfidz, setNewTahfidz] = useState('');

    const [isAddingJadwal, setIsAddingJadwal] = useState(false);
    const [newJadwal, setNewJadwal] = useState({ tanggal: '', materi: [] });
    const [jadwalFilter, setJadwalFilter] = useState('');

    const hasTajwidSub = useMemo(() => materials.tahsin.some(mat => tajwidList.includes(mat)), [materials.tahsin]);
    const hasGhoribSub = useMemo(() => materials.tahsin.some(mat => ghoribList.includes(mat)), [materials.tahsin]);

    const [localRS, setLocalRS] = useState({});
    useEffect(() => {
        const rs = materials.reportSettings || {};
        setLocalRS({
            semester: rs.semester || (new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap'),
            tahunPelajaran: rs.tahunPelajaran || (new Date().getMonth() >= 6 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`),
            namaSekolah: rs.namaSekolah || 'SDIT AL FITYAN SCHOOL BOGOR',
            alamatSekolah: rs.alamatSekolah || 'Jl. Bengkel Roda, Kp. Cipiicung.\nDesa Mekarsari. Kec. Cileungsi. Bogor',
            kepalaSekolah: rs.kepalaSekolah || 'Mei Tri Listari, S.Pd.I, M. Pd',
            tempatCetak: rs.tempatCetak || 'Bogor',
            tanggalCetak: rs.tanggalCetak || getIndonesianDate()
        });
    }, [materials.reportSettings]);

    const displayedStudents = useMemo(() => {
        let result = filteredStudents;

        if (searchQuery.trim()) {
            result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (showUnscoredOnly) {
            result = result.filter(s => {
                const hasUngradedTahsin = materials.tahsin.some(mat => {
                    const score = s.ujian_records?.[mat];
                    return score === undefined || score === null || score.toString().trim() === '';
                });
                const hasUngradedTahfidz = materials.tahfidz.some(mat => {
                    const score = s.ujian_records?.[mat];
                    return score === undefined || score === null || score.toString().trim() === '';
                });
                return hasUngradedTahsin || hasUngradedTahfidz;
            });
        }

        return result;
    }, [filteredStudents, searchQuery, showUnscoredOnly, materials]);

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
                        setMaterials({
                            tahsin: data.ujian_materials.tahsin || [],
                            tahfidz: data.ujian_materials.tahfidz || [],
                            jadwal: data.ujian_materials.jadwal || [],
                            reportSettings: data.ujian_materials.reportSettings || {}
                        });
                    }
                    if (data.kkm_score) setKkmScore(data.kkm_score);
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
            setMaterials(newMats);
            showToast('Pengaturan berhasil diperbarui!');
        }
    };

    const handleSaveJadwal = () => {
        if (!newJadwal.tanggal || newJadwal.materi.length === 0) {
            showToast('Tanggal dan minimal satu materi harus dipilih!');
            return;
        }
        const updatedJadwal = [...(materials.jadwal || []), { ...newJadwal, id: Date.now() }];
        saveMaterials({ ...materials, jadwal: updatedJadwal });
        setNewJadwal({ tanggal: '', materi: [] });
        setIsAddingJadwal(false);
    };

    const handleDeleteJadwal = (id) => {
        setConfirmDialog({
            isOpen: true,
            message: 'Yakin ingin menghapus jadwal ujian ini?',
            onConfirm: () => {
                const updatedJadwal = (materials.jadwal || []).filter(j => j.id !== id);
                saveMaterials({ ...materials, jadwal: updatedJadwal });
            }
        });
    };

    const handleAddTahsin = () => {
        if (!newTahsin.trim() || materials.tahsin.includes(newTahsin.trim())) return;
        const updated = { ...materials, tahsin: [...materials.tahsin, newTahsin.trim()] };
        saveMaterials(updated);
        setNewTahsin('');
    };

    const handleAddTahfidz = (val) => {
        if (!val || materials.tahfidz.includes(val)) return;
        const updated = { ...materials, tahfidz: [...materials.tahfidz, val] };
        saveMaterials(updated);
        setNewTahfidz('');
    };

    const handleRemoveMaterial = (type, index) => {
        setConfirmDialog({
            isOpen: true,
            message: 'Yakin ingin menghapus materi ini dari daftar ujian?',
            onConfirm: () => {
                const arr = [...materials[type]];
                arr.splice(index, 1);
                saveMaterials({ ...materials, [type]: arr });
            }
        });
    };

    const formatDateForJadwal = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

    const classAverages = useMemo(() => {
        const tahsinAvgs = materials.tahsin.map(mat => {
            const scores = displayedStudents.map(s => parseFloat(s.ujian_records?.[mat])).filter(n => !isNaN(n));
            return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        });

        const tahfidzAvgs = materials.tahfidz.map(mat => {
            const scores = displayedStudents.map(s => parseFloat(s.ujian_records?.[mat])).filter(n => !isNaN(n));
            return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        });

        const allTajwidScores = displayedStudents.flatMap(s => materials.tahsin.filter(m => tajwidList.includes(m)).map(m => parseFloat(s.ujian_records?.[m])).filter(n => !isNaN(n)));
        const tajwidAvg = allTajwidScores.length > 0 ? (allTajwidScores.reduce((a, b) => a + b, 0) / allTajwidScores.length).toFixed(1) : '-';

        const allGhoribScores = displayedStudents.flatMap(s => materials.tahsin.filter(m => ghoribList.includes(m)).map(m => parseFloat(s.ujian_records?.[m])).filter(n => !isNaN(n)));
        const ghoribAvg = allGhoribScores.length > 0 ? (allGhoribScores.reduce((a, b) => a + b, 0) / allGhoribScores.length).toFixed(1) : '-';

        let totalAll = 0; let countAll = 0;
        displayedStudents.forEach(s => {
            materials.tahsin.forEach(mat => { const val = parseFloat(s.ujian_records?.[mat]); if (!isNaN(val)) { totalAll += val; countAll++; } });
            materials.tahfidz.forEach(mat => { const val = parseFloat(s.ujian_records?.[mat]); if (!isNaN(val)) { totalAll += val; countAll++; } });
        });
        const overallAvgAll = countAll > 0 ? (totalAll / countAll).toFixed(1) : '-';

        return { tahsinAvgs, tahfidzAvgs, tajwidAvg, ghoribAvg, overallAvgAll };
    }, [displayedStudents, materials]);

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
        const headers = ['Nama Siswa', ...materials.tahsin, ...materials.tahfidz, 'Rata-Rata Akhir'];
        const rows = displayedStudents.map(student => {
            const row = [student.name];
            let total = 0; let count = 0;
            materials.tahsin.forEach(mat => {
                const val = student.ujian_records?.[mat] || '-';
                row.push(val);
                if (val !== '-' && !isNaN(parseFloat(val))) { total += parseFloat(val); count++; }
            });
            materials.tahfidz.forEach(mat => {
                const val = student.ujian_records?.[mat] || '-';
                row.push(val);
                if (val !== '-' && !isNaN(parseFloat(val))) { total += parseFloat(val); count++; }
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
            />
        );
    }

    return (
        <div className="p-4 sm:p-6 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Style khusus untuk cetak halaman ujian */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                    
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
                        <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight truncate">Ujian Al-Qur&apos;an</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 line-clamp-1">Kelola Materi &amp; Nilai Akhir Semester</p>
                    </div>
                </div>
                <div className="flex items-center justify-center w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 p-1.5 sm:p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex-1 sm:flex-none px-4 py-1.5 sm:py-2 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</span>
                        <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{filteredStudents.length}</span>
                    </div>
                    <div className="flex-1 sm:flex-none px-4 py-1.5 sm:py-2 flex flex-col items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Materi</span>
                        <span className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{materials.tahsin.length + materials.tahfidz.length}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigasi & Aksi */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 print:hidden">
                <div className="flex flex-row w-full lg:w-fit bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl sm:rounded-2xl gap-1 shadow-inner transition-colors overflow-x-auto hide-scrollbar">
                    <button onClick={() => setActiveTab('penilaian')} className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 min-w-fit ${activeTab === 'penilaian' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                        <ClipboardList size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Penilaian</span><span className="sm:hidden">Nilai</span>
                    </button>
                    <button onClick={() => setActiveTab('jadwal')} className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 min-w-fit ${activeTab === 'jadwal' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                        <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" /> Jadwal
                    </button>
                    <button onClick={() => setActiveTab('materi')} className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-300 min-w-fit ${activeTab === 'materi' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/50 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                        <Settings size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Atur Materi</span><span className="sm:hidden">Materi</span>
                    </button>
                </div>

                {activeTab === 'penilaian' && (
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
                        <label className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex-1 sm:flex-none whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showUnscoredOnly}
                                onChange={(e) => setShowUnscoredOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            Belum Dinilai
                        </label>
                        <div className="flex gap-2 flex-1 sm:flex-none">
                            <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 whitespace-nowrap">
                                <Download size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50">
                                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                <span className="hidden sm:inline">{isDownloadingPdf ? 'Memproses...' : 'PDF'}</span>
                            </button>
                            <button onClick={handlePrint} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 whitespace-nowrap">
                                <Printer size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Cetak</span>
                            </button>
                        </div>
                    </div>
                )}
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
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <TahsinSelector value={newTahsin} onChange={setNewTahsin} placeholder="Pilih Materi (Tilawah, Tajwid, dll)..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 dark:text-slate-100 placeholder:text-slate-400 pr-10" />
                            <button onClick={handleAddTahsin} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95"><Plus size={18} /> <span className="sm:hidden">Tambah</span></button>
                        </div>
                        <ul className="space-y-3">
                            {materials.tahsin.length === 0 && <li className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada materi Tahsin.</p></li>}
                            {materials.tahsin.map((mat, i) => (
                                <li key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 px-5 py-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                    <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>{mat}</span>
                                    <button onClick={() => handleRemoveMaterial('tahsin', i)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={16} /></button>
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
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <TahfidzSelector value={newTahfidz} onChange={setNewTahfidz} surahList={surahList} placeholder="Pilih Materi (Surat, Juz, dll)..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-slate-700 dark:text-slate-100 placeholder:text-slate-400 pr-10" />
                            <button onClick={() => handleAddTahfidz(newTahfidz)} className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-xl transition-all shadow-sm shadow-purple-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95"><Plus size={18} /> <span className="sm:hidden">Tambah</span></button>
                        </div>
                        <ul className="space-y-3">
                            {materials.tahfidz.length === 0 && <li className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum ada materi Tahfidz.</p></li>}
                            {materials.tahfidz.map((mat, i) => (
                                <li key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 px-5 py-4 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-purple-200 dark:hover:border-purple-500/30 transition-all">
                                    <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>{mat}</span>
                                    <button onClick={() => handleRemoveMaterial('tahfidz', i)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={16} /></button>
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
                            <button onClick={() => saveMaterials({ ...materials, reportSettings: localRS })} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-200 flex items-center justify-center gap-2 font-bold text-sm active:scale-95">
                                <Check size={18} /> Simpan Pengaturan
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                <button onClick={() => setIsAddingJadwal(true)} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                                    <Plus size={18} /> Tambah Jadwal
                                </button>
                            )}
                        </div>

                        {isAddingJadwal && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-slate-700 dark:text-slate-200">Buat Jadwal Baru</h3>
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
                                            {materials.tahsin.map((m, i) => (
                                                <label key={`t-${i}`} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${newJadwal.materi.includes(m) ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-500/30 dark:border-indigo-500/50 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 hover:border-indigo-200'}`}>
                                                    <input type="checkbox" className="hidden" checked={newJadwal.materi.includes(m)} onChange={(e) => {
                                                        const updated = e.target.checked ? [...newJadwal.materi, m] : newJadwal.materi.filter(x => x !== m);
                                                        setNewJadwal({...newJadwal, materi: updated});
                                                    }} />
                                                    {m}
                                                </label>
                                            ))}
                                            {materials.tahfidz.map((m, i) => (
                                                <label key={`f-${i}`} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${newJadwal.materi.includes(m) ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-500/30 dark:border-indigo-500/50 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 hover:border-indigo-200'}`}>
                                                    <input type="checkbox" className="hidden" checked={newJadwal.materi.includes(m)} onChange={(e) => {
                                                        const updated = e.target.checked ? [...newJadwal.materi, m] : newJadwal.materi.filter(x => x !== m);
                                                        setNewJadwal({...newJadwal, materi: updated});
                                                    }} />
                                                    {m}
                                                </label>
                                            ))}
                                            {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
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

                        {(!materials.jadwal || materials.jadwal.length === 0) ? (
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {(materials.jadwal || []).filter(j => !jadwalFilter || j.materi.some(m => m.toLowerCase().includes(jadwalFilter.toLowerCase()))).map((jadwal, idx) => (
                                    <div key={jadwal.id || idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative group shadow-sm hover:shadow-md transition-all">
                                        <button onClick={() => handleDeleteJadwal(jadwal.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={16} /></button>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg"><Calendar size={16} /></div>
                                            <div className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">{formatDateForJadwal(jadwal.tanggal)}</div>
                                        </div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-4 pr-8">Ujian Al-Qur'an</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {jadwal.materi.map((m, i) => (
                                                <span key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">{m}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                </div>
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
                        <p className="text-slate-500 font-bold mt-1">Halaqoh: {activeHalaqoh || 'Semua Kelompok'}</p>
                    </div>

                    {/* TABEL GABUNGAN (TAHSIN & TAHFIDZ) */}
                    <div id="ujian-report-container" className="flex flex-col md:bg-white md:dark:bg-slate-900 md:rounded-3xl md:shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:border md:border-slate-200/80 md:dark:border-slate-800 transition-colors">
                        <div className="hidden md:block overflow-x-auto custom-scrollbar print:!block print:overflow-visible">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th rowSpan={2} className="p-3 sm:p-5 border-b border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md z-30 w-[140px] sm:w-[200px] shadow-[4px_0_12px_rgba(0,0,0,0.03)] align-middle">Nama Siswa</th>
                                        {materials.tahsin.length > 0 && (
                                            <th colSpan={materials.tahsin.length + (hasTajwidSub ? 1 : 0) + (hasGhoribSub ? 1 : 0)} className="p-3 border-b border-slate-200 dark:border-slate-700 text-center text-blue-600 dark:text-blue-400 border-l border-slate-200/60 dark:border-slate-700/50">Tahsin</th>
                                        )}
                                        {materials.tahfidz.length > 0 && (
                                            <th colSpan={materials.tahfidz.length} className="p-3 border-b border-slate-200 dark:border-slate-700 text-center text-purple-600 dark:text-purple-400 border-l border-slate-200/60 dark:border-slate-700/50 bg-purple-50/50 dark:bg-purple-500/10">Tahfidz</th>
                                        )}
                                        {materials.tahsin.length === 0 && materials.tahfidz.length === 0 && (
                                            <th rowSpan={2} className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700/50">Materi</th>
                                        )}
                                        {(materials.tahsin.length > 0 || materials.tahfidz.length > 0) && (
                                            <th rowSpan={2} className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 align-middle w-[100px]">Rata-Rata<br />Akhir</th>
                                        )}
                                        <th rowSpan={2} className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800 align-middle w-[70px]">Rapor</th>
                                    </tr>
                                    <tr>
                                        {materials.tahsin.map((mat, i) => (
                                            <th key={`t-${i}`} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center text-blue-600 dark:text-blue-400 min-w-[120px] border-l border-slate-200/60 dark:border-slate-700/50 font-bold">{mat}</th>
                                        ))}
                                        {hasTajwidSub && <th className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center text-indigo-600 dark:text-indigo-400 min-w-[120px] border-l border-slate-200/60 dark:border-slate-700/50 bg-indigo-50/50 dark:bg-indigo-500/10 font-bold">Rata-rata Tajwid</th>}
                                        {hasGhoribSub && <th className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center text-teal-600 dark:text-teal-400 min-w-[120px] border-l border-slate-200/60 dark:border-slate-700/50 bg-teal-50/50 dark:bg-teal-500/10 font-bold">Rata-rata Ghorib</th>}

                                        {materials.tahfidz.map((mat, i) => (
                                            <th key={`f-${i}`} className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 text-center text-purple-600 dark:text-purple-400 min-w-[120px] border-l border-slate-200/60 dark:border-slate-700/50 bg-purple-50/30 dark:bg-purple-900/5 font-bold">{mat}</th>
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
                                                    <StudentTableRow key={student.id} student={student} index={index} materials={materials} hasTajwidSub={hasTajwidSub} hasGhoribSub={hasGhoribSub} kkmScore={kkmScore} onSaveScore={handleSaveScore} onPrintStudent={setActivePrintStudent} />
                                                );
                                            })}

                                            {/* Baris Kalkulasi Rata-rata */}
                                            {(materials.tahsin.length > 0 || materials.tahfidz.length > 0) && (
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 font-black border-t-2 border-slate-200 dark:border-slate-700">
                                                    <td className="p-3 sm:p-5 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-right pr-4 sm:pr-6 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-slate-200 dark:border-slate-700">
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
                                                    {(materials.tahsin.length > 0 || materials.tahfidz.length > 0) && (
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
                                        <StudentMobileCard key={student.id} student={student} index={index} materials={materials} hasTajwidSub={hasTajwidSub} hasGhoribSub={hasGhoribSub} kkmScore={kkmScore} onSaveScore={handleSaveScore} onPrintStudent={setActivePrintStudent} />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

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
    "Asy-Syarh": "الشرح",
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
    "Al-Masad": "المسد",
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

const getArabicPredicate = (score) => {
    const num = parseFloat(score);
    if (isNaN(num)) return '-';
    if (num >= 92) return 'ممتاز';
    if (num >= 83) return 'جيد جدا';
    if (num >= 75) return 'جيد';
    return '-';
};

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

// --- Full Quran Assessment Report Wizard Component ---

const QuranReportWizard = ({ student, onClose, materials, showToast, kkmScore, activeHalaqoh }) => {
    const [nis, setNis] = useState('');
    const [kelas, setKelas] = useState(student.kelas || '');
    const [halaqoh, setHalaqoh] = useState(student.halaqoh || activeHalaqoh || '');
    
    const [gender, setGender] = useState(student.gender || student.jenis_kelamin || 'P');

    const rs = materials.reportSettings || {};
    const semester = rs.semester || (new Date().getMonth() >= 6 ? 'Ganjil' : 'Genap');
    const tahunPelajaran = rs.tahunPelajaran || (new Date().getMonth() >= 6 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`);
    const namaSekolah = rs.namaSekolah || 'SDIT AL FITYAN SCHOOL BOGOR';
    const alamatSekolah = rs.alamatSekolah || 'Jl. Bengkel Roda, Kp. Cipiicung.\nDesa Mekarsari. Kec. Cileungsi. Bogor';
    const kepalaSekolah = rs.kepalaSekolah || 'Mei Tri Listari, S.Pd.I, M. Pd';
    const tempatCetak = rs.tempatCetak || 'Bogor';
    const tanggalCetak = rs.tanggalCetak || getIndonesianDate();

    // Deteksi apakah ada sub-materi Tajwid atau Ghorib di dalam materi Tahsin
    const hasTajwidSub = useMemo(() => materials.tahsin.some(mat => tajwidList.includes(mat)), [materials.tahsin]);
    const hasGhoribSub = useMemo(() => materials.tahsin.some(mat => ghoribList.includes(mat)), [materials.tahsin]);

    const getSubAverage = (list) => {
        const scores = materials.tahsin.filter(m => list.includes(m)).map(m => parseFloat(student.ujian_records?.[m])).filter(n => !isNaN(n));
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '';
    };

    // Ringkas Bidang Studi: Gabungkan sub-materi menjadi "Tajwid" dan "Ghorib"
    const summarizedTahsin = useMemo(() => {
        const mainMats = materials.tahsin.filter(m => !tajwidList.includes(m) && !ghoribList.includes(m));
        const result = [...mainMats];
        if (hasTajwidSub && !result.includes('Tajwid')) result.push('Tajwid');
        if (hasGhoribSub && !result.includes('Ghorib')) result.push('Ghorib');
        return result;
    }, [materials.tahsin, hasTajwidSub, hasGhoribSub]);

    // Core grades
    const [mainScoreValues, setMainScoreValues] = useState(() => {
        const initial = {};
        summarizedTahsin.forEach(mat => {
            if (mat === 'Tajwid' && hasTajwidSub && !materials.tahsin.includes('Tajwid')) initial[mat] = getSubAverage(tajwidList);
            else if (mat === 'Ghorib' && hasGhoribSub && !materials.tahsin.includes('Ghorib')) initial[mat] = getSubAverage(ghoribList);
            else initial[mat] = student.ujian_records?.[mat] || '';
        });
        return initial;
    });
    const [tahfidzOverride, setTahfidzOverride] = useState(student.ujian_records?.['Tahfidz'] || '');

    // Prepopulate recitations (tahfidz scores)
    const [hafalanKelas, setHafalanKelas] = useState([]);

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
    const [zoom, setZoom] = useState(window.innerWidth < 768 ? 0.45 : 0.85);
    const [isDownloading, setIsDownloading] = useState(false);

    // Initialize lists
    useEffect(() => {
        const tahfidzScores = [];
        materials.tahfidz.forEach(surah => {
            const score = student.ujian_records?.[surah];
            // Selalu masukkan materi tahfidz yang ada di pengaturan ujian, meskipun nilainya kosong
            tahfidzScores.push({ surah, score: score !== undefined && score !== null ? score : '' });
        });

        // Also scan student's other records that are surahs
        Object.keys(student.ujian_records || {}).forEach(key => {
            if (!materials.tahfidz.includes(key) && surahList.some(s => s.name === key)) {
                const score = student.ujian_records[key];
                if (score !== undefined && score !== null && score.toString().trim() !== '') {
                    // Prevent duplicate
                    if (!tahfidzScores.some(x => x.surah === key)) {
                        tahfidzScores.push({ surah: key, score });
                    }
                }
            }
        });

        const classList = Array.from({ length: 22 }, (_, i) => {
            if (tahfidzScores[i]) {
                return { surah: tahfidzScores[i].surah, score: tahfidzScores[i].score };
            }
            return { surah: '', score: '' };
        });

        setHafalanKelas(classList);
    }, [student, materials]);

    // Compute average tahfidz
    const computedTahfidzAvg = useMemo(() => {
        const allScores = [];
        hafalanKelas.forEach(h => {
            const num = parseFloat(h.score);
            if (!isNaN(num)) allScores.push(num);
        });
        if (allScores.length === 0) return '';
        return (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(0);
    }, [hafalanKelas]);

    // Tahfidz final score to display (either computed or overridden)
    const displayTahfidz = tahfidzOverride !== '' ? tahfidzOverride : computedTahfidzAvg;

    // Compute final class average and total
    const { jumlahNilai, rataRata } = useMemo(() => {
        let total = 0;
        let count = 0;

        Object.values(mainScoreValues).forEach(val => {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                total += num;
                count++;
            }
        });

        if (materials.tahfidz.length > 0) {
            const num = parseFloat(displayTahfidz);
            if (!isNaN(num)) {
                total += num;
                count++;
            }
        }

        const sum = count > 0 ? total : 0;
        const avg = count > 0 ? (total / count).toFixed(0) : '';
        return { jumlahNilai: sum || '-', rataRata: avg || '-' };
    }, [mainScoreValues, displayTahfidz, materials]);

    // Auto-update note if not edited
    useEffect(() => {
        if (!isNoteEdited) {
            const arabicPredicate = getArabicPredicate(rataRata);
            const genderTerm = gender === 'P' ? 'sholihah' : 'sholeh';
            const defaultNote = `Alhamdulillah ananda ${student.name} yang ${genderTerm} telah menyelesaikan materi pembelajaran Al Qur'an dengan predikat ${arabicPredicate === '-' ? 'ممتاز' : arabicPredicate}. Pertahankan prestasimu dalam mempelajari Al Qur'an`;
            setCatatan(defaultNote);
        }
    }, [student.name, gender, rataRata, isNoteEdited]);

    const handleHafalanChange = (idx, field, val) => {
        let newVal = val;
        if (field === 'score' && newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
        const updated = [...hafalanKelas];
        updated[idx] = { ...updated[idx], [field]: newVal };
        setHafalanKelas(updated);
    };

    const handleTargetChange = (idx, val) => {
        const updated = [...targets];
        updated[idx] = val;
        setTargets(updated);
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
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
                pdf.save(`Raport_AlQuran_${student.name.replace(/\s+/g, '_')}.pdf`);
                showToast('Raport PDF berhasil diunduh!');
            }
        } catch (error) {
            console.error("Gagal mengunduh PDF:", error);
            showToast("Maaf, terjadi kesalahan saat membuat PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen text-slate-100 overflow-hidden font-sans print:static print:h-auto print:overflow-visible print:bg-white print:text-black">
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
                    html, body, #root, #root > div, main, main > div {
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        background: white !important;
                    }

                    /* Hapus efek zoom di print */
                    #zoom-wrapper {
                        transform: none !important;
                        height: auto !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    #individual-raport-capture {
                        position: relative !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 auto !important;
                        padding: 15mm !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        color: black !important;
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
            <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shrink-0 print:hidden">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all font-bold text-sm shrink-0 border border-red-500/20 hover:border-red-500"
                        title="Tutup Pratinjau"
                    >
                        <ArrowLeft size={18} className="hidden sm:block" />
                        <X size={20} className="sm:hidden" />
                        <span className="hidden sm:inline">Tutup</span>
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">Cetak Raport Al-Qur&apos;an</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5 truncate">Siswa: {student.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
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
                        disabled={isDownloading}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDownloading ? <Loader2 size={16} className="animate-spin sm:w-4 sm:h-4 w-3.5 h-3.5" /> : <FileText size={16} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Unduh PDF</span>
                        <span className="sm:hidden">PDF</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95"
                    >
                        <Printer size={16} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cetak (Browser)</span>
                        <span className="sm:hidden">Cetak</span>
                    </button>
                </div>
            </div>

            {/* Split Main Screen */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden custom-scrollbar print:overflow-visible print:block">

                {/* Left Panel: Sidebar Editors */}
                <div className="w-full lg:w-[450px] bg-slate-900 lg:border-r border-b border-slate-800 flex flex-col lg:h-full lg:overflow-y-auto shrink-0 p-4 sm:p-6 gap-5 sm:gap-6 print:hidden">

                    {/* 1. DATA IDENTITAS CARD */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4">
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
                                    onChange={(e) => setGender(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                                >
                                <option value="L">L</option>
                                <option value="P">P</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. NILAI UTAMA (TABLE 1) */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">2. Nilai Sub Bidang Studi</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {summarizedTahsin.map((mat, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider" title={mat}>{mat.length > 20 ? mat.substring(0, 18) + '...' : mat}</label>
                                    <input
                                        type="text"
                                        value={mainScoreValues[mat] || ''}
                                        onChange={(e) => {
                                            let newVal = e.target.value;
                                            if (newVal !== '' && !isNaN(newVal) && parseFloat(newVal) > 100) newVal = '100';
                                            setMainScoreValues(prev => ({ ...prev, [mat]: newVal }));
                                        }}
                                        placeholder="-"
                                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 text-center font-bold outline-none focus:border-emerald-500"
                                    />
                                </div>
                            ))}
                            {materials.tahfidz.length > 0 && (
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
                            )}
                        </div>
                    </div>

                    {/* 3. RINCIAN SETORAN HAFALAN */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-purple-400 font-bold text-sm uppercase tracking-wider">3. I. Hafalan Kelas (Max 22)</span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                            {hafalanKelas.map((h, i) => (
                                <div key={i} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                                    <span className="text-xs font-black text-slate-500 w-5 text-center">{i + 1}</span>
                                    <input
                                        type="text"
                                        value={h.surah}
                                        onChange={(e) => handleHafalanChange(i, 'surah', e.target.value)}
                                        placeholder="Surah / Halaman"
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

                    {/* 4. TARGET YANG TIDAK TERCAPAI (Max 8) */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-orange-400 font-bold text-sm uppercase tracking-wider">4. II. Target Tidak Tercapai</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {targets.map((tgt, i) => (
                                <div key={i} className="flex gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                                    <span className="text-xs font-black text-slate-500 w-5 text-center">{i + 1}</span>
                                    <input
                                        type="text"
                                        list="surah-list-options"
                                        value={tgt}
                                        onChange={(e) => handleTargetChange(i, e.target.value)}
                                        placeholder="Nama Surat (Bisa diketik)"
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 flex-1 text-xs outline-none focus:border-orange-500 text-slate-200 font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                        <datalist id="surah-list-options">
                            {surahList.map(s => <option key={s.no} value={s.name} />)}
                        </datalist>
                    </div>

                    {/* 5. ADAB DALAM HALAQOH */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-teal-400 font-bold text-sm uppercase tracking-wider">5. III. Adab Dalam Halaqoh</span>
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

                    {/* 6. CATATAN */}
                    <div className="bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-700/60 flex flex-col gap-4 mb-4 lg:mb-8">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
                            <span className="text-rose-400 font-bold text-sm uppercase tracking-wider">6. Catatan</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Catatan Guru</label>
                                    <button
                                        onClick={() => setIsNoteEdited(false)}
                                        className="text-[9px] font-bold text-emerald-400 hover:underline"
                                    >
                                        Reset Default
                                    </button>
                                </div>
                                <textarea
                                    value={catatan}
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
                <div className="flex-1 bg-slate-950 flex justify-center lg:overflow-auto p-4 sm:p-8 pb-32 lg:pb-8 relative items-start select-none custom-scrollbar print:p-0 print:overflow-visible print:bg-white print:block">

                    <div
                        id="zoom-wrapper"
                        className="origin-top transition-transform shadow-2xl duration-200 mb-12 shrink-0 border border-slate-800"
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
                                padding: '15mm',
                                boxSizing: 'border-box',
                                overflow: 'hidden'
                            }}
                        >

                            <div>
                                {/* Header */}
                                <div className="text-center font-extrabold leading-tight mb-5 tracking-wide uppercase text-black">
                                    <div className="text-[13pt] mb-1">Laporan Penilaian Hasil Belajar</div>
                                    <div className="text-[11pt]">Bidang Studi Al-Qur&apos;an</div>
                                </div>

                                {/* Identity Block */}
                                <div className="flex justify-between text-[10px] leading-tight mb-4 font-bold text-black">
                                    <table className="w-[60%] border-none">
                                        <tbody>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">Nama Siswa</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="uppercase font-extrabold text-[11px] align-top pb-1.5">{student.name}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">No. Induk</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="align-top pb-1.5">{nis || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">Jenis Kelamin</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="align-top pb-1.5">{gender}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">Nama Sekolah</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="uppercase align-top pb-1.5">{namaSekolah}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top">Alamat Sekolah</td>
                                                <td className="w-[10px] align-top">:</td>
                                                <td className="font-normal text-[9px] align-top leading-normal pr-4"><div className="line-clamp-2">{alamatSekolah}</div></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table className="w-[35%] border-none">
                                        <tbody>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">Kelas / Halaqoh</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="font-extrabold text-[11px] align-top pb-1.5">{kelas} {halaqoh ? `/ ${halaqoh}` : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="w-[90px] align-top pb-1.5">Semester</td>
                                                <td className="w-[10px] align-top pb-1.5">:</td>
                                                <td className="align-top pb-1.5">{semester}</td>
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
                                <table className="w-full border-collapse border-1.5 border-black text-[10px] text-black mb-3">
                                    <thead>
                                        <tr className="bg-gray-100 font-bold h-[26px]">
                                            <th className="border border-black text-center w-[6%] text-black p-1">No</th>
                                            <th className="border border-black text-left w-[40%] text-black px-2.5 py-1">Sub Bidang Studi</th>
                                            <th className="border border-black text-center w-[12%] text-black p-1">KKM</th>
                                            <th className="border border-black text-center w-[15%] text-black p-1">Nilai</th>
                                            <th className="border border-black text-center w-[27%] text-black p-1">Deskripsi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summarizedTahsin.length > 0 || materials.tahfidz.length > 0 ? (
                                            <>
                                                {summarizedTahsin.map((mat, idx) => (
                                                    <tr key={`tahsin-${idx}`} className="h-[21px] font-semibold">
                                                        <td className="border border-black text-center p-0.5">{idx + 1}</td>
                                                        <td className="border border-black text-left px-2.5 py-0.5">{mat}</td>
                                                        <td className="border border-black text-center p-0.5 font-bold">{kkmScore}</td>
                                                        <td className="border border-black text-center p-0.5 font-bold">{mainScoreValues[mat] || '-'}</td>
                                                        <td className="border border-black text-center p-0.5 font-medium">{getGradeDescription(mainScoreValues[mat], kkmScore)}</td>
                                                    </tr>
                                                ))}
                                                {materials.tahfidz.length > 0 && (
                                                    <tr className="h-[21px] font-semibold">
                                                        <td className="border border-black text-center p-0.5">{summarizedTahsin.length + 1}</td>
                                                        <td className="border border-black text-left px-2.5 py-0.5">Tahfidz</td>
                                                        <td className="border border-black text-center p-0.5 font-bold">{kkmScore}</td>
                                                        <td className="border border-black text-center p-0.5 font-bold">{displayTahfidz || '-'}</td>
                                                        <td className="border border-black text-center p-0.5 font-medium">{getGradeDescription(displayTahfidz, kkmScore)}</td>
                                                    </tr>
                                                )}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="border border-black text-center p-2 font-medium">Belum ada materi ujian yang diatur.</td>
                                            </tr>
                                        )}
                                        {/* Footer totals */}
                                        <tr className="h-[21px] font-bold">
                                            <td colSpan={3} className="border border-black text-center p-0.5">Jumlah Nilai</td>
                                            <td className="border border-black text-center p-0.5 font-extrabold">{jumlahNilai}</td>
                                            <td className="border border-black text-center p-0.5 text-gray-500 font-normal">-</td>
                                        </tr>
                                        <tr className="h-[21px] font-bold">
                                            <td colSpan={3} className="border border-black text-center p-0.5">Nilai Rata-rata</td>
                                            <td className="border border-black text-center p-0.5 font-extrabold">{rataRata}</td>
                                            <td className="border border-black text-center p-0.5 text-gray-500 font-normal">-</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Table 2 section: Setoran Hafalan */}
                                <div className="text-center font-extrabold text-[10pt] uppercase mb-2 text-black tracking-wide">
                                    Daftar Rincian Nilai Setoran Hafalan Al Qur&apos;an
                                </div>

                                <div className="font-extrabold mb-1 tracking-tight text-[9.5px] text-black">
                                    I. HAFALAN KELAS
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-black text-[9px] mb-3">
                                    {/* Left Table: Hafalan 1-11 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black">
                                            <thead>
                                                <tr className="bg-gray-100 font-bold h-[22px] text-center">
                                                    <td className="border border-black p-0.5 w-[8%] font-bold">No</td>
                                                    <td className="border border-black p-0.5 w-[54%] font-bold">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[18%] font-bold">Nilai</td>
                                                    <td className="border border-black p-0.5 w-[20%] font-bold">Predikat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const item = hafalanKelas[i] || { surah: '', score: '' };
                                                    return (
                                                        <tr key={i} className="h-[19px]">
                                                            <td className="border border-black text-center p-0.5 font-semibold">{i + 1}</td>
                                                            <td className="border border-black text-center p-0.5 font-arabic text-sm font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {translateToArabicSurah(item.surah)}
                                                            </td>
                                                            <td className="border border-black text-center p-0.5 font-extrabold">{item.score || ''}</td>
                                                            <td className="border border-black text-center p-0.5 font-arabic text-xs font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {getArabicPredicate(item.score)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Right Table: Hafalan 12-22 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black">
                                            <thead>
                                                <tr className="bg-gray-100 font-bold h-[22px] text-center">
                                                    <td className="border border-black p-0.5 w-[8%] font-bold">No</td>
                                                    <td className="border border-black p-0.5 w-[54%] font-bold">Nama Surat</td>
                                                    <td className="border border-black p-0.5 w-[18%] font-bold">Nilai</td>
                                                    <td className="border border-black p-0.5 w-[20%] font-bold">Predikat</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const idx = i + 11;
                                                    const item = hafalanKelas[idx] || { surah: '', score: '' };
                                                    return (
                                                        <tr key={idx} className="h-[19px]">
                                                            <td className="border border-black text-center p-0.5 font-semibold">{idx + 1}</td>
                                                            <td className="border border-black text-center p-0.5 font-arabic text-sm font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {translateToArabicSurah(item.surah)}
                                                            </td>
                                                            <td className="border border-black text-center p-0.5 font-extrabold">{item.score || ''}</td>
                                                            <td className="border border-black text-center p-0.5 font-arabic text-xs font-bold text-black" style={{ direction: 'rtl' }}>
                                                                {getArabicPredicate(item.score)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section III: Target tidak tercapai */}
                                <div className="font-extrabold mb-1.5 tracking-tight text-[9.5px] text-black">
                                    II. TARGET YANG TIDAK TERCAPAI
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-black text-[9px] mb-3">
                                    {/* Left Table: Target 1-4 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black text-center">
                                            <tbody>
                                                {[0, 1, 2, 3].map(i => (
                                                    <tr key={i} className="h-[19px]">
                                                        <td className="border border-black p-0.5 w-[15%] font-semibold bg-gray-50">{i + 1}</td>
                                                        <td className="border border-black p-0.5 w-[85%] font-arabic text-sm font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurah(targets[i])}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Right Table: Target 5-8 */}
                                    <div>
                                        <table className="w-full border-collapse border border-black text-center">
                                            <tbody>
                                                {[4, 5, 6, 7].map(i => (
                                                    <tr key={i} className="h-[19px]">
                                                        <td className="border border-black p-0.5 w-[15%] font-semibold bg-gray-50">{i + 1}</td>
                                                        <td className="border border-black p-0.5 w-[85%] font-arabic text-sm font-bold text-black" style={{ direction: 'rtl' }}>
                                                            {translateToArabicSurah(targets[i])}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section IV: Adab */}
                                <div className="font-extrabold mb-1.5 tracking-tight text-[9.5px] text-black">
                                    III. ADAB DALAM HALAQOH
                                </div>
                                <table className="w-full border-collapse border border-black text-[9px] text-black mb-3">
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
                                    {catatan}
                                </div>
                            </div>

                            {/* Footer (Rentan Nilai & Signatures) */}
                            <div className="flex justify-between items-end text-[9px] text-black font-bold mt-2">
                                {/* Rentan Nilai */}
                                <div className="flex flex-col gap-0.5 text-[8.5px] leading-tight">
                                    <div className="font-extrabold border-b border-black pb-0.5 mb-0.5">Rentan Nilai</div>
                                    <div className="flex justify-between w-[95px]"><span>{kkmScore} - 82</span><span>:</span><span className="font-arabic font-bold text-[11px] text-black">جيد</span></div>
                                    <div className="flex justify-between w-[95px]"><span>83 - 91</span><span>:</span><span className="font-arabic font-bold text-[11px] text-black">جيد جدا</span></div>
                                    <div className="flex justify-between w-[95px]"><span>92 - 100</span><span>:</span><span className="font-arabic font-bold text-[11px] text-black">ممتاز</span></div>
                                </div>

                                {/* Signatures block */}
                                <div className="w-[300px] flex flex-col text-right leading-tight">
                                    <div>Diberikan di <span className="ml-[20px]">: {tempatCetak}</span></div>
                                    <div className="mt-0.5">Tanggal <span className="ml-[34px]">: {tanggalCetak}</span></div>

                                    <div className="flex justify-between mt-3 text-center text-[9px]">
                                        <div className="w-[120px] flex flex-col justify-between h-[60px]">
                                            <div>Orang Tua / Wali Siswa</div>
                                            <div className="border-b border-black w-full mt-auto mb-1"></div>
                                        </div>
                                        <div className="w-[140px] flex flex-col justify-between h-[60px]">
                                            <div>Kepala Sekolah</div>
                                            <div className="font-extrabold underline mt-auto uppercase text-black leading-none">{kepalaSekolah}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Tombol Tutup Melayang (Bawah) */}
            <button
                onClick={onClose}
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[100] flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-[0_10px_25px_rgba(220,38,38,0.4)] active:scale-95 transition-all print:hidden font-black border border-red-500"
                title="Tutup Pratinjau"
            >
                <X size={20} strokeWidth={3} />
                <span>Tutup</span>
            </button>
        </div>
    );
};

export default UjianView;