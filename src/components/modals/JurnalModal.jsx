import React, { useState, useMemo } from 'react';
import { X, BookOpen, Mic, Repeat, FileText, Plus, ChevronDown, Search, Check } from 'lucide-react';
import SurahSelector from '../SurahSelector';
import AyatSelector from '../AyatSelector';
import { Tooltip } from 'react-tooltip';

export const JurnalModal = ({
  isOpen, onClose, modalMode, getModalTitle, lessonPlans, handlePlanChange,
  handleToggleArray, handleAddSurat, handleRemoveSurat, handleSuratChange,
  activeDropdown, setActiveDropdown, tahsinCategories, ghoribList, tajwidList, surahList,
  homeTab, handleSave, editingId, selectedStudents,
  filteredStudents, toggleStudent
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const gradeOptions = ['A', 'B+', 'B', 'B-', 'C'];

  // Filter siswa berdasarkan pencarian lokal di dalam modal
  const displayStudents = useMemo(() => {
    if (!searchQuery.trim()) return filteredStudents;
    return filteredStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [filteredStudents, searchQuery]);

  // Pastikan Early Return berada SETELAH semua fungsi React Hooks dipanggil
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] print-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <Tooltip id="student-tooltip" place="top" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }} />
      <div className="bg-gray-50 w-full sm:max-w-2xl rounded-t-[24px] sm:rounded-3xl shadow-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out] sm:animate-in sm:zoom-in-95">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white z-20 shrink-0 flex justify-between items-center rounded-t-[24px] sm:rounded-t-3xl">
          <h2 className="text-base sm:text-lg font-black text-gray-800 flex items-center gap-2">{getModalTitle()}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X size={18}/></button>
        </div>
        
        <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-gray-50 pb-24 sm:pb-6">
          
          {/* Bagian Pilih Siswa - Selalu Tampil untuk memungkinkan input massal dari form manapun */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 shrink-0 flex flex-col gap-3 transition-all">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {editingId ? 'Terapkan Juga Ke Siswa Lain' : `Pilih Siswa (${selectedStudents.length}/${filteredStudents.length})`}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari siswa..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700"
                    />
                  </div>
                  <button type="button" onClick={() => toggleStudent('ALL')} className="shrink-0 text-[10px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                    {filteredStudents.length === selectedStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[140px] sm:max-h-[160px] overflow-y-auto custom-scrollbar p-1 -mx-1">
                {displayStudents.map(s => {
                  const isSelected = selectedStudents.includes(s.id);
                  const isEditing = s.id === editingId;

                  return (
                    <button 
                      key={s.id} 
                      type="button"
                      onClick={() => toggleStudent(s.id)} 
                      className={`relative flex items-center justify-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSelected ? (isEditing ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-[#00e676]/10 border-[#00e676] text-green-700 shadow-sm') : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                      data-tooltip-id="student-tooltip"
                      data-tooltip-content={s.name}
                    >
                        {isSelected && !isEditing && <Check size={12} strokeWidth={3} className="shrink-0" />}
                        <span className="truncate max-w-[110px] sm:max-w-[140px]">{s.name}</span>
                    </button>
                  );
                })}
                {displayStudents.length === 0 && (
                  <div className="w-full text-center text-xs text-gray-400 py-3 italic font-medium">Siswa tidak ditemukan.</div>
                )}
            </div>
          </div>

          {/* Form Input Data */}
          {lessonPlans.map(plan => (
            <div key={plan.id} className="flex flex-col gap-4">
              
              {/* --- FORM TAHSIN --- */}
              {['full_bulk', 'full_edit', 'tahsin'].includes(modalMode) && (
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2"><BookOpen size={18} className="text-blue-500"/> Data Tahsin</h3>
                    <div className="flex flex-col gap-4">
                        
                        {/* Kategori */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Metode / Jilid</label>
                          <select value={plan.tahsinKategori} onChange={(e) => handlePlanChange(plan.id, 'tahsinKategori', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 transition-shadow">
                              <option value="">Pilih Metode / Jilid...</option>
                              {tahsinCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        
                        {/* Materi Tajwid / Ghorib */}
                        {['Ghorib', 'Tajwid'].includes(plan.tahsinKategori) && (
                          <div className="relative">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Materi Pokok</label>
                              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold flex justify-between items-center cursor-pointer transition-shadow hover:border-blue-300" onClick={() => setActiveDropdown(activeDropdown === `mat` ? null : `mat`)}>
                                <span className="truncate">{(plan.tahsinMateri || []).length > 0 ? plan.tahsinMateri.length + ' dipilih' : `Pilih Materi...`}</span>
                                <ChevronDown size={18} className="text-gray-400" />
                              </div>
                              {activeDropdown === `mat` && (
                                <div className="bg-white border border-gray-200 rounded-xl mt-2 max-h-48 overflow-y-auto p-2 flex flex-col gap-1 shadow-xl absolute z-20 w-full left-0 top-full">
                                    {(plan.tahsinKategori === 'Ghorib' ? ghoribList : tajwidList).map((materi, i) => (
                                      <label key={i} className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">
                                          <input type="checkbox" checked={(plan.tahsinMateri || []).includes(materi)} onChange={() => handleToggleArray(plan.id, 'tahsinMateri', materi)} className="w-4 h-4 mt-0.5 text-blue-600 rounded cursor-pointer shrink-0" />
                                          <span className={`text-sm font-bold text-gray-700 flex-1 leading-snug ${plan.tahsinKategori === 'Ghorib' ? 'font-arabic text-lg text-right' : 'text-left'}`} dir={plan.tahsinKategori === 'Ghorib' ? "rtl" : "ltr"}>{materi}</span>
                                      </label>
                                    ))}
                                </div>
                              )}
                          </div>
                        )}

                        {/* Pilihan Halaman */}
                        {['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 'Tajwid', 'Ghorib'].includes(plan.tahsinKategori) && (
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Halaman</label>
                              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {Array.from({length: plan.tahsinKategori === 'Ghorib' ? 28 : plan.tahsinKategori === 'Tajwid' ? 20 : 40}, (_, i) => String(i + 1)).map(p => (
                                    <button type="button" key={p} onClick={() => handleToggleArray(plan.id, 'tahsinHalaman', p)} className={`shrink-0 w-12 h-12 rounded-xl text-sm font-black border-2 flex items-center justify-center transition-all ${plan.tahsinHalaman.includes(p) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>{p}</button>
                                ))}
                              </div>
                          </div>
                        )}

                        {/* Pilihan Baris */}
                        {['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6'].includes(plan.tahsinKategori) && (
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Baris</label>
                              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {['1','2','3','4','5','6','7','8'].map(b => (
                                    <button type="button" key={b} onClick={() => handleToggleArray(plan.id, 'tahsinBaris', b)} className={`shrink-0 w-12 h-12 rounded-xl text-sm font-black border-2 flex items-center justify-center transition-all ${plan.tahsinBaris.includes(b) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>{b}</button>
                                ))}
                              </div>
                          </div>
                        )}

                        {/* Nilai Kategori Keseluruhan (Muncul persis setelah Jilid / Materi, Hanya di Tab Jurnal) */}
                        {homeTab === 'jurnal' && ['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 'Tajwid', 'Ghorib'].includes(plan.tahsinKategori) && (
                          <div className="mt-1 mb-2 bg-blue-50/40 p-3 rounded-2xl border border-blue-100/50">
                              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                                Nilai {plan.tahsinKategori.includes('Jilid') ? 'Jilid' : plan.tahsinKategori}
                              </label>
                              <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
                                  {gradeOptions.map(n => (
                                    <button 
                                      type="button" 
                                      key={n} 
                                      onClick={() => handlePlanChange(plan.id, 'tahsinNilai', n)} 
                                      className={`shrink-0 flex-1 min-w-[50px] py-2.5 rounded-xl text-sm font-black border-2 transition-all ${plan.tahsinNilai === n ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300'}`}
                                    >
                                      {n}
                                    </button>
                                  ))}
                              </div>
                          </div>
                        )}

                        {/* Pilihan Surat & Ayat Tahsin */}
                        {['Al-Qur\'an', 'Tajwid', 'Ghorib'].includes(plan.tahsinKategori) && (
                          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 mt-2">
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                Surat & Ayat {plan.tahsinKategori !== 'Al-Qur\'an' ? '(Aplikasi / Tilawah)' : ''}
                              </label>
                              
                              {plan.tahsinSuratList.map((item, idx) => (
                                <div key={item.id} className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl flex flex-col gap-3 relative">
                                    <SurahSelector
                                      value={item.surat}
                                      onChange={value => handleSuratChange(plan.id, 'tahsinSuratList', item.id, 'surat', value)}
                                      surahList={surahList}
                                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                      <div className="flex items-center gap-2 flex-1 w-full">
                                          <AyatSelector
                                            surahName={item.surat}
                                            surahList={surahList}
                                            value={item.ayatStart}
                                            onChange={value => handleSuratChange(plan.id, 'tahsinSuratList', item.id, 'ayatStart', value)}
                                            maxAyat={item.ayatEnd}
                                            placeholder="Awal"
                                            className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={!item.surat}
                                          />
                                          <span className="text-gray-400 font-bold">-</span>
                                          <AyatSelector
                                            surahName={item.surat}
                                            surahList={surahList}
                                            value={item.ayatEnd}
                                            onChange={value => handleSuratChange(plan.id, 'tahsinSuratList', item.id, 'ayatEnd', value)}
                                            minAyat={item.ayatStart}
                                            placeholder="Akhir"
                                            className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={!item.surat}
                                          />
                                      </div>
                                      
                                      {/* Input Nilai Spesifik per Surat (Hanya Muncul di Tab Jurnal) */}
                                      {homeTab === 'jurnal' && (
                                          <div className="w-full sm:w-28 shrink-0 mt-2 sm:mt-0 relative">
                                            <select 
                                              value={item.nilai || ''} 
                                              onChange={e => handleSuratChange(plan.id, 'tahsinSuratList', item.id, 'nilai', e.target.value)} 
                                              className="w-full bg-gray-800 text-white border-2 border-gray-800 rounded-xl px-3 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-center appearance-none"
                                            >
                                              <option value="">Nilai</option>
                                              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            {/* Custom Dropdown Arrow untuk tombol hitam */}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                               <ChevronDown size={14}/>
                                            </div>
                                          </div>
                                      )}
                                    </div>
                                    {idx > 0 && <button type="button" onClick={() => handleRemoveSurat(plan.id, 'tahsinSuratList', item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition-colors"><X size={14} strokeWidth={3}/></button>}
                                </div>
                              ))}
                              
                              <button type="button" onClick={() => handleAddSurat(plan.id, 'tahsinSuratList')} className="text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl flex justify-center items-center gap-1.5 transition-colors border border-blue-200/50 mt-1"><Plus size={16}/> TAMBAH SURAT</button>
                          </div>
                        )}

                    </div>
                  </div>
              )}

              {/* --- FORM TAHFIDZ --- */}
              {['full_bulk', 'full_edit', 'tahfidz'].includes(modalMode) && (
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2"><Mic size={18} className="text-purple-500"/> Data Tahfidz</h3>
                    <div className="flex flex-col gap-3">
                        {plan.tahfidzSuratList.map((item, idx) => (
                          <div key={item.id} className="bg-purple-50/50 border border-purple-100 p-3 rounded-2xl flex flex-col gap-3 relative">
                              <SurahSelector
                                value={item.surat}
                                onChange={value => handleSuratChange(plan.id, 'tahfidzSuratList', item.id, 'surat', value)}
                                surahList={surahList}
                                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <div className="flex items-center gap-2 flex-1 w-full">
                                    <AyatSelector
                                      surahName={item.surat}
                                      surahList={surahList}
                                      value={item.ayatStart}
                                      onChange={value => handleSuratChange(plan.id, 'tahfidzSuratList', item.id, 'ayatStart', value)}
                                      maxAyat={item.ayatEnd}
                                      placeholder="Awal"
                                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
                                      disabled={!item.surat}
                                    />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <AyatSelector
                                      surahName={item.surat}
                                      surahList={surahList}
                                      value={item.ayatEnd}
                                      onChange={value => handleSuratChange(plan.id, 'tahfidzSuratList', item.id, 'ayatEnd', value)}
                                      minAyat={item.ayatStart}
                                      placeholder="Akhir"
                                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
                                      disabled={!item.surat}
                                    />
                                </div>
                                
                                {/* Pilihan Nilai Tahfidz */}
                                {homeTab === 'jurnal' && (
                                    <div className="w-full sm:w-28 shrink-0 mt-2 sm:mt-0 relative">
                                      <select 
                                        value={item.nilai || ''} 
                                        onChange={e => handleSuratChange(plan.id, 'tahfidzSuratList', item.id, 'nilai', e.target.value)} 
                                        className="w-full bg-gray-800 text-white border-2 border-gray-800 rounded-xl px-3 py-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-purple-500 shadow-sm text-center appearance-none"
                                      >
                                        <option value="">Nilai</option>
                                        {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                      </select>
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                                         <ChevronDown size={14}/>
                                      </div>
                                    </div>
                                )}
                              </div>
                              {idx > 0 && <button type="button" onClick={() => handleRemoveSurat(plan.id, 'tahfidzSuratList', item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition-colors"><X size={14} strokeWidth={3}/></button>}
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddSurat(plan.id, 'tahfidzSuratList')} className="text-xs font-black bg-purple-50 hover:bg-purple-100 text-purple-600 py-3 rounded-xl flex justify-center items-center gap-1.5 transition-colors border border-purple-200/50 mt-1"><Plus size={16}/> TAMBAH SURAT HAFALAN</button>
                    </div>
                  </div>
              )}

              {/* --- FORM MUROJAAH --- */}
              {['full_bulk', 'full_edit', 'murojaah'].includes(modalMode) && (
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2"><Repeat size={18} className="text-emerald-500"/> Data Murojaah</h3>
                    <div className="flex flex-col gap-3">
                        {plan.murojaah.map((item, idx) => (
                          <div key={item.id} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl flex flex-col gap-3 relative">
                              <SurahSelector
                                value={item.surat}
                                onChange={value => handleSuratChange(plan.id, 'murojaah', item.id, 'surat', value)}
                                surahList={surahList}
                                className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <div className="flex items-center gap-2">
                                <AyatSelector
                                  surahName={item.surat}
                                  surahList={surahList}
                                  value={item.ayatStart}
                                  onChange={value => handleSuratChange(plan.id, 'murojaah', item.id, 'ayatStart', value)}
                                  maxAyat={item.ayatEnd}
                                  placeholder="Awal"
                                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                  disabled={!item.surat}
                                />
                                <span className="text-gray-400 font-bold">-</span>
                                <AyatSelector
                                  surahName={item.surat}
                                  surahList={surahList}
                                  value={item.ayatEnd}
                                  onChange={value => handleSuratChange(plan.id, 'murojaah', item.id, 'ayatEnd', value)}
                                  minAyat={item.ayatStart}
                                  placeholder="Akhir"
                                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 disabled:bg-gray-100 disabled:border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                                  disabled={!item.surat}
                                />
                              </div>
                              {idx > 0 && <button type="button" onClick={() => handleRemoveSurat(plan.id, 'murojaah', item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition-colors"><X size={14} strokeWidth={3}/></button>}
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddSurat(plan.id, 'murojaah')} className="text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-xl flex justify-center items-center gap-1.5 transition-colors border border-emerald-200/50 mt-1"><Plus size={16}/> TAMBAH SURAT MUROJAAH</button>
                    </div>
                  </div>
              )}

              {/* --- FORM CATATAN --- */}
              {['full_bulk', 'full_edit', 'catatan'].includes(modalMode) && (
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2"><FileText size={18} className="text-orange-500"/> {homeTab === 'lesson_plan' ? 'Catatan Target Guru' : 'Catatan Capaian / Nilai Jurnal'}</h3>
                    <textarea rows="3" placeholder="Ketikkan catatan khusus di sini..." value={plan.lainLain} onChange={e => handlePlanChange(plan.id, 'lainLain', e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-orange-400 rounded-2xl p-4 text-sm font-bold outline-none resize-none text-gray-800 transition-colors focus:ring-2 focus:ring-orange-400/20"></textarea>
                    
                    <div className="mt-3 flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                        {['Sangat Baik', 'Lancar', 'Bagus', 'Perlu Murojaah', 'Kurang Lancar', 'Ulangi Besok'].map(note => (
                          <button type="button" key={note} onClick={() => handlePlanChange(plan.id, 'lainLain', (plan.lainLain ? plan.lainLain + ', ' : '') + note)} className="shrink-0 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-xl text-[11px] font-black transition-colors shadow-sm">
                            + {note}
                          </button>
                        ))}
                    </div>
                  </div>
              )}
            </div>
          ))}
        </div>

        {/* Tombol Simpan Bawah */}
        <div className="absolute sm:relative bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] sm:shadow-none z-30">
          <button onClick={handleSave} className="w-full flex justify-center items-center gap-2 bg-[#00e676] hover:bg-green-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-green-200">
            <BookOpen size={18}/> Simpan Data {homeTab === 'lesson_plan' ? 'Target' : 'Jurnal'}
          </button>
        </div>
      </div>
    </div>
  );
};