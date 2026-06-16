import React, { useMemo, useState } from 'react';
import { PieChart, TrendingUp, Users, BookOpen, Mic, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPeriode } from '../../utils/helpers';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const TAHSIN_LEVELS = ['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 'Al-Qur\'an', 'Tajwid', 'Ghorib', 'Belum Ada'];
const JURNAL_KEYS = {
  t: 'jurnalTahsin',
  h: 'jurnalHalAyatTahsin',
  tNilai: 'jurnalTahsinNilai',
  tsNilai: 'jurnalTahsinSuratNilai',
  f: 'jurnalTahfidz',
  af: 'jurnalAyatTahfidz',
  fNilai: 'jurnalTahfidzNilai',
  c: 'jurnalCatatan'
};
const LESSON_KEYS = {
  t: 'tahsin',
  h: 'halAyatTahsin',
  tNilai: 'tahsinNilai',
  tsNilai: 'tahsinSuratNilai',
  f: 'tahfidz',
  af: 'ayatTahfidz',
  fNilai: 'tahfidzNilai',
  c: 'catatan'
};

const getMonthTitle = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const createEmptyTahsinCounts = () => TAHSIN_LEVELS.reduce((acc, level) => {
  acc[level] = 0;
  return acc;
}, {});

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== '' && text !== '-';
};

const isInactiveRecord = (record, keys) => {
  const note = String(record?.[keys.c] || '').toLowerCase();
  return ['libur', 'sakit', 'izin', 'alpa', 'tidak hadir'].some(keyword => note.includes(keyword));
};

const isInPeriod = (dateStr, periodRange) => {
  if (!periodRange) return true;
  const dateObj = new Date(dateStr);
  return dateObj >= periodRange.start && dateObj <= periodRange.end;
};

const getRecordProgress = (record, keys) => ({
  tahsin: record?.[keys.t],
  tahsinDetail: record?.[keys.h],
  tahsinNilai: record?.[keys.tNilai],
  tahsinSuratNilai: record?.[keys.tsNilai],
  tahfidz: record?.[keys.f],
  tahfidzDetail: record?.[keys.af],
  tahfidzNilai: record?.[keys.fNilai]
});

const getLatestProgress = (student, periodRange) => {
  const latest = { tahsin: null, tahfidz: null };
  const dates = Object.keys(student.records || {})
    .filter(dateStr => isInPeriod(dateStr, periodRange))
    .sort((a, b) => new Date(b) - new Date(a));

  for (const dateStr of dates) {
    const record = student.records?.[dateStr];
    if (!record) continue;

    const journalProgress = getRecordProgress(record, JURNAL_KEYS);
    const lessonProgress = getRecordProgress(record, LESSON_KEYS);

    if (!latest.tahsin) {
      if (!isInactiveRecord(record, JURNAL_KEYS) && (hasValue(journalProgress.tahsin) || hasValue(journalProgress.tahsinDetail) || hasValue(journalProgress.tahsinNilai) || hasValue(journalProgress.tahsinSuratNilai))) {
        latest.tahsin = journalProgress;
      } else if (!isInactiveRecord(record, LESSON_KEYS) && (hasValue(lessonProgress.tahsin) || hasValue(lessonProgress.tahsinDetail) || hasValue(lessonProgress.tahsinNilai) || hasValue(lessonProgress.tahsinSuratNilai))) {
        latest.tahsin = lessonProgress;
      }
    }

    if (!latest.tahfidz) {
      if (!isInactiveRecord(record, JURNAL_KEYS) && (hasValue(journalProgress.tahfidz) || hasValue(journalProgress.tahfidzDetail) || hasValue(journalProgress.tahfidzNilai))) {
        latest.tahfidz = journalProgress;
      } else if (!isInactiveRecord(record, LESSON_KEYS) && (hasValue(lessonProgress.tahfidz) || hasValue(lessonProgress.tahfidzDetail) || hasValue(lessonProgress.tahfidzNilai))) {
        latest.tahfidz = lessonProgress;
      }
    }

    if (latest.tahsin && latest.tahfidz) break;
  }

  return latest;
};

