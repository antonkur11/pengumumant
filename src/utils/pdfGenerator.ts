import { jsPDF } from 'jspdf';
import { Student, SchoolSettings, SKLTemplate } from '../types.ts';
import { DEFAULT_KOP_LOGO } from './defaultLogo.ts';

export function formatIndonesianDate(dateStr?: string): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  if (!dateStr || !dateStr.trim()) {
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  const clean = dateStr.trim();

  // If already contains an Indonesian month name, return it cleanly
  const hasIndoMonth = months.some(m => clean.toLowerCase().includes(m.toLowerCase()));
  if (hasIndoMonth) {
    return clean;
  }

  // Handle formats like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12 && !isNaN(d) && !isNaN(y)) {
        return `${d} ${months[m]} ${y}`;
      }
    } else if (parts[2].substring(0, 4).length === 4) {
      // DD-MM-YYYY or DD/MM/YYYY (may have timestamp after space or T)
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2].substring(0, 4), 10);
      if (m >= 0 && m < 12 && !isNaN(d) && !isNaN(y)) {
        return `${d} ${months[m]} ${y}`;
      }
    }
  }

  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return clean;
  } catch {
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
}


export function replacePlaceholders(text: string, student: Student, settings: SchoolSettings): string {
  const tglLahirFormatted = formatIndonesianDate(student.tanggal_lahir);
  const tempatTanggalLahir = `${student.tempat_lahir || ''}, ${tglLahirFormatted}`.trim().replace(/^,|,$/g, '');
  const tglPengumumanFormatted = formatIndonesianDate(settings.tanggal_pengumuman);

  return text
    .replace(/\{\{NISN\}\}/g, student.nisn || '')
    .replace(/\{\{NAMA\}\}/g, (student.nama || '').toUpperCase())
    .replace(/\{\{TEMPAT_LAHIR\}\}/g, student.tempat_lahir || '')
    .replace(/\{\{TANGGAL_LAHIR\}\}/g, tglLahirFormatted)
    .replace(/\{\{TEMPAT_TANGGAL_LAHIR\}\}/g, tempatTanggalLahir)
    .replace(/\{\{KELAS\}\}/g, student.kelas || '')
    .replace(/\{\{STATUS_KELULUSAN\}\}/g, student.status_kelulusan || '')
    .replace(/\{\{TAHUN_PELAJARAN\}\}/g, student.tahun_pelajaran || settings.tahun_pelajaran || '')
    .replace(/\{\{NAMA_SEKOLAH\}\}/g, settings.nama_sekolah || '')
    .replace(/\{\{NPSN\}\}/g, settings.npsn || '')
    .replace(/\{\{ALAMAT_SEKOLAH\}\}/g, settings.alamat || '')
    .replace(/\{\{NAMA_KEPALA_SEKOLAH\}\}/g, settings.nama_kepala_sekolah || '')
    .replace(/\{\{NIP_KEPALA_SEKOLAH\}\}/g, settings.nip_kepala_sekolah || '')
    .replace(/\{\{TANGGAL_PENGUMUMAN\}\}/g, tglPengumumanFormatted);
}

