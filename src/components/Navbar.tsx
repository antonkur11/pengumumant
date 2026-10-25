import React from 'react';
import { School, ShieldCheck, Lock, LayoutDashboard } from 'lucide-react';
import { SchoolSettings } from '../types.ts';
import { authStorage } from '../services/api.ts';

interface NavbarProps {
  settings: SchoolSettings;
  isOpen: boolean;
  onOpenAdmin: () => void;
  isAdminView?: boolean;
  onBackToPublic?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isOpen,
  onOpenAdmin,
  isAdminView,
  onBackToPublic,
}) => {
  const isLoggedIn = authStorage.isAuthenticated();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3.5">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt={settings.nama_sekolah}
                className="w-11 h-11 object-contain rounded-lg border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-950/20">
                <School className="w-6 h-6 text-sky-200" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg line-clamp-1">
                  {settings.nama_sekolah}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  NPSN: {settings.npsn}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tahun Pelajaran {settings.tahun_pelajaran}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            {/* Status indicator badge */}
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-full border">
              {settings.status_pengumuman === 'DITUTUP' ? (
                <span className="flex items-center text-red-700 bg-red-50 border-red-200 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
                  Pengumuman Ditutup
                </span>
              ) : isOpen ? (
                <span className="flex items-center text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Pengumuman Dibuka
                </span>
              ) : (
                <span className="flex items-center text-amber-700 bg-amber-50 border-amber-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                  Hitung Mundur
                </span>
              )}
            </div>

            {isAdminView ? (
              <button
                onClick={onBackToPublic}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-all"
              >
                <span>Halaman Siswa</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-900 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3.5 py-2 rounded-lg transition-all shadow-xs"
              >
                {isLoggedIn ? (
                  <>
                    <LayoutDashboard className="w-4 h-4 text-blue-700" />
                    <span>Dashboard Admin</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Login Admin</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
