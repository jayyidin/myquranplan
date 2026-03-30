// File: src/components/modals/StudentModals.jsx
import React from 'react';
import { X, Search, User, Plus, Camera, ShieldAlert, Edit3 } from 'lucide-react';

export const AddStudentModal = ({
  isOpen, onClose, isSuperAdmin, addStudentMode, setAddStudentMode,
  masterSearchQuery, setMasterSearchQuery, students, activeHalaqoh,
  handleAssignFromMaster, newStudent, setNewStudent, handlePhotoUpload,
  kelasList, handleSaveNewStudent, getInitials, guruHalaqohData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm print-hidden">
      <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-in sm:zoom-in-95 duration-300 relative z-[305]">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-black text-gray-800">Tambah Siswa Baru</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white border border-gray-200 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100"><X size={16}/></button>
        </div>
        
        <div className="flex bg-gray-100 rounded-xl p-1 m-4 mb-0 shrink-0 relative">
          <button type="button" onClick={() => setAddStudentMode('master')} className={`flex-1 px-3 py-2 font-black text-xs rounded-lg transition-colors shadow-sm relative z-10 ${addStudentMode === 'master' ? 'bg-white text-blue-600' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}>Pilih dari Master</button>
          <button type="button" onClick={() => setAddStudentMode('manual')} className={`flex-1 px-3 py-2 font-black text-xs rounded-lg transition-colors shadow-sm relative z-10 ${addStudentMode === 'manual' ? 'bg-white text-green-600' : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'}`}>Input Baru (Manual)</button>
        </div>

        {addStudentMode === 'master' ? (
            <div className="p-4 flex flex-col gap-3 h-[380px]">
              <div className="relative shrink-0">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Cari nama siswa..." value={masterSearchQuery} onChange={e => setMasterSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                  {masterSearchQuery.trim() === '' ? (
                    <div className="text-center text-xs text-gray-400 py-8 font-bold flex flex-col items-center gap-2"><Search size={24} className="text-gray-300"/> Ketik nama siswa untuk mencari...</div>
                  ) : students.filter(s => s.halaqoh !== activeHalaqoh && s.name.toLowerCase().includes(masterSearchQuery.toLowerCase())).length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-8 font-bold flex flex-col items-center gap-2"><User size={24} className="text-gray-300"/> Siswa tidak ditemukan.</div>
                  ) : students.filter(s => s.halaqoh !== activeHalaqoh && s.name.toLowerCase().includes(masterSearchQuery.toLowerCase())).map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-gray-100 ${s.color || 'bg-gray-100 text-gray-600'}`}>
                              {s.photo ? <img src={s.photo} className="w-full h-full object-cover rounded-full"/> : (s.initial || getInitials(s.name))}
                          </div>
                          <div className="min-w-0">
                              <p className="font-extrabold text-sm text-gray-800 truncate">{s.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Kelas: {s.kelas} • Halaqoh: {s.halaqoh || '-'}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleAssignFromMaster(s)} className="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white p-2 rounded-lg transition-colors shrink-0 shadow-sm">
                          <Plus size={16} strokeWidth={3}/>
                        </button>
                    </div>
                  ))}
              </div>
            </div>
        ) : (
            <form onSubmit={handleSaveNewStudent} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2">
                <label className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer">
                    {newStudent.photo ? <img src={newStudent.photo} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400" />}
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} className="hidden" />
                </label>
                <span className="text-[10px] font-bold text-gray-400">Ketuk foto</span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Lengkap</label>
                <input type="text" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Masukkan nama..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Kelas</label>
                    <select value={newStudent.kelas} onChange={e => setNewStudent({...newStudent, kelas: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold outline-none">
                      {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Halaqoh</label>
                  <select 
                    value={newStudent.halaqoh} 
                    onChange={e => setNewStudent({...newStudent, halaqoh: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Halaqoh...</option>
                    {Object.entries(guruHalaqohData || {}).map(([guru, halaqohs]) => (
                        <optgroup key={guru} label={`Ustadz/ah ${guru}`}>
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
              <button type="submit" className="w-full bg-[#00e676] hover:bg-green-500 text-white py-3.5 rounded-2xl font-black mt-2 active:scale-95 transition-all text-sm shadow-md shadow-green-200">Simpan Data Siswa</button>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm print-hidden">
      <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-in sm:zoom-in-95 duration-300 relative z-[305]">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><Edit3 size={18} className="text-blue-500"/> Edit Siswa</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white border border-gray-200 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100"><X size={16}/></button>
        </div>
        <form onSubmit={handleUpdateStudent} className="p-5 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <label className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer">
                {editStudentData.photo ? <img src={editStudentData.photo} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400" />}
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} className="hidden" />
              </label>
              <span className="text-[10px] font-bold text-gray-400">Ketuk ubah</span>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Lengkap</label>
              <input type="text" required value={editStudentData.name} onChange={e => setEditStudentData({...editStudentData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Kelas</label>
                  <select value={editStudentData.kelas} onChange={e => setEditStudentData({...editStudentData, kelas: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Halaqoh</label>
                <select 
                  value={editStudentData.halaqoh} 
                  onChange={e => setEditStudentData({...editStudentData, halaqoh: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Halaqoh...</option>
                  {Object.entries(guruHalaqohData || {}).map(([guru, halaqohs]) => (
                      <optgroup key={guru} label={`Ustadz/ah ${guru}`}>
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
            <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black mt-2 active:scale-95 transition-transform text-sm">Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
};