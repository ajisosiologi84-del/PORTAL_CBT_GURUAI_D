import React, { useState } from 'react';
import { X, Database, Download, Upload, Copy, Check, ShieldCheck, RefreshCw, Users, GraduationCap, Shield } from 'lucide-react';
import { StudentUser, TeacherUser, AdminUser } from '../types';

export interface UserBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers: TeacherUser[];
  admins: AdminUser[];
  onRestoreUsers: (data: { students: StudentUser[]; teachers: TeacherUser[]; admins: AdminUser[] }) => void;
  showAlert?: (msg: string) => void;
}

export const UserBackupModal: React.FC<UserBackupModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  admins,
  onRestoreUsers,
  showAlert = alert,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const backupData = {
        students,
        teachers,
        admins,
        exportDate: new Date().toISOString(),
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `cbt-user-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg('Backup data user (Siswa, Guru, Admin) berhasil diunduh.');
    } catch (err) {
      setErrorMsg('Gagal mengunduh file backup JSON.');
    }
  };

  const handleCopyJSON = () => {
    try {
      const backupData = { students, teachers, admins };
      navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setErrorMsg('Gagal menyalin data ke clipboard.');
    }
  };

  const handleImportJSON = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!jsonInput.trim()) {
      setErrorMsg('Silakan tempelkan data JSON backup terlebih dahulu.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const restoredStudents = Array.isArray(parsed.students) ? parsed.students : [];
      const restoredTeachers = Array.isArray(parsed.teachers) ? parsed.teachers : [];
      const restoredAdmins = Array.isArray(parsed.admins) ? parsed.admins : [];

      if (restoredStudents.length === 0 && restoredTeachers.length === 0 && restoredAdmins.length === 0) {
        throw new Error('Data user tidak ditemukan dalam JSON.');
      }

      onRestoreUsers({
        students: restoredStudents,
        teachers: restoredTeachers,
        admins: restoredAdmins,
      });

      setSuccessMsg('Data master user berhasil dipulihkan!');
      setJsonInput('');
    } catch (err: any) {
      setErrorMsg(`Gagal memulihkan data: ${err.message || 'Format JSON tidak valid.'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const restoredStudents = Array.isArray(parsed.students) ? parsed.students : [];
        const restoredTeachers = Array.isArray(parsed.teachers) ? parsed.teachers : [];
        const restoredAdmins = Array.isArray(parsed.admins) ? parsed.admins : [];

        onRestoreUsers({
          students: restoredStudents,
          teachers: restoredTeachers,
          admins: restoredAdmins,
        });

        setSuccessMsg('Backup file JSON user berhasil diimpor!');
      } catch (err: any) {
        setErrorMsg(`Gagal mengimpor file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                Cadangan Data Master User
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Penyimpanan cadangan terpusat untuk Data Siswa, Guru, dan Admin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-slate-50/50">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-center justify-between font-semibold">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-xs underline ml-2">Tutup</button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 text-xs flex items-center justify-between font-semibold">
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="text-xs underline ml-2">Tutup</button>
            </div>
          )}

          {/* Stats Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-800">{students.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Siswa</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
              <GraduationCap className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-800">{teachers.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Guru</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
              <Shield className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="text-lg font-black text-slate-800">{admins.length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Admin</div>
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">1. Ekspor Cadangan Data</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all text-slate-800 shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Unduh File Backup (.json)
              </button>
              <button
                onClick={handleCopyJSON}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all text-slate-800 shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-600" />}
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Teks JSON'}
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">2. Pulihkan Data Dari Backup</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors text-slate-700 shadow-2xs">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pilih File Backup JSON dari Komputer</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Atau tempelkan kode struktur JSON backup user di sini..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleImportJSON}
                  disabled={!jsonInput.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Pulihkan Data User Dari Teks JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
