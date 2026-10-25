import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  PenTool
} from 'lucide-react';
import { SKLTemplate, SchoolSettings, Student } from '../../types.ts';
import { getAdminTemplate, updateAdminTemplate, updateAdminSettings } from '../../services/api.ts';
import { generateSklPdf, replacePlaceholders, formatIndonesianDate } from '../../utils/pdfGenerator.ts';
import { DEFAULT_KOP_LOGO } from '../../utils/defaultLogo.ts';

interface SKLTemplateTabProps {
  settings: SchoolSettings;
  onSettingsUpdated: (updated: SchoolSettings) => void;
}

export const SKLTemplateTab: React.FC<SKLTemplateTabProps> = ({ settings, onSettingsUpdated }) => {
  const [template, setTemplate] = useState<SKLTemplate | null>(null);
  const [downloadActive, setDownloadActive] = useState(settings.download_skl_aktif);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sample student for live preview
  const sampleStudent: Student = {
    id: 'sample_01',
    nisn: '0012345678',
    nama: 'BUDI SANTOSO',
    tempat_lahir: 'Pemalang',
    tanggal_lahir: '01 Januari 2008',
    kelas: 'XII TJKT 1',
    status_kelulusan: 'LULUS',
    nomor_peserta: 'UJN-2026-001',
    tahun_pelajaran: settings.tahun_pelajaran || '2025/2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  useEffect(() => {
    async function loadTemplate() {
      try {
        setIsLoading(true);
        const res = await getAdminTemplate();
        if (res.success) {
          setTemplate({
            ...res.template,
            logo_kop: res.template.logo_kop || DEFAULT_KOP_LOGO,
            logo_kop_kanan: res.template.logo_kop_kanan || '',
            kop_baris_1: res.template.kop_baris_1 || 'PEMERINTAH PROVINSI JAWA TENGAH',
            kop_baris_2: res.template.kop_baris_2 || 'DINAS PENDIDIKAN',
            kop_baris_3: res.template.kop_baris_3 || 'SMK NEGERI 1 PEMALANG',
            kop_baris_4: res.template.kop_baris_4 || 'Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319 Telepon 0284 321386',
            kop_baris_5: res.template.kop_baris_5 || 'Faksimile 0284 323376 Surat Elektronik admin@smkn1pml.sch.id',
            tampilkan_logo_kop: res.template.tampilkan_logo_kop !== false,
            tampilkan_logo_kop_kanan: res.template.tampilkan_logo_kop_kanan !== false,
            tanda_tangan: res.template.tanda_tangan || '',
            tampilkan_tanda_tangan: res.template.tampilkan_tanda_tangan !== false,
          });
        }
      } catch (err: any) {
        setNotification({ type: 'error', text: err.message || 'Gagal memuat template SKL.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplate();
  }, []);

  // Helper to convert and normalize image files to standard PNG data URL (max 450x450)
  const processImageFileToPng = (file: File, maxWidth = 450, maxHeight = 450): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', text: 'File logo harus berupa gambar (PNG, JPG, WebP, SVG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Ukuran file logo maksimal 5MB.' });
      return;
    }

    try {
      const base64Png = await processImageFileToPng(file, 450, 450);
      if (template) {
        setTemplate({ ...template, logo_kop: base64Png, tampilkan_logo_kop: true });
        setNotification({ type: 'success', text: 'Logo kop kiri berhasil dipilih. Klik "Simpan Perubahan" untuk menyimpan permanen.' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Gagal memproses gambar logo kop kiri.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleRightLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', text: 'File logo kop kanan harus berupa gambar (PNG, JPG, WebP, SVG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Ukuran file logo kop kanan maksimal 5MB.' });
      return;
    }

    try {
      const base64Png = await processImageFileToPng(file, 450, 450);
      if (template) {
        setTemplate({ ...template, logo_kop_kanan: base64Png, tampilkan_logo_kop_kanan: true });
        setNotification({ type: 'success', text: 'Logo kop kanan berhasil dipilih. Klik "Simpan Perubahan" untuk menyimpan permanen.' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Gagal memproses gambar logo kop kanan.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', text: 'File tanda tangan harus berupa gambar (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Ukuran file tanda tangan maksimal 5MB.' });
      return;
    }

    try {
      const base64Png = await processImageFileToPng(file, 500, 300);
      if (template) {
        setTemplate({ ...template, tanda_tangan: base64Png, tampilkan_tanda_tangan: true });
        setNotification({ type: 'success', text: 'Gambar tanda tangan berhasil diunggah. Klik "Simpan Perubahan" untuk menyimpan permanen.' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Gagal memproses gambar tanda tangan.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleResetDefaultLogo = () => {
    if (template) {
      setTemplate({
        ...template,
        logo_kop: DEFAULT_KOP_LOGO,
        tampilkan_logo_kop: true,
      });
      setNotification({ type: 'success', text: 'Logo dikembalikan ke lambang resmi Provinsi / Sekolah.' });
    }
  };

  const handleRemoveLogo = () => {
    if (template) {
      setTemplate({
        ...template,
        logo_kop: '',
        tampilkan_logo_kop: false,
      });
    }
  };

  const handleRemoveRightLogo = () => {
    if (template) {
      setTemplate({
        ...template,
        logo_kop_kanan: '',
        tampilkan_logo_kop_kanan: false,
      });
      setNotification({ type: 'success', text: 'Logo kop kanan telah dihapus.' });
    }
  };

  const handleRemoveSignature = () => {
    if (template) {
      setTemplate({
        ...template,
        tanda_tangan: '',
        tampilkan_tanda_tangan: false,
      });
      setNotification({ type: 'success', text: 'Tanda tangan telah dihapus dari template.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    try {
      setIsSaving(true);
      setNotification(null);

      // Save template with all kop surat and signature settings
      const resTpl = await updateAdminTemplate(template);

      // Save download toggle if changed
      if (downloadActive !== settings.download_skl_aktif) {
        const resSet = await updateAdminSettings({ download_skl_aktif: downloadActive });
        if (resSet.success) {
          onSettingsUpdated(resSet.settings);
        }
      }

      if (resTpl.success) {
        setTemplate(resTpl.template);
        setNotification({ type: 'success', text: 'Template SKL, logo kop, tanda tangan, dan format surat berhasil disimpan.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Gagal menyimpan template SKL.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDownload = () => {
    if (!template) return;
    const { doc, filename } = generateSklPdf(sampleStudent, settings, template);
    doc.save(`UJI_COBA_${filename}`);
  };

  if (isLoading || !template) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        <span className="ml-3 font-semibold text-slate-600">Memuat template SKL...</span>
      </div>
    );
  }

  const renderedPembukaPreview = replacePlaceholders(template.konten_pembuka, sampleStudent, settings);
  const renderedPenutupPreview = replacePlaceholders(template.konten_penutup, sampleStudent, settings);

  const displayLogo = template.logo_kop || DEFAULT_KOP_LOGO;
  const isLogoVisible = template.tampilkan_logo_kop !== false && Boolean(displayLogo);
  const isRightLogoVisible = template.tampilkan_logo_kop_kanan !== false && Boolean(template.logo_kop_kanan);
  const isSignatureVisible = template.tampilkan_tanda_tangan !== false && Boolean(template.tanda_tangan);
  const formattedAnnouncementDate = formatIndonesianDate(settings.tanggal_pengumuman);

  const placeholders = [
    { code: '{{NISN}}', desc: 'Nomor Induk Siswa Nasional (10 digit)' },
    { code: '{{NAMA}}', desc: 'Nama Lengkap Siswa (Huruf Kapital)' },
    { code: '{{TEMPAT_LAHIR}}', desc: 'Kota / Tempat Kelahiran' },
    { code: '{{TANGGAL_LAHIR}}', desc: 'Tanggal Lahir Siswa' },
    { code: '{{TEMPAT_TANGGAL_LAHIR}}', desc: 'Format gabungan (Tempat, Tanggal Lahir)' },
    { code: '{{KELAS}}', desc: 'Kelas atau Jurusan Siswa' },
    { code: '{{STATUS_KELULUSAN}}', desc: 'LULUS / TIDAK LULUS' },
    { code: '{{TAHUN_PELAJARAN}}', desc: 'Tahun Pelajaran (e.g. 2025/2026)' },
    { code: '{{NAMA_SEKOLAH}}', desc: 'Nama Resmi Sekolah' },
    { code: '{{NPSN}}', desc: 'Nomor Pokok Sekolah Nasional' },
    { code: '{{ALAMAT_SEKOLAH}}', desc: 'Alamat Sekolah' },
    { code: '{{NAMA_KEPALA_SEKOLAH}}', desc: 'Nama Kepala Sekolah' },
    { code: '{{NIP_KEPALA_SEKOLAH}}', desc: 'NIP Kepala Sekolah' },
    { code: '{{TANGGAL_PENGUMUMAN}}', desc: 'Tanggal Pengumuman Kelulusan' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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

      {/* Top Toggle Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-900" />
            <h3 className="font-extrabold text-base text-slate-900">
              Pengaturan Kop Surat, Tanda Tangan & Template SKL Resmi
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Kustomisasi logo kop surat, teks instansi, tanda tangan kepala sekolah, dan format surat yang dicetak pada PDF A4.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDownloadActive(!downloadActive)}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            downloadActive
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-slate-100 text-slate-600 border border-slate-300'
          }`}
        >
          {downloadActive ? (
            <>
              <ToggleRight className="w-5 h-5 text-emerald-600" />
              <span>Download SKL: DIAKTIFKAN</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-slate-400" />
              <span>Download SKL: DINONAKTIFKAN</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Column (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-extrabold text-sm text-slate-900">Editor Kop Surat & Tanda Tangan</h4>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>

          {/* Section 1: Logo Kop Surat (Kiri & Kanan) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Logo Kop Surat Dokumen (Kiri & Kanan)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unggah logo kop sebelah kiri (lambang provinsi/daerah) dan logo kop sebelah kanan (Tut Wuri Handayani / logo sekolah).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Kiri */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Logo Kop Kiri</span>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.tampilkan_logo_kop !== false}
                      onChange={(e) => setTemplate({ ...template, tampilkan_logo_kop: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="font-medium text-[11px]">Tampilkan</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-15 rounded-lg border border-slate-300 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {displayLogo ? (
                      <img src={displayLogo} alt="Logo Kop Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1.5 grow">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 text-[11px] font-bold hover:bg-blue-100 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3 h-3 text-blue-700" />
                        <span>Unggah</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleResetDefaultLogo}
                        className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition-colors"
                        title="Gunakan lambang resmi Pemprov"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Reset</span>
                      </button>

                      {template.logo_kop && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center space-x-1 px-1.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Posisi kiri atas kop surat</span>
                  </div>
                </div>
              </div>

              {/* Logo Kanan */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Logo Kop Kanan</span>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.tampilkan_logo_kop_kanan !== false}
                      onChange={(e) => setTemplate({ ...template, tampilkan_logo_kop_kanan: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="font-medium text-[11px]">Tampilkan</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-12 h-15 rounded-lg border border-slate-300 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {template.logo_kop_kanan ? (
                      <img src={template.logo_kop_kanan} alt="Logo Kop Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1.5 grow">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3 h-3 text-emerald-700" />
                        <span>Unggah Logo Kanan</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleRightLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {template.logo_kop_kanan && (
                        <button
                          type="button"
                          onClick={handleRemoveRightLogo}
                          className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Posisi kanan atas kop surat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Upload Tanda Tangan Digital */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center space-x-1.5">
                <PenTool className="w-4 h-4 text-blue-700" />
                <span>2. Tanda Tangan Kepala Sekolah (Langsung Tampil di SKL)</span>
              </label>
              <label className="flex items-center space-x-1.5 text-xs text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.tampilkan_tanda_tangan !== false}
                  onChange={(e) => setTemplate({ ...template, tampilkan_tanda_tangan: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <span className="font-semibold text-[11px]">Tampilkan TTD di SKL</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-16 rounded-xl border border-blue-200 bg-white p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {template.tanda_tangan ? (
                  <img src={template.tanda_tangan} alt="Tanda Tangan" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic text-center leading-tight">Belum Ada TTD</span>
                )}
              </div>

              <div className="space-y-2 grow">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Tanda Tangan</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>

                  {template.tanda_tangan && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Tanda Tangan</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-600">
                  Unggah file tanda tangan kepala sekolah (disarankan format PNG transparan) agar dokumen SKL yang diunduh siswa otomatis memuat tanda tangan sah.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 5 Baris Teks Kop Surat (Font Sans-Serif Proposional) */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Teks Kop Surat Resmi (Sesuai Format Dinas)
            </h5>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Baris 1: Instansi Atas
              </label>
              <input
                type="text"
                required
                value={template.kop_baris_1 || ''}
                onChange={(e) => setTemplate({ ...template, kop_baris_1: e.target.value })}
                placeholder="PEMERINTAH PROVINSI JAWA TENGAH"
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden uppercase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Baris 2: Dinas Pembina
                </label>
                <span className="text-[10px] text-slate-400">Ukuran font 1x lebih kecil dari nama sekolah</span>
              </div>
              <input
                type="text"
                required
                value={template.kop_baris_2 || ''}
                onChange={(e) => setTemplate({ ...template, kop_baris_2: e.target.value })}
                placeholder="DINAS PENDIDIKAN"
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Baris 3: Nama Satuan Pendidikan
              </label>
              <input
                type="text"
                required
                value={template.kop_baris_3 || ''}
                onChange={(e) => setTemplate({ ...template, kop_baris_3: e.target.value })}
                placeholder="SMK NEGERI 1 PEMALANG"
                className="w-full px-3 py-2 text-xs font-extrabold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Baris 4: Alamat & Telepon
              </label>
              <input
                type="text"
                required
                value={template.kop_baris_4 || ''}
                onChange={(e) => setTemplate({ ...template, kop_baris_4: e.target.value })}
                placeholder="Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319 Telepon 0284 321386"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Baris 5: Faksimile & Pos-el (Email)
              </label>
              <input
                type="text"
                required
                value={template.kop_baris_5 || ''}
                onChange={(e) => setTemplate({ ...template, kop_baris_5: e.target.value })}
                placeholder="Faksimile 0284 323376 Surat Elektronik admin@smkn1pml.sch.id"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Format Nomor & Paragraf SKL */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Format Nomor & Paragraf SKL
            </h5>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Format Nomor Surat SKL
              </label>
              <input
                type="text"
                required
                value={template.nomor_surat_format}
                onChange={(e) => setTemplate({ ...template, nomor_surat_format: e.target.value })}
                placeholder="421.5/{{NO_URUT}}/SKL/{{TAHUN}}"
                className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Teks Paragraf Pembuka
              </label>
              <textarea
                rows={3}
                required
                value={template.konten_pembuka}
                onChange={(e) => setTemplate({ ...template, konten_pembuka: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Teks Paragraf Penutup
              </label>
              <textarea
                rows={2}
                required
                value={template.konten_penutup}
                onChange={(e) => setTemplate({ ...template, konten_penutup: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden leading-relaxed"
              />
            </div>

            {/* Placeholders Reference */}
            <div>
              <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Variabel Tag Placeholder:</span>
              </h5>
              <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {placeholders.map((p, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-mono font-bold text-blue-900">{p.code}</span>
                    <span className="text-slate-500 text-[10px]">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Pratinjau Layout Kop & SKL (A4)
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Ukuran A4</span>
            </div>

            {/* Document Mockup Box - Clean font-sans everywhere, no times new roman */}
            <div className="border border-slate-300 rounded-xl p-4 bg-white shadow-md space-y-3 text-slate-800 text-[11px] leading-relaxed font-sans">
              {/* Kop Surat Header with dual logo support, differentiated font sizes, and center alignment */}
              <div className="relative pb-2.5 border-b-[3px] border-double border-slate-950">
                {/* Logo Kop Kiri */}
                {isLogoVisible && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-14 flex items-center justify-center">
                    <img
                      src={displayLogo}
                      alt="Logo Kop Kiri"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Logo Kop Kanan */}
                {isRightLogoVisible && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-14 flex items-center justify-center">
                    <img
                      src={template.logo_kop_kanan}
                      alt="Logo Kop Kanan"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Centered Text with clean sans font & font hierarchy */}
                <div
                  className={`text-center space-y-0.5 ${
                    isLogoVisible && isRightLogoVisible
                      ? 'px-12'
                      : isLogoVisible
                      ? 'pl-12 pr-2'
                      : isRightLogoVisible
                      ? 'pr-12 pl-2'
                      : 'px-2'
                  }`}
                >
                  {/* Baris 1: PEMERINTAH PROVINSI JAWA TENGAH (Font 1x lebih kecil dari baris 3) */}
                  <p className="font-bold text-[10px] tracking-tight uppercase text-slate-800 leading-snug">
                    {template.kop_baris_1 || 'PEMERINTAH PROVINSI JAWA TENGAH'}
                  </p>
                  {/* Baris 2: DINAS PENDIDIKAN (Font 1x lebih kecil dari baris 3) */}
                  <p className="font-bold text-[10px] tracking-tight uppercase text-slate-800 leading-snug">
                    {template.kop_baris_2 || 'DINAS PENDIDIKAN'}
                  </p>
                  {/* Baris 3: SMK NEGERI 1 PEMALANG (Font lebih besar & menonjol) */}
                  <p className="font-black text-[13.5px] tracking-tight uppercase text-slate-950 leading-snug">
                    {template.kop_baris_3 || 'SMK NEGERI 1 PEMALANG'}
                  </p>
                  {/* Baris 4: Alamat & Telepon */}
                  <p className="font-normal text-[8px] text-slate-700 leading-tight">
                    {template.kop_baris_4 || 'Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319 Telepon 0284 321386'}
                  </p>
                  {/* Baris 5: Faksimile & Pos-el */}
                  <p className="font-normal text-[8px] text-slate-700 leading-tight">
                    {template.kop_baris_5 || 'Faksimile 0284 323376 Surat Elektronik admin@smkn1pml.sch.id'}
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center pt-1 space-y-0.5 font-sans">
                <h6 className="font-extrabold text-xs text-slate-900 underline tracking-wide">
                  SURAT KETERANGAN LULUS
                </h6>
                <p className="font-mono text-[10px] text-slate-600">
                  Nomor: 421.5/0001/SKL/{new Date().getFullYear()}
                </p>
              </div>

              {/* Rendered Opening */}
              <p className="text-justify text-slate-700 italic font-sans text-[10px]">
                "{renderedPembukaPreview}"
              </p>

              {/* Student table */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 font-sans text-[10px]">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="col-span-2 font-bold text-slate-900">: {sampleStudent.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">NISN</span>
                  <span className="col-span-2 font-mono font-bold text-slate-900">: {sampleStudent.nisn}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">TTL</span>
                  <span className="col-span-2">: {sampleStudent.tempat_lahir}, {sampleStudent.tanggal_lahir}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-500">Kelas / Peminatan</span>
                  <span className="col-span-2 font-semibold">: {sampleStudent.kelas}</span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-2 rounded-lg border border-emerald-500 bg-emerald-50 text-center font-sans">
                <span className="text-[9px] text-slate-600 block">Dinyatakan:</span>
                <span className="text-sm font-black text-emerald-800 tracking-wider">
                  L U L U S
                </span>
              </div>

              {/* Rendered Closing */}
              <p className="text-justify text-slate-700 italic font-sans text-[10px]">
                "{renderedPenutupPreview}"
              </p>

              {/* Signature Block: Center in bottom-right corner with full Indonesian month name */}
              <div className="pt-2 flex justify-end font-sans">
                <div className="w-52 text-center space-y-0.5">
                  <p className="text-[9.5px] text-slate-800">
                    Pemalang, {formattedAnnouncementDate}
                  </p>
                  <p className="font-medium text-[9.5px] text-slate-800">
                    {settings.jabatan_penandatangan || 'Kepala Sekolah'},
                  </p>

                  {/* Signature Image or spacing */}
                  <div className="h-12 flex items-center justify-center my-0.5">
                    {isSignatureVisible ? (
                      <img
                        src={template.tanda_tangan}
                        alt="Tanda Tangan Kepala Sekolah"
                        className="max-h-12 max-w-[130px] object-contain"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-300 italic">(Tanda Tangan & Cap)</span>
                    )}
                  </div>

                  <p className="font-bold text-[10px] text-slate-900 underline">
                    {settings.nama_kepala_sekolah}
                  </p>
                  <p className="font-mono text-[8.5px] text-slate-600">
                    NIP. {settings.nip_kepala_sekolah}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test PDF Download button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestDownload}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Uji Coba Download PDF SKL dengan Tanda Tangan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
