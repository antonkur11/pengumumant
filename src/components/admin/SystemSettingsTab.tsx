import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { SchoolSettings } from '../../types.ts';
import { updateAdminSettings } from '../../services/api.ts';

interface SystemSettingsTabProps {
  settings: SchoolSettings;
  onSettingsUpdated: (updated: SchoolSettings) => void;
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [pencarianAktif, setPencarianAktif] = useState(settings.pencarian_aktif);
  const [downloadAktif, setDownloadAktif] = useState(settings.download_skl_aktif);
  const [batasPencarian, setBatasPencarian] = useState(settings.batas_pencarian_per_menit || 30);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setNotification(null);
      const res = await updateAdminSettings({
        pencarian_aktif: pencarianAktif,
        download_skl_aktif: downloadAktif,
        batas_pencarian_per_menit: Number(batasPencarian),
      });

      if (res.success) {
        onSettingsUpdated(res.settings);
        setNotification({ type: 'success', text: 'Konfigurasi sistem berhasil disimpan.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Gagal menyimpan konfigurasi sistem.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-xs sm:text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pengaturan Operasional Sistem & Proteksi
              </h3>
              <p className="text-xs text-slate-500">
                Kelola sakelar fitur dan pembatasan laju permintaan untuk keamanan server.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Feature toggles */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sakelar Fitur Publik (Feature Flags)
            </h4>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs text-slate-900">Layanan Pencarian NISN</h5>
                <p className="text-xs text-slate-500">
                  Jika dimatikan, halaman depan akan menampilkan pesan bahwa layanan sedang dinonaktifkan.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pencarianAktif}
                onChange={(e) => setPencarianAktif(e.target.checked)}
                className="w-5 h-5 text-blue-900 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-xs text-slate-900">Layanan Unduh SKL PDF</h5>
                <p className="text-xs text-slate-500">
                  Jika dimatikan, tombol download SKL PDF tidak dapat diakses oleh siswa.
                </p>
              </div>
              <input
                type="checkbox"
                checked={downloadAktif}
                onChange={(e) => setDownloadAktif(e.target.checked)}
                className="w-5 h-5 text-blue-900 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Rate limiting */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Proteksi Beban & Keamanan Akses (Rate Limiting)
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Batas Maksimal Percobaan Pencarian per IP (per Menit)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={batasPencarian}
                onChange={(e) => setBatasPencarian(parseInt(e.target.value) || 30)}
                className="w-full sm:w-48 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Mencegah bot dan scraping otomatis terhadap database siswa (disarankan 20-30).
              </p>
            </div>
          </div>

          {/* System status details */}
          <div className="pt-4 border-t border-slate-100 p-4 rounded-xl bg-slate-50 space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status Operasional Backend: NORMAL</span>
            </div>
            <p>Database: JSON Persistence Terproteksi | Port Dev: 3000 | Waktu Server: {new Date().toISOString()}</p>
          </div>
        </div>
      </form>
    </div>
  );
};
