// File: src/components/views/StudentView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Users, Settings, Plus, Edit3, Trash2, Camera, GripVertical, Search, X, ChevronUp, ChevronDown, ArrowUp } from 'lucide-react';

const StudentView = ({ activeHalaqoh, filteredStudents, openAddStudentModal, openEditStudentModal, requestDeleteStudent, isSuperAdmin, openCropModal, uploadingPhotoId, uploadProgress, onReorderStudents, searchQuery, setSearchQuery }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(window.innerWidth >= 768);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  // --- DEBOUNCE PENCARIAN (MENGURANGI LAG DI HP) ---
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300); // Jeda 300ms sebelum filter dijalankan
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);
  useEffect(() => {
    if (searchQuery === '') setLocalSearch('');
  }, [searchQuery]);

  // Mendeteksi guliran (scroll) dari kontainer luarnya
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null); setDragOverId(null);
      return;
    }
    const draggedIdx = filteredStudents.findIndex(s => s.id === dragId);
    const targetIdx = filteredStudents.findIndex(s => s.id === targetId);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newList = [...filteredStudents];
      const [draggedItem] = newList.splice(draggedIdx, 1);
      newList.splice(targetIdx, 0, draggedItem);
      if (onReorderStudents) onReorderStudents(newList);
    }
    setDragId(null); setDragOverId(null);
  };

  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };
  
  // --- EVENT HANDLER KHUSUS UNTUK HP (TOUCHSCREEN) ---
  const handleTouchStart = (e, id) => {
    setDragId(id);
  };

  const handleTouchMove = (e) => {
    if (!dragId) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = target?.closest('[data-student-id]');
    if (card) {
      const hoverId = card.getAttribute('data-student-id');
      if (hoverId !== dragOverId) setDragOverId(hoverId);
    }
  };

  const handleTouchEnd = () => {
    if (dragId && dragOverId && dragId !== dragOverId) {
      const draggedIdx = filteredStudents.findIndex(s => s.id === dragId);
      const targetIdx = filteredStudents.findIndex(s => s.id === dragOverId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const newList = [...filteredStudents];
        const [draggedItem] = newList.splice(draggedIdx, 1);
        newList.splice(targetIdx, 0, draggedItem);
        if (onReorderStudents) onReorderStudents(newList);
      }
    }
    setDragId(null); setDragOverId(null);
  };

  // Fungsi lokal pembuat inisial nama
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';

  // Handler untuk perubahan input file
  const onPhotoChange = (e, studentId) => {
    const file = e.target.files[0];
    if (file && openCropModal) {
      openCropModal(file, studentId);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8" ref={containerRef}>
      {isHeaderVisible && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 md:pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-[#1a202c] tracking-tight mb-1.5 md:mb-2">Data Siswa</h1>
            <p className="text-gray-500 font-medium text-xs sm:text-sm md:text-base break-words whitespace-normal">Kelola profil dan daftar siswa untuk halaqoh <strong className={`text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block break-words whitespace-normal max-w-full align-bottom ${(activeHalaqoh || '').length > 20 ? 'text-[10px] sm:text-xs' : ''}`}>{activeHalaqoh || '-'}</strong>.</p>
          </div>
          <button onClick={openAddStudentModal} disabled={!activeHalaqoh} className="flex items-center justify-center gap-1.5 md:gap-2 bg-[#00e676] hover:bg-green-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold transition-colors text-xs md:text-sm shadow-md shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-0">
            <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5"/> Tambah Siswa Baru
          </button>
        </div>
      )}

      {/* KOTAK PENCARIAN SISWA */}
      {activeHalaqoh && (
        <div className="sticky -top-4 sm:-top-6 md:-top-8 z-30 bg-slate-50/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 py-2 sm:py-3 mb-4 sm:mb-6 border-b border-gray-200/60 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)] transition-all">
          {!isSearchVisible && !searchQuery ? (
            <div className="flex justify-end gap-2 z-10">
              <button
                onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/80 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm text-[10px] sm:text-xs font-bold"
                title={isHeaderVisible ? "Sembunyikan Judul" : "Tampilkan Judul"}
              >
                {isHeaderVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                <span className="hidden sm:inline">{isHeaderVisible ? 'Sembunyikan Judul' : 'Tampilkan Judul'}</span>
                <span className="sm:hidden">{isHeaderVisible ? 'Tutup Judul' : 'Buka Judul'}</span>
              </button>
              <button
                onClick={() => setIsSearchVisible(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/80 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm text-[10px] sm:text-xs font-bold"
                title="Pencarian Siswa"
              >
                <Search size={14} /> Cari Siswa
              </button>
            </div>
          ) : (
            <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
              />
              <input
                autoFocus
                type="text"
                placeholder="Cari nama siswa..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-white border border-gray-200/80 rounded-xl pl-10 pr-[80px] py-2.5 sm:py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-bold text-slate-700 transition-all shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                  className="text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                  title={isHeaderVisible ? "Sembunyikan Judul" : "Tampilkan Judul"}
                >
                  {isHeaderVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => { setIsSearchVisible(false); setLocalSearch(''); setSearchQuery(''); }}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!activeHalaqoh ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Settings size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">Tidak ada Halaqoh yang dipilih.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Users size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">{searchQuery ? `Siswa dengan nama "${searchQuery}" tidak ditemukan.` : `Belum ada data siswa di ${activeHalaqoh}.`}</p>
          {!searchQuery && <button onClick={openAddStudentModal} className="text-xs text-green-600 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 mt-2 font-bold">Tambahkan Siswa</button>}
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredStudents.map(student => (
            <div 
              key={student.id} 
              data-student-id={student.id}
              draggable
              onDragStart={(e) => handleDragStart(e, student.id)}
              onDragOver={(e) => handleDragOver(e, student.id)}
              onDrop={(e) => handleDrop(e, student.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white p-4 md:p-6 min-h-[110px] md:min-h-[130px] rounded-2xl md:rounded-3xl shadow-sm border ${dragOverId === student.id ? 'border-green-500 scale-[1.02] shadow-lg' : 'border-gray-100'} flex items-start md:items-center justify-between hover:shadow-md transition-all group gap-3 cursor-grab active:cursor-grabbing ${dragId === student.id ? 'opacity-50 grayscale' : 'opacity-100'}`}
            >
              <div 
                className="flex flex-col items-center justify-center shrink-0 text-gray-300 group-hover:text-gray-400 cursor-grab touch-none p-1.5 -ml-2"
                onTouchStart={(e) => handleTouchStart(e, student.id)}
              >
                <GripVertical size={20} />
              </div>
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                <div className={`w-[48px] h-[48px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center font-black text-lg md:text-xl overflow-hidden relative shrink-0 border border-gray-100 group/avatar ${student.color || 'bg-blue-100 text-blue-600'}`}>
                  {student.photo ? (<img src={student.photo} alt="" className="w-full h-full object-cover" />) : (student.initial || getInitials(student.name))}
                  
                  {uploadingPhotoId === student.id ? (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-wait p-2">
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  ) : (
                    <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-center p-2">
                      <Camera size={20} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ganti</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoChange(e, student.id)} />
                    </label>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1">
                  <h3 className={`font-extrabold text-gray-800 leading-tight mb-1.5 line-clamp-2 whitespace-normal ${student.name.length > 24 ? 'text-xs md:text-sm' : student.name.length > 18 ? 'text-sm md:text-base' : 'text-sm md:text-lg'}`} title={student.name}>{student.name}</h3>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    <span className="inline-flex bg-blue-50 text-blue-600 text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider border border-blue-100 shadow-sm max-w-full break-all whitespace-normal leading-snug">{student.kelas}</span>
                    <span className="inline-flex bg-gray-50 text-gray-600 text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider border border-gray-200 shadow-sm max-w-full break-all whitespace-normal leading-snug">{student.halaqoh}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1">
                <button onClick={() => openEditStudentModal(student)} className="p-2 text-gray-400 bg-gray-50 hover:text-blue-600 hover:bg-blue-100 rounded-lg md:rounded-xl transition-all shadow-sm" title="Edit Data Siswa"><Edit3 size={16}/></button>
                <button onClick={() => requestDeleteStudent(student)} className="p-2 text-gray-400 bg-gray-50 hover:text-white hover:bg-red-500 rounded-lg md:rounded-xl transition-all shadow-sm" title={isSuperAdmin ? "Hapus Siswa (Permanen)" : "Keluarkan dari Halaqoh"}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tombol Scroll ke Atas */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-3 sm:p-3.5 bg-slate-800 text-white rounded-full shadow-2xl hover:bg-slate-900 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300"
          title="Scroll ke Atas"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default StudentView;