// File: src/components/views/StudentView.jsx
import React from 'react';
import { Users, Settings, Plus, Edit3, Trash2, Camera } from 'lucide-react';

const StudentView = ({ activeHalaqoh, filteredStudents, openAddStudentModal, openEditStudentModal, requestDeleteStudent, isSuperAdmin, openCropModal, uploadingPhotoId, uploadProgress }) => {
  
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
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1a202c] tracking-tight mb-1.5 md:mb-2">Data Siswa</h1>
          <p className="text-gray-500 font-medium text-xs sm:text-sm md:text-base">Kelola profil dan daftar siswa untuk halaqoh <strong className="text-green-600 bg-green-50 px-2 py-0.5 rounded">{activeHalaqoh || '-'}</strong>.</p>
        </div>
        <button onClick={openAddStudentModal} disabled={!activeHalaqoh} className="flex items-center justify-center gap-1.5 md:gap-2 bg-[#00e676] hover:bg-green-500 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold transition-colors text-xs md:text-sm shadow-md shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus size={16} strokeWidth={3} className="md:w-5 md:h-5"/> Tambah Siswa Baru
        </button>
      </div>

      {!activeHalaqoh ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Settings size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">Tidak ada Halaqoh yang dipilih.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 md:py-20 text-gray-400 font-bold bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 px-4">
          <Users size={36} className="text-gray-300 md:w-10 md:h-10"/>
          <p className="text-sm md:text-base">Belum ada data siswa di {activeHalaqoh}.</p>
          <button onClick={openAddStudentModal} className="text-xs text-green-600 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 mt-2 font-bold">Tambahkan Siswa</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white p-4 md:p-6 min-h-[110px] md:min-h-[130px] rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-start md:items-center justify-between hover:shadow-md transition-all group gap-3">
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
                  <h3 className="font-extrabold text-gray-800 text-sm md:text-lg leading-tight mb-1.5 line-clamp-2 break-all whitespace-normal" title={student.name}>{student.name}</h3>
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
    </div>
  );
};

export default StudentView;