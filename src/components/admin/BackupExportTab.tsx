import React, { useState } from 'react';
import { DownloadCloud, FileText, Database, ShieldCheck, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { authStorage } from '../../services/api.ts';

export const BackupExportTab: React.FC = () => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleDownload = async (url: string, filename: string, type: string) => {
    try {
      setDownloadingFormat(type);
      setSuccessNotice(null);
      const token = authStorage.getToken();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal mengekspor data.');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccessNotice(`File ${filename} berhasil diunduh.`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh file ekspor.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Backup & Ekspor Data Sistem
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Unduh salinan data siswa atau cadangkan seluruh konfigurasi sistem untuk arsip sekolah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export CSV */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Ekspor Data Siswa (CSV)</h4>
              <p className="text-xs text-slate-500">
                Format spreadsheet standar untuk dibuka di Microsoft Excel atau Google Sheets.
              </p>
            </div>
            <button
              onClick={() =>
                handleDownload(
                  '/api/admin/export/students?format=csv',
                  'data_siswa_kelulusan.csv',
                  'csv'
                )
              }
              disabled={downloadingFormat === 'csv'}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {downloadingFormat === 'csv' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh File CSV</span>
            </button>
          </div>

          {/* Export JSON */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Ekspor Data Siswa (JSON)</h4>
              <p className="text-xs text-slate-500">
                Format terstruktur untuk integrasi dengan sistem informasi akademik sekolah lainnya.
              </p>
            </div>
            <button
              onClick={() =>
                handleDownload(
                  '/api/admin/export/students?format=json',
                  'data_siswa_kelulusan.json',
                  'json'
                )
              }
              disabled={downloadingFormat === 'json'}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {downloadingFormat === 'json' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh File JSON</span>
            </button>
          </div>

          {/* Full Backup */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Cadangan Penuh (Full Backup)</h4>
              <p className="text-xs text-slate-500">
                Mencadangkan seluruh data siswa, profil sekolah, template SKL, dan konfigurasi.
              </p>
            </div>
            <button
              onClick={() =>
                handleDownload(
                  '/api/admin/export/backup',
                  'backup_sistem_kelulusan.json',
                  'backup'
                )
              }
              disabled={downloadingFormat === 'backup'}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {downloadingFormat === 'backup' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh Full Backup</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Arsip ekspor ini dilindungi dengan validasi hak akses token administrator dan tidak mengandung password hash.
          </span>
        </div>
      </div>
    </div>
  );
};
