import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Award,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Mic,
  Printer,
  Repeat,
  Search,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { formatDateObj, formatPeriode, formatPrintData, formatShortDate, getInitials } from '../../utils/helpers';

const JURNAL = {
  tahsin: 'jurnalTahsin',
  halTahsin: 'jurnalHalAyatTahsin',
  tahsinNilai: 'jurnalTahsinNilai',
  tahsinSuratNilai: 'jurnalTahsinSuratNilai',
  tahfidz: 'jurnalTahfidz',
  ayatTahfidz: 'jurnalAyatTahfidz',
  tahfidzNilai: 'jurnalTahfidzNilai',
  murojaah: 'jurnalMurojaah',
  murojaahQorib: 'jurnalMurojaahQorib',
  murojaahBaid: 'jurnalMurojaahBaid',
  catatan: 'jurnalCatatan',
  catatanTahsin: 'jurnalCatatanTahsin',
  catatanTahfidz: 'jurnalCatatanTahfidz'
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const JILID_ORDER = ['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', "Al-Qur'an"];
const FINAL_PRINT_ROWS_PER_PAGE = 14;
const MONTHLY_PRINT_ROWS_PER_PAGE = 10;

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== '' && text !== '-';
};

const getMurojaahQorib = (record) => hasValue(record?.[JURNAL.murojaahQorib])
  ? String(record[JURNAL.murojaahQorib])
  : hasValue(record?.[JURNAL.murojaah])
    ? String(record[JURNAL.murojaah])
    : '-';
const getMurojaahBaid = (record) => hasValue(record?.[JURNAL.murojaahBaid]) ? String(record[JURNAL.murojaahBaid]) : '-';
const hasMurojaah = (record) => hasValue(getMurojaahQorib(record)) || hasValue(getMurojaahBaid(record));

const getMonthTitle = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const getMonthWeekRanges = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const ranges = [];
  for (let day = 1; day <= lastDay; day += 7) {
    const endDay = Math.min(day + 6, lastDay);
    ranges.push({
      index: ranges.length + 1,
      start: new Date(year, month, day),
      end: new Date(year, month, endDay)
    });
  }
  return ranges;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const getDayTitle = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '-';
  return DAY_NAMES[date.getDay()] || '-';
};

const getRecordDateKey = (dateInput) => formatDateObj(dateInput);

const getReportDocId = (activeHalaqoh, periodStart, reportType) => {
  const halaqohSlug = String(activeHalaqoh || 'semua-halaqoh')
    .replace(/[^a-z0-9]+/gi, '')
    .toUpperCase()
    .slice(0, 24) || 'HALAQOH';
  const dateKey = getRecordDateKey(periodStart).replace(/-/g, '') || '00000000';
  return `SDITALFITYAN-LP-${dateKey}-${reportType.toUpperCase()}-${halaqohSlug}`;
};

const hasJournalData = (record) => {
  if (!record) return false;
  return [
    JURNAL.tahsin,
    JURNAL.halTahsin,
    JURNAL.tahsinNilai,
    JURNAL.tahsinSuratNilai,
    JURNAL.tahfidz,
    JURNAL.ayatTahfidz,
    JURNAL.tahfidzNilai,
    JURNAL.catatan,
    JURNAL.catatanTahsin,
    JURNAL.catatanTahfidz
  ].some((field) => hasValue(record[field])) || hasMurojaah(record);
};

