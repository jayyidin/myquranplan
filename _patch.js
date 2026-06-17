const fs = require('fs');
const mainAppPath = 'c:/Users/Hype G12/myquranplan/src/components/MainApp.jsx';
const studentViewPath = 'c:/Users/Hype G12/myquranplan/src/components/views/StudentView.jsx';
const settingsViewPath = 'c:/Users/Hype G12/myquranplan/src/components/views/SettingsView.jsx';

// ============ MAINAPP.JSX ============
let c = fs.readFileSync(mainAppPath, 'utf8');

// 1. Replace requestDeleteStudent with simplified version + add requestRemoveFromHalaqoh
const startMarker = '  const requestDeleteStudent = (student) => {';
const endMarker = '  };\n\n  const requestBulkDeleteStudents';
const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('MARKERS NOT FOUND:', startIdx, endIdx);
  process.exit(1);
}

const newFuncs = `  const requestDeleteStudent = (student) => {
    setConfirmDialog({
      isOpen: true,
      message: \`Yakin ingin menghapus "\${student.name}" secara permanen dari sistem? Data tidak dapat dikembalikan!\`,
      onConfirm: () => {
        if (student.photo) {
          const match = student.photo.match(/student_photos\\/(.+?)(\\?|$)/);
          if (match && match[1]) {
            supabase.storage.from('student_photos').remove([match[1]]).catch(console.error);
          }
        }
        supabase.from('students').delete().eq('id', student.id).then(() => {
          setStudents(prev => prev.filter(s => s.id !== student.id));
          showToast('Dihapus.');
        });
      }
    });
  };

  const requestRemoveFromHalaqoh = (student) => {
    const halaqoh = (student.halaqoh || '').trim();
    if (!halaqoh) { showToast('Siswa ini belum memiliki halaqoh.'); return; }
    setConfirmDialog({
      isOpen: true,
      message: \`Keluarkan "\${student.name}" dari halaqoh \${halaqoh}? Siswa akan kembali ke Bank Data Siswa dan bisa dimasukkan ke halaqoh lain nanti.\`,
      onConfirm: () => {
        supabase.from('students').update({ halaqoh: '' }).eq('id', student.id).then(() => {
          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, halaqoh: '' } : s));
          showToast('Siswa berhasil dikeluarkan dari halaqoh dan dikembalikan ke Bank Data Siswa.');
        });
      }
    });
  };`;

c = c.slice(0, startIdx) + newFuncs + c.slice(endIdx);
console.log('Replacement 1 (requestDeleteStudent + requestRemoveFromHalaqoh): OK');

// 2. Add requestRemoveFromHalaqoh to StudentView props
const svOld = 'requestDeleteStudent={requestDeleteStudent} isSuperAdmin={isSuperAdmin}';
const svNew = 'requestDeleteStudent={requestDeleteStudent} requestRemoveFromHalaqoh={requestRemoveFromHalaqoh} isSuperAdmin={isSuperAdmin}';
if (c.includes(svOld)) { c = c.replace(svOld, svNew); console.log('Replacement 2 (StudentView props): OK'); }
else { console.log('Replacement 2: NOT FOUND'); }

// 3. Add requestRemoveFromHalaqoh to SettingsView props
const setOld = 'requestDeleteStudent={requestDeleteStudent} requestBulkDeleteStudents={requestBulkDeleteStudents}';
const setNew = 'requestDeleteStudent={requestDeleteStudent} requestRemoveFromHalaqoh={requestRemoveFromHalaqoh} requestBulkDeleteStudents={requestBulkDeleteStudents}';
if (c.includes(setOld)) { c = c.replace(setOld, setNew); console.log('Replacement 3 (SettingsView props): OK'); }
else { console.log('Replacement 3: NOT FOUND'); }

fs.writeFileSync(mainAppPath, c, 'utf8');
console.log('MainApp.jsx saved.');

