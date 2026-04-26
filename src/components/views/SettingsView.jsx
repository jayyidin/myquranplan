// File: src/components/views/SettingsView.jsx
import React, { useState } from 'react';
import { 
  UserCheck, CheckCircle2, X, ImageIcon, Camera,
  GraduationCap, Plus, User, Edit3, Trash2, Save, Users, Search, ShieldCheck, Database, LayoutGrid, LogOut
} from 'lucide-react';

const SettingsView = ({ 
  isSuperAdmin, appUsers, handleApproveUser, handleRejectUser, handleUpdateUserAccount,
  institutionName, setInstitutionName, institutionLogo, handleInstitutionLogoUpload, setInstitutionLogo, updateMasterDataCloud, showToast, isUploadingLogo, logoUploadProgress,
  kelasList, newKelasName, setNewKelasName, handleAddKelas, handleDeleteKelas,
  newGuruName, setNewGuruName, handleAddGuru, guruList, 
  selectedGuruForHalaqoh, setSelectedGuruForHalaqoh, newHalaqohName, setNewHalaqohName, handleAddHalaqoh,
  currentUser, guruHalaqohData, editingGuru, setEditingGuru, handleSaveEditGuru, requestDeleteGuru,
  editingHalaqoh, setEditingHalaqoh, handleSaveEditHalaqoh, requestDeleteHalaqoh,
  students, openEditStudentModal, requestDeleteStudent, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents, onLogout
}) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [bulkData, setBulkData] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ kelas: '', halaqoh: '' });

  const processBulkImport = () => {
    // Mendukung line endings Windows (\r\n) dan Unix (\n)
    const rows = bulkData.split(/\r?\n/).filter(row => row.trim() !== '');
    const parsed = rows.map(row => {
      // Mendukung pemisah koma atau TAB (saat copy langsung dari Excel)
      const parts = row.split(/[,\t]/).map(p => p.trim());
      return { name: parts[0], kelas: parts[1] || 'N/A', halaqoh: parts[2] || 'Unassigned' };
    }).filter(s => s.name);
    
    if (parsed.length === 0) {
      showToast('Data tidak valid! Gunakan format: Nama, Kelas, Halaqoh');
      return;
    }
    
    handleBulkSaveStudents(parsed);
    setBulkData('');
    setIsBulkImportOpen(false);
  };

  const handleStartEditAccount = (user) => {
    setEditingAccount({ id: user.id, name: user.name, password: user.password, role: user.role });
  };

  const handleSaveAccount = async () => {
    await handleUpdateUserAccount(editingAccount.id, { 
      name: editingAccount.name, 
      password: editingAccount.password, 
      role: editingAccount.role,
      resetrequested: false 
    });
    setEditingAccount(null);
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(displayedStudents.map(s => s.id));
    }
  };

  const handleBulkDelete = () => {
    requestBulkDeleteStudents(selectedStudentIds);
    setSelectedStudentIds([]);
    setIsBulkEditOpen(false);
  };

  const handleExecuteBulkEdit = () => {
    const updates = {};
    if (bulkEditData.kelas) updates.kelas = bulkEditData.kelas;
    if (bulkEditData.halaqoh) updates.halaqoh = bulkEditData.halaqoh;

    if (Object.keys(updates).length === 0) {
      showToast('Pilih minimal kelas atau halaqoh baru.');
      return;
    }

    requestBulkEditStudents(selectedStudentIds, updates);
    setSelectedStudentIds([]);
    setIsBulkEditOpen(false);
    setBulkEditData({ kelas: '', halaqoh: '' });
  };

  // Cari key guru secara case-insensitive untuk mendapatkan daftar halaqoh saya
  const searchName = currentUser?.name?.trim().toLowerCase() || "";
  const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
  const myHalaqohs = isSuperAdmin ? [] : (guruKey ? (guruHalaqohData[guruKey] || []) : []);

  const filteredStudentsMaster = (students || []).filter(s => {
    if (isSuperAdmin) {
      // BANK DATA: Jika siswa SUDAH masuk halaqoh, sembunyikan dari sini
      const halaqoh = (s?.halaqoh || "").trim();
      if (halaqoh !== '' && halaqoh.toLowerCase() !== 'unassigned') {
        return false;
      }
    } else {
      if (!myHalaqohs.some(h => h.trim().toLowerCase() === (s?.halaqoh || "").trim().toLowerCase())) {
        return false;
      }
    }
    const nameMatch = (s?.name || '').toLowerCase().includes((studentSearch || '').toLowerCase());
    const halaqohMatch = (s?.halaqoh || '').toLowerCase().includes((studentSearch || '').toLowerCase());
    return nameMatch || halaqohMatch;
  });

  const displayedStudents = filteredStudentsMaster.slice(0, visibleCount);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#F8F9FA] custom-scrollbar min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 md:px-8 pb-32">
        
        {/* HEADER SECTION */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              {isSuperAdmin ? 'Pengaturan Sistem' : 'Manajemen Halaqoh'}
            </h1>
            <p className="text-slate-500 font-medium">
              {isSuperAdmin 
                ? 'Konfigurasi identitas sekolah, hak akses guru, dan struktur database halaqoh.' 
                : 'Kelola daftar kelompok halaqoh yang berada di bawah bimbingan Anda.'} 
            </p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* 1. NOTIFIKASI PERSETUJUAN (URGENT) */}
          {isSuperAdmin && appUsers.filter(u => u.status === 'pending').length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Persetujuan Menunggu</h2>
              </div>
              <div className="bg-white rounded-[2rem] border-2 border-orange-100 shadow-xl shadow-orange-900/5 overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appUsers.filter(u => u.status === 'pending').map(pendingUser => ( 
                    <div key={pendingUser.id} className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-3">
                      <div>
                        <p className="font-black">{pendingUser.name}</p>
                        <p className="text-xs font-bold text-orange-600/70 uppercase">@{pendingUser.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveUser(pendingUser)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-1.5"><CheckCircle2 size={14}/> Terima</button>
                        <button onClick={() => handleRejectUser(pendingUser.id)} className="flex-1 bg-white text-orange-600 border border-orange-200 font-bold py-2 rounded-xl text-xs hover:bg-orange-100 transition-all flex items-center justify-center gap-1.5"><X size={14}/> Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 2. IDENTITAS & KURIKULUM (TWO COLUMNS) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LOGO SEKOLAH */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Laporan</h2>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
                  {/* Logo Part */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center relative group overflow-hidden shrink-0">
                      {isUploadingLogo ? (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-wait p-4">
                          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                            <div 
                              className="bg-white h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${logoUploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">{Math.round(logoUploadProgress)}%</span>
                        </div>
                      ) : institutionLogo && institutionLogo !== 'logo.png' ? (
                        <img src={institutionLogo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-90" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                      {!isUploadingLogo && (
                        <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-center p-2">
                          <Camera size={20} className="mb-1" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Ganti Logo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleInstitutionLogoUpload} /> 
                        </label>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-black text-lg mb-1">Logo Lembaga</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Gunakan logo transparan (PNG) untuk hasil cetak laporan yang maksimal.</p>
                      {institutionLogo !== 'logo.png' && (
                        <button onClick={() => { setInstitutionLogo('logo.png'); updateMasterDataCloud({ institutionLogo: 'logo.png' }); showToast('Logo direset.'); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors">Reset ke Default</button>
                      )}
                    </div>
                  </div>
                  {/* Institution Name Part */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lembaga</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={institutionName} 
                        onChange={e => setInstitutionName(e.target.value)} 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                      <button onClick={() => { updateMasterDataCloud({ institutionName }); showToast('Nama lembaga disimpan!'); }} className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-100 transition-all"><Save size={20}/></button>
                    </div>
                  </div>
                </div>
              </section>

              {/* MASTER KELAS */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Kelas</h2>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                  <div className="flex gap-2 mb-6"> 
                    <input type="text" placeholder="Nama kelas (Misal: 1A)" value={newKelasName} onChange={e => setNewKelasName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                    <button onClick={handleAddKelas} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-100 transition-all"><Plus size={20}/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kelasList.map(kelas => (
                      <div key={kelas} className="group bg-slate-50 border border-slate-100 pl-4 pr-2 py-2 rounded-xl flex items-center gap-3 transition-all hover:bg-white hover:shadow-md hover:border-emerald-200">
                        <span className="text-xs font-black text-slate-700">{kelas}</span>
                        <button onClick={() => handleDeleteKelas(kelas)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 3. AKSES & HALAQOH (FULL WIDTH) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Manajemen Guru & Halaqoh</h2>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Sidebar: Accounts (Super Admin Only) */}
              {isSuperAdmin && (
                <div className="xl:col-span-1 space-y-6">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-indigo-600" size={24} />
                        <h3 className="font-black text-slate-800">Akses Pengguna</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                      {appUsers.filter(u => u.status === 'active' || u.role === 'superadmin').map(user => (
                        <div key={user.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:border-indigo-200 group">
                          {editingAccount?.id === user.id ? (
                            <div className="space-y-3 animate-in fade-in duration-300">
                              <input type="text" value={editingAccount.name} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold" />
                              <input type="text" value={editingAccount.password} onChange={e => setEditingAccount({...editingAccount, password: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs" placeholder="Password Baru" /> 
                              <div className="flex gap-2">
                                <button onClick={handleSaveAccount} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase">Simpan</button>
                                <button onClick={() => setEditingAccount(null)} className="flex-1 bg-white border border-slate-200 py-2 rounded-xl text-[10px] font-black uppercase">Batal</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-black text-sm truncate">
                                  {user.name}
                                  {user.resetrequested && <span className="ml-2 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">RESET</span>}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">@{user.username} • {user.role}</p>
                              </div>
                              <button onClick={() => handleStartEditAccount(user)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><Edit3 size={16}/></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main: Halaqoh Structures */}
              <div className={isSuperAdmin ? "xl:col-span-2" : "xl:col-span-3"}>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  {/* Input Actions */}
                  <div className="p-6 bg-slate-50/80 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isSuperAdmin ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tambah Guru</label>
                            <div className="flex gap-2"> 
                              <input type="text" list="approved-gurus" placeholder="Nama lengkap..." value={newGuruName} onChange={e => setNewGuruName(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500" />
                              <button onClick={handleAddGuru} className="bg-slate-900 text-white px-4 rounded-2xl font-black text-xs uppercase tracking-widest">Add</button>
                              <datalist id="approved-gurus">
                                {appUsers.filter(u => (u.status === 'active' || u.role === 'superadmin') && !guruList.includes(u.name)).map(u => <option key={u.id} value={u.name}>{u.username}</option>)}
                              </datalist>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Assign Halaqoh</label>
                            <div className="flex gap-2"> 
                              <select value={selectedGuruForHalaqoh} onChange={e => setSelectedGuruForHalaqoh(e.target.value)} className="w-[120px] bg-white border border-slate-200 rounded-2xl px-2 py-2.5 text-xs font-bold outline-none">
                                <option value="">Guru...</option>
                                {guruList.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                              <input type="text" placeholder="Nama halaqoh..." value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-bold outline-none" />
                              <button onClick={handleAddHalaqoh} disabled={!selectedGuruForHalaqoh} className="bg-indigo-500 text-white px-4 rounded-2xl disabled:bg-slate-200 transition-colors"><Plus size={18}/></button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tambah Halaqoh Baru Anda</label>
                          <div className="flex gap-2"> 
                            <input type="text" placeholder="Nama kelompok (Misal: Hamzah Bin Abdul Muthalib)" value={newHalaqohName} onChange={e => setNewHalaqohName(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500" />
                            <button onClick={handleAddHalaqoh} disabled={!newHalaqohName.trim()} className="bg-emerald-500 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest disabled:bg-slate-200 shadow-lg shadow-emerald-100">Simpan</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List Content */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {guruList.map(guru => {
                      // Find the correct key in guruHalaqohData case-insensitively to display the halaqoh list correctly.
                      const guruDataKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === guru.trim().toLowerCase());
                      const halaqohsForGuru = guruDataKey ? guruHalaqohData[guruDataKey] : [];
                      const linkedUser = appUsers.find(u => u.name?.trim() === guru.trim());
                      return (
                        <div key={guru} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/card">
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            {editingGuru?.oldName === guru ? (
                              <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                <input 
                                  type="text" 
                                  autoFocus 
                                  value={editingGuru.newName} 
                                  onChange={e => setEditingGuru({...editingGuru, newName: e.target.value})} 
                                  className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-sm font-bold outline-none ring-2 ring-indigo-500/10" 
                                />
                                <button onClick={handleSaveEditGuru} className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-90"><Save size={14}/></button>
                                <button onClick={() => setEditingGuru(null)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><X size={14}/></button>
                              </div>
                            ) : (
                              <>
                                <div className="min-w-0">
                                  <h4 className="font-black text-sm truncate flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><User size={12}/></div>
                                    {guru}
                                  </h4>
                                  {linkedUser && <p className="text-[10px] font-bold text-indigo-400 ml-8">@{linkedUser.username}</p>}
                                </div>
                                {isSuperAdmin && (
                                  <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingGuru({oldName: guru, newName: guru})} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
                                    <button onClick={() => requestDeleteGuru(guru)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(halaqohsForGuru || []).map(halaqoh => (
                              <React.Fragment key={halaqoh}>
                                {editingHalaqoh?.oldName === halaqoh && editingHalaqoh?.guruName === guru ? (
                                  <div className="bg-indigo-50 border border-indigo-200 p-1 rounded-xl flex items-center gap-1 shadow-sm animate-in zoom-in-95 duration-200">
                                    <input 
                                      type="text" 
                                      autoFocus 
                                      value={editingHalaqoh.newName} 
                                      onChange={e => setEditingHalaqoh({...editingHalaqoh, newName: e.target.value})} 
                                      className="w-24 bg-white border border-indigo-100 rounded-lg px-2 py-1 text-[11px] font-bold outline-none" 
                                    />
                                    <button onClick={handleSaveEditHalaqoh} className="p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Save size={12}/></button>
                                    <button onClick={() => setEditingHalaqoh(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg"><X size={12}/></button>
                                  </div>
                                ) : ( 
                                  <div className="bg-white border border-slate-200 pl-3 pr-1.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-2 transition-all hover:border-emerald-300 hover:text-emerald-700">
                                    <span>{halaqoh}</span>
                                    <div className="flex items-center gap-0.5 border-l border-slate-100 pl-1.5 ml-0.5">
                                      {isSuperAdmin && (
                                        <button onClick={() => setEditingHalaqoh({guruName: guru, oldName: halaqoh, newName: halaqoh})} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={10}/></button>
                                      )}
                                      <button onClick={() => requestDeleteHalaqoh(guru, halaqoh)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={10}/></button>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            ))} 
                            {(!halaqohsForGuru || halaqohsForGuru.length === 0) && <p className="text-[10px] text-slate-300 italic font-bold">Belum ada kelompok.</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. PENCARIAN SISWA (FOOTER SECTION) */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{isSuperAdmin ? 'Bank Data Siswa' : 'Data Siswa Saya'}</h2>
            </div>
            <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-2xl shadow-purple-900/20">
              <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6 mb-6 sm:mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Database size={32} />
                </div>
                <div className="flex-1 text-center md:text-left min-w-0">
                  <h3 className="text-xl font-black mb-1 truncate">{isSuperAdmin ? 'Bank Data (Belum Masuk Halaqoh)' : 'Cari Siswa Anda'}</h3>
                  <p className="text-slate-400 text-sm font-medium line-clamp-2">{isSuperAdmin ? 'Siswa yang telah dimasukkan ke halaqoh akan otomatis hilang dari daftar ini.' : 'Temukan data siswa di seluruh kelompok halaqoh binaan Anda.'}</p>
                </div>
                <div className="relative w-full md:w-80 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari nama siswa..." 
                      value={studentSearch} 
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"
                    /> 
                  </div>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => setIsBulkImportOpen(!isBulkImportOpen)}
                      className={`p-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${isBulkImportOpen ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
                      title="Import Masal"
                    >
                      {isBulkImportOpen ? <X size={20} strokeWidth={3}/> : <Plus size={20} strokeWidth={3} />}
                    </button>
                  )}
                </div>
              </div>

              {isBulkImportOpen && (
                <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] animate-in zoom-in-95 duration-300">
                  <label className="block text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-3">Input Masal (Format: Nama, Kelas, Halaqoh)</label>
                  <textarea 
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="Ahmad, 1A, Abu Bakar&#10;Siti, 1B, Khadijah&#10;..."
                    className="w-full h-40 bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600 resize-none mb-4"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setBulkData(''); setIsBulkImportOpen(false); }} className="px-6 py-3 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-white transition-colors">Batal</button>
                    <button onClick={processBulkImport} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95 transition-all">Proses Impor</button>
                  </div>
                </div>
              )}

              {displayedStudents.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentIds.length === displayedStudents.length && displayedStudents.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Pilih Semua di Halaman Ini</span>
                    </label>
                    
                    {selectedStudentIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsBulkEditOpen(!isBulkEditOpen)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          <Edit3 size={16} /> Edit Terpilih ({selectedStudentIds.length})
                        </button>
                        <button 
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={16} /> Hapus Terpilih ({selectedStudentIds.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {isBulkEditOpen && selectedStudentIds.length > 0 && (
                    <div className="p-4 bg-white/5 border border-blue-500/30 rounded-2xl animate-in zoom-in-95 duration-200">
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Pindah Kelas / Halaqoh Massal</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <select
                          value={bulkEditData.kelas}
                          onChange={e => setBulkEditData({...bulkEditData, kelas: e.target.value})}
                          className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">-- Jangan Ubah Kelas --</option>
                          {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                        </select>
                        <select
                          value={bulkEditData.halaqoh}
                          onChange={e => setBulkEditData({...bulkEditData, halaqoh: e.target.value})}
                          className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">-- Jangan Ubah Halaqoh --</option>
                          {Array.from(new Set(Object.values(guruHalaqohData).flat())).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsBulkEditOpen(false)} className="px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-white transition-colors">Batal</button>
                        <button onClick={handleExecuteBulkEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Simpan Perubahan</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedStudents.map(s => (
                  <div key={s.id} className={`bg-white/5 border ${selectedStudentIds.includes(s.id) ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10'} rounded-3xl p-4 sm:p-5 flex items-center justify-between transition-all hover:bg-white/10 group gap-4`}>
                    <div className="min-w-0 flex-1 flex items-center gap-3 sm:gap-4">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleSelectStudent(s.id)}
                        className="w-5 h-5 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1"> 
                        <p className={`font-black text-white leading-tight mb-1 ${s.name.length > 24 ? 'text-xs sm:text-sm whitespace-normal line-clamp-2' : s.name.length > 18 ? 'text-sm sm:text-[15px] whitespace-normal line-clamp-2' : 'text-sm sm:text-base truncate'}`}>{s.name}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest truncate">
                          Halaqoh: <span className="text-white">{s.halaqoh || 'Unassigned'}</span> • {s.kelas || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEditStudentModal(s)} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => requestDeleteStudent(s)} className="p-2 sm:p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl sm:rounded-2xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {studentSearch && displayedStudents.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-slate-500 font-bold italic">
                    Data siswa tidak ditemukan di database.
                  </div>
                )}
              </div>

              {/* Tombol Load More untuk Scroll Data Siswa */}
              {visibleCount < filteredStudentsMaster.length && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-8 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    Muat {filteredStudentsMaster.length - visibleCount} Siswa Lainnya
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 5. TOMBOL KELUAR (KHUSUS MOBILE) */}
          <div className="md:hidden pt-4">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 p-5 bg-white border-2 border-red-100 text-red-600 rounded-[2rem] font-black shadow-xl shadow-red-900/5 active:scale-95 transition-all"
            >
              <LogOut size={20} />
              Keluar dari Akun
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;