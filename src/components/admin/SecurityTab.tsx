import React, { useState } from 'react';
import { Shield, KeyRound, CheckCircle2, AlertCircle, Loader2, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';
import { changePassword } from '../../services/api.ts';

export const SecurityTab: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setNotice({ type: 'error', text: 'Semua kolom password wajib diisi.' });
      return;
    }

    if (newPassword.length < 8) {
      setNotice({ type: 'error', text: 'Password baru minimal harus 8 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    try {
      setIsLoading(true);
      setNotice(null);
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setNotice({ type: 'success', text: res.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal mengubah password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-2 text-xs sm:text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Change Password Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Ubah Password Administrator</h3>
              <p className="text-xs text-slate-500">
                Perbarui kata sandi secara berkala untuk menjaga kerahasiaan data kelulusan siswa.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password Lama*
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password Baru*
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ulangi Password Baru*
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password baru"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Simpan Password Baru</span>
            </button>
          </div>
        </div>
      </form>

      {/* Security Best Practices */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Status Keamanan Sistem Pengumuman</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">✓ Proteksi Database Publik</span>
            <p className="text-[11px] text-slate-500">
              Pengunjung umum tidak dapat mengunduh seluruh database siswa. Hanya data siswa yang cocok dengan NISN yang dikembalikan.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">✓ Validasi Waktu Server-Side</span>
            <p className="text-[11px] text-slate-500">
              Pengecekan kelulusan dan unduhan SKL divalidasi langsung di server, bukan hanya melalui timer di browser.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">✓ Enkripsi Password Salt & PBKDF2</span>
            <p className="text-[11px] text-slate-500">
              Password admin tidak pernah disimpan dalam bentuk plaintext, diacak menggunakan salt dan hashing 64-byte.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">✓ Rate Limiter Aktif</span>
            <p className="text-[11px] text-slate-500">
              Permintaan pencarian dibatasi per menit untuk mencegah automated scraping data kelulusan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