const getTahsinLevel = (latestTahsin) => {
  if (!latestTahsin) return 'Belum Ada';

  const tahsinText = String(latestTahsin.tahsin || '').trim();
  const detailText = String(latestTahsin.tahsinDetail || '').trim();
  const combinedText = `${tahsinText} ${detailText}`.trim();

  if (!hasValue(combinedText) && !hasValue(latestTahsin.tahsinNilai) && !hasValue(latestTahsin.tahsinSuratNilai)) return 'Belum Ada';

  const jilidMatch = combinedText.match(/Jilid\s*([1-6])/i);
  if (jilidMatch) return `Jilid ${jilidMatch[1]}`;
  if (/Tajwid/i.test(combinedText)) return 'Tajwid';
  if (/Ghorib|Gharib/i.test(combinedText)) return 'Ghorib';
  if (/Al[\s-]?Qur[’']?an|Al\s+Quran|Qur[’']?an|Quran/i.test(combinedText)) return 'Al-Qur\'an';

  // Di beranda, kategori Al-Qur'an disimpan sebagai nama surat/ayat, bukan selalu teks "Al-Qur'an".
  if (hasValue(tahsinText) || hasValue(detailText) || hasValue(latestTahsin.tahsinNilai) || hasValue(latestTahsin.tahsinSuratNilai)) return 'Al-Qur\'an';

  return 'Belum Ada';
};

const sortClassNames = (a, b) => {
  const aNum = String(a).match(/\d+/);
  const bNum = String(b).match(/\d+/);
  if (aNum && bNum && Number(aNum[0]) !== Number(bNum[0])) return Number(aNum[0]) - Number(bNum[0]);
  return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
};

const sortTahfidzLevels = (a, b) => {
  if (a === 'Belum Ada') return 1;
  if (b === 'Belum Ada') return -1;
  if (a === 'Lainnya') return 1;
  if (b === 'Lainnya') return -1;

  const aNum = String(a).match(/\d+/);
  const bNum = String(b).match(/\d+/);
  if (aNum && bNum) return Number(bNum[0]) - Number(aNum[0]);

  return String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' });
};

const getClassLevelName = (kelas) => {
  const rawClass = kelas?.trim();
  if (!rawClass) return 'Tanpa Kelas';

  const levelMatch = rawClass.match(/\d+/);
  if (levelMatch) return `Kelas ${levelMatch[0]}`;

  return rawClass;
};

const getJuzFromSurah = (surahString) => {
  if (!surahString) return 'Belum Ada';
  const match = surahString.match(/^(\d+)\./);
  if (match) {
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
  }
  const juzMatch = surahString.match(/Juz\s*(\d+)/i);
  if (juzMatch) return `Juz ${juzMatch[1]}`;

  if (surahString === 'Belum Ada' || surahString === '-') return 'Belum Ada';
  return 'Lainnya';
};

