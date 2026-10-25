import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SchoolSettings } from '../types.ts';
import { formatIndonesianDate } from '../utils/pdfGenerator.ts';

interface HeroAnnouncementProps {
  settings: SchoolSettings;
  isOpen: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const HeroAnnouncement: React.FC<HeroAnnouncementProps> = ({ settings, isOpen }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    function calculateCountdown() {
      if (!settings.tanggal_pengumuman) return;
      const target = new Date(settings.tanggal_pengumuman).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
        });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          isPast: false,
        });
      }
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings.tanggal_pengumuman]);

  const targetDateObj = new Date(settings.tanggal_pengumuman);
  const formattedTargetDate = formatIndonesianDate(settings.tanggal_pengumuman);
  const timeFormatted = targetDateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900/50">
      {/* Decorative radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-blue-600/15 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Badge header */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-900/70 border border-blue-700/60 shadow-inner">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-200 uppercase">
            Tahun Pelajaran {settings.tahun_pelajaran}
          </span>
        </div>

        {/* Main Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm font-sans">
            {settings.judul_pengumuman || 'PENGUMUMAN KELULUSAN'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {settings.deskripsi_pengumuman ||
              'Silakan periksa kelulusan Anda dan unduh Surat Keterangan Lulus (SKL) resmi.'}
          </p>
        </div>

        {/* Status Notice or Countdown */}
        {settings.status_pengumuman === 'DITUTUP' ? (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 flex items-center space-x-3 text-left">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-red-100">Pengumuman Ditutup</h4>
              <p className="text-xs text-red-300">
                Pencarian kelulusan saat ini ditutup oleh pihak sekolah. Silakan hubungi bagian tata usaha untuk informasi lebih lanjut.
              </p>
            </div>
          </div>
        ) : isOpen ? (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-100 flex items-center space-x-3.5 text-left shadow-lg shadow-emerald-950/30">
            <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pengumuman Resmi Telah Dibuka!</h4>
              <p className="text-xs text-emerald-200">
                {settings.pesan_setelah_pengumuman ||
                  'Hasil kelulusan sudah dapat diakses. Masukkan 10 digit NISN Anda pada form di bawah.'}
              </p>
            </div>
          </div>
        ) : (
          /* COUNTDOWN CARD */
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center space-x-2 text-sky-300 text-xs sm:text-sm font-medium">
              <Clock className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>
                {settings.judul_countdown || 'Hitung Mundur Waktu Pengumuman'}:{' '}
                <strong className="text-white">
                  {formattedTargetDate} pukul {timeFormatted} WIB
                </strong>
              </span>
            </div>

            {/* Countdown Flip Cards */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
              {[
                { label: 'HARI', value: timeRemaining.days },
                { label: 'JAM', value: timeRemaining.hours },
                { label: 'MENIT', value: timeRemaining.minutes },
                { label: 'DETIK', value: timeRemaining.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-blue-500/20 shadow-xl flex flex-col items-center justify-center"
                >
                  <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-sky-300 tracking-wider mt-1 uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 italic">
              {settings.pesan_sebelum_pengumuman ||
                'Hasil kelulusan akan ditampilkan secara otomatis saat hitung mundur selesai.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
