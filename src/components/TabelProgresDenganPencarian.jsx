import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

/**
 * Komponen untuk menampilkan tabel progres siswa dengan fungsionalitas pencarian.
 * @param {Array} students - Daftar siswa dalam halaqoh. Contoh: [{ id: '1', name: 'Ahmad' }, ...]
 * @param {Function} onOpenModal - Fungsi yang dipanggil saat tombol 'Input' diklik. Menerima (student, category).
 */
const TabelProgresDenganPencarian = ({ students = [], onOpenModal }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Gunakan useMemo untuk efisiensi, agar filter tidak berjalan pada setiap render
    // kecuali jika `students` atau `searchTerm` berubah.
    const filteredStudents = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            return students;
        }
        return students.filter(student =>
            student.name.toLowerCase().includes(term)
        );
    }, [students, searchTerm]);

    return (
        <div className="w-full bg-white dark:bg-slate-900/70 p-4 sm:p-6 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-colors duration-500">
            {/* --- Kotak Pencarian Siswa --- */}
            <div className="relative mb-4">
                <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    size={20}
                />
                <input
                    type="text"
                    placeholder={`Cari dari ${students.length} siswa di halaqoh ini...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 dark:text-slate-100 transition-all"
                />
            </div>

            {/* --- Tabel Daftar Siswa (Hasil Filter) --- */}
            <div className="overflow-x-auto hide-scrollbar overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-center border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="p-3 text-left sticky left-0 bg-white dark:bg-slate-900/70 z-10 w-[240px]">
                                Nama Siswa
                            </th>
                            <th className="p-3">Tahsin</th>
                            <th className="p-3">Tahfidz</th>
                            <th className="p-3">Murojaah</th>
                            <th className="p-3">Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    className="group border-b border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors duration-200"
                                >
                                    <td className="p-3 text-left sticky left-0 bg-white dark:bg-slate-900/70 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 z-10 font-semibold text-slate-700 dark:text-slate-200 transition-colors duration-200">
                                        <div className={`leading-tight ${student.name.length > 24 ? 'text-[10px] sm:text-xs whitespace-normal line-clamp-2' : student.name.length > 18 ? 'text-xs sm:text-sm whitespace-normal line-clamp-2' : 'text-sm'}`}>
                                            {student.name}
                                        </div>
                                    </td>
                                    {/* Tombol ini akan memicu fungsi onOpenModal yang di-pass dari parent */}
                                    <td className="p-3"><button onClick={() => onOpenModal(student, 'tahsin')} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Input</button></td>
                                    <td className="p-3"><button onClick={() => onOpenModal(student, 'tahfidz')} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Input</button></td>
                                    <td className="p-3"><button onClick={() => onOpenModal(student, 'murojaah')} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Input</button></td>
                                    <td className="p-3"><button onClick={() => onOpenModal(student, 'catatan')} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Input</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-16 text-slate-500 font-medium">
                                    {searchTerm
                                        ? `Siswa dengan nama "${searchTerm}" tidak ditemukan.`
                                        : 'Tidak ada siswa dalam halaqoh ini.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TabelProgresDenganPencarian;