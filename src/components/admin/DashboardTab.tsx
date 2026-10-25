import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { DashboardStats, SchoolSettings } from '../../types.ts';
import { getAdminStats } from '../../services/api.ts';
import { AdminTab } from './AdminLayout.tsx';

interface DashboardTabProps {
  settings: SchoolSettings;
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ settings, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAdminStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat statistik dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-8 h-8 text-blue-700 animate-spin" />
        <span className="ml-3 font-semibold text-slate-600">Memuat statistik sistem...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Gagal mengambil data statistik.'}</span>
        </div>
        <button
          onClick={loadStats}
          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-xs font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-base sm:text-lg">Status Sistem Pengumuman:</h3>
            <span className="font-black px-2.5 py-0.5 rounded-md bg-white/20 text-xs">
              {settings.status_pengumuman}
            </span>
          </div>
          <p className="text-xs text-sky-200">
            Jadwal: {new Date(settings.tanggal_pengumuman).toLocaleString('id-ID')} WIB | Pencarian: {settings.pencarian_aktif ? 'Aktif' : 'Nonaktif'} | Unduh SKL: {settings.download_skl_aktif ? 'Aktif' : 'Nonaktif'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('countdown')}
          className="inline-flex items-center space-x-2 text-xs font-bold bg-white text-blue-900 px-3.5 py-2 rounded-xl hover:bg-sky-50 transition-colors shadow-xs"
        >
          <span>Ubah Jadwal & Status</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Terdaftar</p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.totalSiswa}</h4>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-blue-700 hover:underline mt-2 inline-block"
            >
              Kelola Siswa →
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Siswa Lulus */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Siswa Lulus</p>
            <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{stats.lulus}</h4>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Persentase: <strong className="text-slate-800">{stats.persentaseKelulusan}%</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Siswa Tidak Lulus */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Tidak Lulus</p>
            <h4 className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{stats.tidakLulus}</h4>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Belum ditetapkan: <strong className="text-slate-800">{stats.belumDitetapkan}</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Unduhan SKL */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Unduhan SKL</p>
            <h4 className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1">{stats.totalUnduhanSKL}</h4>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs font-semibold text-indigo-700 hover:underline mt-2 inline-block"
            >
              Lihat Log Unduhan →
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Progress & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Persentase Progress Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 text-base">Ringkasan Kelulusan</h4>
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">LULUS ({stats.lulus})</span>
                <span className="text-slate-700">{stats.persentaseKelulusan}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.persentaseKelulusan}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-700">TIDAK LULUS ({stats.tidakLulus})</span>
                <span className="text-slate-700">
                  {stats.totalSiswa > 0 ? Math.round((stats.tidakLulus / stats.totalSiswa) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalSiswa > 0 ? (stats.tidakLulus / stats.totalSiswa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">BELUM DITETAPKAN ({stats.belumDitetapkan})</span>
                <span className="text-slate-700">
                  {stats.totalSiswa > 0 ? Math.round((stats.belumDitetapkan / stats.totalSiswa) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalSiswa > 0 ? (stats.belumDitetapkan / stats.totalSiswa) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Data statistik ini dihitung secara dinamis dari database aktif saat ini.
          </div>
        </div>

        {/* Right: Breakdown Per Kelas */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 text-base">Distribusi Siswa Per Kelas</h4>
            <span className="text-xs text-slate-500 font-medium">
              {Object.keys(stats.perKelas).length} Kelas Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Kelas</th>
                  <th className="py-2.5 px-3 text-center">Total Siswa</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">Lulus</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">Tidak Lulus</th>
                  <th className="py-2.5 px-3 text-right">% Kelulusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(stats.perKelas).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada data siswa terdaftar.
                    </td>
                  </tr>
                ) : (
                  Object.entries(stats.perKelas).map(([k, v]) => {
                    const pct = v.total > 0 ? Math.round((v.lulus / v.total) * 100) : 0;
                    return (
                      <tr key={k} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{k}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">{v.total}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-700">
                          {v.lulus}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-rose-700">
                          {v.tidakLulus}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              pct === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : pct >= 80
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
        <h4 className="font-bold text-sm text-slate-800">Aksi Cepat Administrator:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('students')}
            className="p-3.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shadow-xs"
          >
            <Users className="w-5 h-5 text-blue-800 mb-1.5" />
            <h5 className="font-bold text-xs text-slate-900">Kelola Siswa</h5>
            <p className="text-[11px] text-slate-500">Tambah, edit, hapus</p>
          </button>

          <button
            onClick={() => onNavigate('import')}
            className="p-3.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 mb-1.5" />
            <h5 className="font-bold text-xs text-slate-900">Impor CSV</h5>
            <p className="text-[11px] text-slate-500">Upload massal data</p>
          </button>

          <button
            onClick={() => onNavigate('template')}
            className="p-3.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shadow-xs"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-700 mb-1.5" />
            <h5 className="font-bold text-xs text-slate-900">Template SKL</h5>
            <p className="text-[11px] text-slate-500">Kustomisasi format surat</p>
          </button>

          <button
            onClick={() => onNavigate('backup')}
            className="p-3.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all shadow-xs"
          >
            <Download className="w-5 h-5 text-purple-700 mb-1.5" />
            <h5 className="font-bold text-xs text-slate-900">Ekspor Data</h5>
            <p className="text-[11px] text-slate-500">Unduh data CSV/JSON</p>
          </button>
        </div>
      </div>
    </div>
  );
};
