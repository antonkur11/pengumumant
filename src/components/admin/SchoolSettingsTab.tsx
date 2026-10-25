import React, { useState } from 'react';
import {
  Save,
  Building2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Upload
} from 'lucide-react';
import { SchoolSettings } from '../../types.ts';
import { updateAdminSettings } from '../../services/api.ts';

interface SchoolSettingsTabProps {
  settings: SchoolSettings;
  onSettingsUpdated: (updated: SchoolSettings) => void;
}

export const SchoolSettingsTab: React.FC<SchoolSettingsTabProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof SchoolSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File logo harus berupa gambar (PNG, JPG, SVG, WebP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file logo maksimal 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleInputChange('logo', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      const res = await updateAdminSettings(formData);
      if (res.success) {
        onSettingsUpdated(res.settings);
        setMessage({ type: 'success', text: 'Identitas sekolah dan pengaturan berhasil diperbarui.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-xs sm:text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pengaturan Identitas & Informasi Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Data ini dicetak otomatis pada Kop Surat SKL dan ditampilkan pada portal publik.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Perubahan</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo preview & upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Logo Sekolah
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Gambar Logo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('logo', '')}
                    className="block text-[11px] text-red-600 hover:underline"
                  >
                    Hapus Logo (Gunakan Icon Bawaan)
                  </button>
                )}
                <p className="text-[11px] text-slate-400">Format PNG, JPG, atau SVG (maks. 2MB)</p>
              </div>
            </div>
          </div>

          {/* School Name & NPSN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Resmi Sekolah*
              </label>
              <input
                type="text"
                required
                value={formData.nama_sekolah}
                onChange={(e) => handleInputChange('nama_sekolah', e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NPSN*
              </label>
              <input
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => handleInputChange('npsn', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Alamat Lengkap Sekolah*
            </label>
            <input
              type="text"
              required
              value={formData.alamat}
              onChange={(e) => handleInputChange('alamat', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
            />
          </div>

          {/* Contact & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => handleInputChange('telepon', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Sekolah
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tahun Pelajaran*
              </label>
              <input
                type="text"
                required
                value={formData.tahun_pelajaran}
                onChange={(e) => handleInputChange('tahun_pelajaran', e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>

          {/* Principal & Signatory info */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3">
              Data Penandatangan Surat (Kepala Sekolah)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Kepala Sekolah (Beserta Gelar)*
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_kepala_sekolah}
                  onChange={(e) => handleInputChange('nama_kepala_sekolah', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.nip_kepala_sekolah}
                  onChange={(e) => handleInputChange('nip_kepala_sekolah', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Jabatan Penandatangan
              </label>
              <input
                type="text"
                value={formData.jabatan_penandatangan}
                onChange={(e) => handleInputChange('jabatan_penandatangan', e.target.value)}
                placeholder="Kepala Sekolah"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>

          {/* Portal Display Text */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Kustomisasi Teks Portal Publik
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Judul Besar Halaman Pengumuman
              </label>
              <input
                type="text"
                value={formData.judul_pengumuman}
                onChange={(e) => handleInputChange('judul_pengumuman', e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Deskripsi Pengumuman
              </label>
              <textarea
                rows={2}
                value={formData.deskripsi_pengumuman}
                onChange={(e) => handleInputChange('deskripsi_pengumuman', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Teks Footer / Hak Cipta
              </label>
              <input
                type="text"
                value={formData.teks_footer}
                onChange={(e) => handleInputChange('teks_footer', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
