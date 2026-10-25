import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, XCircle, AlertTriangle, FileText, Printer, ShieldCheck, Loader2 } from 'lucide-react';
import { StudentSearchResult } from '../types.ts';
import { verifyAndFetchSklData } from '../services/api.ts';
import { generateSklPdf } from '../utils/pdfGenerator.ts';

interface GraduationResultCardProps {
  result: StudentSearchResult | null;
  onReset: () => void;
}

export const GraduationResultCard: React.FC<GraduationResultCardProps> = ({ result, onReset }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.data && result.data.status_kelulusan === 'LULUS') {
      // Trigger joyous confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#38bdf8', '#fbbf24', '#ffffff'],
      });
    }
  }, [result]);

  if (!result) return null;

  // Case 1: Student not found or message returned
  if (!result.data) {
    return (
      <div className="w-full max-w-xl mx-auto mt-6 px-4">
        <div className="bg-white rounded-2xl border border-amber-200/90 shadow-md p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Data Tidak Ditemukan</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {result.message ||
                'Data tidak ditemukan atau belum dapat ditampilkan. Silakan periksa kembali NISN Anda atau hubungi pihak sekolah.'}
            </p>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <span>Coba NISN Lain</span>
          </button>
        </div>
      </div>
    );
  }

  const student = result.data;
  const isLulus = student.status_kelulusan === 'LULUS';
  const isTidakLulus = student.status_kelulusan === 'TIDAK LULUS';

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      // Verify with backend & fetch latest settings & active template
      const sklPayload = await verifyAndFetchSklData(student.nisn);

      if (!sklPayload.success) {
        setDownloadError('Gagal memverifikasi unduhan SKL.');
        return;
      }

      // Generate PDF
      const { doc, filename } = generateSklPdf(
        sklPayload.student,
        sklPayload.settings,
        sklPayload.template
      );

      // Trigger direct download
      doc.save(filename);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setDownloadError(err.message || 'Terjadi kesalahan saat membuat file PDF SKL.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
        {/* Status Header Banner */}
        <div
          className={`px-6 py-6 text-center text-white ${
            isLulus
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : isTidakLulus
              ? 'bg-gradient-to-r from-rose-600 to-red-700'
              : 'bg-gradient-to-r from-slate-600 to-slate-700'
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            {isLulus ? (
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            ) : isTidakLulus ? (
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            )}
          </div>

          <span className="text-xs uppercase tracking-widest font-bold opacity-90 block">
            Hasil Keputusan Rapat Pleno Kelulusan
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            {student.status_kelulusan}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-md mx-auto">
            {isLulus
              ? 'Selamat atas pencapaian Anda! Anda dinyatakan berhak mendapatkan Surat Keterangan Lulus (SKL).'
              : isTidakLulus
              ? 'Tetap semangat dan jangan putus asa. Silakan berkonsultasi dengan wali kelas atau pihak sekolah.'
              : 'Status kelulusan Anda belum ditetapkan secara final. Harap hubungi pihak kurikulum sekolah.'}
          </p>
        </div>

        {/* Student Details Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border border-slate-200/80 rounded-xl bg-slate-50/60 p-5 divide-y divide-slate-200/70">
            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                NISN
              </span>
              <span className="text-base font-bold font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 inline-block w-fit">
                {student.nisn}
              </span>
            </div>

            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nama Lengkap
              </span>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {student.nama}
              </span>
            </div>

            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Tempat, Tanggal Lahir
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {student.tempat_lahir}, {student.tanggal_lahir}
              </span>
            </div>

            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Kelas / Jurusan
              </span>
              <span className="text-sm font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60 inline-block w-fit">
                {student.kelas}
              </span>
            </div>

            {student.nomor_peserta && student.nomor_peserta !== '-' && (
              <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nomor Peserta Ujian
                </span>
                <span className="text-sm font-mono font-medium text-slate-700">
                  {student.nomor_peserta}
                </span>
              </div>
            )}

            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status Kelulusan
              </span>
              <span
                className={`text-sm font-black px-3 py-1 rounded-full w-fit ${
                  isLulus
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isTidakLulus
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {student.status_kelulusan}
              </span>
            </div>
          </div>

          {/* Download Action Area */}
          {result.settings?.download_skl_aktif !== false ? (
            <div className="space-y-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="w-full inline-flex items-center justify-center space-x-2.5 py-4 px-6 rounded-xl font-bold text-white bg-blue-900 hover:bg-blue-800 active:scale-[0.99] transition-all shadow-md shadow-blue-950/20 disabled:opacity-50 cursor-pointer text-base"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>MEMPROSES & MEMBUAT DOKUMEN PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>DOWNLOAD SKL PDF</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dokumen digital resmi berstandar A4</span>
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  className="text-blue-700 hover:underline font-semibold"
                >
                  Cari NISN Lain
                </button>
              </div>

              {downloadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {downloadError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 text-xs text-center border border-amber-200">
              Fitur unduh Surat Keterangan Lulus (SKL) digital sedang dinonaktifkan sementara oleh pihak sekolah.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