// ============ STUDENTVIEW.JSX ============
let sv = fs.readFileSync(studentViewPath, 'utf8');

// Add LogOut to imports
const oldImports = "import { Users, Settings, Plus, Edit3, Trash2, Camera, GripVertical, Search, X, ChevronUp, ChevronDown, ArrowUp, User, Save, FolderPlus, Database, Download, Printer, List, LayoutGrid, ArrowUpDown, ClipboardCheck, BarChart3, AlertTriangle, ArrowRightLeft } from 'lucide-react';";
const newImports = "import { Users, Settings, Plus, Edit3, Trash2, Camera, GripVertical, Search, X, ChevronUp, ChevronDown, ArrowUp, User, Save, FolderPlus, Database, Download, Printer, List, LayoutGrid, ArrowUpDown, ClipboardCheck, BarChart3, AlertTriangle, ArrowRightLeft, LogOut } from 'lucide-react';";
if (sv.includes(oldImports)) { sv = sv.replace(oldImports, newImports); console.log('StudentView import: OK'); }
else { console.log('StudentView import: NOT FOUND'); }

// Add requestRemoveFromHalaqoh to StudentDataSection props
const sdOld = 'const StudentDataSection = ({ students, openEditStudentModal, requestDeleteStudent, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents, kelasList, guruHalaqohData, currentUser, showToast })';
const sdNew = 'const StudentDataSection = ({ students, openEditStudentModal, requestDeleteStudent, requestRemoveFromHalaqoh, requestBulkDeleteStudents, requestBulkEditStudents, handleBulkSaveStudents, kelasList, guruHalaqohData, currentUser, showToast })';
if (sv.includes(sdOld)) { sv = sv.replace(sdOld, sdNew); console.log('StudentDataSection props: OK'); }
else { console.log('StudentDataSection props: NOT FOUND'); }

// Replace student card trash button to show "Keluarkan dari Halaqoh" when student has halaqoh
const trashOld = `<button onClick={() => requestDeleteStudent(student)} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-white hover:bg-red-500 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title={isSuperAdmin ? "Hapus Siswa (Permanen)" : "Keluarkan dari Halaqoh"}><Trash2 size={16}/></button>`;
const trashNew = `{student.halaqoh && student.halaqoh.trim() !== '' ? (
                <button onClick={() => requestRemoveFromHalaqoh(student)} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-orange-600 hover:bg-orange-50 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title="Keluarkan dari Halaqoh (kembali ke Bank Data)"><LogOut size={16}/></button>
                ) : null}
                <button onClick={() => requestDeleteStudent(student)} className="flex items-center justify-center p-2.5 sm:p-2 text-gray-400 bg-gray-50 hover:text-white hover:bg-red-500 rounded-lg md:rounded-xl transition-all shadow-sm active:scale-95" title={isSuperAdmin ? "Hapus Siswa (Permanen)" : "Hapus Siswa"}><Trash2 size={16}/></button>`;
if (sv.includes(trashOld)) { sv = sv.replace(trashOld, trashNew); console.log('StudentView trash button: OK'); }
else { console.log('StudentView trash button: NOT FOUND'); }

// Also update the main StudentView component to accept and pass requestRemoveFromHalaqoh
// Find the StudentView function signature - it receives props from MainApp
// Look for where requestDeleteStudent is destructured in the main StudentView component
const svMainOld = 'requestDeleteStudent,';
const svMainNew = 'requestDeleteStudent, requestRemoveFromHalaqoh,';
// Only replace the first occurrence (in the main component, not StudentDataSection)
const svMainIdx = sv.indexOf(svMainOld);
if (svMainIdx !== -1) {
  sv = sv.slice(0, svMainIdx) + svMainNew + sv.slice(svMainIdx + svMainOld.length);
  console.log('StudentView main destructuring: OK');
} else {
  console.log('StudentView main destructuring: NOT FOUND');
}