export function generateSklPdf(
  student: Student,
  settings: SchoolSettings,
  template?: SKLTemplate
): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // --- KOP SURAT RESMI (FONT SAMA DENGAN BAWAHNYA: HELVETICA & PROPORSI RAPI) ---
  const logoSrc = template?.logo_kop || settings.logo;
  let activeLogoData: string | null = null;

  if (logoSrc && logoSrc.startsWith('data:image/')) {
    activeLogoData = logoSrc;
  } else if (logoSrc && (logoSrc.includes('logo_kop') || logoSrc.startsWith('/'))) {
    activeLogoData = DEFAULT_KOP_LOGO;
  } else if (template?.tampilkan_logo_kop !== false) {
    activeLogoData = DEFAULT_KOP_LOGO;
  }

  const showLogo = template?.tampilkan_logo_kop !== false && Boolean(activeLogoData);

  // Logo Kop Kanan
  const rightLogoSrc = template?.logo_kop_kanan;
  const showRightLogo = template?.tampilkan_logo_kop_kanan !== false && Boolean(rightLogoSrc);

  // Text center position: strictly center of the page (105mm on A4)
  const textCenterX = pageWidth / 2;

  // Render Logo Kop Kiri (Pemprov / Dinas)
  if (showLogo && activeLogoData) {
    try {
      const leftFormat = activeLogoData.includes('image/jpeg') || activeLogoData.includes('image/jpg') ? 'JPEG' : 'PNG';
      doc.addImage(activeLogoData, leftFormat, margin, 13.5, 18, 23);
    } catch (e) {
      console.warn('Gagal memuat logo kop kiri ke PDF:', e);
    }
  }

  // Render Logo Kop Kanan (Sekolah / Tut Wuri Handayani)
  if (showRightLogo && rightLogoSrc) {
    try {
      let rightFormat = 'PNG';
      if (rightLogoSrc.includes('image/jpeg') || rightLogoSrc.includes('image/jpg')) {
        rightFormat = 'JPEG';
      }
      doc.addImage(rightLogoSrc, rightFormat, pageWidth - margin - 18, 13.5, 18, 23);
    } catch (e) {
      console.warn('Gagal memuat logo kop kanan ke PDF:', e);
      try {
        (doc as any).addImage(rightLogoSrc, pageWidth - margin - 18, 13.5, 18, 23);
      } catch (err2) {
        console.warn('Fallback addImage logo kanan juga gagal:', err2);
      }
    }
  }

  // Baris 1: PEMERINTAH PROVINSI JAWA TENGAH (Font: Helvetica Bold, Size: 11.5 - 1 level lebih kecil dari nama sekolah)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  const baris1 = template?.kop_baris_1 || 'PEMERINTAH PROVINSI JAWA TENGAH';
  doc.text(baris1, textCenterX, 16.5, { align: 'center' });

  // Baris 2: DINAS PENDIDIKAN (Font: Helvetica Bold, Size: 11.5 - 1 level lebih kecil dari nama sekolah)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  const baris2 = template?.kop_baris_2 || 'DINAS PENDIDIKAN';
  doc.text(baris2, textCenterX, 22, { align: 'center' });

  // Baris 3: SMK NEGERI 1 PEMALANG (Font: Helvetica Bold, Size: 15.5 - Menonjol & Elegan)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  const baris3 = template?.kop_baris_3 || (settings.nama_sekolah || 'SMK NEGERI 1 PEMALANG').toUpperCase();
  doc.text(baris3, textCenterX, 28.5, { align: 'center' });

  // Baris 4: Alamat & Telepon (Font: Helvetica Normal, Size: 8.5)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const baris4 = template?.kop_baris_4 || 'Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319 Telepon 0284 321386';
  doc.text(baris4, textCenterX, 33.5, { align: 'center' });

  // Baris 5: Faksimile & Pos-el (Font: Helvetica Normal, Size: 8.5)
  const baris5 = template?.kop_baris_5 || 'Faksimile 0284 323376 Surat Elektronik admin@smkn1pml.sch.id';
  doc.text(baris5, textCenterX, 37.5, { align: 'center' });

  // Double horizontal separator line (thick 0.9mm top, thin 0.3mm bottom)
  y = 41;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1.3;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- JUDUL DOKUMEN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT KETERANGAN LULUS', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Dynamic document number
  const currentYear = new Date().getFullYear();
  const rawNomor = template?.nomor_surat_format || '421.5/{{NO_URUT}}/SKL/{{TAHUN}}';
  const noUrut = student.nisn ? student.nisn.slice(-4) : '001';
  const nomorSurat = rawNomor
    .replace('{{NO_URUT}}', noUrut)
    .replace('{{TAHUN}}', currentYear.toString());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Nomor: ${nomorSurat}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // --- TEKS PEMBUKA ---
  const defaultPembuka =
    template?.konten_pembuka ||
    'Kepala {{NAMA_SEKOLAH}}, dengan NPSN {{NPSN}}, berdasarkan hasil rapat pleno dewan guru tentang kelulusan peserta didik Tahun Pelajaran {{TAHUN_PELAJARAN}}, dengan ini menerangkan bahwa:';

  const renderedPembuka = replacePlaceholders(defaultPembuka, student, settings);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const pembukaLines = doc.splitTextToSize(renderedPembuka, contentWidth);
  doc.text(pembukaLines, margin, y, { align: 'justify', maxWidth: contentWidth });
  y += pembukaLines.length * 5 + 4;

  // --- TABEL DATA SISWA ---
  const labelX = margin + 8;
  const colonX = margin + 65;
  const valueX = margin + 70;
  const lineSpacing = 6.2;

  const formattedTglLahir = formatIndonesianDate(student.tanggal_lahir);
  const dataSiswaList: [string, string][] = [
    ['Nama Lengkap', (student.nama || '').toUpperCase()],
    ['Tempat, Tanggal Lahir', `${student.tempat_lahir || '-'}, ${formattedTglLahir || '-'}`],
    ['Nomor Induk Siswa Nasional', student.nisn || '-'],
    ['Nomor Peserta Ujian', student.nomor_peserta || '-'],
    ['Kelas / Peminatan', student.kelas || '-'],
    ['Tahun Pelajaran', student.tahun_pelajaran || settings.tahun_pelajaran || '-'],
  ];

  dataSiswaList.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text(label, labelX, y);
    doc.text(':', colonX, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(value, valueX, y);
    y += lineSpacing;
  });

  y += 4;

  // --- KOTAK STATUS KELULUSAN ---
  const isLulus = student.status_kelulusan === 'LULUS';
  const boxHeight = 22;
  const boxY = y;

  if (isLulus) {
    doc.setFillColor(240, 253, 244); // light green tint
    doc.setDrawColor(22, 163, 74); // green border
  } else if (student.status_kelulusan === 'TIDAK LULUS') {
    doc.setFillColor(254, 242, 242); // light red tint
    doc.setDrawColor(220, 38, 38); // red border
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(100, 116, 139);
  }

  doc.setLineWidth(0.6);
  doc.roundedRect(margin + 10, boxY, contentWidth - 20, boxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Dinyatakan:', pageWidth / 2, boxY + 6.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  if (isLulus) {
    doc.setTextColor(21, 128, 61); // deep emerald
  } else if (student.status_kelulusan === 'TIDAK LULUS') {
    doc.setTextColor(185, 28, 28); // deep red
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text(student.status_kelulusan || 'LULUS', pageWidth / 2, boxY + 16, { align: 'center' });

  y = boxY + boxHeight + 8;

  // --- TEKS PENUTUP ---
  const defaultPenutup =
    template?.konten_penutup ||
    'Demikian Surat Keterangan Lulus ini diterbitkan untuk dapat dipergunakan sebagaimana mestinya sampai dengan diterbitkannya Ijazah asli.';
  const renderedPenutup = replacePlaceholders(defaultPenutup, student, settings);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const penutupLines = doc.splitTextToSize(renderedPenutup, contentWidth);
  doc.text(penutupLines, margin, y, { align: 'justify', maxWidth: contentWidth });
  y += penutupLines.length * 4.8 + 8;

  // --- TANDA TANGAN & PENGESAHAN (CENTER DI POJOK KANAN BAWAH) ---
  const tglFormatted = formatIndonesianDate(settings.tanggal_pengumuman);
  // Center of the signature column on the bottom right (between margin+100 and pageWidth-margin)
  const ttdCenterX = pageWidth - margin - 35;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(`Pemalang, ${tglFormatted}`, ttdCenterX, y, { align: 'center' });
  y += 5;

  doc.text(settings.jabatan_penandatangan || 'Kepala Sekolah,', ttdCenterX, y, { align: 'center' });
  y += 3;

  // Render signature image if uploaded and enabled
  const showSignature = template?.tanda_tangan && template?.tampilkan_tanda_tangan !== false;
  if (showSignature && template?.tanda_tangan) {
    try {
      const sigW = 34;
      const sigH = 17;
      doc.addImage(template.tanda_tangan, 'PNG', ttdCenterX - (sigW / 2), y, sigW, sigH);
      y += sigH + 2;
    } catch (e) {
      console.warn('Gagal memuat gambar tanda tangan:', e);
      y += 18;
    }
  } else {
    // Blank space for manual signature
    y += 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const kepsekNama = settings.nama_kepala_sekolah || 'Drs. H. Bambang Sudarsono, M.Pd.';
  doc.text(kepsekNama, ttdCenterX, y, { align: 'center' });

  // Elegant underline under Principal Name
  const nameWidth = doc.getTextWidth(kepsekNama);
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.35);
  doc.line(ttdCenterX - (nameWidth / 2), y + 0.8, ttdCenterX + (nameWidth / 2), y + 0.8);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`NIP. ${settings.nip_kepala_sekolah || '-'}`, ttdCenterX, y, { align: 'center' });

  // --- DIGITAL SECURITY FOOTER & QR PLACEHOLDER ---
  const footerY = 280;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Dokumen digital ini sah diterbitkan melalui Sistem Informasi Kelulusan Sekolah. NISN: ${student.nisn} | Terverifikasi Digital`,
    margin,
    footerY
  );
  doc.text(
    `Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );

  // File naming: SKL_0012345678_BUDI_SANTOSO.pdf
  const sanitizedNama = (student.nama || 'SISWA').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const filename = `SKL_${student.nisn}_${sanitizedNama}.pdf`;

  return { doc, filename };
}
