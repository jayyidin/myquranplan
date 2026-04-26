import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ChevronDown size={18} />
      </div>

      {isDropdownOpen && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {filteredSurahs.length > 0 ? (
              filteredSurahs.map(surah => (
                <div
                  key={surah.no}
                  onClick={() => handleSelect(surah)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-800 rounded-lg hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                >
                  <span>{surah.no}. {surah.name}</span>
                  <span className="text-xs text-gray-400 font-medium">{surah.ayat} ayat</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-center text-sm text-gray-500">
                Surat tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurahSelector;