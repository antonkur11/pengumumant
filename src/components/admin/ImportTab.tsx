import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ClipboardCopy,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  Sparkles,
  RefreshCw,
  FileText,
  Settings2,
  HelpCircle,
  Check,
  X,
  Loader2,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SchoolSettings } from '../../types.ts';
import { importStudents } from '../../services/api.ts';
import {
  parseUploadedFile,
  parseDelimitedText,
  autoDetectColumns,
  transformRowsWithMapping,
  downloadExcelTemplate,
  downloadCsvTemplate,
  ParsedStudentItem,
  ColumnMapping
} from '../../utils/importUtils.ts';

interface ImportTabProps {
  settings?: SchoolSettings;
}

export const ImportTab: React.FC<ImportTabProps> = ({ settings }) => {
  const defaultTahun = settings?.tahun_pelajaran || '2025/2026';

  // Input Method: 'file' (Excel / CSV) or 'paste' (Copy-Paste from Excel/Sheets)
  const [inputMethod, setInputMethod] = useState<'file' | 'paste'>('file');

  // File & Raw Data State
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    nisn: -1,
    nama: -1,
    tempat_lahir: -1,
    tanggal_lahir: -1,
    kelas: -1,
    status_kelulusan: -1,
    nomor_peserta: -1,
    tahun_pelajaran: -1,
  });
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const [autoPadNisn, setAutoPadNisn] = useState(true);

  // Transformed & Validated Items
  const [parsedItems, setParsedItems] = useState<ParsedStudentItem[]>([]);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'invalid'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Processing & Results
  const [importMode, setImportMode] = useState<'skip' | 'update'>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultReport, setResultReport] = useState<{
    total: number;
    berhasil: number;
    diperbarui: number;
    dilewati: number;
    gagal: number;
    errors: string[];
  } | null>(null);

  // 1. File Upload Handler (Supports .xlsx, .xls, .csv, .txt)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setResultReport(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsParsing(true);
      setFile(selectedFile);
      const parsed = await parseUploadedFile(selectedFile);

      if (parsed.rows.length === 0) {
        setErrorMessage('File tidak memiliki baris data.');
        setIsParsing(false);
        return;
      }

      setRawHeaders(parsed.headers);
      setRawRows(parsed.rows);

      const mapping = autoDetectColumns(parsed.headers);
      setColumnMapping(mapping);

      const transformed = transformRowsWithMapping(parsed.rows, mapping, defaultTahun, autoPadNisn);
      setParsedItems(transformed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membaca isi file. Pastikan format file sesuai.');
      setFile(null);
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // 2. Clipboard Paste Handler (Copy-Paste from Excel / Google Sheets)
  const handleProcessPastedText = () => {
    setErrorMessage(null);
    setResultReport(null);

    if (!pastedText.trim()) {
      setErrorMessage('Silakan tempel (paste) data dari Excel atau Google Sheets terlebih dahulu.');
      return;
    }

    try {
      setIsParsing(true);
      const parsed = parseDelimitedText(pastedText, 'excel');

      if (parsed.rows.length === 0) {
        setErrorMessage('Data yang ditempel tidak memuat baris data siswa yang valid.');
        setIsParsing(false);
        return;
      }

      setFile(new File([pastedText], 'data_salin_excel.xlsx', { type: 'text/plain' }));
      setRawHeaders(parsed.headers);
      setRawRows(parsed.rows);

      const mapping = autoDetectColumns(parsed.headers);
      setColumnMapping(mapping);

      const transformed = transformRowsWithMapping(parsed.rows, mapping, defaultTahun, autoPadNisn);
      setParsedItems(transformed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses data yang ditempel.');
    } finally {
      setIsParsing(false);
    }
  };

  // Quick Sample Paste
  const handleInsertSamplePaste = () => {
    const sample = [
      'NISN\tNama Siswa\tTempat Lahir\tTanggal Lahir\tKelas\tStatus Kelulusan\tNo Peserta\tTahun Pelajaran',
      `0012345689\tAHMAD FAUZAN\tSemarang\t12 Mei 2008\tXII TJKT 1\tLULUS\tUJN-2026-012\t${defaultTahun}`,
      `0012345690\tCITRA KIRANA\tSurabaya\t24 April 2008\tXII RPL 1\tLULUS\tUJN-2026-013\t${defaultTahun}`,
      `0012345691\tDIMAS ANGGARA\tJakarta\t18 November 2007\tXII DKV 1\tTIDAK LULUS\tUJN-2026-014\t${defaultTahun}`,
      `0012345692\tEKA NURHALIZA\tBandung\t03 Februari 2008\tXII RPL 2\tLULUS\tUJN-2026-015\t${defaultTahun}`,
      `0012345693\tFAJAR PRATAMA\tPemalang\t15 Juli 2008\tXII TJKT 2\tLULUS\tUJN-2026-016\t${defaultTahun}`
    ].join('\n');
    setPastedText(sample);
  };

  // Update mapping and recalculate
  const handleUpdateMapping = (field: keyof ColumnMapping, colIdx: number) => {
    const updated = { ...columnMapping, [field]: colIdx };
    setColumnMapping(updated);
    if (rawRows.length > 0) {
      const transformed = transformRowsWithMapping(rawRows, updated, defaultTahun, autoPadNisn);
      setParsedItems(transformed);
    }
  };

  // Toggle auto pad zero
  const handleToggleAutoPad = (checked: boolean) => {
    setAutoPadNisn(checked);
    if (rawRows.length > 0) {
      const transformed = transformRowsWithMapping(rawRows, columnMapping, defaultTahun, checked);
      setParsedItems(transformed);
    }
  };

  // Edit cell value directly in preview table
  const handleSaveCellEdit = (id: string, field: keyof ParsedStudentItem) => {
    const updated = parsedItems.map(item => {
      if (item.id !== id) return item;

      const newItem = { ...item, [field]: editValue };
      // Re-validate row
      const errors: string[] = [];
      const warnings: string[] = [];

      const cleanNisnVal = newItem.nisn.trim().replace(/[^0-9]/g, '');
      if (!cleanNisnVal) {
        errors.push('NISN kosong');
      } else if (!/^\d{10}$/.test(cleanNisnVal)) {
        errors.push(`NISN ${cleanNisnVal.length} digit (harus 10 digit angka)`);
      }

      if (!newItem.nama.trim()) errors.push('Nama siswa kosong');
      if (!newItem.kelas.trim()) errors.push('Kelas kosong');

      newItem.isValid = errors.length === 0;
      newItem.errors = errors;
      newItem.warnings = warnings;

      return newItem;
    });

    setParsedItems(updated);
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  // Delete single row from preview
  const handleDeleteRow = (id: string) => {
    setParsedItems(prev => prev.filter(p => p.id !== id));
  };

  // Remove all invalid rows with one click
  const handleRemoveInvalidRows = () => {
    const validOnly = parsedItems.filter(p => p.isValid);
    setParsedItems(validOnly);
  };

  // Clear all
  const handleReset = () => {
    setFile(null);
    setPastedText('');
    setRawHeaders([]);
    setRawRows([]);
    setParsedItems([]);
    setResultReport(null);
    setErrorMessage(null);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    const validItems = parsedItems.filter(p => p.isValid);
    if (validItems.length === 0) {
      setErrorMessage('Tidak ada data siswa yang valid untuk diimpor. Silakan periksa kembali data Anda.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const filename = file?.name || 'impor_siswa.xlsx';
      const res = await importStudents(validItems, importMode, filename);

      if (res.success) {
        setResultReport(res.report);
        setParsedItems([]);
        setFile(null);
        setPastedText('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengeksekusi impor data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats calculation
  const totalCount = parsedItems.length;
  const validCount = parsedItems.filter(p => p.isValid).length;
  const invalidCount = totalCount - validCount;

  const displayedRows = parsedItems.filter(item => {
    if (filterView === 'valid') return item.isValid;
    if (filterView === 'invalid') return !item.isValid;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Card & Method Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Impor Data Kelulusan Siswa (Excel & Spreadsheet)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Kini jauh lebih mudah! Anda dapat mengunggah file <strong>Excel asli (.xlsx / .xls)</strong>, file <strong>CSV</strong>, atau langsung <strong>salin-tempel (copy-paste)</strong> dari Microsoft Excel dan Google Sheets tanpa perlu repot mengatur format koma.
            </p>
          </div>

          {/* Download Template Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadExcelTemplate(defaultTahun)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => downloadCsvTemplate(defaultTahun)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Template CSV</span>
            </button>
          </div>
        </div>

        {/* Input Method Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setInputMethod('file');
              handleReset();
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3.5 ${
              inputMethod === 'file'
                ? 'border-blue-700 bg-blue-50/50 text-blue-950 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              inputMethod === 'file' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm">Cara 1: Unggah File Excel / CSV</div>
              <div className="text-[11px] text-slate-500">Pilih file .xlsx, .xls, atau .csv dari komputer</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMethod('paste');
              handleReset();
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center space-x-3.5 ${
              inputMethod === 'paste'
                ? 'border-blue-700 bg-blue-50/50 text-blue-950 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              inputMethod === 'paste' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <ClipboardCopy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm">Cara 2: Salin-Tempel (Copy-Paste)</div>
              <div className="text-[11px] text-slate-500">Blok data di Excel/Google Sheets, tekan Ctrl+C lalu Ctrl+V</div>
            </div>
          </button>
        </div>

        {/* Method 1: File Drag & Drop Zone */}
        {inputMethod === 'file' && (
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-7 bg-slate-50/50 text-center transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs text-blue-900 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6 text-blue-700" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800">
                {file ? file.name : 'Pilih atau Tarik File Excel (.xlsx / .xls) atau CSV'}
              </h4>
              <p className="text-xs text-slate-500">
                Mendukung file Microsoft Excel resmi maupun CSV tanpa batasan format pemisah.
              </p>
            </div>

            <div className="pt-1">
              <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-xs cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Pilih File dari Komputer</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Method 2: Copy-Paste Box */}
        {inputMethod === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <ClipboardCopy className="w-4 h-4 text-blue-700" />
                <span>Tempelkan Baris Data dari Excel atau Google Sheets di Sini:</span>
              </label>
              <button
                type="button"
                onClick={handleInsertSamplePaste}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Isi Contoh Data Otomatis</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Contoh salin beberapa baris dari Excel lalu tekan Ctrl+V di sini...&#10;0012345689	AHMAD FAUZAN	Semarang	12 Mei 2008	XII TJKT 1	LULUS&#10;0012345690	CITRA KIRANA	Surabaya	24 April 2008	XII RPL 1	LULUS"
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden bg-white leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim() || isParsing}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Proses & Analisis Data Siswa</span>
              </button>
            </div>
          </div>
        )}

        {/* Helpful auto-helpers toggle */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPadNisn}
              onChange={(e) => handleToggleAutoPad(e.target.checked)}
              className="rounded text-blue-900"
            />
            <span className="font-semibold text-slate-800">
              Otomatis lengkapi awalan '0' jika NISN kurang dari 10 digit
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (mengatasi angka 0 di depan yang terhapus saat disimpan di Excel)
            </span>
          </label>

          {parsedItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMappingSettings(!showMappingSettings)}
              className="inline-flex items-center space-x-1 font-bold text-blue-900 hover:text-blue-700 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showMappingSettings ? 'Tutup Pemetaan Kolom' : 'Sesuaikan Pemetaan Kolom'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Column Mapping Panel (Shows when toggled or if columns need manual adjustment) */}
      {showMappingSettings && rawHeaders.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                <Settings2 className="w-4 h-4 text-blue-700" />
                <span>Sesuaikan Pemetaan Kolom Dokumen Anda</span>
              </h4>
              <p className="text-xs text-slate-500">
                Cocokkan nama kolom di file Excel Anda dengan kolom data yang dibutuhkan sistem.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMappingSettings(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* NISN */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kolom NISN <span className="text-rose-500">*</span>
              </label>
              <select
                value={columnMapping.nisn}
                onChange={(e) => handleUpdateMapping('nisn', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>-- Pilih Kolom NISN --</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kolom Nama Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={columnMapping.nama}
                onChange={(e) => handleUpdateMapping('nama', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>-- Pilih Kolom Nama --</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Tempat Lahir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <select
                value={columnMapping.tempat_lahir}
                onChange={(e) => handleUpdateMapping('tempat_lahir', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>(Tidak ada / Otomatis '-')</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <select
                value={columnMapping.tanggal_lahir}
                onChange={(e) => handleUpdateMapping('tanggal_lahir', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>(Tidak ada / Otomatis '-')</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Kelas */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kelas / Jurusan <span className="text-rose-500">*</span>
              </label>
              <select
                value={columnMapping.kelas}
                onChange={(e) => handleUpdateMapping('kelas', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>-- Pilih Kolom Kelas --</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Kelulusan</label>
              <select
                value={columnMapping.status_kelulusan}
                onChange={(e) => handleUpdateMapping('status_kelulusan', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>(Otomatis 'LULUS')</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* No Peserta */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Peserta Ujian</label>
              <select
                value={columnMapping.nomor_peserta}
                onChange={(e) => handleUpdateMapping('nomor_peserta', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>(Opsional)</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun Pelajaran */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
              <select
                value={columnMapping.tahun_pelajaran}
                onChange={(e) => handleUpdateMapping('tahun_pelajaran', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-xs focus:border-blue-600 outline-hidden"
              >
                <option value={-1}>(Gunakan default: {defaultTahun})</option>
                {rawHeaders.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h || `Kolom ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Report */}
      {resultReport && (
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-md space-y-4">
          <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Proses Impor Berhasil Diselesaikan!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Total Baris</span>
              <span className="font-extrabold text-base text-slate-900">{resultReport.total}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="block font-semibold">Data Baru Masuk</span>
              <span className="font-extrabold text-base">{resultReport.berhasil}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <span className="block font-semibold">Data Diperbarui</span>
              <span className="font-extrabold text-base">{resultReport.diperbarui}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <span className="block font-semibold">Dilewati</span>
              <span className="font-extrabold text-base">{resultReport.dilewati}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <span className="block font-semibold">Gagal</span>
              <span className="font-extrabold text-base">{resultReport.gagal}</span>
            </div>
          </div>

          {resultReport.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <strong className="block font-bold">Catatan Kesalahan Baris:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {resultReport.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              Selesai & Impor Data Lainnya
            </button>
          </div>
        </div>
      )}

      {/* Interactive Preview Table & Control Bar */}
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          {/* Header & Filter Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                Pratinjau Data Siswa ({totalCount} Baris Terbaca)
              </h4>
              <p className="text-xs text-slate-500">
                Periksa data di bawah ini. Anda dapat mengklik sel untuk mengoreksi data secara langsung.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterView('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterView === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterView('valid')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterView === 'valid'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Valid ({validCount})
              </button>
              {invalidCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterView('invalid')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    filterView === 'invalid'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  Perlu Koreksi ({invalidCount})
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-slate-700">Jika NISN sudah terdaftar:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="importMode"
                  value="update"
                  checked={importMode === 'update'}
                  onChange={() => setImportMode('update')}
                  className="text-blue-900"
                />
                <span>Perbarui Data Lama</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="importMode"
                  value="skip"
                  checked={importMode === 'skip'}
                  onChange={() => setImportMode('skip')}
                  className="text-blue-900"
                />
                <span>Lewati (Jangan Timpa)</span>
              </label>
            </div>

            {invalidCount > 0 && (
              <button
                type="button"
                onClick={handleRemoveInvalidRows}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer transition-colors"
                title="Hapus baris yang gagal validasi dan hanya simpan yang valid"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Baris yang Bermasalah ({invalidCount})</span>
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase sticky top-0 border-b border-slate-200 z-10 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">NISN (10 Digit)</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Tempat, Tanggal Lahir</th>
                  <th className="py-2.5 px-3">Kelas / Rombel</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Status Validasi</th>
                  <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Tidak ada data yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className={`transition-colors ${
                        !row.isValid
                          ? 'bg-rose-50/70 hover:bg-rose-100/60'
                          : row.warnings && row.warnings.length > 0
                          ? 'bg-amber-50/40 hover:bg-amber-100/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* NISN (Editable) */}
                      <td className="py-2 px-3 font-mono">
                        {editingId === row.id && editingField === 'nisn' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-2 py-0.5 text-xs font-mono border border-blue-600 rounded bg-white w-28"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCellEdit(row.id!, 'nisn')}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingId(row.id!);
                              setEditingField('nisn');
                              setEditValue(row.nisn);
                            }}
                            className="group flex items-center space-x-1 cursor-pointer font-bold text-slate-900"
                            title="Klik untuk mengoreksi NISN"
                          >
                            <span className={!/^\d{10}$/.test(row.nisn) ? 'text-rose-700 underline font-extrabold' : ''}>
                              {row.nisn || <span className="text-rose-400 italic font-normal">Kosong</span>}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* Nama (Editable) */}
                      <td className="py-2 px-3">
                        {editingId === row.id && editingField === 'nama' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-2 py-0.5 text-xs border border-blue-600 rounded bg-white uppercase w-48"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCellEdit(row.id!, 'nama')}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingId(row.id!);
                              setEditingField('nama');
                              setEditValue(row.nama);
                            }}
                            className="group flex items-center space-x-1 cursor-pointer font-semibold text-slate-900"
                            title="Klik untuk mengoreksi Nama Siswa"
                          >
                            <span>{row.nama || <span className="text-rose-400 italic">Kosong</span>}</span>
                            <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* TTL */}
                      <td className="py-2 px-3 text-slate-600">
                        {row.tempat_lahir}, {row.tanggal_lahir}
                      </td>

                      {/* Kelas */}
                      <td className="py-2 px-3 font-semibold text-blue-900">
                        {row.kelas}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status_kelulusan === 'LULUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status_kelulusan === 'TIDAK LULUS'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {row.status_kelulusan}
                        </span>
                      </td>

                      {/* Validasi */}
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Siap Impor</span>
                            </span>
                            {row.warnings && row.warnings.length > 0 && (
                              <span className="text-amber-700 text-[10px] block">
                                {row.warnings.join(', ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-700 font-bold text-[11px] flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{row.errors.join(', ')}</span>
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id!)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus baris ini dari pratinjau"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Confirm & Save Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batalkan & Pilih Data Baru
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isLoading || validCount === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MEMPROSES IMPOR KE DATABASE...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    SIMPAN {validCount} DATA SISWA KE DATABASE
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
