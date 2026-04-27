import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, X, AlertCircle } from 'lucide-react';

const AyatSelector = ({ surahName, surahList, value, onChange, placeholder = "Ayat...", className, disabled, minAyat, maxAyat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const ayatOptions = useMemo(() => {
    if (!surahName) return [];
    const surahData = surahList.find(s => `${s.no}. ${s.name}` === surahName);
    if (!surahData) return [];
    let options = Array.from({ length: surahData.ayat }, (_, i) => String(i + 1));

    if (minAyat) {
      options = options.filter(ayat => Number(ayat) >= Number(minAyat));
    }
    if (maxAyat) {
      options = options.filter(ayat => Number(ayat) <= Number(maxAyat));
    }

    return options;
  }, [surahName, surahList, minAyat, maxAyat]);

  const filteredAyats = useMemo(() => {
    if (!isDropdownOpen) return [];
    if (!searchTerm.trim()) return ayatOptions;

    return ayatOptions.filter(ayat => ayat.startsWith(searchTerm));
  }, [searchTerm, ayatOptions, isDropdownOpen]);

  // Validasi: Cek apakah input tidak valid (misal: ada huruf atau ayat di luar jangkauan)
  const isInvalid = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return false;
    if (!/^\d+$/.test(term)) return true; // True jika format bukan angka (ada huruf/simbol)
    
    return !ayatOptions.some(ayat => ayat.startsWith(term)); // True jika ayat tidak ditemukan di daftar
  }, [searchTerm, ayatOptions]);

  const handleSelect = (ayat) => {
    onChange(ayat);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm(value || '');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, value]);

  return (
    <div className={`relative w-full ${isDropdownOpen ? 'z-40' : ''}`} ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        disabled={disabled || !surahName}
        className={`${className} ${isInvalid ? '!border-red-500 !text-red-600 focus:!ring-red-200 focus:!border-red-500' : ''}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
        {searchTerm && !(disabled || !surahName) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm('');
              onChange('');
              setIsDropdownOpen(true);
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
          <span>Ayat tidak ditemukan</span>
        </div>
      )}

      {isDropdownOpen && filteredAyats.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
          <div className="p-2">
            {filteredAyats.map(ayat => (
              <div key={ayat} onClick={() => handleSelect(ayat)} className="px-4 py-2.5 text-sm font-bold text-gray-800 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer">
                Ayat {ayat}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AyatSelector;