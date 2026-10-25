import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  FileText,
  Clock,
  Sliders,
  History,
  DownloadCloud,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
  School
} from 'lucide-react';
import { SchoolSettings } from '../../types.ts';
import { logoutAdmin } from '../../services/api.ts';

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'import'
  | 'school'
  | 'template'
  | 'countdown'
  | 'system'
  | 'logs'
  | 'backup'
  | 'security';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  settings: SchoolSettings;
  onLogout: () => void;
  onGoToPublic: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  settings,
  onLogout,
  onGoToPublic,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as AdminTab, label: 'Data Siswa', icon: Users },
    { id: 'import' as AdminTab, label: 'Impor Data Siswa', icon: FileSpreadsheet },
    { id: 'school' as AdminTab, label: 'Pengaturan Sekolah', icon: Settings },
    { id: 'template' as AdminTab, label: 'Template SKL', icon: FileText },
    { id: 'countdown' as AdminTab, label: 'Countdown Pengumuman', icon: Clock },
    { id: 'system' as AdminTab, label: 'Pengaturan Sistem', icon: Sliders },
    { id: 'logs' as AdminTab, label: 'Log Aktivitas', icon: History },
    { id: 'backup' as AdminTab, label: 'Backup & Ekspor Data', icon: DownloadCloud },
    { id: 'security' as AdminTab, label: 'Akun & Keamanan', icon: Shield },
  ];

  const handleLogoutClick = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sesi administrator?')) {
      await logoutAdmin();
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white">
            <School className="w-5 h-5 text-sky-200" />
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[180px]">
            {settings.nama_sekolah}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 shrink-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between z-30 shadow-xl border-r border-slate-800/90`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Brand */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-950/40 shrink-0">
                <School className="w-5 h-5 text-sky-200" />
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-sm text-white truncate tracking-tight">
                  {settings.nama_sekolah}
                </h2>
                <p className="text-[11px] text-sky-400 font-medium">Panel Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 grow">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
            <button
              onClick={onGoToPublic}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Lihat Halaman Siswa</span>
            </button>

            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="grow flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Tahun Pelajaran: {settings.tahun_pelajaran} | Status:{' '}
              <strong className="text-blue-900">{settings.status_pengumuman}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onGoToPublic}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Halaman Pengumuman Siswa</span>
              <span className="sm:hidden">Portal Siswa</span>
            </button>
          </div>
        </header>

        {/* Tab Content Canvas */}
        <div className="p-4 sm:p-6 lg:p-8 grow">{children}</div>
      </main>
    </div>
  );
};
