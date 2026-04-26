import React, { useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase'; // Pastikan file config Firebase ini masih ada
import { supabase } from './supabase';

export default function MigrationTool() {
  const [log, setLog] = useState([]);
  const [isMigrating, setIsMigrating] = useState(false);

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleMigrate = async () => {
    setIsMigrating(true);
    addLog('Memulai migrasi data...');

    try {
      // 1. MIGRASI PENGATURAN (SETTINGS)
      addLog('1. Mengambil data Settings dari Firebase...');
      const settingsSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'));

      if (settingsSnap.exists()) {
        addLog('   Menyimpan Settings ke Supabase...');
        const data = settingsSnap.data();
        const { error } = await supabase.from('settings').upsert({ 
          id: 1, 
          guruhalaqohdata: data.guruHalaqohData || {},
          kelaslist: data.kelasList || [],
          institutionname: data.institutionName || 'Nama Sekolah Anda',
          institutionlogo: data.institutionLogo || null
        });
        if (error) addLog(`   ❌ Error Settings: ${error.message}`);
      }

      // 2. MIGRASI DATA PENGGUNA (GURU)
      addLog('2. Mengambil data App Users dari Firebase...');
      const usersSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'));
      
      for (const d of usersSnap.docs) {
        const data = d.data();
        try {
          const { error } = await supabase.from('app_users').insert([{
            username: d.id, // Di Firebase, ID dokumennya adalah username
            name: data.name,
            password: data.password,
            role: data.role,
            status: data.status,
            resetrequested: data.resetRequested || false
          }]);
          if (error) throw new Error(error.message);
          addLog(`   ✅ User diproses: ${data.name}`);
        } catch (e) {
          addLog(`   ❌ Gagal user ${data.name}: ${e.message}`);
        }
      }

      // 3. MIGRASI DATA SISWA
      addLog('3. Mengambil data Students dari Firebase...');
      const studentsSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
      
      for (const d of studentsSnap.docs) {
        const data = d.data();
        try {
          const { error } = await supabase.from('students').insert([{
            // id: d.id, -> Kita tidak memasukkan ID lama karena Supabase akan membuatkan ID (angka) baru secara otomatis. 
            name: data.name,
            kelas: data.kelas || '',
            halaqoh: data.halaqoh || '',
            initial: data.initial || '',
            photo: data.photo || null,
            records: data.records || {}
          }]);
          if (error) throw new Error(error.message);
          addLog(`   ✅ Siswa diproses: ${data.name}`);
        } catch (e) {
          addLog(`   ❌ Gagal siswa ${data.name}: ${e.message}`);
        }
      }

      addLog('🎉 MIGRASI SELESAI! Data berhasil disedot ke Supabase.');
    } catch (error) {
      console.error(error);
      addLog(`❌ TERJADI KESALAHAN FATAL: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 flex flex-col items-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full border border-gray-100">
        <h1 className="text-3xl font-black mb-4 text-slate-800">Sedot Data (Firebase ➡ Supabase)</h1>
        <p className="text-slate-500 mb-8 leading-relaxed font-medium">Alat ini akan menarik seluruh data Pengaturan, Akun Guru, dan Riwayat Siswa dari database Firebase lamamu, lalu memasukkannya ke rumah barunya di Supabase.</p>

        <button onClick={handleMigrate} disabled={isMigrating} className="w-full bg-emerald-500 text-white font-black text-lg py-4 rounded-2xl hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 mb-8 active:scale-95">
          {isMigrating ? 'Menyedot Data...' : 'Mulai Eksekusi Sedot Data'}
        </button>

        <div className="bg-slate-900 text-emerald-400 p-5 rounded-2xl h-80 overflow-y-auto font-mono text-xs sm:text-sm text-left custom-scrollbar leading-relaxed">
          {log.length === 0 ? '> Menyiapkan sistem. Klik tombol di atas untuk memulai...' : log.map((msg, i) => <div key={i} className="mb-1">{'>'} {msg}</div>)}
        </div>
      </div>
    </div>
  );
}