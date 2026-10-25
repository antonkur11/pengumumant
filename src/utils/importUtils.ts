import * as XLSX from 'xlsx';

export interface ColumnMapping {
  nisn: number;
  nama: number;
  tempat_lahir: number;
  tanggal_lahir: number;
  kelas: number;
  status_kelulusan: number;
  nomor_peserta: number;
  tahun_pelajaran: number;
}

export interface ParsedStudentItem {
  id?: string;
  nisn: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  kelas: string;
  status_kelulusan: 'LULUS' | 'TIDAK LULUS' | 'BELUM DITETAPKAN';
  nomor_peserta?: string;
  tahun_pelajaran?: string;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date values from Excel (serial numbers, Date objects, or strings) into clean Indonesian format
 */
export function cleanExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';

  // Excel serial date number
  if (typeof val === 'number' && val > 1000 && val < 60000) {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const d = date.getUTCDate();
      const m = date.getUTCMonth();
      const y = date.getUTCFullYear();
      return `${d} ${INDONESIAN_MONTHS[m]} ${y}`;
    }
  }

  // Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const d = val.getDate();
      const m = val.getMonth();
      const y = val.getFullYear();
      return `${d} ${INDONESIAN_MONTHS[m]} ${y}`;
    }
  }

  const str = String(val).trim();
  // If ISO string like 2008-04-12T00:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${d} ${INDONESIAN_MONTHS[m]} ${y}`;
      }
    }
  }

  return str;
}

/**
 * Normalize and pad NISN with leading zeros if dropped by Excel
 */
export function cleanNisn(val: any, autoPad = true): { cleaned: string; wasPadded: boolean } {
  if (val === null || val === undefined) return { cleaned: '', wasPadded: false };
  let str = String(val).trim().replace(/[^0-9]/g, '');

  let wasPadded = false;
  if (autoPad && (str.length === 8 || str.length === 9)) {
    str = str.padStart(10, '0');
    wasPadded = true;
  }

  return { cleaned: str, wasPadded };
}

/**
 * Normalize graduation status
 */
export function cleanStatus(val: any): 'LULUS' | 'TIDAK LULUS' | 'BELUM DITETAPKAN' {
  if (!val) return 'LULUS';
  const clean = String(val).trim().toUpperCase();

  if (clean === 'L' || clean === 'LULUS' || clean === '1' || clean === 'TRUE' || clean.includes('LULUS') && !clean.includes('TIDAK')) {
    return 'LULUS';
  }
  if (clean === 'TL' || clean === 'TIDAK LULUS' || clean === '0' || clean === 'TIDAK' || clean === 'FALSE') {
    return 'TIDAK LULUS';
  }
  if (clean.includes('BELUM') || clean.includes('TUNDA') || clean.includes('PENDING')) {
    return 'BELUM DITETAPKAN';
  }

  return 'LULUS';
}

