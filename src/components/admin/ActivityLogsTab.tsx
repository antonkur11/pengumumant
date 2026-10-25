import React, { useState, useEffect } from 'react';
import { History, Download, FileSpreadsheet, ShieldAlert, RefreshCw, Loader2 } from 'lucide-react';
import { ActivityLog, DownloadLog, ImportHistory } from '../../types.ts';
import { getAdminLogs } from '../../services/api.ts';

export const ActivityLogsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'activity' | 'downloads' | 'imports'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await getAdminLogs();
      if (res.success) {
        setActivityLogs(res.activityLogs || []);
        setDownloadLogs(res.downloadLogs || []);
        setImportHistory(res.importHistory || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Sub-tabs */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-blue-900" />
          <h3 className="font-extrabold text-base text-slate-900">
            Log Aktivitas & Riwayat Audit Sistem
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('activity')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'activity' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Aktivitas Admin ({activityLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('downloads')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'downloads' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Unduhan SKL ({downloadLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('imports')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'imports' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Riwayat Impor ({importHistory.length})
            </button>
          </div>

          <button
            onClick={loadLogs}
            title="Refresh Log"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Tables */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
            <span className="ml-3 font-semibold text-slate-600">Memuat log...</span>
          </div>
        ) : activeSubTab === 'activity' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aktor / Admin</th>
                  <th className="py-3 px-4">Jenis Aktivitas</th>
                  <th className="py-3 px-4">Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada catatan aktivitas.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.aktor}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/60">
                          {log.jenis_aktivitas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeSubTab === 'downloads' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu Unduh</th>
                  <th className="py-3 px-4">NISN Siswa</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4 text-center">Status Unduhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downloadLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada riwayat unduhan SKL.
                    </td>
                  </tr>
                ) : (
                  downloadLogs.map((dl) => (
                    <tr key={dl.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(dl.waktu_download).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{dl.nisn}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{dl.nama_siswa}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {dl.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu Impor</th>
                  <th className="py-3 px-4">Nama File</th>
                  <th className="py-3 px-4 text-center">Total Baris</th>
                  <th className="py-3 px-4 text-center text-emerald-700">Berhasil</th>
                  <th className="py-3 px-4 text-center text-rose-700">Gagal</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada riwayat impor data.
                    </td>
                  </tr>
                ) : (
                  importHistory.map((imp) => (
                    <tr key={imp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(imp.waktu_impor).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{imp.nama_file}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">{imp.total_data}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {imp.berhasil}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                        {imp.gagal}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{imp.admin_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
