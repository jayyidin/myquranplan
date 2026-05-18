// File: src/utils/helpers.js

// Fungsi untuk mendapatkan hari Senin pada minggu berjalan
export const getMonday = (d) => { 
  const date = new Date(d); 
  const day = date.getDay(); 
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff)); 
};

// Fungsi untuk format format tanggal menjadi YYYY-MM-DD
export const formatDateObj = (dateInput) => { 
  if (!dateInput) return ''; 
  const d = new Date(dateInput); 
  if (isNaN(d.getTime())) return ''; 
  const year = d.getFullYear(); 
  const month = String(d.getMonth() + 1).padStart(2, '0'); 
  const day = String(d.getDate()).padStart(2, '0'); 
  return `${year}-${month}-${day}`; 
};

// Fungsi untuk mendapatkan nama Bulan dan Tahun (misal: Januari 2026)
export const getMonthYear = (dateObj) => { 
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']; 
  return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`; 
};

// Fungsi untuk mendapatkan nama hari
export const getDayName = (dateObj) => {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dateObj.getDay()];
};

// Fungsi format tanggal singkat (misal: 20 Jan 2026)
export const formatShortDate = (dateObj) => { 
  if (!dateObj) return '-';
  // Konversi ke Date object jika input adalah string
  const d = (dateObj instanceof Date) ? dateObj : new Date(dateObj);
  // Cek jika date tidak valid
  if (isNaN(d.getTime())) return '-';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']; 
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`; 
};

// Mewarnai teks catatan berdasarkan status
export const getStatusColor = (catatan) => {
  if (!catatan || catatan === '-') return 'text-gray-400';
  const lower = catatan.toLowerCase();
  if (lower.includes('lancar') || lower.includes('sangat baik') || lower.includes('bagus') || lower.includes('a')) return 'text-[#00e676] font-bold';
  if (lower.includes('perlu') || lower.includes('kurang') || lower.includes('ulang') || lower.includes('c')) return 'text-[#f97316] font-bold';
  return 'text-[#3b82f6] font-bold';
};

// Fungsi pembantu untuk inisial nama
export const getInitials = (name) => {
  try {
    if (!name || typeof name !== 'string') return 'UN';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'UN';
    return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
  } catch { return 'UN'; }
};

// Salin teks dengan fallback untuk browser yang tidak mendukung Clipboard API.
export const copyTextToClipboard = async (text) => {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API gagal, mencoba fallback:', err);
  }

  if (typeof document === 'undefined') return false;

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.width = '1px';
  textArea.style.height = '1px';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  try {
    return document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy gagal:', err);
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

// Format periode tanggal
export const formatPeriode = (start, end) => {
  try {
    if (!start || !end) return '-';
    const dStart = new Date(start); const dEnd = new Date(end);
    if (isNaN(dStart) || isNaN(dEnd)) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${dStart.getDate()} ${months[dStart.getMonth()]} ${dStart.getFullYear()} - ${dEnd.getDate()} ${months[dEnd.getMonth()]} ${dEnd.getFullYear()}`;
  } catch { return '-'; }
};

// Format data untuk tampilan cetak/kartu
export const formatPrintData = (text, detail, gradeCat, gradeSurat) => {
  try {
    const hasText = text && text !== '-' && typeof text === 'string';
    const nList = String(gradeSurat || '').split(',').map(s => s.trim()).filter(s => s && s !== '-');
    const dList = String(detail || '').split(',').map(s => s.trim()).filter(s => s && s !== '-');

    if (!hasText) {
      let res = '';
      if (dList.length > 0) res += dList.join(', ') + '\n';
      if (gradeCat && gradeCat !== '-') res += `(Nilai: ${gradeCat})\n`;
      if (nList.length > 0) res += nList.map(n => `(${n})`).join(' ');
      return res.trim() || '-';
    }

    const tList = text.split(',').map(s => s.trim());
    const detailList = String(detail || '').split(',').map(s => s.trim());
    const gradeSuratList = String(gradeSurat || '').split(',').map(s => s.trim());

    if (text.includes('Jilid')) {
        let res = `${text}`;
        if (detail && detail !== '-') res += `\n${String(detail)}`;
        if (gradeCat && gradeCat !== '-') res += `\n(Nilai: ${String(gradeCat)})`;
        return res;
    }

    if (text.includes('Tajwid') || text.includes('Ghorib') || text.includes('Gharib')) {
        const cat = tList[0] || '';
        let res = `${cat}`;
        if (gradeCat && gradeCat !== '-') res += ` (Nilai: ${String(gradeCat)})`;
        let halMat = detail && detail !== '-' ? String(detail) : '';
        let ayatListStr = '';
        if (halMat.includes(' / ')) {
           const splitDetails = halMat.split(' / ');
           halMat = splitDetails[0].trim();
           ayatListStr = splitDetails.slice(1).join(' / ').trim();
           } else if (/^[0-9\-, ]+$/.test(halMat) || halMat.includes('Semua Ayat')) {
           ayatListStr = halMat; halMat = '';
        }
        if (halMat) res += `\n${halMat}`;
        const sList = tList.slice(1);
        const aList = ayatListStr ? ayatListStr.split(',').map(s=>s.trim()) : [];
        if (sList.length > 0) {
           res += '\n' + sList.map((s, i) => {
              const a = aList[i];
              let line = (a && a !== '-' && a !== 'Semua Ayat') ? `${s} ${a}` : s;
              const n = gradeSuratList[i];
              if (n && n !== '-') line += ` (${n})`;
              return line;
           }).join('\n');
        }
        return res.trim();
    }

    return tList.map((t, i) => {
      const d = detailList[i];
      const n = gradeSuratList[i];
      let line = (d && d !== '-' && d !== 'Semua Ayat') ? `${t} ${d}` : t;
      if (n && n !== '-') line += ` (${n})`;
      return line;
    }).join('\n');
  } catch { return '-'; }
};
