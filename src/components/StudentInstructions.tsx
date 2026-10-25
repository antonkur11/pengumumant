import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, FileCheck, PhoneCall } from 'lucide-react';
import { SchoolSettings } from '../types.ts';

interface StudentInstructionsProps {
  settings: SchoolSettings;
}

export const StudentInstructions: React.FC<StudentInstructionsProps> = ({ settings }) => {
  const steps = [
    {
      step: '1',
      title: 'Persiapkan NISN',
      desc: 'Pastikan Anda memasukkan 10 digit Nomor Induk Siswa Nasional (NISN) resmi Anda sesuai data Dapodik/Pusdatin.',
      icon: HelpCircle,
    },
    {
      step: '2',
      title: 'Cek Status Kelulusan',
      desc: 'Klik tombol "CEK KELULUSAN". Sistem akan memverifikasi data dan menampilkan status kelulusan Anda secara instan.',
      icon: CheckCircle2,
    },
    {
      step: '3',
      title: 'Unduh SKL Digital',
      desc: 'Bagi siswa yang dinyatakan LULUS, klik tombol "DOWNLOAD SKL PDF" untuk mencetak atau menyimpan dokumen resmi.',
      icon: FileCheck,
    },
    {
      step: '4',
      title: 'Bantuan & Pengaduan',
      desc: `Jika data tidak muncul atau terdapat perbedaan identitas, silakan segera hubungi pihak tata usaha ${settings.nama_sekolah}.`,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4 sm:px-6">
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Petunjuk Alur Pemeriksaan Kelulusan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Harap membaca langkah-langkah di bawah ini untuk kelancaran proses pengecekan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-start space-x-3.5"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 flex items-center justify-center shrink-0 font-bold text-sm">
                  {item.step}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Strip */}
        <div className="mt-8 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-blue-800" />
            <span>
              Layanan Informasi Sekolah:{' '}
              <strong className="text-slate-800">{settings.telepon || '(021) 789-2233'}</strong>
            </span>
          </div>
          <div className="text-slate-500">
            Jam Layanan: Senin – Jumat (08.00 – 15.00 WIB)
          </div>
        </div>
      </div>
    </div>
  );
};
