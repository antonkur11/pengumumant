import React from 'react';
import { School, MapPin, Phone, Mail, Award } from 'lucide-react';
import { SchoolSettings } from '../types.ts';

interface FooterProps {
  settings: SchoolSettings;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.nama_sekolah}
                  className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-800 flex items-center justify-center text-white">
                  <School className="w-5 h-5 text-sky-200" />
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {settings.nama_sekolah}
                </h4>
                <p className="text-xs text-sky-400 font-medium">NPSN: {settings.npsn}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem Informasi Pengumuman Kelulusan Resmi dan Penerbitan Surat Keterangan Lulus (SKL) Digital.
            </p>
          </div>

          {/* Col 2: Alamat & Kontak */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-white tracking-wide uppercase">
              Informasi Kontak
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{settings.alamat}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{settings.telepon}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{settings.email}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Pengesahan & Legal */}
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-white tracking-wide uppercase">
              Kepala Sekolah & Legalisasi
            </h5>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-300 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>{settings.jabatan_penandatangan || 'Kepala Sekolah'}</span>
              </div>
              <p className="font-bold text-white">{settings.nama_kepala_sekolah}</p>
              <p className="text-slate-400 font-mono text-[11px]">NIP. {settings.nip_kepala_sekolah}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{settings.teks_footer || `© ${new Date().getFullYear()} ${settings.nama_sekolah}. Seluruh Hak Cipta Dilindungi.`}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAdmin}
              className="hover:text-sky-400 transition-colors cursor-pointer text-slate-400 underline underline-offset-4"
            >
              Portal Petugas / Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