const extractJilid = (tahsin) => {
  if (!hasValue(tahsin)) return null;
  const text = String(tahsin);
  const match = text.match(/Jilid\s*[1-6]/i);
  if (match) return match[0].replace(/\s+/, ' ').replace(/jilid/i, 'Jilid');
  if (/Al-?Qur'?an|Al Quran/i.test(text)) return "Al-Qur'an";
  return null;
};

const getTahsinLevel = (tahsin) => {
  if (!hasValue(tahsin)) return '-';
  const jilid = extractJilid(tahsin);
  if (jilid) return jilid;
  const text = String(tahsin);
  if (/Al-?Qur'?an|Al Quran/i.test(text)) return "Al-Qur'an";
  if (/Tajwid/i.test(text)) return 'Tajwid';
  if (/Ghorib|Gharib/i.test(text)) return 'Ghorib';
  return 'Tahsin';
};

const getRecordDisplay = (record) => {
  const tahsin = formatPrintData(record?.[JURNAL.tahsin], record?.[JURNAL.halTahsin], record?.[JURNAL.tahsinNilai], record?.[JURNAL.tahsinSuratNilai]);
  const tahfidz = formatPrintData(record?.[JURNAL.tahfidz], record?.[JURNAL.ayatTahfidz], null, record?.[JURNAL.tahfidzNilai]);
  const murojaahQorib = getMurojaahQorib(record);
  const murojaahBaid = getMurojaahBaid(record);
  const catatan = hasValue(record?.[JURNAL.catatan]) ? String(record[JURNAL.catatan]) : '-';
  const catatanTahsin = hasValue(record?.[JURNAL.catatanTahsin]) ? String(record[JURNAL.catatanTahsin]) : '-';
  const catatanTahfidz = hasValue(record?.[JURNAL.catatanTahfidz]) ? String(record[JURNAL.catatanTahfidz]) : '-';

  return { tahsin, tahfidz, murojaahQorib, murojaahBaid, catatan, catatanTahsin, catatanTahfidz };
};

const cleanPrintText = (value) => {
  if (!hasValue(value)) return '-';
  return String(value)
    .replace(/\(Nilai:[^)]+\)/gi, '')
    .replace(/\s+\(([A-C][+-]?|D)\)/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim() || '-';
};

const formatTahsinPageOnly = (value) => {
  const text = cleanPrintText(value);
  if (!hasValue(text)) return '-';

  const pages = [...text.matchAll(/Hal\.\s*([\d,\s]+)/gi)]
    .flatMap((match) => match[1].split(',').map((page) => page.trim()))
    .filter(Boolean);

  if (pages.length === 0) return text.replace(/\s*Brs\s*[\d,\s:]+/gi, '').trim() || '-';
  return `Hal. ${[...new Set(pages)].join(', ')}`;
};

const isInactiveRecord = (record) => {
  const text = String(record?.[JURNAL.catatan] || '').toLowerCase();
  return ['libur', 'sakit', 'izin', 'alpa', 'tidak hadir'].some((word) => text.includes(word));
};

const hasDrillNote = (record) => [
  JURNAL.catatan,
  JURNAL.catatanTahsin,
  JURNAL.catatanTahfidz,
  'catatan',
  'catatanTahsin',
  'catatanTahfidz'
].some((field) => String(record?.[field] || '').toLowerCase().includes('drill'));

const getStudentGuru = (guruHalaqohData, halaqoh) => {
  if (!guruHalaqohData) return '-';
  for (const [guru, halaqohs] of Object.entries(guruHalaqohData)) {
    if (Array.isArray(halaqohs) && halaqohs.includes(halaqoh)) return guru;
  }
  return '-';
};

const ReportView = ({
  activeHalaqoh,
  activeGuru,
  activeGuruDisplayName,
  weekDates,
  changeWeek,
  filteredStudents,
  institutionLogo,
  guruHalaqohData,
  getTeacherDisplayName
}) => {
  const [reportType, setReportType] = useState('weekly');
  const [monthDate, setMonthDate] = useState(new Date());
  const teacherDisplayName = activeGuruDisplayName || activeGuru || '';
  const [studentSearch, setStudentSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);
  const reportPanRef = useRef(null);

  const students = Array.isArray(filteredStudents) ? filteredStudents : [];

  const period = useMemo(() => {
    if (reportType === 'final') {
      return {
        start: new Date(2000, 0, 1),
        end: new Date(2100, 0, 1),
        title: 'Hasil Capaian Akhir',
        label: 'Rekap Keseluruhan',
        note: 'Menampilkan capaian terakhir siswa dari seluruh data yang ada.'
      };
    }

    if (reportType === 'monthly') {
      const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      return {
        start,
        end,
        title: getMonthTitle(monthDate),
        label: 'Rekap Bulanan',
        note: 'Menampilkan jurnal terakhir yang diisi pada bulan ini.'
      };
    }

    const start = new Date(weekDates?.[0] || new Date());
    const end = new Date(weekDates?.[weekDates.length - 1] || start);
    return {
      start,
      end,
      title: formatPeriode(start, end),
      label: 'Rekap Mingguan',
      note: 'Menampilkan jurnal terakhir yang diisi pada pekan ini.'
    };
  }, [monthDate, reportType, weekDates]);

  const changeMonth = (offset) => {
    const nextDate = new Date(monthDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setMonthDate(nextDate);
  };

  const monthWeekRanges = useMemo(() => getMonthWeekRanges(monthDate), [monthDate]);
  const reportColumns = useMemo(() => {
    if (reportType === 'final') return [];

    if (reportType === 'monthly') {
      return monthWeekRanges.map((week) => ({
        ...week,
        kind: 'week',
        title: `Minggu ${week.index}`,
        subtitle: `${formatShortDate(week.start)} - ${formatShortDate(week.end)}`
      }));
    }

    return (Array.isArray(weekDates) ? weekDates : []).map((date, index) => ({
      kind: 'day',
      index: index + 1,
      key: getRecordDateKey(date),
      date,
      start: date,
      end: date,
      title: getDayTitle(date),
      subtitle: formatShortDate(date)
    }));
  }, [monthWeekRanges, reportType, weekDates]);

  const getRecordsInRange = (student, start, end) => {
    const records = student?.records || {};
    const startTime = new Date(start);
    const endTime = new Date(end);
    startTime.setHours(0, 0, 0, 0);
    endTime.setHours(23, 59, 59, 999);

    return Object.entries(records)
      .map(([date, record]) => ({ date, dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => !Number.isNaN(dateObj.getTime()) && dateObj >= startTime && dateObj <= endTime && hasJournalData(record))
      .sort((a, b) => b.dateObj - a.dateObj);
  };

  const getLatestCapaian = (student) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const validRecords = Object.entries(student?.records || {})
      .map(([date, record]) => ({ dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => (
        !Number.isNaN(dateObj.getTime())
        && dateObj <= today
        && hasJournalData(record)
        && !isInactiveRecord(record)
      ))
      .sort((a, b) => b.dateObj - a.dateObj);

    let latestTahsin = null;
    let latestTahfidz = null;
    const latestDrillTime = Object.entries(student?.records || {})
      .map(([date, record]) => ({ dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => (
        !Number.isNaN(dateObj.getTime())
        && dateObj <= today
        && !isInactiveRecord(record)
        && hasDrillNote(record)
      ))
      .sort((a, b) => b.dateObj - a.dateObj)[0]?.dateObj.getTime() || null;

    for (const { dateObj, record } of validRecords) {
      if (!latestTahsin && (hasValue(record[JURNAL.tahsin]) || hasValue(record[JURNAL.halTahsin]))) {
        const shouldUseDrillPage = hasDrillNote(record) || (latestDrillTime !== null && latestDrillTime >= dateObj.getTime());
        latestTahsin = {
          tahsin: hasValue(record[JURNAL.tahsin]) ? cleanPrintText(record[JURNAL.tahsin]) : '-',
          halTahsin: shouldUseDrillPage ? 'Hal. 40' : hasValue(record[JURNAL.halTahsin]) ? formatTahsinPageOnly(record[JURNAL.halTahsin]) : '-'
        };
      }

      if (!latestTahfidz && (hasValue(record[JURNAL.tahfidz]) || hasValue(record[JURNAL.ayatTahfidz]))) {
        latestTahfidz = {
          tahfidz: hasValue(record[JURNAL.tahfidz]) ? cleanPrintText(record[JURNAL.tahfidz]) : '-',
          ayatTahfidz: hasValue(record[JURNAL.ayatTahfidz]) ? cleanPrintText(record[JURNAL.ayatTahfidz]) : '-'
        };
      }

      if (latestTahsin && latestTahfidz) break;
    }

    return {
      tahsin: latestTahsin?.tahsin || '-',
      halTahsin: latestTahsin?.halTahsin || '-',
      tahfidz: latestTahfidz?.tahfidz || '-',
      ayatTahfidz: latestTahfidz?.ayatTahfidz || '-'
    };
  };

  const getReportCell = (student, column) => {
    if (column.kind === 'day') {
      const record = student?.records?.[column.key] || null;
      const latest = record && hasJournalData(record)
        ? { date: column.key, dateObj: new Date(column.date), record }
        : null;
      return {
        ...column,
        latest,
        display: getRecordDisplay(latest?.record || {})
      };
    }

    const recordsInRange = getRecordsInRange(student, column.start, column.end);
    const latestMurojaah = recordsInRange.find(({ record }) => hasMurojaah(record)) || null;
    const latestTahsin = recordsInRange.find(({ record }) => (
      hasValue(record?.[JURNAL.tahsin])
      || hasValue(record?.[JURNAL.halTahsin])
      || hasValue(record?.[JURNAL.tahsinNilai])
      || hasValue(record?.[JURNAL.tahsinSuratNilai])
    )) || null;
    const latestTahfidz = recordsInRange.find(({ record }) => (
      hasValue(record?.[JURNAL.tahfidz])
      || hasValue(record?.[JURNAL.ayatTahfidz])
      || hasValue(record?.[JURNAL.tahfidzNilai])
    )) || null;
    const latest = [latestMurojaah, latestTahsin, latestTahfidz]
      .filter(Boolean)
      .sort((a, b) => b.dateObj - a.dateObj)[0] || null;
    const combinedRecord = {};

    if (latestMurojaah) {
      combinedRecord[JURNAL.murojaah] = latestMurojaah.record?.[JURNAL.murojaah];
      combinedRecord[JURNAL.murojaahQorib] = latestMurojaah.record?.[JURNAL.murojaahQorib];
      combinedRecord[JURNAL.murojaahBaid] = latestMurojaah.record?.[JURNAL.murojaahBaid];
      combinedRecord[JURNAL.catatan] = latestMurojaah.record?.[JURNAL.catatan];
    }

    if (latestTahsin) {
      combinedRecord[JURNAL.tahsin] = latestTahsin.record?.[JURNAL.tahsin];
      combinedRecord[JURNAL.halTahsin] = latestTahsin.record?.[JURNAL.halTahsin];
      combinedRecord[JURNAL.tahsinNilai] = latestTahsin.record?.[JURNAL.tahsinNilai];
      combinedRecord[JURNAL.tahsinSuratNilai] = latestTahsin.record?.[JURNAL.tahsinSuratNilai];
      combinedRecord[JURNAL.catatanTahsin] = latestTahsin.record?.[JURNAL.catatanTahsin];
    }

    if (latestTahfidz) {
      combinedRecord[JURNAL.tahfidz] = latestTahfidz.record?.[JURNAL.tahfidz];
      combinedRecord[JURNAL.ayatTahfidz] = latestTahfidz.record?.[JURNAL.ayatTahfidz];
      combinedRecord[JURNAL.tahfidzNilai] = latestTahfidz.record?.[JURNAL.tahfidzNilai];
      combinedRecord[JURNAL.catatanTahfidz] = latestTahfidz.record?.[JURNAL.catatanTahfidz];
    }

    return {
      ...column,
      latest,
      metricDates: {
        murojaah: latestMurojaah?.date || null,
        tahsin: latestTahsin?.date || null,
        tahfidz: latestTahfidz?.date || null
      },
      display: getRecordDisplay(combinedRecord)
    };
  };

  const getRecordsInPeriod = (student) => getRecordsInRange(student, period.start, period.end);

  const getJilidJourney = (student) => {
    const records = Object.entries(student?.records || {})
      .map(([date, record]) => ({ date, dateObj: new Date(date), record }))
      .filter(({ dateObj, record }) => !Number.isNaN(dateObj.getTime()) && hasValue(record?.[JURNAL.tahsin]))
      .sort((a, b) => a.dateObj - b.dateObj);

    const journeyMap = new Map();
    records.forEach(({ date, record }) => {
      const jilid = extractJilid(record[JURNAL.tahsin]);
      if (!jilid) return;
      const existing = journeyMap.get(jilid);
      const item = {
        jilid,
        firstDate: existing?.firstDate || date,
        lastDate: date,
        detail: hasValue(record[JURNAL.halTahsin]) ? String(record[JURNAL.halTahsin]) : '-',
        nilai: hasValue(record[JURNAL.tahsinNilai]) ? String(record[JURNAL.tahsinNilai]) : '-'
      };
      journeyMap.set(jilid, item);
    });

    return Array.from(journeyMap.values()).sort((a, b) => JILID_ORDER.indexOf(a.jilid) - JILID_ORDER.indexOf(b.jilid));
  };

  const reportRows = students
    .map((student) => {
      const latest = getRecordsInPeriod(student)[0] || null;
      const latestCapaian = getLatestCapaian(student);
      const display = getRecordDisplay(latest?.record || {});
      const journey = getJilidJourney(student);
      const lastJilid = journey[journey.length - 1] || null;
      const teacherName = getStudentGuru(guruHalaqohData, student?.halaqoh);
      const periodCells = reportColumns.map((column) => getReportCell(student, column));

      return {
        student,
        latest,
        display,
        periodCells,
        journey,
        lastJilid,
        teacherName: getTeacherDisplayName?.(teacherName) || teacherName,
        latestCapaian,
        tahsinLevel: reportType === 'final' ? getTahsinLevel(latestCapaian.tahsin) : getTahsinLevel(latest?.record?.[JURNAL.tahsin])
      };
    })
    .filter(({ student }) => {
      return !studentSearch.trim() || String(student?.name || '').toLowerCase().includes(studentSearch.trim().toLowerCase());
    });

  const stats = {
    filled: reportRows.filter((row) => row.latest).length,
    tahsin: reportRows.filter((row) => reportType === 'final'
      ? hasValue(row.latestCapaian?.tahsin) || hasValue(row.latestCapaian?.halTahsin)
      : hasValue(row.latest?.record?.[JURNAL.tahsin])).length,
    tahfidz: reportRows.filter((row) => reportType === 'final'
      ? hasValue(row.latestCapaian?.tahfidz) || hasValue(row.latestCapaian?.ayatTahfidz)
      : hasValue(row.latest?.record?.[JURNAL.tahfidz])).length,
    murojaah: reportRows.filter((row) => hasMurojaah(row.latest?.record)).length,
    jilid: reportRows.filter((row) => row.journey.length > 0).length
  };
  const printRowCount = Math.min(reportRows.length, 12);
  const printDensityClass = printRowCount >= 11 ? 'print-density-tight' : printRowCount >= 8 ? 'print-density-medium' : 'print-density-normal';
  const reportTableMinWidth = Math.max(980, 260 + (reportColumns.length * 330));
  const finalPrintPages = chunkArray(reportRows, FINAL_PRINT_ROWS_PER_PAGE).map((studentRows, pageIndex) => ({
    studentRows,
    pageIndex
  }));
  const monthlyPrintPages = chunkArray(reportRows, MONTHLY_PRINT_ROWS_PER_PAGE).map((studentRows, pageIndex) => ({
    studentRows,
    pageIndex
  }));
  const weeklyPrintPages = chunkArray(reportRows, MONTHLY_PRINT_ROWS_PER_PAGE).map((studentRows, pageIndex) => ({
    studentRows,
    pageIndex
  }));
  const totalPrintPages = reportType === 'final'
    ? Math.max(1, finalPrintPages.length)
    : reportType === 'monthly'
      ? Math.max(1, monthlyPrintPages.length)
      : Math.max(1, weeklyPrintPages.length);
  const periodMonthLabel = getMonthTitle(period.start);
  const reportDocId = getReportDocId(activeHalaqoh, reportType === 'final' ? new Date() : period.start, reportType);

  // Menghitung Distribusi Tahsin per Halaqoh yang sedang tampil
  const tahsinDistribution = (() => {
    const counts = {};
    reportRows.forEach(row => {
      const level = row.tahsinLevel;
      if (level && level !== '-') {
        counts[level] = (counts[level] || 0) + 1;
      }
    });
    const order = ['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', "Al-Qur'an", 'Tajwid', 'Ghorib', 'Tahsin'];
    return Object.entries(counts).sort((a, b) => {
      const idxA = order.indexOf(a[0]);
      const idxB = order.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b[1] - a[1];
    });
  })();

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportWheel = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (e.target.closest('[data-report-native-scroll], button, input, select, textarea, a')) return;
    const pageContainer = scrollContainerRef.current;
    if (!pageContainer) return;
    const horizontalContainer = e.target.closest('[data-report-pan-container]') || pageContainer;
    const horizontalDelta = e.shiftKey ? e.deltaY : e.deltaX;
    
    if (e.cancelable) {
      e.preventDefault();
    }
    
    horizontalContainer.scrollLeft += horizontalDelta;
    pageContainer.scrollTop += e.shiftKey ? 0 : e.deltaY;
  };

  const handleReportPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-report-native-scroll], button, input, select, textarea, a')) return;
    const pageContainer = scrollContainerRef.current;
    if (!pageContainer) return;
    const horizontalContainer = e.target.closest('[data-report-pan-container]') || pageContainer;
    reportPanRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      horizontalContainer,
      pageContainer,
      scrollLeft: horizontalContainer.scrollLeft,
      scrollTop: pageContainer.scrollTop
    };
    pageContainer.setPointerCapture?.(e.pointerId);
  };

  const handleReportPointerMove = (e) => {
    const pan = reportPanRef.current;
    if (!pan) return;
    pan.horizontalContainer.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX);
    pan.pageContainer.scrollTop = pan.scrollTop - (e.clientY - pan.startY);
  };

  const stopReportPan = (e) => {
    const container = scrollContainerRef.current;
    const pointerId = reportPanRef.current?.pointerId ?? e?.pointerId;
    if (pointerId != null && container?.hasPointerCapture?.(pointerId)) {
      container.releasePointerCapture(pointerId);
    }
    reportPanRef.current = null;
  };

  const getMurojaahText = (display) => {
    const items = [
      hasValue(display?.murojaahQorib) ? `QORIB: ${display.murojaahQorib}` : '',
      hasValue(display?.murojaahBaid) ? `BAID: ${display.murojaahBaid}` : ''
    ].filter(Boolean);
    return items.length ? items.join('\n') : '-';
  };

  const getMetricValue = (cell, metric) => {
    if (!cell?.latest) return '-';
    if (metric === 'murojaah') return getMurojaahText(cell.display);
    if (metric === 'tahsin') return cell.display?.tahsin || '-';
    return cell.display?.tahfidz || '-';
  };

  const getMetricNote = (cell, metric) => {
    if (!cell?.latest) return '-';
    if (metric === 'murojaah') return cell.display?.catatan || '-';
    if (metric === 'tahsin') return cell.display?.catatanTahsin || '-';
    return cell.display?.catatanTahfidz || '-';
  };

  const getMetricConfig = (metric) => {
    if (metric === 'murojaah') {
      return {
        label: 'Murojaah',
        noteLabel: 'Umum',
        screenClass: 'text-emerald-700',
        printClass: 'lesson-print-murojaah',
        noteClass: 'text-orange-600'
      };
    }
    if (metric === 'tahsin') {
      return {
        label: 'Tahsin',
        noteLabel: 'Tahsin',
        screenClass: 'text-blue-700',
        printClass: 'lesson-print-tahsin',
        noteClass: 'text-blue-600'
      };
    }
    return {
      label: 'Tahfidz',
      noteLabel: 'Tahfidz',
      screenClass: 'text-purple-700',
      printClass: 'lesson-print-tahfidz',
      noteClass: 'text-purple-600'
    };
  };

  const renderMetricCell = (cell, metric, variant = 'screen') => {
    const config = getMetricConfig(metric);
    const rawValue = getMetricValue(cell, metric);
    const value = variant === 'print' ? cleanPrintText(rawValue) : rawValue;
    const note = getMetricNote(cell, metric);

    if (variant === 'print') {
      return (
        <div className={`lesson-print-cell ${config.printClass}`}>
          <div>{hasValue(value) ? value : '-'}</div>
          {hasValue(note) && (
            <div className={`lesson-print-note ${config.printClass}`}>
              <b>{config.noteLabel}:</b> {String(note)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="min-w-0">
        <div className={`whitespace-pre-wrap break-words leading-snug font-black ${config.screenClass}`}>
          {hasValue(value) ? value : '-'}
        </div>
        {hasValue(note) && (
          <div className={`mt-2 text-[10px] font-bold leading-snug ${config.noteClass}`}>
            <span className="font-black">{config.noteLabel}:</span> {String(note)}
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyPrintCell = (cell) => {
    if (!cell?.latest) {
      return <div className="monthly-print-empty">-</div>;
    }

    const items = [
      { label: 'M', date: cell.metricDates?.murojaah, value: cleanPrintText(getMurojaahText(cell.display)), className: 'monthly-print-murojaah' },
      { label: 'Tsn', date: cell.metricDates?.tahsin, value: cleanPrintText(cell.display?.tahsin), className: 'monthly-print-tahsin' },
      { label: 'Tfdz', date: cell.metricDates?.tahfidz, value: cleanPrintText(cell.display?.tahfidz), className: 'monthly-print-tahfidz' }
    ].filter((item) => hasValue(item.value));

    return (
      <div className="monthly-print-cell">
        {items.length > 0 ? items.map((item) => (
          <div key={item.label} className={`monthly-print-line ${item.className}`}>
            <b>{item.label}:</b> {item.date && <span className="monthly-print-item-date">{formatShortDate(new Date(item.date))}</span>} {item.value}
          </div>
        )) : <div className="monthly-print-empty">-</div>}
      </div>
    );
  };

  const renderJourney = (journey, compact = false) => {
    if (!journey.length) return <span className="text-[11px] sm:text-sm text-slate-400 font-bold">Belum ada progres jilid</span>;

    return (
      <div className={`flex ${compact ? 'gap-1.5 overflow-x-auto custom-scrollbar pb-1' : 'flex-wrap gap-2'}`}>
        {journey.map((item) => (
          <div key={item.jilid} className="rounded-xl border border-emerald-100 bg-emerald-50 px-2 sm:px-2.5 py-1.5 sm:py-2 min-w-[82px] sm:min-w-[92px]">
            <div className="text-[9px] sm:text-[10px] font-black text-emerald-700 leading-none">{item.jilid}</div>
            <div className="text-[9px] font-bold text-emerald-600/70 mt-1">{formatShortDate(new Date(item.lastDate))}</div>
            {item.detail !== '-' && <div className="text-[9px] font-bold text-slate-500 mt-1 truncate">{item.detail}</div>}
          </div>
        ))}
      </div>
    );
  };

  const renderPeriodCards = (cells = []) => {
    if (!cells.length) return null;

    return (
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {cells.map((cell) => {
          const hasLatest = Boolean(cell.latest);

          return (
            <div key={`${cell.kind}-${cell.index}`} className={`min-w-[255px] rounded-xl border p-2.5 ${hasLatest ? 'bg-emerald-50/70 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${hasLatest ? 'text-emerald-700' : 'text-slate-400'}`}>{cell.title}</div>
                  <div className="text-[9px] font-bold text-slate-500 leading-tight">
                    {cell.subtitle}
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-black ${hasLatest ? 'bg-white text-emerald-700 border border-emerald-100' : 'bg-white text-slate-400 border border-slate-200'}`}>
                  {hasLatest ? (reportType === 'monthly' ? formatShortDate(new Date(cell.latest.date)) : 'Terisi') : '-'}
                </span>
              </div>
              {hasLatest ? (
                <div className="space-y-2 text-[10px] font-bold leading-snug">
                  {['murojaah', 'tahsin', 'tahfidz'].map((metric) => {
                    const Icon = metric === 'murojaah' ? Repeat : metric === 'tahsin' ? BookOpen : Mic;
                    const config = getMetricConfig(metric);
                    return (
                      <div key={metric} className="rounded-lg bg-white/70 border border-white p-2 min-w-0">
                        <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest mb-1 ${config.screenClass}`}>
                          <Icon size={10} /> {config.label}
                        </div>
                        {renderMetricCell(cell, metric)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[9px] font-bold text-slate-400">Belum ada jurnal</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      onWheel={handleReportWheel}
      onPointerDown={handleReportPointerDown}
      onPointerMove={handleReportPointerMove}
      onPointerUp={stopReportPan}
      onPointerCancel={stopReportPan}
      onPointerLeave={stopReportPan}
      className="report-print-viewport flex-1 w-full h-full overflow-auto overscroll-contain custom-scrollbar bg-slate-50 text-slate-900 relative print:bg-white print:overflow-visible"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <style type="text/css" media="print" dangerouslySetInnerHTML={{
        __html: `
        @page { size: A4 landscape; margin: 4mm; }
        html, body, #root {
          width: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: white !important;
        }
        .report-print-viewport {
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          background: white !important;
        }
        .report-print-shell {
          width: 289mm !important;
          max-width: none !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        .report-print-page {
          --print-font: 6.2pt;
          --print-cell-pad: 1.25mm;
          --print-title: 14pt;
          --print-stat: 15pt;
          width: 281mm !important;
          height: 194mm !important;
          overflow: hidden !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .report-print-page.print-density-medium {
          --print-font: 5.4pt;
          --print-cell-pad: 0.95mm;
          --print-title: 12pt;
          --print-stat: 12.5pt;
        }
        .report-print-page.print-density-tight {
          --print-font: 4.7pt;
          --print-cell-pad: 0.65mm;
          --print-title: 10.5pt;
          --print-stat: 10.5pt;
        }
        .report-print-inner {
          padding: 0 !important;
        }
        .report-print-header {
          flex-direction: row !important;
          align-items: center !important;
          gap: 3mm !important;
          padding-bottom: 2mm !important;
          margin-bottom: 2mm !important;
          border-bottom-width: 1px !important;
        }
        .report-print-logo {
          width: 15mm !important;
          height: 15mm !important;
        }
        .report-print-title {
          font-size: var(--print-title) !important;
          line-height: 1.05 !important;
        }
        .report-print-subtitle {
          font-size: 6pt !important;
          line-height: 1.1 !important;
          margin-top: 1mm !important;
          letter-spacing: 0.08em !important;
        }
        .report-print-meta {
          grid-template-columns: auto minmax(0, 1fr) !important;
          gap: 0.8mm 2mm !important;
          padding: 1.6mm !important;
          border-radius: 2mm !important;
          font-size: 5.5pt !important;
          max-width: 70mm !important;
        }
        .report-print-stats-wrap {
          margin: 2mm 0 !important;
          overflow: visible !important;
        }
        .report-print-stats {
          min-width: 0 !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          gap: 1.5mm !important;
        }
        .report-print-stat {
          padding: 1.2mm !important;
          border-radius: 2mm !important;
        }
        .report-print-stat svg {
          display: none !important;
        }
        .report-print-stat-value {
          font-size: var(--print-stat) !important;
          line-height: 1 !important;
        }
        .report-print-stat-label {
          font-size: 4.3pt !important;
          line-height: 1.05 !important;
          margin-top: 0.6mm !important;
          letter-spacing: 0.08em !important;
        }
        .report-print-table-wrap {
          display: block !important;
          max-height: none !important;
          overflow: visible !important;
          border-radius: 2mm !important;
        }
        .report-print-table {
          width: 100% !important;
          min-width: 0 !important;
          table-layout: fixed !important;
          font-size: var(--print-font) !important;
          line-height: 1.08 !important;
        }
        .report-print-table th,
        .report-print-table td {
          padding: var(--print-cell-pad) !important;
          vertical-align: top !important;
        }
        .report-print-table th {
          font-size: calc(var(--print-font) - 0.2pt) !important;
          letter-spacing: 0.08em !important;
        }
        .report-print-student-cell {
          gap: 1.2mm !important;
        }
        .report-print-avatar {
          width: 7mm !important;
          height: 7mm !important;
          font-size: 4.8pt !important;
        }
        .report-print-student-name {
          font-size: calc(var(--print-font) + 0.4pt) !important;
          line-height: 1.05 !important;
        }
        .report-print-student-meta {
          font-size: calc(var(--print-font) - 1pt) !important;
          margin-top: 0.4mm !important;
          letter-spacing: 0.06em !important;
        }
        .report-print-weekly > div,
        .report-print-journey > div {
          overflow: hidden !important;
          gap: 0.8mm !important;
          padding-bottom: 0 !important;
        }
        .report-print-weekly > div > div,
        .report-print-journey > div > div {
          min-width: 25mm !important;
          padding: 0.8mm !important;
          border-radius: 1.5mm !important;
          font-size: calc(var(--print-font) - 0.5pt) !important;
          line-height: 1.05 !important;
        }
        .report-print-table .whitespace-pre-wrap {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
        }
        .report-print-signatures {
          margin-top: 2.5mm !important;
          gap: 20mm !important;
        }
        .report-print-signatures p {
          margin-bottom: 9mm !important;
          font-size: 5pt !important;
          line-height: 1.15 !important;
        }
        .report-print-signatures .w-56 {
          width: 45mm !important;
        }
        .report-card {
          break-inside: avoid;
        }
        .screen-report-area {
          display: none !important;
        }
        .print-only-report {
          display: block !important;
          width: 289mm !important;
          max-height: 202mm !important;
          overflow: hidden !important;
          color: #0f172a !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 5.6pt !important;
          line-height: 1.08 !important;
          box-sizing: border-box !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-only-report.density-medium {
          font-size: 5pt !important;
        }
        .print-only-report.density-tight {
          font-size: 4.35pt !important;
          line-height: 1.06 !important;
        }
        .print-clean-header {
          display: grid !important;
          grid-template-columns: 1fr 62mm !important;
          gap: 3mm !important;
          align-items: start !important;
          padding-bottom: 1.4mm !important;
          border-bottom: 1.5px solid #0f172a !important;
        }
        .print-brand {
          display: flex !important;
          align-items: center !important;
          gap: 3mm !important;
          min-width: 0 !important;
        }
        .print-brand-logo {
          width: 10mm !important;
          height: 10mm !important;
          object-fit: contain !important;
          flex: 0 0 auto !important;
        }
        .print-clean-title {
          font-size: 10.5pt !important;
          line-height: 1 !important;
          font-weight: 900 !important;
          letter-spacing: 0 !important;
          text-transform: uppercase !important;
        }
        .density-medium .print-clean-title {
          font-size: 9.8pt !important;
        }
        .density-tight .print-clean-title {
          font-size: 9pt !important;
        }
        .print-clean-subtitle {
          margin-top: 0.8mm !important;
          font-size: 5.2pt !important;
          font-weight: 900 !important;
          color: #059669 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
        }
        .density-tight .print-clean-subtitle {
          font-size: 5pt !important;
        }
        .print-clean-meta {
          border: 1px solid #cbd5e1 !important;
          border-radius: 2mm !important;
          padding: 1.2mm 1.6mm !important;
          display: grid !important;
          grid-template-columns: 17mm 1fr !important;
          gap: 0.55mm 1.4mm !important;
          font-size: 4.7pt !important;
        }
        .print-clean-meta b {
          color: #64748b !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
        }
        .print-clean-stats {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 1mm !important;
          margin: 1.2mm 0 !important;
        }
        .print-clean-stat {
          border: 1px solid #dbeafe !important;
          border-radius: 2mm !important;
          padding: 0.8mm 1mm !important;
          background: #f8fafc !important;
        }
        .print-clean-stat-value {
          font-size: 9pt !important;
          line-height: 1 !important;
          font-weight: 900 !important;
        }
        .density-tight .print-clean-stat-value {
          font-size: 7.8pt !important;
        }
        .print-clean-stat-label {
          margin-top: 0.35mm !important;
          font-size: 3.7pt !important;
          font-weight: 900 !important;
          color: #64748b !important;
          letter-spacing: 0.14em !important;
          text-transform: uppercase !important;
        }
        .print-clean-table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
          border: 1px solid #cbd5e1 !important;
          margin-top: 1.5mm !important;
        }
        .print-clean-table th {
          background: #f1f5f9 !important;
          color: #475569 !important;
          font-size: 5pt !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          font-weight: 900 !important;
          border: 1px solid #cbd5e1 !important;
          padding: 1mm 0.9mm !important;
          line-height: 1.08 !important;
        }
        .print-clean-table td {
          border: 1px solid #cbd5e1 !important;
          padding: 0.6mm 0.75mm !important;
          vertical-align: top !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
        }
        .print-clean-table tbody tr {
          height: auto !important;
          break-inside: avoid !important;
        }
        .print-clean-table tbody td {
          height: auto !important;
          max-height: 11mm !important;
          overflow: hidden !important;
        }
        .density-medium .print-clean-table td {
          padding: 0.5mm 0.65mm !important;
        }
        .density-tight .print-clean-table td {
          padding: 0.4mm 0.55mm !important;
        }
        .print-week-title {
          display: block !important;
          color: #0f172a !important;
          font-size: 5.7pt !important;
          line-height: 1.05 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }
        .print-week-range {
          display: block !important;
          margin-top: 0.45mm !important;
          color: #059669 !important;
          font-size: 4.25pt !important;
          line-height: 1.05 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          font-weight: 900 !important;
        }
        .density-tight .print-week-title {
          font-size: 5.2pt !important;
        }
        .density-tight .print-week-range {
          font-size: 3.9pt !important;
        }
        .print-no {
          width: 7mm !important;
          text-align: center !important;
          color: #64748b !important;
          font-weight: 900 !important;
        }
        .print-student {
          width: 38mm !important;
        }
        .print-week-col {
          width: 48mm !important;
        }
        .print-monthly-table .print-no {
          width: 5.5% !important;
        }
        .print-monthly-table .print-student {
          width: 16.5% !important;
        }
        .print-monthly-table .print-week-col {
          width: 15.6% !important;
        }
        .print-monthly-table th,
        .print-monthly-table td {
          box-sizing: border-box !important;
        }
        .print-main-col {
          width: 44mm !important;
        }
        .print-small-col {
          width: 26mm !important;
        }
        .print-student-info {
          display: flex !important;
          align-items: flex-start !important;
          gap: 1.3mm !important;
          min-width: 0 !important;
        }
        .print-student-avatar {
          width: 7.5mm !important;
          height: 7.5mm !important;
          border-radius: 999px !important;
          object-fit: cover !important;
          border: 1px solid #cbd5e1 !important;
          flex: 0 0 auto !important;
        }
        .print-student-avatar-fallback {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #ecfdf5 !important;
          color: #047857 !important;
          font-size: 3.8pt !important;
          font-weight: 900 !important;
        }
        .print-student-text {
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .print-student-name {
          font-weight: 900 !important;
          font-size: 5.2pt !important;
          line-height: 1.08 !important;
          max-height: 7mm !important;
          overflow: hidden !important;
        }
        .density-tight .print-student-name {
          font-size: 4.55pt !important;
        }
        .print-student-meta {
          margin-top: 0.25mm !important;
          color: #64748b !important;
          font-size: 3.65pt !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          max-height: 3.6mm !important;
          overflow: hidden !important;
        }
        .print-cell-blue {
          color: #1d4ed8 !important;
          font-weight: 800 !important;
          white-space: pre-wrap !important;
        }
        .print-cell-purple {
          color: #7e22ce !important;
          font-weight: 800 !important;
          white-space: pre-wrap !important;
        }
        .print-cell-muted,
        .print-muted {
          color: #94a3b8 !important;
        }
        .print-week-cell {
          white-space: pre-wrap !important;
          max-height: 11.4mm !important;
          overflow: hidden !important;
        }
        .print-week-date {
          color: #059669 !important;
          font-size: 3.7pt !important;
          font-weight: 900 !important;
          margin-bottom: 0.3mm !important;
        }
        .print-week-cell div {
          line-height: 1.08 !important;
        }
        .print-signatures-clean {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 40mm !important;
          margin-top: 1.2mm !important;
          text-align: center !important;
          font-size: 4.3pt !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-signatures-clean .line {
          width: 34mm !important;
          border-bottom: 1px solid #0f172a !important;
          margin: 5.2mm auto 0.8mm !important;
        }
        .print-only-report {
          display: block !important;
          width: 289mm !important;
          max-height: none !important;
          overflow: visible !important;
          color: #111827 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          background: white !important;
        }
        .lesson-print-page {
          width: 289mm !important;
          height: 202mm !important;
          box-sizing: border-box !important;
          padding: 6mm 6mm 4mm !important;
          background: white !important;
          color: #111827 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          page-break-after: always !important;
          break-after: page !important;
        }
        .lesson-print-page:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .lesson-print-hero {
          height: 28mm !important;
          border: 1px solid #dcfce7 !important;
          border-radius: 8mm !important;
          background: #f0fdf4 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 7mm !important;
          box-sizing: border-box !important;
        }
        .lesson-print-title {
          font-size: 15pt !important;
          line-height: 1 !important;
          font-weight: 900 !important;
          letter-spacing: 0 !important;
          color: #111827 !important;
        }
        .lesson-print-subtitle {
          margin-top: 1.8mm !important;
          color: #00c853 !important;
          font-size: 8.2pt !important;
          font-weight: 900 !important;
          font-style: italic !important;
          line-height: 1 !important;
        }
        .lesson-print-logo {
          width: 17mm !important;
          height: 17mm !important;
          object-fit: contain !important;
          color: #059669 !important;
        }
        .lesson-print-meta {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 0 !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 5mm !important;
          overflow: hidden !important;
          margin: 5mm 0 4.5mm !important;
          background: #fbfdff !important;
        }
        .lesson-print-meta-item {
          display: grid !important;
          grid-template-columns: 1.1mm minmax(0, 1fr) !important;
          gap: 3mm !important;
          align-items: center !important;
          padding: 3mm 4mm !important;
          border-right: 1px solid #e5e7eb !important;
          min-width: 0 !important;
        }
        .lesson-print-meta-item:last-child {
          border-right: 0 !important;
        }
        .lesson-print-meta-accent {
          width: 1.1mm !important;
          height: 8mm !important;
          border-radius: 999px !important;
          background: #00c853 !important;
        }
        .lesson-print-meta-label {
          color: #9ca3af !important;
          font-size: 5pt !important;
          font-weight: 900 !important;
          letter-spacing: 0.16em !important;
          text-transform: uppercase !important;
          line-height: 1 !important;
        }
        .lesson-print-meta-value {
          color: #1f2937 !important;
          font-size: 7.2pt !important;
          font-weight: 900 !important;
          line-height: 1.12 !important;
          margin-top: 1.2mm !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .lesson-print-table-wrap {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .lesson-print-table {
          width: 100% !important;
          height: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        .lesson-print-table th,
        .lesson-print-table td {
          border-bottom: 1px solid #e5e7eb !important;
          border-right: 1px solid #f1f5f9 !important;
          box-sizing: border-box !important;
          vertical-align: top !important;
        }
        .lesson-print-table th:last-child,
        .lesson-print-table td:last-child {
          border-right: 0 !important;
        }
        .lesson-print-table th {
          background: #f8fafc !important;
          color: #6b7280 !important;
          font-size: 4.8pt !important;
          font-weight: 900 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          padding: 1.2mm 0.9mm !important;
          line-height: 1.1 !important;
        }
        .lesson-print-table td {
          padding: 1.05mm 0.9mm !important;
          font-size: 4.45pt !important;
          line-height: 1.08 !important;
        }
        .lesson-print-no {
          width: 8mm !important;
          text-align: center !important;
          color: #64748b !important;
          font-weight: 900 !important;
        }
        .lesson-print-student {
          width: 43mm !important;
        }
        .lesson-print-group-title {
          color: #047857 !important;
          font-size: 5.7pt !important;
          display: block !important;
          letter-spacing: 0.08em !important;
        }
        .lesson-print-group-subtitle {
          color: #94a3b8 !important;
          display: block !important;
          font-size: 4.2pt !important;
          letter-spacing: 0 !important;
          margin-top: 0.6mm !important;
          text-transform: none !important;
        }
        .lesson-print-subhead-murojaah {
          color: #059669 !important;
        }
        .lesson-print-subhead-tahsin {
          color: #2563eb !important;
        }
        .lesson-print-subhead-tahfidz {
          color: #7c3aed !important;
        }
        .lesson-print-student-info {
          display: flex !important;
          align-items: center !important;
          gap: 2.1mm !important;
          min-width: 0 !important;
        }
        .lesson-print-avatar {
          width: 8.5mm !important;
          height: 8.5mm !important;
          border-radius: 999px !important;
          object-fit: cover !important;
          border: 1px solid #e5e7eb !important;
          flex: 0 0 auto !important;
        }
        .lesson-print-avatar-fallback {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: #ecfdf5 !important;
          color: #047857 !important;
          font-size: 4pt !important;
          font-weight: 900 !important;
        }
        .lesson-print-student-name {
          font-size: 5.4pt !important;
          line-height: 1.08 !important;
          font-weight: 900 !important;
          color: #111827 !important;
          max-height: 7.2mm !important;
          overflow: hidden !important;
        }
        .lesson-print-student-meta {
          margin-top: 1.1mm !important;
          color: #94a3b8 !important;
          font-size: 4.1pt !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
        }
        .lesson-print-cell {
          max-height: 11.5mm !important;
          overflow: hidden !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          font-weight: 900 !important;
        }
        .lesson-print-murojaah {
          color: #059669 !important;
        }
        .lesson-print-tahsin {
          color: #2563eb !important;
        }
        .lesson-print-tahfidz {
          color: #7c3aed !important;
        }
        .lesson-print-note {
          margin-top: 0.9mm !important;
          font-size: 3.55pt !important;
          line-height: 1.08 !important;
          font-weight: 800 !important;
        }
        .lesson-print-footer {
          display: grid !important;
          grid-template-columns: 1fr auto 1fr !important;
          align-items: center !important;
          gap: 4mm !important;
          padding-top: 3mm !important;
          color: #9ca3af !important;
          font-size: 5pt !important;
          font-weight: 900 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
        }
        .lesson-print-footer-center {
          text-align: center !important;
        }
        .lesson-print-footer-right {
          text-align: right !important;
        }
        .density-medium .lesson-print-table td,
        .density-tight .lesson-print-table td {
          padding-top: 0.8mm !important;
          padding-bottom: 0.8mm !important;
        }
        .density-tight .lesson-print-cell {
          max-height: 10.2mm !important;
          font-size: 4.05pt !important;
          line-height: 1.05 !important;
        }
        .density-tight .lesson-print-note {
          font-size: 3.25pt !important;
        }
        .final-capaian-print-page .lesson-print-hero {
          background: #eff6ff !important;
          border-color: #dbeafe !important;
          height: 30mm !important;
          padding: 0 10mm !important;
        }
        .final-capaian-print-page .lesson-print-logo,
        .final-capaian-print-page .lesson-print-subtitle {
          color: #2563eb !important;
        }
        .final-capaian-print-page {
          padding: 9mm 10mm 7mm !important;
        }
        .final-capaian-print-page .lesson-print-logo {
          width: 34mm !important;
          height: 20mm !important;
          object-fit: contain !important;
        }
        .final-capaian-print-page .lesson-print-meta {
          margin: 6mm 0 5.5mm !important;
        }
        .final-capaian-print-table {
          height: auto !important;
        }
        .final-capaian-print-table th {
          background: #17223a !important;
          color: #ffffff !important;
          font-size: 5.3pt !important;
          padding: 2.1mm 1.2mm !important;
          text-align: center !important;
          border-right: 1px solid #31415f !important;
          border-bottom: 0 !important;
        }
        .final-capaian-print-table .final-print-head-tahsin,
        .final-capaian-print-table .final-print-head-hal {
          background: #1e3a8a !important;
        }
        .final-capaian-print-table .final-print-head-tahfidz,
        .final-capaian-print-table .final-print-head-ayat {
          background: #4c1d95 !important;
        }
        .final-capaian-print-table td {
          padding: 1.2mm 1.35mm !important;
          font-size: 5.6pt !important;
          line-height: 1.15 !important;
          font-weight: 900 !important;
          vertical-align: middle !important;
          border-right: 1px solid #e2e8f0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .final-capaian-print-table tbody tr:nth-child(even) td {
          background: #f8fafc !important;
        }
        .final-capaian-print-table .lesson-print-no {
          width: 8mm !important;
        }
        .final-capaian-print-table .final-print-name {
          width: 95mm !important;
          color: #0f172a !important;
          text-align: left !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .final-capaian-print-table .final-print-student-info {
          display: flex !important;
          align-items: center !important;
          gap: 2.4mm !important;
          min-width: 0 !important;
        }
        .final-capaian-print-table .final-print-avatar {
          width: 8mm !important;
          height: 8mm !important;
          border-radius: 999px !important;
          object-fit: cover !important;
          border: 1px solid #dbeafe !important;
          background: #eff6ff !important;
          flex: 0 0 auto !important;
        }
        .final-capaian-print-table .final-print-avatar-fallback {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #2563eb !important;
          font-size: 3.7pt !important;
          font-weight: 900 !important;
        }
        .final-capaian-print-table .final-print-student-name {
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .final-capaian-print-table .final-print-class {
          width: 20mm !important;
          text-align: center !important;
          color: #334155 !important;
        }
        .final-capaian-print-table .final-print-tahsin {
          width: 34mm !important;
          text-align: center !important;
          color: #1d4ed8 !important;
        }
        .final-capaian-print-table .final-print-hal {
          width: 26mm !important;
          text-align: center !important;
          color: #1d4ed8 !important;
        }
        .final-capaian-print-table .final-print-tahfidz {
          width: 52mm !important;
          text-align: center !important;
          color: #6d28d9 !important;
        }
        .final-capaian-print-table .final-print-ayat {
          width: 22mm !important;
          text-align: center !important;
          color: #6d28d9 !important;
        }
        .final-capaian-print-table thead .lesson-print-no,
        .final-capaian-print-table thead .final-print-name,
        .final-capaian-print-table thead .final-print-class,
        .final-capaian-print-table thead .final-print-tahsin,
        .final-capaian-print-table thead .final-print-hal,
        .final-capaian-print-table thead .final-print-tahfidz,
        .final-capaian-print-table thead .final-print-ayat {
          color: #ffffff !important;
        }
        .monthly-capaian-print-page,
        .weekly-capaian-print-page {
          padding: 9mm 10mm 7mm !important;
        }
        .monthly-capaian-print-page .lesson-print-hero,
        .weekly-capaian-print-page .lesson-print-hero {
          background: #eff6ff !important;
          border-color: #dbeafe !important;
          height: 30mm !important;
          padding: 0 10mm !important;
        }
        .monthly-capaian-print-page .lesson-print-logo,
        .weekly-capaian-print-page .lesson-print-logo {
          width: 34mm !important;
          height: 20mm !important;
          object-fit: contain !important;
          color: #2563eb !important;
        }
        .monthly-capaian-print-page .lesson-print-subtitle,
        .weekly-capaian-print-page .lesson-print-subtitle {
          color: #2563eb !important;
        }
        .monthly-capaian-print-page .lesson-print-meta,
        .weekly-capaian-print-page .lesson-print-meta {
          margin: 6mm 0 5.5mm !important;
        }
        .monthly-capaian-print-table {
          height: auto !important;
        }
        .monthly-capaian-print-table th {
          background: #17223a !important;
          color: #ffffff !important;
          font-size: 5.1pt !important;
          padding: 2mm 1mm !important;
          text-align: center !important;
          border-right: 1px solid #31415f !important;
          border-bottom: 0 !important;
          line-height: 1.1 !important;
        }
        .monthly-capaian-print-table .monthly-print-head-week {
          background: #1e3a8a !important;
        }
        .monthly-capaian-print-table td {
          padding: 1.25mm 1mm !important;
          font-size: 4.65pt !important;
          line-height: 1.08 !important;
          font-weight: 900 !important;
          vertical-align: top !important;
          border-right: 1px solid #e2e8f0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .monthly-capaian-print-table tbody tr:nth-child(even) td {
          background: #f8fafc !important;
        }
        .monthly-capaian-print-table .monthly-print-no {
          width: 7mm !important;
          text-align: center !important;
          color: #64748b !important;
          vertical-align: middle !important;
        }
        .monthly-capaian-print-table .monthly-print-name {
          width: 56mm !important;
          color: #0f172a !important;
          text-align: left !important;
          vertical-align: middle !important;
        }
        .monthly-capaian-print-table .monthly-print-class {
          width: 14mm !important;
          text-align: center !important;
          color: #334155 !important;
          vertical-align: middle !important;
        }
        .monthly-capaian-print-table .monthly-print-week {
          width: 38mm !important;
          color: #334155 !important;
        }
        .monthly-capaian-print-table thead .monthly-print-no,
        .monthly-capaian-print-table thead .monthly-print-name,
        .monthly-capaian-print-table thead .monthly-print-class,
        .monthly-capaian-print-table thead .monthly-print-week {
          color: #ffffff !important;
        }
        .monthly-print-week-title {
          display: block !important;
          color: #ffffff !important;
          letter-spacing: 0.08em !important;
        }
        .monthly-print-week-subtitle {
          display: block !important;
          margin-top: 0.55mm !important;
          color: rgba(255,255,255,0.78) !important;
          font-size: 4pt !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }
        .monthly-print-student-info {
          display: flex !important;
          align-items: center !important;
          gap: 2.2mm !important;
          min-width: 0 !important;
        }
        .monthly-print-avatar {
          width: 7.8mm !important;
          height: 7.8mm !important;
          border-radius: 999px !important;
          object-fit: cover !important;
          border: 1px solid #dbeafe !important;
          background: #eff6ff !important;
          flex: 0 0 auto !important;
        }
        .monthly-print-avatar-fallback {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #2563eb !important;
          font-size: 3.7pt !important;
          font-weight: 900 !important;
        }
        .monthly-print-student-name {
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .monthly-print-student-meta {
          margin-top: 0.7mm !important;
          color: #94a3b8 !important;
          font-size: 3.8pt !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
        }
        .monthly-print-cell {
          max-height: 22mm !important;
          overflow: hidden !important;
        }
        .monthly-print-date {
          color: #64748b !important;
          font-size: 3.8pt !important;
          font-weight: 900 !important;
          margin-bottom: 0.7mm !important;
          text-transform: uppercase !important;
        }
        .monthly-print-line {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          margin-top: 0.55mm !important;
        }
        .monthly-print-item-date {
          color: #64748b !important;
          font-size: 3.65pt !important;
          font-weight: 900 !important;
          margin: 0 0.45mm !important;
          text-transform: uppercase !important;
        }
        .monthly-print-murojaah {
          color: #059669 !important;
        }
        .monthly-print-tahsin {
          color: #1d4ed8 !important;
        }
        .monthly-print-tahfidz {
          color: #6d28d9 !important;
        }
        .monthly-print-empty {
          color: #cbd5e1 !important;
          text-align: center !important;
          font-weight: 900 !important;
        }
      ` }} />

      <div className="report-print-shell max-w-7xl mx-auto px-3 sm:px-5 md:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        <div className="print:hidden flex flex-col xl:flex-row xl:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-emerald-600 mb-1.5 sm:mb-2">
              <TrendingUp size={16} className="shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] sm:tracking-[0.22em]">Laporan Progres Jurnal</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">Rekap Tahsin, Tahfidz, dan Perjalanan Jilid</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1 max-w-3xl leading-relaxed">{period.note} Data diambil dari Jurnal Harian, bukan Lesson Plan.</p>
          </div>
          <button
            onClick={handlePrint}
            disabled={reportRows.length === 0}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-4 sm:px-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg text-xs sm:text-sm"
          >
            <Printer size={18} /> Cetak / Simpan PDF
          </button>
        </div>

        <div className="print:hidden grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-3 mb-5">
          <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setReportType('weekly')} className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap ${reportType === 'weekly' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Mingguan</button>
            <button onClick={() => setReportType('monthly')} className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap ${reportType === 'monthly' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Bulanan</button>
            <button onClick={() => setReportType('final')} className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap ${reportType === 'final' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Capaian Akhir</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col lg:flex-row gap-2">
            {reportType !== 'final' && (
              <div className="flex items-center justify-between lg:w-[360px] bg-slate-50 rounded-xl px-1.5 sm:px-2 py-1.5 min-w-0">
                <button onClick={() => reportType === 'weekly' ? changeWeek(-7) : changeMonth(-1)} className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors shrink-0"><ChevronLeft size={18} /></button>
                <div className="text-center px-1 sm:px-2 min-w-0">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{period.label}</div>
                  <div className="text-[11px] sm:text-sm font-black text-slate-800 flex items-center justify-center gap-1.5 min-w-0"><Calendar size={13} className="text-emerald-500 shrink-0" /> <span className="truncate">{period.title}</span></div>
                </div>
                <button onClick={() => reportType === 'weekly' ? changeWeek(7) : changeMonth(1)} className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors shrink-0"><ChevronRight size={18} /></button>
              </div>
            )}

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-full min-h-[42px] sm:min-h-[44px] pl-10 pr-10 bg-slate-50 border border-transparent rounded-xl text-xs sm:text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-300 transition-all"
              />
              {studentSearch && <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={16} /></button>}
            </div>
          </div>
        </div>

        <div data-report-pan-container className={`screen-report-area report-print-page ${printDensityClass} bg-white rounded-2xl sm:rounded-[28px] border border-slate-200 shadow-sm overflow-auto custom-scrollbar print:shadow-none print:border-none print:rounded-none print:overflow-visible`}>
          <div className="report-print-inner p-4 sm:p-7 md:p-9 print:p-0">
            <div className="report-print-header flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 pb-4 sm:pb-6 border-b-4 border-slate-900 print:border-b-2">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="report-print-logo w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <BookOpen size={38} className="text-emerald-600 sm:w-[52px] sm:h-[52px]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="report-print-title text-base sm:text-3xl font-black text-slate-950 leading-tight uppercase">Laporan Progres Al-Qur'an</h2>
                  <p className="report-print-subtitle text-[10px] sm:text-sm font-black text-emerald-600 uppercase tracking-widest mt-1 truncate">{period.label} - {period.title}</p>
                </div>
              </div>

              <div className="report-print-meta grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 text-[10px] sm:text-xs print:bg-white print:border-slate-300">
                <span className="font-black text-slate-400 uppercase tracking-widest">Halaqoh</span>
                <span className="font-black text-slate-800 truncate">{activeHalaqoh || '-'}</span>
                <span className="font-black text-slate-400 uppercase tracking-widest">Ustadz/ah</span>
                <span className="font-black text-slate-800 truncate">{teacherDisplayName || '-'}</span>
                <span className="font-black text-slate-400 uppercase tracking-widest">Sumber</span>
                <span className="font-black text-slate-800 truncate">Jurnal Harian</span>
              </div>
            </div>

            <div className="report-print-stats-wrap my-4 sm:my-6 overflow-x-auto custom-scrollbar print:my-4 print:overflow-visible">
              <div className="report-print-stats grid grid-cols-5 gap-2.5 sm:gap-3 min-w-[680px]">
                {[
                  { label: 'Siswa Tampil', value: reportRows.length, icon: Users, className: 'bg-slate-50 text-slate-700 border-slate-200' },
                  { label: 'Ada Jurnal', value: stats.filled, icon: FileText, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  { label: 'Ada Tahsin', value: stats.tahsin, icon: BookOpen, className: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Ada Tahfidz', value: stats.tahfidz, icon: Mic, className: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { label: 'Progres Jilid', value: stats.jilid, icon: Layers, className: 'bg-orange-50 text-orange-700 border-orange-100' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`report-print-stat rounded-2xl border p-3 sm:p-4 ${item.className}`}>
                      <Icon size={18} className="mb-1.5 sm:mb-2" />
                      <div className="report-print-stat-value text-2xl sm:text-3xl font-black leading-none">{item.value}</div>
                      <div className="report-print-stat-label text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1 opacity-75 leading-tight">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAFIK PERSENTASE (BAR CHART) */}
            {reportRows.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-[24px] border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto custom-scrollbar">
                <h3 className="text-[11px] sm:text-sm font-black text-slate-800 mb-4 sm:mb-5 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500 shrink-0" />
                  Grafik Persentase Capaian
                </h3>
                <div className="grid grid-cols-3 gap-4 sm:gap-6 min-w-[720px]">
                  {/* Bar Tahsin */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-blue-700 flex items-center gap-1.5"><BookOpen size={14} /> Tahsin</span>
                      <span className="text-slate-500">{Math.round((stats.tahsin / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.tahsin}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.tahsin / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                  {/* Bar Tahfidz */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-purple-700 flex items-center gap-1.5"><Mic size={14} /> Tahfidz</span>
                      <span className="text-slate-500">{Math.round((stats.tahfidz / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.tahfidz}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.tahfidz / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                  {/* Bar Murojaah */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-emerald-700 flex items-center gap-1.5"><Repeat size={14} /> Murojaah</span>
                      <span className="text-slate-500">{Math.round((stats.murojaah / reportRows.length) * 100)}% <span className="font-medium text-[10px]">({stats.murojaah}/{reportRows.length})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round((stats.murojaah / reportRows.length) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DISTRIBUSI LEVEL TAHSIN */}
            {tahsinDistribution.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-[24px] border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto custom-scrollbar">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-5">
                  <h3 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={16} className="text-blue-500 shrink-0" />
                    Distribusi Level Tahsin
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest self-start sm:self-auto max-w-full truncate">{activeHalaqoh || 'Semua Halaqoh'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4 min-w-[720px]">
                  {tahsinDistribution.map(([level, count]) => {
                    const percentage = Math.round((count / reportRows.length) * 100);
                    return (
                      <div key={level} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 sm:p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[11px] sm:text-sm font-black text-blue-800 mb-1">{level}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-black text-blue-600 leading-none">{count}</span>
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Siswa</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-500/70 mt-1 leading-tight">{percentage}% dari total aktif</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reportRows.length === 0 ? (
              <div className="text-center py-14 sm:py-20 bg-slate-50 rounded-2xl sm:rounded-3xl text-slate-400 font-bold border-2 border-dashed border-slate-200 text-xs sm:text-sm">
                <FileText size={30} className="mx-auto mb-3 text-slate-300" />
                Tidak ada siswa yang sesuai filter.
              </div>
            ) : reportType === 'final' ? (
              <div data-report-native-scroll className="report-print-table-wrap rounded-2xl border border-slate-200 overflow-auto custom-scrollbar bg-white shadow-sm mb-6 print:border-none print:shadow-none print:overflow-visible">
                <table className="w-full border-collapse text-left min-w-[700px] print:min-w-0 print:text-[8pt] print:leading-tight">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase text-[10px] font-black tracking-widest print:bg-slate-100 print:text-slate-800 print:text-[7pt]">
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 w-12 text-center rounded-tl-xl print:rounded-none !text-white">NO</th>
                      <th className="px-5 py-3.5 border border-slate-700 print:border-slate-300 !text-white">NAMA</th>
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 text-center w-24 !text-white">KELAS</th>
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 text-center w-32 bg-blue-900/50 print:bg-slate-100 !text-white">TAHSIN</th>
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 text-center w-20 bg-blue-900/50 print:bg-slate-100 !text-white">HAL</th>
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 text-center w-36 bg-purple-900/50 print:bg-slate-100 !text-white">TAHFIDZ</th>
                      <th className="px-4 py-3.5 border border-slate-700 print:border-slate-300 text-center w-20 bg-purple-900/50 print:bg-slate-100 rounded-tr-xl print:rounded-none !text-white">AYAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs font-bold print:divide-none">
                    {reportRows.map((row, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <tr key={row.student?.id || index} className={`${isEven ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition-colors print:bg-white print:break-inside-avoid`}>
                          <td className="px-4 py-3 border border-slate-200 text-center text-slate-500">{index + 1}</td>
                          <td className="px-5 py-3 border border-slate-200 text-slate-900">{row.student?.name || '-'}</td>
                          <td className="px-4 py-3 border border-slate-200 text-center text-slate-600">{row.student?.kelas || '-'}</td>
                          <td className="px-4 py-3 border border-slate-200 text-center text-blue-700">{row.latestCapaian?.tahsin || '-'}</td>
                          <td className="px-4 py-3 border border-slate-200 text-center text-blue-700">{row.latestCapaian?.halTahsin || '-'}</td>
                          <td className="px-4 py-3 border border-slate-200 text-center text-purple-700">{row.latestCapaian?.tahfidz || '-'}</td>
                          <td className="px-4 py-3 border border-slate-200 text-center text-purple-700">{row.latestCapaian?.ayatTahfidz || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <div data-report-native-scroll className="report-print-table-wrap hidden lg:block rounded-2xl border border-slate-200 max-h-[70dvh] overflow-auto custom-scrollbar print:hidden">
                  <table className="report-print-table w-full border-collapse text-left bg-white" style={{ minWidth: `${reportTableMinWidth}px` }}>
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                        <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 w-12 text-center align-middle">No</th>
                        <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 min-w-[210px] align-middle">Nama Siswa</th>
                        {reportColumns.map((column) => (
                          <th key={`${column.kind}-${column.index}`} colSpan={3} className="px-4 py-3 border-r border-slate-200 text-center">
                            <div className="text-emerald-700">{column.title}</div>
                            <div className="text-[9px] font-bold text-slate-400 tracking-normal normal-case mt-1">{column.subtitle}</div>
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest">
                        {reportColumns.map((column) => (
                          <React.Fragment key={`${column.kind}-${column.index}-metrics`}>
                            <th className="px-3 py-2 border-r border-slate-200 text-emerald-600">Murojaah</th>
                            <th className="px-3 py-2 border-r border-slate-200 text-blue-600">Tahsin</th>
                            <th className="px-3 py-2 border-r border-slate-200 text-purple-600">Tahfidz</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportRows.map((row, index) => (
                        <tr key={row.student?.id || index} className="report-card hover:bg-slate-50 align-top">
                          <td className="px-3 py-4 border-r border-slate-200 text-center font-black text-slate-400">{index + 1}</td>
                          <td className="px-4 py-4 border-r border-slate-200">
                            <div className="report-print-student-cell flex items-center gap-3">
                              {row.student?.photo ? (
                                <img src={row.student.photo} alt={row.student?.name || ''} className="report-print-avatar w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="report-print-avatar w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center text-xs font-black shrink-0">
                                  {getInitials(row.student?.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="report-print-student-name font-black text-slate-900 leading-tight">{row.student?.name || 'Siswa'}</div>
                                <div className="report-print-student-meta text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.student?.kelas || '-'} - {row.teacherName}</div>
                              </div>
                            </div>
                          </td>
                          {row.periodCells.map((cell) => (
                            <React.Fragment key={`${row.student?.id || index}-${cell.kind}-${cell.index}`}>
                              <td className="px-3 py-3 border-r border-slate-200 text-[11px] align-top">{renderMetricCell(cell, 'murojaah')}</td>
                              <td className="px-3 py-3 border-r border-slate-200 text-[11px] align-top">{renderMetricCell(cell, 'tahsin')}</td>
                              <td className="px-3 py-3 border-r border-slate-200 text-[11px] align-top">{renderMetricCell(cell, 'tahfidz')}</td>
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden print:hidden flex flex-col gap-2.5 sm:gap-3">
                  {reportRows.map((row, index) => (
                    <div key={row.student?.id || index} className="report-card bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm">
                      <div className="flex items-start gap-2.5 sm:gap-3 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-slate-900 leading-tight text-sm sm:text-base truncate" title={row.student?.name || 'Siswa'}>{row.student?.name || 'Siswa'}</div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{row.student?.kelas || '-'} - {row.teacherName}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        {renderPeriodCards(row.periodCells)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-2.5 sm:p-3">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2"><Award size={12} /> Posisi Tahsin</div>
                          <div className="text-[11px] sm:text-xs font-black text-orange-900">{row.tahsinLevel}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 min-w-0">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2"><Layers size={12} /> Perjalanan Jilid</div>
                          {renderJourney(row.journey)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="report-print-signatures hidden print:grid grid-cols-2 mt-14 gap-20">
              <div className="text-center">
                <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Mengetahui,<br />Koordinator Al-Qur'an</p>
                <div className="w-56 mx-auto border-b border-slate-800 mb-1"></div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">NIP. ...........................</p>
              </div>
              <div className="text-center">
                <p className="mb-20 text-xs font-bold text-slate-600 uppercase tracking-widest">Bogor, ........................ 20....<br />Pengajar Halaqoh</p>
                <p className="font-black text-slate-900 border-b border-slate-800 w-56 mx-auto pb-1 uppercase">{teacherDisplayName || '...........................'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ustadz / Ustadzah</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`print-only-report hidden ${printDensityClass.replace('print-density-', 'density-')}`}>
          {reportType === 'final' ? (
            finalPrintPages.map((page, pageIndex) => (
              <section key={`final-${page.pageIndex}`} className="lesson-print-page final-capaian-print-page">
                <div className="lesson-print-hero">
                  <div>
                    <div className="lesson-print-title">Hasil Capaian Akhir Al-Qur'an</div>
                    <div className="lesson-print-subtitle">SDIT Al-Fityan School Bogor</div>
                  </div>
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="lesson-print-logo" />
                  ) : (
                    <BookOpen size={52} className="lesson-print-logo" />
                  )}
                </div>

                <div className="lesson-print-meta">
                  {[
                    { label: 'Rekap', value: 'Capaian Akhir' },
                    { label: 'Halaqoh', value: activeHalaqoh || '-' },
                    { label: 'Tanggal Cetak', value: formatShortDate(new Date()) },
                    { label: 'Ustadz/ah', value: teacherDisplayName || '-' }
                  ].map((item) => (
                    <div key={item.label} className="lesson-print-meta-item">
                      <div className="lesson-print-meta-accent" />
                      <div className="min-w-0">
                        <div className="lesson-print-meta-label">{item.label}</div>
                        <div className="lesson-print-meta-value">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lesson-print-table-wrap">
                  <table className="lesson-print-table final-capaian-print-table">
                    <thead>
                      <tr>
                        <th className="lesson-print-no">NO</th>
                        <th className="final-print-name">NAMA</th>
                        <th className="final-print-class">KELAS</th>
                        <th className="final-print-tahsin final-print-head-tahsin">TAHSIN</th>
                        <th className="final-print-hal final-print-head-hal">HAL</th>
                        <th className="final-print-tahfidz final-print-head-tahfidz">TAHFIDZ</th>
                        <th className="final-print-ayat final-print-head-ayat">AYAT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.studentRows.map((row, rowIndex) => {
                        const studentNumber = (page.pageIndex * FINAL_PRINT_ROWS_PER_PAGE) + rowIndex + 1;
                        return (
                          <tr key={row.student?.id || rowIndex}>
                            <td className="lesson-print-no">{studentNumber}</td>
                            <td className="final-print-name">
                              <div className="final-print-student-info">
                                {row.student?.photo ? (
                                  <img src={row.student.photo} alt={row.student?.name || ''} className="final-print-avatar" />
                                ) : (
                                  <div className="final-print-avatar final-print-avatar-fallback">{getInitials(row.student?.name)}</div>
                                )}
                                <div className="final-print-student-name">{row.student?.name || '-'}</div>
                              </div>
                            </td>
                            <td className="final-print-class">{row.student?.kelas || '-'}</td>
                            <td className="final-print-tahsin">{row.latestCapaian?.tahsin || '-'}</td>
                            <td className="final-print-hal">{row.latestCapaian?.halTahsin || '-'}</td>
                            <td className="final-print-tahfidz">{row.latestCapaian?.tahfidz || '-'}</td>
                            <td className="final-print-ayat">{row.latestCapaian?.ayatTahfidz || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="lesson-print-footer">
                  <div>Membangun generasi qurani dan pemimpin masa depan</div>
                  <div className="lesson-print-footer-center">Page {pageIndex + 1} of {totalPrintPages}</div>
                  <div className="lesson-print-footer-right">Doc ID: {reportDocId}</div>
                </div>
              </section>
            ))
          ) : reportType === 'monthly' ? (
            monthlyPrintPages.map((page, pageIndex) => (
              <section key={`monthly-${page.pageIndex}`} className="lesson-print-page monthly-capaian-print-page">
                <div className="lesson-print-hero">
                  <div>
                    <div className="lesson-print-title">Rekap Bulanan Al-Qur'an</div>
                    <div className="lesson-print-subtitle">SDIT Al-Fityan School Bogor</div>
                  </div>
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="lesson-print-logo" />
                  ) : (
                    <BookOpen size={52} className="lesson-print-logo" />
                  )}
                </div>

                <div className="lesson-print-meta">
                  {[
                    { label: 'Bulan', value: periodMonthLabel },
                    { label: 'Halaqoh', value: activeHalaqoh || '-' },
                    { label: 'Periode', value: period.title },
                    { label: 'Ustadz/ah', value: teacherDisplayName || '-' }
                  ].map((item) => (
                    <div key={item.label} className="lesson-print-meta-item">
                      <div className="lesson-print-meta-accent" />
                      <div className="min-w-0">
                        <div className="lesson-print-meta-label">{item.label}</div>
                        <div className="lesson-print-meta-value">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lesson-print-table-wrap">
                  <table className="lesson-print-table monthly-capaian-print-table">
                    <thead>
                      <tr>
                        <th className="monthly-print-no">NO</th>
                        <th className="monthly-print-name">NAMA</th>
                        <th className="monthly-print-class">KELAS</th>
                        {reportColumns.map((column) => (
                          <th key={`${column.kind}-${column.index}-monthly-head`} className="monthly-print-week monthly-print-head-week">
                            <span className="monthly-print-week-title">{column.title}</span>
                            <span className="monthly-print-week-subtitle">{column.subtitle}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {page.studentRows.map((row, rowIndex) => {
                        const studentNumber = (page.pageIndex * MONTHLY_PRINT_ROWS_PER_PAGE) + rowIndex + 1;
                        return (
                          <tr key={row.student?.id || rowIndex}>
                            <td className="monthly-print-no">{studentNumber}</td>
                            <td className="monthly-print-name">
                              <div className="monthly-print-student-info">
                                {row.student?.photo ? (
                                  <img src={row.student.photo} alt={row.student?.name || ''} className="monthly-print-avatar" />
                                ) : (
                                  <div className="monthly-print-avatar monthly-print-avatar-fallback">{getInitials(row.student?.name)}</div>
                                )}
                                <div className="min-w-0">
                                  <div className="monthly-print-student-name">{row.student?.name || '-'}</div>
                                  <div className="monthly-print-student-meta">{row.teacherName || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="monthly-print-class">{row.student?.kelas || '-'}</td>
                            {reportColumns.map((column) => {
                              const cell = row.periodCells.find((entry) => entry.kind === column.kind && entry.index === column.index) || null;
                              return (
                                <td key={`${row.student?.id || rowIndex}-${column.kind}-${column.index}-monthly`} className="monthly-print-week">
                                  {renderMonthlyPrintCell(cell)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="lesson-print-footer">
                  <div>Membangun generasi qurani dan pemimpin masa depan</div>
                  <div className="lesson-print-footer-center">Page {pageIndex + 1} of {totalPrintPages}</div>
                  <div className="lesson-print-footer-right">Doc ID: {reportDocId}</div>
                </div>
              </section>
            ))
          ) : (
            weeklyPrintPages.map((page, pageIndex) => (
              <section key={`weekly-${page.pageIndex}`} className="lesson-print-page weekly-capaian-print-page">
                <div className="lesson-print-hero">
                  <div>
                    <div className="lesson-print-title">Rekap Mingguan Al-Qur'an</div>
                    <div className="lesson-print-subtitle">SDIT Al-Fityan School Bogor</div>
                  </div>
                  {institutionLogo && institutionLogo !== 'logo.png' ? (
                    <img src={institutionLogo} alt="Logo" className="lesson-print-logo" />
                  ) : (
                    <BookOpen size={52} className="lesson-print-logo" />
                  )}
                </div>

                <div className="lesson-print-meta">
                  {[
                    { label: 'Bulan', value: periodMonthLabel },
                    { label: 'Halaqoh', value: activeHalaqoh || '-' },
                    { label: 'Periode', value: period.title },
                    { label: 'Ustadz/ah', value: teacherDisplayName || '-' }
                  ].map((item) => (
                    <div key={item.label} className="lesson-print-meta-item">
                      <div className="lesson-print-meta-accent" />
                      <div className="min-w-0">
                        <div className="lesson-print-meta-label">{item.label}</div>
                        <div className="lesson-print-meta-value">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lesson-print-table-wrap">
                  <table className="lesson-print-table monthly-capaian-print-table">
                    <thead>
                      <tr>
                        <th className="monthly-print-no">NO</th>
                        <th className="monthly-print-name">NAMA</th>
                        <th className="monthly-print-class">KELAS</th>
                        {reportColumns.map((column) => (
                          <th key={`${column.kind}-${column.index}-weekly-head`} className="monthly-print-week monthly-print-head-week">
                            <span className="monthly-print-week-title">{column.title}</span>
                            <span className="monthly-print-week-subtitle">{column.subtitle}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {page.studentRows.map((row, rowIndex) => {
                        const studentNumber = (page.pageIndex * MONTHLY_PRINT_ROWS_PER_PAGE) + rowIndex + 1;
                        return (
                          <tr key={row.student?.id || rowIndex}>
                            <td className="monthly-print-no">{studentNumber}</td>
                            <td className="monthly-print-name">
                              <div className="monthly-print-student-info">
                                {row.student?.photo ? (
                                  <img src={row.student.photo} alt={row.student?.name || ''} className="monthly-print-avatar" />
                                ) : (
                                  <div className="monthly-print-avatar monthly-print-avatar-fallback">{getInitials(row.student?.name)}</div>
                                )}
                                <div className="min-w-0">
                                  <div className="monthly-print-student-name">{row.student?.name || '-'}</div>
                                  <div className="monthly-print-student-meta">{row.teacherName || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="monthly-print-class">{row.student?.kelas || '-'}</td>
                            {reportColumns.map((column) => {
                              const cell = row.periodCells.find((entry) => entry.kind === column.kind && entry.index === column.index) || null;
                              return (
                                <td key={`${row.student?.id || rowIndex}-${column.kind}-${column.index}-weekly`} className="monthly-print-week">
                                  {renderMonthlyPrintCell(cell)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="lesson-print-footer">
                  <div>Membangun generasi qurani dan pemimpin masa depan</div>
                  <div className="lesson-print-footer-center">Page {pageIndex + 1} of {totalPrintPages}</div>
                  <div className="lesson-print-footer-right">Doc ID: {reportDocId}</div>
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-3 sm:p-3.5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden"
          title="Scroll ke Atas"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default ReportView;
