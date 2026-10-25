import React, { useState } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { SchoolSettings, AnnouncementStatus } from '../../types.ts';
import { updateAdminSettings } from '../../services/api.ts';

interface CountdownSettingsTabProps {
  settings: SchoolSettings;
  onSettingsUpdated: (updated: SchoolSettings) => void;
}

export const CountdownSettingsTab: React.FC<CountdownSettingsTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState({
    tanggal_pengumuman: settings.tanggal_pengumuman,
    zona_waktu: settings.zona_waktu || 'Asia/Jakarta',
    status_pengumuman: settings.status_pengumuman as AnnouncementStatus,
    judul_countdown: settings.judul_countdown,
    pesan_sebelum_pengumuman: settings.pesan_sebelum_pengumuman,
    pesan_setelah_pengumuman: settings.pesan_setelah_pengumuman,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setNotification(null);
      const res = await updateAdminSettings(formData);
      if (res.success) {
        onSettingsUpdated(res.settings);
        setNotification({ type: 'success', text: 'Pengaturan countdown dan jadwal pengumuman berhasil disimpan.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan.' });
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
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pengaturan Waktu & Status Pengumuman
              </h3>
              <p className="text-xs text-slate-500">
                Kontrol waktu hitung mundur dan status izin akses hasil kelulusan di tingkat server.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Jadwal</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Override */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Status Pengumuman Kelulusan*
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'SUDAH_DIBUKA' as AnnouncementStatus,
                  label: 'Sudah Dibuka',
                  desc: 'Siswa dapat langsung mencari NISN dan melihat hasil kelulusan.',
                  color: 'border-emerald-500 bg-emerald-50/60 text-emerald-900',
                },
                {
                  id: 'BELUM_DIBUKA' as AnnouncementStatus,
                  label: 'Belum Dibuka (Ikuti Hitung Mundur)',
                  desc: 'Terkunci hingga waktu countdown berakhir sesuai jadwal.',
                  color: 'border-blue-500 bg-blue-50/60 text-blue-900',
                },
                {
                  id: 'DITUTUP' as AnnouncementStatus,
                  label: 'Ditutup',
                  desc: 'Seluruh akses pencarian dan unduhan SKL dinonaktifkan.',
                  color: 'border-rose-500 bg-rose-50/60 text-rose-900',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    formData.status_pengumuman === item.id
                      ? item.color + ' ring-2 ring-offset-1'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs">{item.label}</span>
                    <input
                      type="radio"
                      name="status_pengumuman"
                      value={item.id}
                      checked={formData.status_pengumuman === item.id}
                      onChange={() => setFormData({ ...formData, status_pengumuman: item.id })}
                      className="text-blue-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">{item.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Waktu & Tanggal Pengumuman*
              </label>
              <input
                type="datetime-local"
                required
                value={formData.tanggal_pengumuman}
                onChange={(e) => setFormData({ ...formData, tanggal_pengumuman: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Format: Tanggal dan jam peluncuran resmi pengumuman.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Zona Waktu
              </label>
              <select
                value={formData.zona_waktu}
                onChange={(e) => setFormData({ ...formData, zona_waktu: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta - UTC+7)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar - UTC+8)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura - UTC+9)</option>
              </select>
            </div>
          </div>

          {/* Title & Custom Messages */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Judul Countdown
              </label>
              <input
                type="text"
                value={formData.judul_countdown}
                onChange={(e) => setFormData({ ...formData, judul_countdown: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pesan Sebelum Pengumuman (Terkunci)
              </label>
              <textarea
                rows={2}
                value={formData.pesan_sebelum_pengumuman}
                onChange={(e) => setFormData({ ...formData, pesan_sebelum_pengumuman: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pesan Setelah Pengumuman (Terbuka)
              </label>
              <textarea
                rows={2}
                value={formData.pesan_setelah_pengumuman}
                onChange={(e) => setFormData({ ...formData, pesan_setelah_pengumuman: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