// Pass requestRemoveFromHalaqoh to StudentDataSection where it's rendered
const sdRenderOld = 'requestDeleteStudent={requestDeleteStudent}';
const sdRenderNew = 'requestDeleteStudent={requestDeleteStudent} requestRemoveFromHalaqoh={requestRemoveFromHalaqoh}';
// Find in the StudentDataSection render call (inside StudentView)
if (sv.includes(sdRenderOld)) { sv = sv.replace(sdRenderOld, sdRenderNew); console.log('StudentDataSection render prop: OK'); }
else { console.log('StudentDataSection render prop: NOT FOUND'); }

fs.writeFileSync(studentViewPath, sv, 'utf8');
console.log('StudentView.jsx saved.');

// ============ SETTINGSVIEW.JSX ============
let stv = fs.readFileSync(settingsViewPath, 'utf8');

// Add LogOut to imports
const stvImportOld = '  UserCheck, CheckCircle2, X, ImageIcon, Camera,';
const stvImportNew = '  UserCheck, CheckCircle2, X, ImageIcon, Camera, LogOut,';
if (stv.includes(stvImportOld)) { stv = stv.replace(stvImportOld, stvImportNew); console.log('SettingsView import: OK'); }
else { console.log('SettingsView import: NOT FOUND'); }

// Add requestRemoveFromHalaqoh to SettingsView destructured props
// Look for where requestDeleteStudent is destructured
const stvPropsOld = 'requestDeleteStudent,';
const stvPropsNew = 'requestDeleteStudent, requestRemoveFromHalaqoh,';
const stvPropsIdx = stv.indexOf(stvPropsOld);
if (stvPropsIdx !== -1) {
  stv = stv.slice(0, stvPropsIdx) + stvPropsNew + stv.slice(stvPropsIdx + stvPropsOld.length);
  console.log('SettingsView props destructure: OK');
} else {
  console.log('SettingsView props destructure: NOT FOUND');
}

// Update student card in Bank Data Siswa to add "Keluarkan dari Halaqoh" button
// The current card has: Edit button + Hapus button in a 2-col grid
const stvCardOld = `<div className="grid grid-cols-2 gap-2">
                          <button onClick={() => openEditStudentModal(s)} className="flex justify-center items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-black text-xs active:scale-95 transition-all"><Edit3 size={16} /> Edit</button>
                          <button onClick={() => requestDeleteStudent(s)} className="flex justify-center items-center gap-2 p-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-black text-xs active:scale-95 transition-all"><Trash2 size={16} /> Hapus</button>
                        </div>`;
const stvCardNew = `<div className="grid grid-cols-3 gap-2">
                          <button onClick={() => openEditStudentModal(s)} className="flex justify-center items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-black text-xs active:scale-95 transition-all"><Edit3 size={16} /> Edit</button>
                          {s.halaqoh && s.halaqoh.trim() !== '' ? (
                            <button onClick={() => requestRemoveFromHalaqoh(s)} className="flex justify-center items-center gap-2 p-3 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl font-black text-xs active:scale-95 transition-all"><LogOut size={16} /> Keluarkan</button>
                          ) : (
                            <button disabled className="flex justify-center items-center gap-2 p-3 bg-slate-50 text-slate-300 rounded-xl font-black text-xs cursor-not-allowed"><LogOut size={16} /> Keluarkan</button>
                          )}
                          <button onClick={() => requestDeleteStudent(s)} className="flex justify-center items-center gap-2 p-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-black text-xs active:scale-95 transition-all"><Trash2 size={16} /> Hapus</button>
                        </div>`;
if (stv.includes(stvCardOld)) { stv = stv.replace(stvCardOld, stvCardNew); console.log('SettingsView card: OK'); }
else { console.log('SettingsView card: NOT FOUND'); }

fs.writeFileSync(settingsViewPath, stv, 'utf8');
console.log('SettingsView.jsx saved.');
console.log('All patches applied!');
