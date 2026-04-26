import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        placeholder={placeholder}
        disabled={disabled || !surahName}
        className={className}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ChevronDown size={18} />
      </div>

      {isDropdownOpen && filteredAyats.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {filteredAyats.map(ayat => (
              <div key={ayat} onClick={() => handleSelect(ayat)} className="px-4 py-2.5 text-sm font-bold text-gray-800 rounded-lg hover:bg-gray-100 cursor-pointer">
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