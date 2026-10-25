import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroAnnouncement } from './components/HeroAnnouncement.tsx';
import { StudentSearchForm } from './components/StudentSearchForm.tsx';
import { GraduationResultCard } from './components/GraduationResultCard.tsx';
import { StudentInstructions } from './components/StudentInstructions.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLoginModal } from './components/admin/AdminLoginModal.tsx';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout.tsx';
import { DashboardTab } from './components/admin/DashboardTab.tsx';
import { StudentsTab } from './components/admin/StudentsTab.tsx';
import { ImportTab } from './components/admin/ImportTab.tsx';
import { SchoolSettingsTab } from './components/admin/SchoolSettingsTab.tsx';
import { SKLTemplateTab } from './components/admin/SKLTemplateTab.tsx';
import { CountdownSettingsTab } from './components/admin/CountdownSettingsTab.tsx';
import { SystemSettingsTab } from './components/admin/SystemSettingsTab.tsx';
import { ActivityLogsTab } from './components/admin/ActivityLogsTab.tsx';
import { BackupExportTab } from './components/admin/BackupExportTab.tsx';
import { SecurityTab } from './components/admin/SecurityTab.tsx';

import { SchoolSettings, StudentSearchResult } from './types.ts';
import { getPublicInfo, searchNisn, authStorage } from './services/api.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // Search state
  const [searchResult, setSearchResult] = useState<StudentSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Admin routing state
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');

  const loadPublicConfig = async () => {
    try {
      setIsLoadingInfo(true);
      const res = await getPublicInfo();
      if (res.success) {
        setSettings(res.data);
        setIsOpen(res.data.isOpen);
      }
    } catch (err) {
      console.error('Failed to load public config:', err);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  useEffect(() => {
    loadPublicConfig();

    // Check hash for #admin
    if (window.location.hash === '#admin') {
      if (authStorage.isAuthenticated()) {
        setIsAdminView(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  }, []);

  const handleSearch = async (nisn: string) => {
    try {
      setIsSearching(true);
      setSearchResult(null);
      const result = await searchNisn(nisn);
      setSearchResult(result);

      // Smooth scroll to result
      setTimeout(() => {
        window.scrollTo({
          top: 380,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err: any) {
      setSearchResult({
        allowed: false,
        message: err.message || 'Terjadi kesalahan sistem saat memproses pencarian NISN.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsAdminView(true);
    window.location.hash = 'admin';
  };

  const handleLogout = () => {
    setIsAdminView(false);
    window.location.hash = '';
    loadPublicConfig();
  };

  if (isLoadingInfo || !settings) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Memuat Sistem Informasi Kelulusan Sekolah...
        </p>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (isAdminView) {
    return (
      <AdminLayout
        activeTab={activeAdminTab}
        onTabChange={setActiveAdminTab}
        settings={settings}
        onLogout={handleLogout}
        onGoToPublic={() => {
          setIsAdminView(false);
          window.location.hash = '';
          loadPublicConfig();
        }}
      >
        {activeAdminTab === 'dashboard' && (
          <DashboardTab settings={settings} onNavigate={setActiveAdminTab} />
        )}
        {activeAdminTab === 'students' && <StudentsTab settings={settings} />}
        {activeAdminTab === 'import' && <ImportTab settings={settings} />}
        {activeAdminTab === 'school' && (
          <SchoolSettingsTab
            settings={settings}
            onSettingsUpdated={(updated) => setSettings(updated)}
          />
        )}
        {activeAdminTab === 'template' && (
          <SKLTemplateTab
            settings={settings}
            onSettingsUpdated={(updated) => setSettings(updated)}
          />
        )}
        {activeAdminTab === 'countdown' && (
          <CountdownSettingsTab
            settings={settings}
            onSettingsUpdated={(updated) => {
              setSettings(updated);
              setIsOpen(
                updated.status_pengumuman === 'SUDAH_DIBUKA' ||
                  (updated.status_pengumuman === 'BELUM_DIBUKA' &&
                    new Date().getTime() >= new Date(updated.tanggal_pengumuman).getTime())
              );
            }}
          />
        )}
        {activeAdminTab === 'system' && (
          <SystemSettingsTab
            settings={settings}
            onSettingsUpdated={(updated) => setSettings(updated)}
          />
        )}
        {activeAdminTab === 'logs' && <ActivityLogsTab />}
        {activeAdminTab === 'backup' && <BackupExportTab />}
        {activeAdminTab === 'security' && <SecurityTab />}
      </AdminLayout>
    );
  }

  // --- PUBLIC PORTAL VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        isOpen={isOpen}
        onOpenAdmin={() => {
          if (authStorage.isAuthenticated()) {
            setIsAdminView(true);
            window.location.hash = 'admin';
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

      {/* Hero with Countdown */}
      <HeroAnnouncement settings={settings} isOpen={isOpen} />

      {/* Main Student Portal Content */}
      <main className="grow pb-16">
        {/* Search Form */}
        <StudentSearchForm
          onSearch={handleSearch}
          isLoading={isSearching}
          disabled={!settings.pencarian_aktif || settings.status_pengumuman === 'DITUTUP'}
        />

        {/* Results Card */}
        {searchResult && (
          <GraduationResultCard
            result={searchResult}
            onReset={() => setSearchResult(null)}
          />
        )}

        {/* Instructions & Guidelines */}
        <StudentInstructions settings={settings} />
      </main>

      {/* Public Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => {
          if (authStorage.isAuthenticated()) {
            setIsAdminView(true);
            window.location.hash = 'admin';
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