/**
 * Auto-detect column headers using flexible Indonesian aliases
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const norm = headers.map(h => (h || '').toString().toLowerCase().trim().replace(/[_\-.]/g, ' '));

  const mapping: ColumnMapping = {
    nisn: -1,
    nama: -1,
    tempat_lahir: -1,
    tanggal_lahir: -1,
    kelas: -1,
    status_kelulusan: -1,
    nomor_peserta: -1,
    tahun_pelajaran: -1,
  };

  norm.forEach((h, idx) => {
    // 1. NISN
    if (mapping.nisn === -1) {
      if (h === 'nisn' || h.includes('nisn') || h === 'nomor induk siswa nasional' || h === 'no induk') {
        mapping.nisn = idx;
        return;
      }
    }

    // 2. Status Kelulusan
    if (mapping.status_kelulusan === -1) {
      if (
        h === 'status' ||
        h.includes('kelulusan') ||
        h === 'status kelulusan' ||
        h === 'keterangan' ||
        h === 'ket' ||
        h === 'hasil'
      ) {
        mapping.status_kelulusan = idx;
        return;
      }
    }

    // 3. Tanggal Lahir (check before tempat lahir)
    if (mapping.tanggal_lahir === -1) {
      if (
        h.includes('tanggal') ||
        h.includes('tgl') ||
        h === 'tgl lahir' ||
        h === 'tanggal lahir' ||
        h === 'birth date' ||
        h === 'dob'
      ) {
        mapping.tanggal_lahir = idx;
        return;
      }
    }

    // 4. Tempat Lahir
    if (mapping.tempat_lahir === -1) {
      if (
        h.includes('tempat') ||
        h === 'tempat lahir' ||
        h === 'kota lahir' ||
        h === 'tmpt lahir' ||
        h === 'tmp lahir' ||
        h === 'pob'
      ) {
        mapping.tempat_lahir = idx;
        return;
      }
    }

    // 5. Nama
    if (mapping.nama === -1) {
      if (
        h === 'nama' ||
        h === 'nama siswa' ||
        h === 'nama lengkap' ||
        h === 'nama peserta didik' ||
        h.includes('nama')
      ) {
        mapping.nama = idx;
        return;
      }
    }

    // 6. Kelas / Rombel / Jurusan
    if (mapping.kelas === -1) {
      if (
        h === 'kelas' ||
        h === 'rombel' ||
        h === 'jurusan' ||
        h === 'tingkat' ||
        h.includes('rombongan') ||
        h.includes('program keahlian') ||
        h.includes('kompetensi')
      ) {
        mapping.kelas = idx;
        return;
      }
    }

    // 7. Nomor Peserta
    if (mapping.nomor_peserta === -1) {
      if (
        h.includes('peserta') ||
        h.includes('ujian') ||
        h === 'no peserta' ||
        h === 'nomor peserta' ||
        h === 'nopes' ||
        h === 'no ujian'
      ) {
        mapping.nomor_peserta = idx;
        return;
      }
    }

    // 8. Tahun Pelajaran
    if (mapping.tahun_pelajaran === -1) {
      if (
        h.includes('tahun') ||
        h.includes('ajaran') ||
        h === 'tahun pelajaran' ||
        h === 'thn ajaran' ||
        h === 'tapel' ||
        h === 'tp'
      ) {
        mapping.tahun_pelajaran = idx;
        return;
      }
    }
  });

  return mapping;
}

/**
 * Parse an Excel (.xlsx / .xls) or CSV / TXT file
 */
export async function parseUploadedFile(file: File): Promise<{
  headers: string[];
  rows: any[][];
  sourceType: 'excel' | 'csv';
}> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
    const firstSheet = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

    if (data.length === 0) {
      throw new Error('Lembar kerja Excel kosong.');
    }

    const headers = (data[0] || []).map(cell => String(cell || '').trim());
    const rows = data.slice(1).filter(r => r.some(c => String(c).trim() !== ''));

    return { headers, rows, sourceType: 'excel' };
  } else {
    // CSV or TXT file - Auto-detect separator (comma vs semicolon vs tab)
    const text = await file.text();
    return parseDelimitedText(text, 'csv');
  }
}

/**
 * Parse text from copy-paste or CSV
 */
