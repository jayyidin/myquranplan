const ABSENCE_KEYWORDS = ['alpa', 'sakit', 'izin', 'tidak hadir'];
const INACTIVE_KEYWORDS = [...ABSENCE_KEYWORDS, 'libur'];

export const hasProgressValue = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== '' && text !== '-';
};

export const isAttendanceNote = (value) => {
  const text = String(value || '').toLowerCase();
  return ABSENCE_KEYWORDS.some(keyword => text.includes(keyword));
};

export const isInactiveNote = (value) => {
  const text = String(value || '').toLowerCase();
  return INACTIVE_KEYWORDS.some(keyword => text.includes(keyword));
};

const getSurahNo = (text) => {
  const match = String(text || '').match(/(?:^|[,\s])(\d{1,3})\.\s*/);
  return match ? Number(match[1]) : null;
};

const getJilidNo = (text) => {
  const match = String(text || '').match(/Jilid\s*([1-6])/i);
  return match ? Number(match[1]) : null;
};

const getMaxNumber = (text) => {
  const matches = String(text || '').match(/\d+/g);
  if (!matches) return null;
  return Math.max(...matches.map(Number));
};

const getRangeEnd = (text) => {
  const safeText = String(text || '');
  const rangeMatches = [...safeText.matchAll(/(\d+)\s*-\s*(\d+)/g)];
  if (rangeMatches.length > 0) {
    return Math.max(...rangeMatches.map(match => Number(match[2])));
  }
  return getMaxNumber(safeText);
};

export const isLessonProgressAchieved = ({
  targetText,
  targetDetail,
  targetNilai,
  targetSuratNilai,
  actualText,
  actualDetail,
  actualNilai,
  actualSuratNilai
}) => {
  const hasTarget = [targetText, targetDetail, targetNilai, targetSuratNilai].some(hasProgressValue);
  const hasActual = [actualText, actualDetail, actualNilai, actualSuratNilai].some(hasProgressValue);
  if (!hasTarget || !hasActual) return false;

  const targetCombined = `${targetText || ''} ${targetDetail || ''}`;
  const actualCombined = `${actualText || ''} ${actualDetail || ''}`;

  const targetSurahNo = getSurahNo(targetText) || getSurahNo(targetCombined);
  if (targetSurahNo) {
    const actualSurahNo = getSurahNo(actualText) || getSurahNo(actualCombined);
    if (actualSurahNo !== targetSurahNo) return false;

    const targetEnd = getRangeEnd(targetDetail);
    if (!targetEnd) return true;

    const actualEnd = getRangeEnd(actualDetail);
    return Boolean(actualEnd && actualEnd >= targetEnd);
  }

  const targetJilidNo = getJilidNo(targetCombined);
  if (targetJilidNo) {
    const actualJilidNo = getJilidNo(actualCombined);
    if (actualJilidNo !== targetJilidNo) return false;

    const targetPage = getMaxNumber(targetDetail);
    if (!targetPage) return true;

    const actualPage = getMaxNumber(actualDetail);
    return Boolean(actualPage && actualPage >= targetPage);
  }

  return hasProgressValue(actualText) || hasProgressValue(actualDetail) || hasProgressValue(actualNilai) || hasProgressValue(actualSuratNilai);
};
