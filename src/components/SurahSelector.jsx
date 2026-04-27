import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, X, AlertCircle } from 'lucide-react';

const SurahSelector = ({ value, onChange, surahList, placeholder = "Pilih Surat...", className, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Ketika nilai dari luar berubah (misal saat membuka modal edit), perbarui teks input
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const filteredSurahs = useMemo(() => {
    if (!isDropdownOpen) return [];

    // Cek apakah pengguna baru saja mengklik input yang sudah ada nilainya.
    // Jika ya (searchTerm sama dengan value awal), kita harus tampilkan semua surat.
    const isInitialStateOrEmpty = searchTerm === value || !searchTerm.trim();

    if (isInitialStateOrEmpty) {
      return surahList;
    }

    // Sanitize the search term by making it lowercase and removing all non-alphanumeric characters.
    // This makes matching more lenient (e.g., "al fatihah" will match "Al-Fatihah").
    const term = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return surahList.filter(s => {
      // Create a searchable string for each surah that includes its number and name,
      // also sanitized in the same way as the search term.
      const searchableString = `${s.no}${s.name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      return searchableString.includes(term);
    });
  }, [searchTerm, surahList, isDropdownOpen, value]);

  // Validasi: Cek apakah input tidak valid (surat tidak ditemukan di daftar)
  const isInvalid = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return false;
    if (term === value) return false; // Valid jika nilainya persis sama dengan yang sudah dipilih

    const sanitizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !surahList.some(s => {
      const searchableString = `${s.no}${s.name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      return searchableString.includes(sanitizedTerm);
    });
  }, [searchTerm, value, surahList]);

  const handleSelect = (surah) => {
    const newValue = `${surah.no}. ${surah.name}`;
    onChange(newValue); // Kirim nilai baru ke parent
    setIsDropdownOpen(false); // Tutup dropdown
  };

  // Efek untuk menutup dropdown saat klik di luar komponen
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        // Kembalikan teks input ke nilai asli jika tidak ada yang dipilih
        setSearchTerm(value || '');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, value]);

  return (
    <div className={`relative w-full ${isDropdownOpen ? 'z-50' : ''}`} ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} ${isInvalid ? '!border-red-500 !text-red-600 focus:!ring-red-200 focus:!border-red-500' : ''}`}
      />
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm('');
              onChange(''); // Hapus nilai di parent
              setIsDropdownOpen(true); // Buka kembali dropdown agar bisa melihat semua opsi
            }}
            className="p-1 mr-0.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Hapus"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
        <div className="pointer-events-none text-gray-400 pr-1">
          <ChevronDown size={18} />
        </div>
      </div>

      {isInvalid && (
        <div className="absolute z-10 top-full left-0 mt-1 px-1.5 py-0.5 bg-white rounded shadow-sm border border-red-100 text-xs font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 pointer-events-none flex items-center gap-1">
          <AlertCircle size={12} className="animate-bounce" />
          <span>Surat tidak ditemukan</span>
        </div>
      )}

      {isDropdownOpen && filteredSurahs.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
          <div className="p-2">
            {filteredSurahs.map(surah => (
              <div
                key={surah.no}
                onClick={() => handleSelect(surah)}
                className="px-4 py-2.5 text-sm font-bold text-gray-800 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer flex justify-between items-center group"
              >
                <span>{surah.no}. {surah.name}</span>
                <span className="text-xs text-gray-400 font-medium group-hover:text-blue-400 transition-colors">{surah.ayat} ayat</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurahSelector;