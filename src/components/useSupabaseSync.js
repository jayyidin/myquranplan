import { useEffect } from 'react';
import { supabase } from '../components/supabase';

export const useSupabaseSync = ({
  isSuperAdmin,
  setGuruHalaqohData,
  setKelasList,
  setInstitutionName,
  setInstitutionLogo,
  setTargetReguler,
  setTargetAlQuran,
  setStudents,
  setAppUsers,
  setIsDbReady
}) => {
  useEffect(() => {
    async function fetchInitialData() {
      // 1. Ambil data pengaturan
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (settingsError) console.error('Error Settings:', settingsError);
      if (settingsData) {
        setGuruHalaqohData(settingsData.guruhalaqohdata || settingsData.guruHalaqohData || {});
        setKelasList(settingsData.kelaslist || settingsData.kelasList || []);
        setInstitutionName(settingsData.institutionname || settingsData.institutionName || 'Nama Sekolah Anda');
        setInstitutionLogo(settingsData.institutionlogo || settingsData.institutionLogo || 'logo.png');
        setTargetReguler(settingsData.targetreguler || settingsData.targetReguler || '2 Juz');
        setTargetAlQuran(settingsData.targetalquran || settingsData.targetAlQuran || '');
      }

      // 2. Ambil data siswa dengan Pagination Loop
      let allStudentsData = [];
      let fetchMore = true;
      let fromRecord = 0;
      const fetchLimit = 1000;

      while (fetchMore) {
        const { data: chunkData, error: chunkError } = await supabase.from('students').select('*').range(fromRecord, fromRecord + fetchLimit - 1);
        if (chunkError) { console.error('Error fetching students chunk:', chunkError); break; }
        if (chunkData && chunkData.length > 0) {
          allStudentsData = [...allStudentsData, ...chunkData];
          fromRecord += fetchLimit;
          if (chunkData.length < fetchLimit) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      if (allStudentsData) {
        const uniqueStudentsMap = new Map();
        const duplicateIdsToDelete = [];
        const studentsToUpdateMap = new Map();

        allStudentsData.forEach(s => {
          const nameKey = (s?.name || '').trim().toLowerCase();
          if (!uniqueStudentsMap.has(nameKey)) {
             uniqueStudentsMap.set(nameKey, s);
          } else {
             const existing = uniqueStudentsMap.get(nameKey);
             const mergedRecords = { ...(existing.records || {}), ...(s.records || {}) };
             
             if (!existing.halaqoh && s.halaqoh) {
                duplicateIdsToDelete.push(existing.id);
                const keptStudent = { ...s, records: mergedRecords };
                uniqueStudentsMap.set(nameKey, keptStudent);
                studentsToUpdateMap.set(keptStudent.id, keptStudent);
             } else {
                duplicateIdsToDelete.push(s.id);
                const keptStudent = { ...existing, records: mergedRecords };
                uniqueStudentsMap.set(nameKey, keptStudent);
                studentsToUpdateMap.set(keptStudent.id, keptStudent);
             }
          }
        });
        
        setStudents(Array.from(uniqueStudentsMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

        if (duplicateIdsToDelete.length > 0) {
          supabase.from('students').delete().in('id', duplicateIdsToDelete).then();
          studentsToUpdateMap.forEach(student => supabase.from('students').update({ records: student.records }).eq('id', student.id).then());
        }
      }

      // 3. Ambil data pengguna
      if (isSuperAdmin) {
        const { data: usersData } = await supabase.from('app_users').select('*');
        if (usersData) setAppUsers(usersData);
      }
      setIsDbReady(true);
    }

    fetchInitialData();

    const studentsSubscription = supabase.channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        setStudents(currentStudents => {
          if (payload.eventType === 'INSERT') return currentStudents.some(s => s.id === payload.new.id) ? currentStudents : [...currentStudents, payload.new];
          if (payload.eventType === 'UPDATE') return currentStudents.map(s => s.id === payload.new.id ? payload.new : s);
          if (payload.eventType === 'DELETE') return currentStudents.filter(s => s.id !== payload.old.id);
          return currentStudents;
        });
      }).subscribe();

    const settingsSubscription = supabase.channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, payload => {
        if (payload.new) {
          setGuruHalaqohData(payload.new.guruhalaqohdata || payload.new.guruHalaqohData || {});
          setKelasList(payload.new.kelaslist || payload.new.kelasList || []);
        }
      }).subscribe();

    return () => { supabase.removeChannel(studentsSubscription); supabase.removeChannel(settingsSubscription); };
  }, [isSuperAdmin]);
};