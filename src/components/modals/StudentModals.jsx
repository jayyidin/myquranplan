// File: src/components/modals/StudentModals.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, User, Plus, Camera, ShieldAlert, Edit3, Loader2 } from 'lucide-react';

export const AddStudentModal = ({
  isOpen, onClose, isSuperAdmin, addStudentMode, setAddStudentMode,
  masterSearchQuery, setMasterSearchQuery, students, activeHalaqoh,
  handleAssignFromMaster, newStudent, setNewStudent, handlePhotoUpload,
  kelasList, handleSaveNewStudent, getInitials, guruHalaqohData
}) => {
  const [localQuery, setLocalQuery] = useState(masterSearchQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Menerapkan debounce 300ms untuk mengurangi lag jika data terlalu besar
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setMasterSearchQuery(localQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setMasterSearchQuery]);

  // Mengatur ulang query lokal jika query eksternal dihapus (misal dari induk)
  useEffect(() => {
    if (masterSearchQuery === '') setLocalQuery('');
  }, [masterSearchQuery]);

  // Mencegah scroll pada body ketika modal terbuka (UX Mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsRendered(true);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setIsRendered(false);
  };

  if (!isRendered) return null;

  return (
    <div onAnimationEnd={onAnimationEnd} className={`fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm print-hidden ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'}`}>
      <div className={`bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-[305] border border-transparent dark:border-slate-800 ${isOpen ? 'animate-slide-up sm:animate-in sm:zoom-in-95' : 'animate-slide-down sm:animate-out sm:zoom-out-95'}`}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Tambah Siswa Baru</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-400 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><X size={16} /></button>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 m-4 mb-0 shrink-0 relative">
          <button type="button" onClick={() => setAddStudentMode('master')} className={`flex-1 px-3 py-2 font-black text-xs rounded-lg transition-colors shadow-sm relative z-10 ${addStudentMode === 'master' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 bg-transparent shadow-none'}`}>Pilih dari Master</button>
          <button type="button" onClick={() => setAddStudentMode('manual')} className={`flex-1 px-3 py-2 font-black text-xs rounded-lg transition-colors shadow-sm relative z-10 ${addStudentMode === 'manual' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 bg-transparent shadow-none'}`}>Input Baru (Manual)</button>
        </div>

        {addStudentMode === 'master' ? (
          <div className="p-4 flex flex-col gap-3 h-[380px]">
            <div className="relative shrink-0">
              {isSearching ? (
                <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 animate-spin" />
              ) : (
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              )}
              <input autoFocus type="text" placeholder="Cari nama siswa..." value={localQuery} onChange={e => setLocalQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-slate-200" />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar flex flex-col gap-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {isSearching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-2.5 rounded-xl shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 min-w-0 w-full">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 ml-3"></div>
                  </div>
                ))
              ) : students.filter(s => s.name.toLowerCase().includes(masterSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-8 font-bold flex flex-col items-center gap-2"><User size={24} className="text-gray-300 dark:text-slate-600" /> {students.length === 0 ? 'Tidak ada data siswa yang halaqohnya kosong.' : 'Siswa tidak ditemukan.'}</div>
              ) : students.filter(s => s.name.toLowerCase().includes(masterSearchQuery.toLowerCase())).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 p-2.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 dark:border-slate-700 ${s.color || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                      {s.photo ? <img src={s.photo} className="w-full h-full object-cover rounded-full" /> : (s.initial || getInitials(s.name))}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-gray-800 dark:text-slate-200 truncate">{s.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase mt-0.5">Kelas: {s.kelas} • Halaqoh: {s.halaqoh || '-'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleAssignFromMaster(s)} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white p-2 rounded-lg transition-colors shrink-0 shadow-sm">
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveNewStudent} className="p-4 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <label className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                {newStudent.photo ? <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400 dark:text-slate-500" />}
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} className="hidden" />
              </label>
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">Ketuk foto</span>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Nama Lengkap</label>
              <input type="text" required value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-green-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-500 dark:text-slate-200" placeholder="Masukkan nama..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Kelas</label>
                <select value={newStudent.kelas} onChange={e => setNewStudent({ ...newStudent, kelas: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-green-500 dark:text-slate-200">
                  {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Halaqoh</label>
                <select
                  value={newStudent.halaqoh}
                  onChange={e => setNewStudent({ ...newStudent, halaqoh: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-green-500 dark:text-slate-200"
                >
                  <option value="">Pilih Halaqoh...</option>
                  {Object.entries(guruHalaqohData || {}).map(([guru, halaqohs]) => (
                    <optgroup key={guru} label={guru}>
                      {Array.isArray(halaqohs) && halaqohs.length > 0 ? (
                        halaqohs.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))
                      ) : (
                        <option disabled>Belum ada halaqoh terdaftar</option>
                      )}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#00e676] hover:bg-green-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-black mt-2 active:scale-95 transition-all text-sm shadow-md shadow-green-200 dark:shadow-none">Simpan Data Siswa</button>
          </form>
        )}
      </div>
    </div>
  );
};

export const EditStudentModal = ({
  isOpen, onClose, editStudentData, setEditStudentData,
  handlePhotoUpload, kelasList, handleUpdateStudent,
  guruHalaqohData, isSuperAdmin
}) => {
  const [isRendered, setIsRendered] = useState(false);

  // Mencegah scroll pada body ketika modal terbuka (UX Mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsRendered(true);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setIsRendered(false);
  };

  if (!isRendered) return null;

  return (
    <div onAnimationEnd={onAnimationEnd} className={`fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm print-hidden ${isOpen ? 'animate-in fade-in' : 'animate-out fade-out'}`}>
      <div className={`bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-[305] border border-transparent dark:border-slate-800 ${isOpen ? 'animate-slide-up sm:animate-in sm:zoom-in-95' : 'animate-slide-down sm:animate-out sm:zoom-out-95'}`}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-500/10">
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2"><Edit3 size={18} className="text-blue-500 dark:text-blue-400" /> Edit Siswa</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-400 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><X size={16} /></button>
        </div>
        <form onSubmit={handleUpdateStudent} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <label className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              {editStudentData.photo ? <img src={editStudentData.photo} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400 dark:text-slate-500" />}
              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} className="hidden" />
            </label>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">Ketuk ubah</span>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Nama Lengkap</label>
            <input type="text" required value={editStudentData.name} onChange={e => setEditStudentData({ ...editStudentData, name: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Kelas</label>
              <select value={editStudentData.kelas} onChange={e => setEditStudentData({ ...editStudentData, kelas: e.target.value })} className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-200">
                {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Halaqoh</label>
              <select
                value={editStudentData.halaqoh}
                onChange={e => setEditStudentData({ ...editStudentData, halaqoh: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-200"
              >
                <option value="">Pilih Halaqoh...</option>
                {Object.entries(guruHalaqohData || {}).map(([guru, halaqohs]) => (
                  <optgroup key={guru} label={guru}>
                    {Array.isArray(halaqohs) && halaqohs.length > 0 ? (
                      halaqohs.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))
                    ) : (
                      <option disabled>Belum ada halaqoh terdaftar</option>
                    )}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black mt-2 active:scale-95 transition-transform text-sm">Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
};