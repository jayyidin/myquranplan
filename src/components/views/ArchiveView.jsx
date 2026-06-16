import React, { useState, useEffect, useMemo } from 'react';
import { Archive, Download, ChevronLeft, Calendar, Database } from 'lucide-react';
import { supabase } from '../supabase';
import ReportView from './ReportView';
import { getMonday, formatDateObj } from '../../utils/helpers';

const ArchiveView = ({ isSuperAdmin, currentUser, institutionLogo, guruHalaqohData }) => {
  const [archives, setArchives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archivedStudents, setArchivedStudents] = useState([]);

  // ReportView dependencies
  const [activeGuru, setActiveGuru] = useState('');
  const [activeHalaqoh, setActiveHalaqoh] = useState('');
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [activeDate, setActiveDate] = useState(formatDateObj(new Date()));

  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const changeWeek = (offset) => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + offset);
    setWeekStart(newWeekStart);
    setActiveDate(formatDateObj(newWeekStart));
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('archived_semesters').select('id, semester_name, created_at').order('created_at', { ascending: false });
    if (!error && data) {
      setArchives(data);
    }
    setIsLoading(false);
  };

  const loadArchiveData = async (archive) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('archived_semesters').select('data, created_at').eq('id', archive.id).single();
    if (!error && data) {
      setSelectedArchive(archive);
      setArchivedStudents(data.data);
      // Set default week to the date of archive creation
      const archiveDate = new Date(data.created_at);
      const monday = getMonday(archiveDate);
      setWeekStart(monday);
      setActiveDate(formatDateObj(monday));

      if (isSuperAdmin) {
        setActiveGuru('');
        setActiveHalaqoh('');
      } else {
        const teacherName = currentUser?.name || "";
        setActiveGuru(teacherName);
        const searchName = teacherName.trim().toLowerCase();
        const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
        const halaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];
        if (halaqohs.length > 0) setActiveHalaqoh(halaqohs[0]);
      }
    }
    setIsLoading(false);
  };

  const handleDownloadJson = async (archive, e) => {
    e.stopPropagation();
    const { data, error } = await supabase.from('archived_semesters').select('data').eq('id', archive.id).single();
    if (!error && data) {
      const backupData = {
        semester: archive.semester_name,
        tanggal_backup: archive.created_at,
        data_siswa: data.data
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `arsip_${archive.semester_name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const filteredStudents = useMemo(() => {
    return archivedStudents.filter(s => {
      const isInActiveHalaqoh = !activeHalaqoh || (s?.halaqoh && String(s.halaqoh).trim() === String(activeHalaqoh).trim());

      if (!isSuperAdmin) {
        const searchName = currentUser?.name?.trim().toLowerCase() || "";
        const guruKey = Object.keys(guruHalaqohData).find(k => k.trim().toLowerCase() === searchName);
        const myHalaqohs = guruKey ? (guruHalaqohData[guruKey] || []) : [];
        const isMyStudent = activeHalaqoh ? isInActiveHalaqoh : myHalaqohs.includes(s?.halaqoh?.trim());
        return isMyStudent;
      }
      return isInActiveHalaqoh;
    });
  }, [archivedStudents, activeHalaqoh, isSuperAdmin, currentUser, guruHalaqohData]);

  if (isLoading) {
    return <div className="flex-1 flex justify-center items-center py-20 bg-slate-50"><div className="animate-spin text-emerald-500 w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full"></div></div>;
  }

  if (selectedArchive) {
    const guruList = isSuperAdmin ? Object.keys(guruHalaqohData) : [currentUser?.name];
    const halaqohOptions = activeGuru ? (guruHalaqohData[activeGuru] || []) : Array.from(new Set(archivedStudents.map(s => s.halaqoh).filter(Boolean)));

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between shadow-sm z-10 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedArchive(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h2 className="font-black text-slate-800 text-sm sm:text-lg">Arsip: {selectedArchive.semester_name}</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500">Melihat {filteredStudents.length} siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isSuperAdmin && (
              <select value={activeGuru} onChange={(e) => { setActiveGuru(e.target.value); setActiveHalaqoh(''); }} className="flex-1 sm:flex-none bg-gray-50 border border-slate-200 rounded-lg p-2 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Semua Guru</option>
                {guruList.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <select value={activeHalaqoh} onChange={(e) => setActiveHalaqoh(e.target.value)} className="flex-1 sm:flex-none bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">Semua Halaqoh</option>
              {halaqohOptions.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <ReportView activeHalaqoh={activeHalaqoh} activeGuru={activeGuru} activeDate={activeDate} setActiveDate={setActiveDate} weekDates={weekDates} changeWeek={changeWeek} filteredStudents={filteredStudents} institutionLogo={institutionLogo} guruHalaqohData={guruHalaqohData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0"><Archive size={28} /></div>
          <div><h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Arsip Semester</h1><p className="text-sm text-slate-500 font-medium mt-1">Lihat kembali riwayat nilai dan jurnal siswa dari semester sebelumnya.</p></div>
        </div>
        {archives.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-slate-400"><Database size={48} className="mb-4 opacity-50" /><p className="font-bold text-lg">Belum Ada Arsip</p><p className="text-sm text-center mt-2">Arsip akan otomatis terbuat saat Super Admin melakukan "Tutup Semester".</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archives.map(archive => (
              <div key={archive.id} onClick={() => loadArchiveData(archive)} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col">
                <div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Archive size={24} /></div><button onClick={(e) => handleDownloadJson(archive, e)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Unduh Backup JSON"><Download size={18} /></button></div>
                <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2">{archive.semester_name}</h3>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-auto pt-4"><Calendar size={14} /> Dibuat: {new Date(archive.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ArchiveView;