export function parseDelimitedText(
  text: string,
  sourceType: 'excel' | 'csv' = 'csv'
): {
  headers: string[];
  rows: any[][];
  sourceType: 'excel' | 'csv';
} {
  const cleanText = text.replace(/^\uFEFF/, ''); // Strip BOM
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Data teks kosong.');
  }

  // Determine delimiter from first few lines
  const sample = lines.slice(0, 5).join('\n');
  const countTab = (sample.match(/\t/g) || []).length;
  const countSemicolon = (sample.match(/;/g) || []).length;
  const countComma = (sample.match(/,/g) || []).length;

  let delimiter = ',';
  if (countTab > countSemicolon && countTab > countComma) {
    delimiter = '\t';
  } else if (countSemicolon > countComma) {
    delimiter = ';';
  }

  const parsedMatrix: string[][] = [];

  for (const line of lines) {
    const cols: string[] = [];
    let inQuote = false;
    let curr = '';

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === delimiter && !inQuote) {
        cols.push(curr.trim().replace(/^["']|["']$/g, ''));
        curr = '';
      } else {
        curr += ch;
      }
    }
    cols.push(curr.trim().replace(/^["']|["']$/g, ''));
    if (cols.some(c => c !== '')) {
      parsedMatrix.push(cols);
    }
  }

  if (parsedMatrix.length === 0) {
    throw new Error('Tidak ada baris data yang valid ditemukan.');
  }

  // Check if first row is header or data
  const firstRow = parsedMatrix[0];
  const firstRowContainsKeywords = firstRow.some(cell => {
    const lower = cell.toLowerCase();
    return lower.includes('nisn') || lower.includes('nama') || lower.includes('kelas') || lower.includes('status');
  });

  let headers: string[];
  let rows: any[][];

  if (firstRowContainsKeywords || parsedMatrix.length === 1) {
    headers = firstRow.map(c => c.trim());
    rows = parsedMatrix.slice(1);
  } else {
    // Generate automatic headers
    headers = firstRow.map((_, i) => `Kolom ${i + 1}`);
    rows = parsedMatrix;
  }

  return { headers, rows, sourceType };
}

/**
 * Validate and transform raw rows based on column mapping
 */
export function transformRowsWithMapping(
  rawRows: any[][],
  mapping: ColumnMapping,
  defaultTahunPelajaran: string,
  autoPadNisn = true
): ParsedStudentItem[] {
  const seenNisns = new Map<string, number>();
  const items: ParsedStudentItem[] = [];

  rawRows.forEach((row, rowIdx) => {
    // Check if entire row is empty
    if (!row || row.every(c => String(c || '').trim() === '')) {
      return;
    }

    const rawNisnVal = mapping.nisn !== -1 ? row[mapping.nisn] : '';
    const rawNamaVal = mapping.nama !== -1 ? row[mapping.nama] : '';
    const rawTempatVal = mapping.tempat_lahir !== -1 ? row[mapping.tempat_lahir] : '';
    const rawTglVal = mapping.tanggal_lahir !== -1 ? row[mapping.tanggal_lahir] : '';
    const rawKelasVal = mapping.kelas !== -1 ? row[mapping.kelas] : '';
    const rawStatusVal = mapping.status_kelulusan !== -1 ? row[mapping.status_kelulusan] : 'LULUS';
    const rawNopesVal = mapping.nomor_peserta !== -1 ? row[mapping.nomor_peserta] : '';
    const rawTahunVal = mapping.tahun_pelajaran !== -1 ? row[mapping.tahun_pelajaran] : '';

    const { cleaned: nisnClean, wasPadded } = cleanNisn(rawNisnVal, autoPadNisn);
    const namaClean = String(rawNamaVal || '').trim().toUpperCase();
    const tempatClean = String(rawTempatVal || '').trim();
    const tglClean = cleanExcelDate(rawTglVal);
    const kelasClean = String(rawKelasVal || '').trim();
    const statusClean = cleanStatus(rawStatusVal);
    const nopesClean = String(rawNopesVal || '').trim();
    const tahunClean = String(rawTahunVal || '').trim() || defaultTahunPelajaran;

    const errors: string[] = [];
    const warnings: string[] = [];

    // NISN Validation
    if (!nisnClean) {
      errors.push('NISN kosong');
    } else if (!/^\d{10}$/.test(nisnClean)) {
      errors.push(`NISN tidak valid (${nisnClean.length} digit, harus 10 digit angka)`);
    } else if (seenNisns.has(nisnClean)) {
      const prevRow = seenNisns.get(nisnClean)! + 1;
      errors.push(`Duplikat NISN dengan baris ke-${prevRow}`);
    } else {
      seenNisns.set(nisnClean, rowIdx);
    }

    if (wasPadded) {
      warnings.push("Otomatis ditambahkan '0' di depan");
    }

    if (!namaClean) errors.push('Nama siswa kosong');
    if (!tempatClean) warnings.push('Tempat lahir belum diisi (otomatis -)');
    if (!tglClean) warnings.push('Tanggal lahir belum diisi (otomatis -)');
    if (!kelasClean) errors.push('Kelas belum diisi');

    items.push({
      id: `row_${rowIdx + 1}`,
      nisn: nisnClean,
      nama: namaClean,
      tempat_lahir: tempatClean || '-',
      tanggal_lahir: tglClean || '-',
      kelas: kelasClean || 'XII',
      status_kelulusan: statusClean,
      nomor_peserta: nopesClean || undefined,
      tahun_pelajaran: tahunClean,
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  });

  return items;
}

/**
 * Generate and download Excel template (.xlsx)
 */
export function downloadExcelTemplate(tahunPelajaran = '2025/2026') {
  const wb = XLSX.utils.book_new();

  const headers = [
    'NISN',
    'Nama Lengkap',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Kelas',
    'Status Kelulusan',
    'Nomor Peserta',
    'Tahun Pelajaran'
  ];

  const sampleData = [
    ['0012345689', 'AHMAD FAUZAN', 'Semarang', '12 Mei 2008', 'XII TJKT 1', 'LULUS', 'UJN-2026-012', tahunPelajaran],
    ['0012345690', 'CITRA KIRANA', 'Surabaya', '24 April 2008', 'XII RPL 1', 'LULUS', 'UJN-2026-013', tahunPelajaran],
    ['0012345691', 'DIMAS ANGGARA', 'Jakarta', '18 November 2007', 'XII DKV 1', 'TIDAK LULUS', 'UJN-2026-014', tahunPelajaran],
    ['0012345692', 'EKA NURHALIZA', 'Bandung', '03 Februari 2008', 'XII RPL 2', 'LULUS', 'UJN-2026-015', tahunPelajaran],
    ['0012345693', 'FAJAR PRATAMA', 'Pemalang', '15 Juli 2008', 'XII TJKT 2', 'LULUS', 'UJN-2026-016', tahunPelajaran]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // NISN
    { wch: 28 }, // Nama
    { wch: 18 }, // Tempat Lahir
    { wch: 18 }, // Tanggal Lahir
    { wch: 15 }, // Kelas
    { wch: 18 }, // Status
    { wch: 16 }, // Nomor Peserta
    { wch: 16 }, // Tahun Pelajaran
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'template_impor_siswa_kelulusan.xlsx');
}

/**
 * Generate and download CSV template (.csv) with UTF-8 BOM
 */
export function downloadCsvTemplate(tahunPelajaran = '2025/2026') {
  const content =
    '\uFEFF' +
    'nisn,nama,tempat_lahir,tanggal_lahir,kelas,status_kelulusan,nomor_peserta,tahun_pelajaran\n' +
    `0012345689,AHMAD FAUZAN,Semarang,12 Mei 2008,XII TJKT 1,LULUS,UJN-2026-012,${tahunPelajaran}\n` +
    `0012345690,CITRA KIRANA,Surabaya,24 April 2008,XII RPL 1,LULUS,UJN-2026-013,${tahunPelajaran}\n` +
    `0012345691,DIMAS ANGGARA,Jakarta,18 November 2007,XII DKV 1,TIDAK LULUS,UJN-2026-014,${tahunPelajaran}\n` +
    `0012345692,EKA NURHALIZA,Bandung,03 Februari 2008,XII RPL 2,LULUS,UJN-2026-015,${tahunPelajaran}`;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'template_impor_siswa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