const StudentNameList = ({ students, color = 'blue' }) => (
  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-2 duration-200">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {students.map((s, idx) => (
        <div key={`${s.name}-${idx}`} className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/60 rounded-lg px-2.5 py-1.5 border border-white dark:border-slate-700/50">
          <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[9px] font-black ${
            color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
            : color === 'purple' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
            : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            {s.name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={s.name}>{s.name}</p>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">{s.kelas !== '-' ? `Kelas ${s.kelas}` : ''}{s.kelas !== '-' && s.halaqoh !== '-' ? ' \u2022 ' : ''}{s.halaqoh !== '-' ? s.halaqoh : ''}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProgressChartView = ({ students, activeHalaqoh, allStudents, weekDates, changeWeek }) => {
  const [periodType, setPeriodType] = useState('all'); // 'all', 'weekly', 'monthly'
  const [monthDate, setMonthDate] = useState(new Date());
  const [dataSourceType, setDataSourceType] = useState('all'); // 'all', 'filtered'
  const [selectedDetail, setSelectedDetail] = useState(null); // { type, key, students: [...] }

  const handleSelectDetail = (type, key, studentList) => {
    if (selectedDetail?.type === type && selectedDetail?.key === key) {
      setSelectedDetail(null); // toggle off
    } else {
      setSelectedDetail({ type, key, students: studentList });
    }
  };

  const changeMonth = (offset) => {
    const nextDate = new Date(monthDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setMonthDate(nextDate);
  };

  const periodRange = useMemo(() => {
    if (periodType === 'all') return null;
    if (periodType === 'monthly') {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, title: getMonthTitle(monthDate), label: 'Bulanan' };
    }
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[weekDates.length - 1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end, title: formatPeriode(start, end), label: 'Mingguan' };
  }, [periodType, monthDate, weekDates]);

  // Mengolah data siswa untuk divisualisasikan (Semua Siswa)
  const globalStats = useMemo(() => {
    const dataSource = dataSourceType === 'all' && allStudents ? allStudents : students;
    const tahsinCounts = createEmptyTahsinCounts();
    const tahfidzCounts = { 'Belum Ada': 0 };
    const tahfidzJuzCounts = { 'Belum Ada': 0 };
    const classTahsinCounts = {};
    const classTahfidzGroupedCounts = {};

    let totalStudents = dataSource.length;

    dataSource.forEach(student => {
      // Samakan dengan beranda: Tahsin dan Tahfidz diambil dari update terakhir masing-masing.
      const { tahsin: latestTahsin, tahfidz: latestTahfidz } = getLatestProgress(student, periodRange);

      // Hitung Tahsin
      const tahsinLevel = getTahsinLevel(latestTahsin);
      tahsinCounts[tahsinLevel]++;

      const className = getClassLevelName(student.kelas);
      if (!classTahsinCounts[className]) {
        classTahsinCounts[className] = { total: 0, counts: createEmptyTahsinCounts() };
      }
      classTahsinCounts[className].total++;
      classTahsinCounts[className].counts[tahsinLevel]++;

      // Hitung Tahfidz
      if (latestTahfidz?.tahfidz) {
        const surah = String(latestTahfidz.tahfidz).split(',')[0].trim();
        tahfidzCounts[surah] = (tahfidzCounts[surah] || 0) + 1;
        const juz = getJuzFromSurah(surah);
        tahfidzJuzCounts[juz] = (tahfidzJuzCounts[juz] || 0) + 1;

        if (!classTahfidzGroupedCounts[juz]) {
          classTahfidzGroupedCounts[juz] = { total: 0, surahs: {} };
        }
        if (!classTahfidzGroupedCounts[juz].surahs[surah]) {
          classTahfidzGroupedCounts[juz].surahs[surah] = { total: 0, classes: {} };
        }
        classTahfidzGroupedCounts[juz].total++;
        classTahfidzGroupedCounts[juz].surahs[surah].total++;
        classTahfidzGroupedCounts[juz].surahs[surah].classes[className] = (classTahfidzGroupedCounts[juz].surahs[surah].classes[className] || 0) + 1;
      } else {
        tahfidzCounts['Belum Ada']++;
        tahfidzJuzCounts['Belum Ada']++;

        if (!classTahfidzGroupedCounts['Belum Ada']) {
          classTahfidzGroupedCounts['Belum Ada'] = { total: 0, surahs: {} };
        }
        if (!classTahfidzGroupedCounts['Belum Ada'].surahs['Belum Ada']) {
          classTahfidzGroupedCounts['Belum Ada'].surahs['Belum Ada'] = { total: 0, classes: {} };
        }
        classTahfidzGroupedCounts['Belum Ada'].total++;
        classTahfidzGroupedCounts['Belum Ada'].surahs['Belum Ada'].total++;
        classTahfidzGroupedCounts['Belum Ada'].surahs['Belum Ada'].classes[className] = (classTahfidzGroupedCounts['Belum Ada'].surahs['Belum Ada'].classes[className] || 0) + 1;
      }
    });

    return { tahsinCounts, tahfidzCounts, tahfidzJuzCounts, classTahsinCounts, classTahfidzGroupedCounts, totalStudents };
  }, [allStudents, students, periodRange, dataSourceType]);

  // Build student name lookup map: { tahsin: { level: [names] }, tahfidz: { surah: [names] }, tahfidzJuz: { juz: [names] } }
  const studentNameMap = useMemo(() => {
    const dataSource = dataSourceType === 'all' && allStudents ? allStudents : students;
    const map = { tahsin: {}, tahfidz: {}, tahfidzJuz: {} };
    dataSource.forEach(student => {
      const name = student.name || 'Tanpa Nama';
      const kelas = student.kelas || '-';
      const halaqoh = student.halaqoh || '-';
      const info = { name, kelas, halaqoh };
      const { tahsin: latestTahsin, tahfidz: latestTahfidz } = getLatestProgress(student, periodRange);
      // Tahsin
      const tahsinLevel = getTahsinLevel(latestTahsin);
      if (!map.tahsin[tahsinLevel]) map.tahsin[tahsinLevel] = [];
      map.tahsin[tahsinLevel].push(info);
      // Tahfidz
      if (latestTahfidz?.tahfidz) {
        const surah = String(latestTahfidz.tahfidz).split(',')[0].trim();
        if (!map.tahfidz[surah]) map.tahfidz[surah] = [];
        map.tahfidz[surah].push(info);
        const juz = getJuzFromSurah(surah);
        if (!map.tahfidzJuz[juz]) map.tahfidzJuz[juz] = [];
        map.tahfidzJuz[juz].push(info);
      } else {
        if (!map.tahfidz['Belum Ada']) map.tahfidz['Belum Ada'] = [];
        map.tahfidz['Belum Ada'].push(info);
        if (!map.tahfidzJuz['Belum Ada']) map.tahfidzJuz['Belum Ada'] = [];
        map.tahfidzJuz['Belum Ada'].push(info);
      }
    });
    return map;
  }, [allStudents, students, periodRange, dataSourceType]);

  const tahsinLabels = Object.keys(globalStats.tahsinCounts).filter(k => k !== 'Belum Ada' || globalStats.tahsinCounts[k] > 0);
  const maxTahsinCount = Math.max(...tahsinLabels.map(k => globalStats.tahsinCounts[k]), 1);
  const dominantLevel = tahsinLabels.length > 0 ? tahsinLabels.reduce((a, b) => globalStats.tahsinCounts[a] > globalStats.tahsinCounts[b] ? a : b, tahsinLabels[0]) : '-';

  const tahfidzData = useMemo(() => {
    let labels = Object.keys(globalStats.tahfidzCounts)
      .filter(k => k !== 'Belum Ada')
      .sort((a, b) => globalStats.tahfidzCounts[b] - globalStats.tahfidzCounts[a]);

    let othersCount = 0;
    if (labels.length > 6) {
      const others = labels.slice(6);
      labels = labels.slice(0, 6);
      others.forEach(k => {
        othersCount += globalStats.tahfidzCounts[k];
      });
    }

    const dataObj = { ...globalStats.tahfidzCounts };
    if (othersCount > 0) {
      dataObj['Lainnya'] = othersCount;
      labels.push('Lainnya');
    }
    if (dataObj['Belum Ada'] > 0) {
      labels.push('Belum Ada');
    }

    return {
      labels,
      counts: dataObj,
      maxCount: Math.max(...labels.map(k => dataObj[k]), 1)
    };
  }, [globalStats.tahfidzCounts]);

  const topTahfidzSurah = tahfidzData.labels.filter(k => k !== 'Belum Ada' && k !== 'Lainnya')[0] || '-';

  const levelClassRows = useMemo(() => {
    return TAHSIN_LEVELS.map(level => {
      const classes = Object.entries(globalStats.classTahsinCounts)
        .map(([className, data]) => ({ className, count: data.counts[level] || 0 }))
        .filter(item => item.count > 0)
        .sort((a, b) => sortClassNames(a.className, b.className));

      return {
        level,
        total: classes.reduce((sum, item) => sum + item.count, 0),
        classes
      };
    }).filter(row => row.total > 0);
  }, [globalStats.classTahsinCounts]);

  const tahfidzGroupedRows = useMemo(() => {
    return Object.entries(globalStats.classTahfidzGroupedCounts)
      .map(([juz, data]) => ({
        juz,
        total: data.total,
        surahs: Object.entries(data.surahs)
          .map(([surah, surahData]) => ({
            surah,
            total: surahData.total,
            classes: Object.entries(surahData.classes)
              .map(([className, count]) => ({ className, count }))
              .sort((a, b) => sortClassNames(a.className, b.className))
          }))
          .sort((a, b) => {
            if (a.surah === 'Belum Ada') return 1;
            if (b.surah === 'Belum Ada') return -1;
            return b.total - a.total || a.surah.localeCompare(b.surah, 'id', { numeric: true, sensitivity: 'base' });
          })
      }))
      .sort((a, b) => sortTahfidzLevels(a.juz, b.juz));
  }, [globalStats.classTahfidzGroupedCounts]);

  const tahfidzJuzData = useMemo(() => {
    let labels = Object.keys(globalStats.tahfidzJuzCounts)
      .filter(k => k !== 'Belum Ada' && k !== 'Lainnya')
      .sort((a, b) => globalStats.tahfidzJuzCounts[b] - globalStats.tahfidzJuzCounts[a]);

    let othersCount = globalStats.tahfidzJuzCounts['Lainnya'] || 0;
    if (labels.length > 6) {
      const others = labels.slice(6);
      labels = labels.slice(0, 6);
      others.forEach(k => {
        othersCount += globalStats.tahfidzJuzCounts[k];
      });
    }

    const dataObj = { ...globalStats.tahfidzJuzCounts };
    if (othersCount > 0) {
      dataObj['Lainnya'] = othersCount;
      labels.push('Lainnya');
    }
    if (dataObj['Belum Ada'] > 0) {
      labels.push('Belum Ada');
    }

    return {
      labels,
      counts: dataObj,
      maxCount: Math.max(...labels.map(k => dataObj[k]), 1)
    };
  }, [globalStats.tahfidzJuzCounts]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-5 md:p-8 custom-scrollbar transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 md:pb-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-5">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
            <PieChart size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Statistik Pencapaian</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">Pantau pencapaian level tahsin dan target tahfidz siswa secara visual.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-2.5 sm:p-3 flex flex-col xl:flex-row gap-2.5 sm:gap-3 mb-4 sm:mb-6 transition-colors">
          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full xl:w-auto">
            <button onClick={() => setDataSourceType('all')} className={`flex-1 xl:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-sm leading-tight transition-all ${dataSourceType === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Semua Siswa</button>
            <button onClick={() => setDataSourceType('filtered')} className={`flex-1 xl:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-sm leading-tight transition-all ${dataSourceType === 'filtered' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Halaqoh Aktif</button>
          </div>

          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full xl:w-auto xl:ml-auto">
            <button onClick={() => setPeriodType('all')} className={`flex-1 xl:flex-none px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-sm leading-tight transition-all ${periodType === 'all' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Semua Waktu</button>
            <button onClick={() => setPeriodType('monthly')} className={`flex-1 xl:flex-none px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-sm leading-tight transition-all ${periodType === 'monthly' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Bulanan</button>
            <button onClick={() => setPeriodType('weekly')} className={`flex-1 xl:flex-none px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[11px] sm:text-sm leading-tight transition-all ${periodType === 'weekly' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'}`}>Mingguan</button>
          </div>

          {periodType !== 'all' && (
            <div className="flex items-center justify-between xl:w-[360px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-2 py-1.5 border border-slate-200 dark:border-slate-700">
              <button onClick={() => periodType === 'weekly' ? changeWeek(-7) : changeMonth(-1)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronLeft size={18} /></button>
              <div className="text-center px-1 sm:px-2 min-w-0">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{periodRange?.label}</div>
                <div className="text-[11px] sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 min-w-0"><Calendar size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0" /> <span className="truncate">{periodRange?.title}</span></div>
              </div>
              <button onClick={() => periodType === 'weekly' ? changeWeek(7) : changeMonth(1)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all"><ChevronRight size={18} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Bar Chart Tahsin */}
          <div className="hidden bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0"><BookOpen className="text-blue-500 dark:text-blue-400 shrink-0" size={19} /><h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">Pencapaian Tahsin</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Level</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {tahsinLabels.map(label => {
                const count = globalStats.tahsinCounts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / maxTahsinCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs sm:text-sm font-bold"><span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span><span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Tahfidz */}
          <div className="hidden bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0"><Mic className="text-purple-500 dark:text-purple-400 shrink-0" size={19} /><h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">Pencapaian Tahfidz</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Surat</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {tahfidzData.labels.map(label => {
                const count = tahfidzData.counts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / tahfidzData.maxCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs sm:text-sm font-bold"><span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span><span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Tahfidz (Juz) */}
          <div className="hidden bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0"><Mic className="text-emerald-500 dark:text-emerald-400 shrink-0" size={19} /><h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">Pencapaian Tahfidz</h2></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest hidden sm:block">Juz</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {tahfidzJuzData.labels.map(label => {
                const count = tahfidzJuzData.counts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / tahfidzJuzData.maxCount) * 100}%`;
                return (
                  <div key={label} className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs sm:text-sm font-bold"><span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span><span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} siswa ({percentage}%)</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600'}`} style={{ width: barWidth }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ringkasan Tahsin Per Level */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="text-cyan-500 dark:text-cyan-400 shrink-0" size={19} />
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">Pencapaian Per Level</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest self-start sm:self-auto">Tahsin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              {tahsinLabels.map(label => {
                const count = globalStats.tahsinCounts[label];
                const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                const barWidth = `${(count / maxTahsinCount) * 100}%`;
                const isSelected = selectedDetail?.type === 'tahsin' && selectedDetail?.key === label;
                return (
                  <div
                    key={`summary-${label}`}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-200 dark:ring-blue-500/30'
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/5'
                    }`}
                    onClick={() => handleSelectDetail('tahsin', label, studentNameMap.tahsin[label] || [])}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px] sm:text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span>
                      <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} ({percentage}%)</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${label === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-blue-400 to-cyan-500 dark:from-blue-500 dark:to-cyan-600'}`} style={{ width: barWidth }} />
                    </div>
                    {isSelected && <StudentNameList students={studentNameMap.tahsin[label] || []} color="blue" />}
                  </div>
                );
              })}
            </div>

            {levelClassRows.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {levelClassRows.map(row => {
                  const isSelected = selectedDetail?.type === 'tahsin' && selectedDetail?.key === row.level;
                  return (
                    <div
                      key={row.level}
                      onClick={() => handleSelectDetail('tahsin', row.level, studentNameMap.tahsin[row.level] || [])}
                      className={`w-full text-left rounded-2xl border p-3 sm:p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50/60 dark:bg-blue-500/10'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">{row.level}</span>
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">{row.total} siswa</span>
                          </div>
                        </div>

                        <div className="space-y-2.5 sm:space-y-3">
                          {row.classes.map(item => (
                            <div key={`${row.level}-${item.className}`} className="grid grid-cols-[68px_minmax(0,1fr)_56px] sm:grid-cols-[120px_minmax(0,1fr)_92px] items-center gap-2 sm:gap-3">
                              <div className="text-[11px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate" title={item.className}>{item.className}</div>
                              <div className="h-3.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${row.level === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600'}`}
                                  style={{ width: `${Math.max((item.count / row.total) * 100, 4)}%` }}
                                />
                              </div>
                              <div className="text-right text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">
                                {item.count}<span className="hidden sm:inline"> siswa</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {isSelected && <StudentNameList students={studentNameMap.tahsin[row.level] || []} color="blue" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500">
                Belum ada data level untuk ditampilkan.
              </div>
            )}
          </div>

          {/* Ringkasan Tahfidz Per Juz dan Surat */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors" style={{ animationDelay: '350ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Mic className="text-purple-500 dark:text-purple-400 shrink-0" size={19} />
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">Pencapaian Tahfidz Per Juz & Surat</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest self-start sm:self-auto">Juz / Surat</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/5 p-3 sm:p-4">
                <div className="text-[10px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-widest mb-3">Ringkasan Surat</div>
                <div className="space-y-2.5">
                  {tahfidzData.labels.map(label => {
                    const count = tahfidzData.counts[label];
                    const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                    const isSelected = selectedDetail?.type === 'tahfidz' && selectedDetail?.key === label;
                    return (
                      <div key={`surah-summary-${label}`} className="-mx-1.5 px-1.5">
                        <div
                          onClick={() => handleSelectDetail('tahfidz', label, studentNameMap.tahfidz[label] || [])}
                          className={`w-full grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px] sm:text-xs font-black text-left p-1.5 rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
                              : 'hover:bg-purple-50 dark:hover:bg-purple-500/10'
                          }`}
                        >
                          <span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span>
                          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} ({percentage}%)</span>
                        </div>
                        {isSelected && <StudentNameList students={studentNameMap.tahfidz[label] || []} color="purple" />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 p-3 sm:p-4">
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest mb-3">Ringkasan Juz</div>
                <div className="space-y-2.5">
                  {tahfidzJuzData.labels.map(label => {
                    const count = tahfidzJuzData.counts[label];
                    const percentage = globalStats.totalStudents > 0 ? Math.round((count / globalStats.totalStudents) * 100) : 0;
                    const isSelected = selectedDetail?.type === 'tahfidzJuz' && selectedDetail?.key === label;
                    return (
                      <div key={`juz-summary-${label}`} className="-mx-1.5 px-1.5">
                        <div
                          onClick={() => handleSelectDetail('tahfidzJuz', label, studentNameMap.tahfidzJuz[label] || [])}
                          className={`w-full grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px] sm:text-xs font-black text-left p-1.5 rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                          }`}
                        >
                          <span className="text-slate-700 dark:text-slate-200 truncate" title={label}>{label}</span>
                          <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">{count} ({percentage}%)</span>
                        </div>
                        {isSelected && <StudentNameList students={studentNameMap.tahfidzJuz[label] || []} color="emerald" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {tahfidzGroupedRows.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {tahfidzGroupedRows.map(juzRow => {
                  const isJuzSelected = selectedDetail?.type === 'tahfidzJuz' && selectedDetail?.key === juzRow.juz;
                  return (
                    <div key={juzRow.juz} className={`rounded-2xl border p-3 sm:p-4 transition-all ${
                      isJuzSelected
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/10'
                        : 'border-purple-100 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div
                          onClick={() => handleSelectDetail('tahfidzJuz', juzRow.juz, studentNameMap.tahfidzJuz[juzRow.juz] || [])}
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">{juzRow.juz}</span>
                          <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-500/20 px-2 py-0.5 rounded-full">{juzRow.total} siswa</span>
                        </div>
                      </div>
                      {isJuzSelected && <StudentNameList students={studentNameMap.tahfidzJuz[juzRow.juz] || []} color="emerald" />}

                      <div className="space-y-2.5 sm:space-y-3">
                        {juzRow.surahs.map(surahRow => {
                          const isSurahSelected = selectedDetail?.type === 'tahfidz' && selectedDetail?.key === surahRow.surah;
                          return (
                            <div key={`${juzRow.juz}-${surahRow.surah}`} className={`rounded-xl border p-3 sm:p-4 transition-all ${
                              isSurahSelected
                                ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10'
                                : 'border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50'
                            }`}>
                              <div
                                onClick={() => handleSelectDetail('tahfidz', surahRow.surah, studentNameMap.tahfidz[surahRow.surah] || [])}
                                className="flex items-center gap-2 min-w-0 mb-3 w-full cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate" title={surahRow.surah}>{surahRow.surah}</span>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shrink-0">{surahRow.total} siswa</span>
                              </div>

                              <div className="space-y-2.5 sm:space-y-3">
                                {surahRow.classes.map(item => (
                                  <div key={`${juzRow.juz}-${surahRow.surah}-${item.className}`} className="grid grid-cols-[68px_minmax(0,1fr)_56px] sm:grid-cols-[120px_minmax(0,1fr)_92px] items-center gap-2 sm:gap-3">
                                    <div className="text-[11px] sm:text-sm font-black text-slate-700 dark:text-slate-200 truncate" title={item.className}>{item.className}</div>
                                    <div className="h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-1000 ${surahRow.surah === 'Belum Ada' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-r from-purple-400 to-fuchsia-500 dark:from-purple-500 dark:to-fuchsia-600'}`}
                                        style={{ width: `${Math.max((item.count / surahRow.total) * 100, 4)}%` }}
                                      />
                                    </div>
                                    <div className="text-right text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">
                                      {item.count}<span className="hidden sm:inline"> siswa</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {isSurahSelected && <StudentNameList students={studentNameMap.tahfidz[surahRow.surah] || []} color="purple" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500">
                Belum ada data tahfidz untuk ditampilkan.
              </div>
            )}
          </div>
          
          {/* Widget Informasi */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-1 sm:mt-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 sm:gap-5 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0"><Users size={26} className="sm:w-8 sm:h-8" /></div>
              <div className="min-w-0"><p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Siswa {dataSourceType === 'all' ? 'Aktif' : 'Terfilter'}</p><p className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 leading-none mt-1">{globalStats.totalStudents}</p><p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 min-w-0">Halaqoh: <span className="truncate bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">{dataSourceType === 'all' ? 'Semua Halaqoh' : (activeHalaqoh || 'Semua')}</span></p></div>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-800 dark:border-slate-800/80 shadow-xl text-white relative overflow-hidden"><div className="absolute -right-12 -top-12 text-white/5"><TrendingUp size={150} className="sm:w-[180px] sm:h-[180px]" /></div><div className="relative z-10"><h3 className="text-base sm:text-xl font-black text-emerald-400 mb-2 sm:mb-3 flex items-center gap-2"><TrendingUp size={18} className="sm:w-5 sm:h-5" /> Insight Otomatis</h3><p className="text-xs sm:text-base font-medium text-slate-300 leading-relaxed">Berdasarkan data <strong className="text-white">{dataSourceType === 'all' ? 'Semua Siswa' : 'Siswa Terfilter'}</strong> {periodRange ? `periode ${periodRange.label.toLowerCase()}` : 'sepanjang waktu'}, mayoritas berada di level <strong className="text-blue-300 bg-blue-500/20 px-1.5 sm:px-2 py-0.5 rounded-md">{dominantLevel}</strong> untuk Tahsin, serta capaian terbanyak Tahfidz pada <strong className="text-purple-300 bg-purple-500/20 px-1.5 sm:px-2 py-0.5 rounded-md">{topTahfidzSurah}</strong>. Terus pantau perkembangan untuk melihat transisi yang lebih detail secara berkelanjutan.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChartView;
