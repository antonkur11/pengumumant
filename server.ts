import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { dbManager, verifyPassword, createPasswordRecord } from './server/db.ts';
import { Student, SchoolSettings, SKLTemplate } from './src/types.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// In-memory token store for admin sessions (active sessions with expiry)
const activeSessions = new Map<string, { username: string; expiresAt: number }>();

// Simple IP-based rate limiter for NISN checks
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to sanitize text
function sanitize(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}

// Authentication middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak valid atau belum login.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
  }

  // Extend session on activity (sliding expiration of 8 hours)
  session.expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  (req as any).adminUser = session.username;
  next();
}

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// 1. Public School & Announcement Config
app.get('/api/public/info', (req, res) => {
  try {
    const db = dbManager.getDb();
    const s = db.settings;

    // Check announcement timing on server
    const now = new Date();
    const announcementTime = new Date(s.tanggal_pengumuman);
    let isOpen = false;

    if (s.status_pengumuman === 'SUDAH_DIBUKA') {
      isOpen = true;
    } else if (s.status_pengumuman === 'BELUM_DIBUKA') {
      isOpen = now.getTime() >= announcementTime.getTime();
    } else {
      // DITUTUP
      isOpen = false;
    }

    res.json({
      success: true,
      data: {
        nama_sekolah: s.nama_sekolah,
        npsn: s.npsn,
        alamat: s.alamat,
        logo: s.logo,
        telepon: s.telepon,
        email: s.email,
        tahun_pelajaran: s.tahun_pelajaran,
        nama_kepala_sekolah: s.nama_kepala_sekolah,
        nip_kepala_sekolah: s.nip_kepala_sekolah,
        jabatan_penandatangan: s.jabatan_penandatangan,
        warna_tema: s.warna_tema,
        judul_pengumuman: s.judul_pengumuman,
        deskripsi_pengumuman: s.deskripsi_pengumuman,
        teks_footer: s.teks_footer,
        tanggal_pengumuman: s.tanggal_pengumuman,
        zona_waktu: s.zona_waktu,
        status_pengumuman: s.status_pengumuman,
        judul_countdown: s.judul_countdown,
        pesan_sebelum_pengumuman: s.pesan_sebelum_pengumuman,
        pesan_setelah_pengumuman: s.pesan_setelah_pengumuman,
        pencarian_aktif: s.pencarian_aktif,
        download_skl_aktif: s.download_skl_aktif,
        isOpen,
        serverTime: now.toISOString(),
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil informasi publik.' });
  }
});

// 2. Public NISN Search (STRICT SECURITY & VALIDATION)
app.post('/api/check-nisn', (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Rate limiter
    const rate = rateLimitMap.get(clientIp);
    const db = dbManager.getDb();
    const limitMax = db.settings.batas_pencarian_per_menit || 30;

    if (rate && rate.resetAt > now) {
      if (rate.count >= limitMax) {
        return res.status(429).json({
          allowed: false,
          message: 'Terlalu banyak permintaan pencarian. Mohon tunggu beberapa saat sebelum mencoba kembali.'
        });
      }
      rate.count++;
    } else {
      rateLimitMap.set(clientIp, { count: 1, resetAt: now + 60 * 1000 });
    }

    const { nisn } = req.body;

    // Validate NISN format: exactly 10 digits string
    if (!nisn || typeof nisn !== 'string' || !/^\d{10}$/.test(nisn.trim())) {
      return res.status(400).json({
        allowed: false,
        message: 'Format NISN tidak valid. NISN harus terdiri dari tepat 10 digit angka.'
      });
    }

    const cleanNisn = nisn.trim();
    const settings = db.settings;

    // Server-side check: is search active?
    if (!settings.pencarian_aktif) {
      return res.status(403).json({
        allowed: false,
        message: 'Layanan pencarian kelulusan sedang dinonaktifkan oleh pihak sekolah.'
      });
    }

    // Server-side check: announcement status & time
    const currentDate = new Date();
    const schedDate = new Date(settings.tanggal_pengumuman);

    if (settings.status_pengumuman === 'DITUTUP') {
      return res.status(403).json({
        allowed: false,
        message: 'Pengumuman kelulusan saat ini telah ditutup oleh pihak sekolah.'
      });
    }

    if (settings.status_pengumuman === 'BELUM_DIBUKA' && currentDate.getTime() < schedDate.getTime()) {
      return res.status(403).json({
        allowed: false,
        message: settings.pesan_sebelum_pengumuman || 'Pengumuman kelulusan belum dibuka. Silakan cek kembali sesuai jadwal.'
      });
    }

    // Find student (only return this single student!)
    const student = db.students.find(s => s.nisn === cleanNisn);

    if (!student) {
      return res.json({
        allowed: true,
        data: null,
        message: 'Data tidak ditemukan atau belum dapat ditampilkan. Silakan periksa kembali NISN Anda atau hubungi pihak sekolah.'
      });
    }

    // Return sanitized single student record
    res.json({
      allowed: true,
      data: {
        nisn: student.nisn,
        nama: student.nama,
        tempat_lahir: student.tempat_lahir,
        tanggal_lahir: student.tanggal_lahir,
        kelas: student.kelas,
        status_kelulusan: student.status_kelulusan,
        nomor_peserta: student.nomor_peserta || '-',
        tahun_pelajaran: student.tahun_pelajaran || settings.tahun_pelajaran,
      },
      settings: {
        nama_sekolah: settings.nama_sekolah,
        npsn: settings.npsn,
        alamat: settings.alamat,
        logo: settings.logo,
        download_skl_aktif: settings.download_skl_aktif,
        tahun_pelajaran: settings.tahun_pelajaran,
      }
    });
  } catch (err) {
    res.status(500).json({ allowed: false, message: 'Terjadi kesalahan sistem saat memproses pencarian.' });
  }
});

// 3. Log SKL Download & Get Full Template Placeholders for PDF Generation
app.post('/api/download-skl-check', (req, res) => {
  try {
    const { nisn } = req.body;
    if (!nisn || typeof nisn !== 'string' || !/^\d{10}$/.test(nisn.trim())) {
      return res.status(400).json({ success: false, message: 'NISN tidak valid.' });
    }

    const cleanNisn = nisn.trim();
    const db = dbManager.getDb();
    const settings = db.settings;

    if (!settings.download_skl_aktif) {
      return res.status(403).json({ success: false, message: 'Fitur unduh SKL sedang dinonaktifkan oleh pihak sekolah.' });
    }

    const student = db.students.find(s => s.nisn === cleanNisn);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    // Log the download event
    dbManager.logDownload(cleanNisn, student.nama, 'BERHASIL');

    res.json({
      success: true,
      student,
      settings,
      template: db.template
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses verifikasi unduhan SKL.' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const db = dbManager.getDb();
    const admin = db.admin;

    if (username.trim() !== admin.username) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const isValid = verifyPassword(password, admin.salt, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
    activeSessions.set(token, { username: admin.username, expiresAt });

    // Update last login
    admin.lastLogin = new Date().toISOString();
    dbManager.saveDb(db);
    dbManager.logActivity(admin.username, 'Login', 'Admin berhasil login ke dashboard');

    res.json({
      success: true,
      token,
      username: admin.username,
      message: 'Login berhasil.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memproses login.' });
  }
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  const user = (req as any).adminUser || 'Admin';
  dbManager.logActivity(user, 'Logout', 'Admin keluar dari sesi');
  res.json({ success: true, message: 'Berhasil logout.' });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  const db = dbManager.getDb();
  res.json({
    success: true,
    data: {
      username: db.admin.username,
      lastLogin: db.admin.lastLogin,
    }
  });
});

// ==========================================
// ADMIN DASHBOARD & STATS
// ==========================================

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    const students = db.students;
    const settings = db.settings;

    const totalSiswa = students.length;
    let lulus = 0;
    let tidakLulus = 0;
    let belumDitetapkan = 0;
    const perKelas: { [kelas: string]: { total: number; lulus: number; tidakLulus: number } } = {};

    students.forEach(s => {
      if (s.status_kelulusan === 'LULUS') lulus++;
      else if (s.status_kelulusan === 'TIDAK LULUS') tidakLulus++;
      else belumDitetapkan++;

      const k = s.kelas || 'Lainnya';
      if (!perKelas[k]) {
        perKelas[k] = { total: 0, lulus: 0, tidakLulus: 0 };
      }
      perKelas[k].total++;
      if (s.status_kelulusan === 'LULUS') perKelas[k].lulus++;
      if (s.status_kelulusan === 'TIDAK LULUS') perKelas[k].tidakLulus++;
    });

    const persentaseKelulusan = totalSiswa > 0 ? Math.round((lulus / totalSiswa) * 100 * 10) / 10 : 0;

    const now = new Date();
    const schedDate = new Date(settings.tanggal_pengumuman);
    const isAnnouncementOpen =
      settings.status_pengumuman === 'SUDAH_DIBUKA' ||
      (settings.status_pengumuman === 'BELUM_DIBUKA' && now.getTime() >= schedDate.getTime());

    res.json({
      success: true,
      stats: {
        totalSiswa,
        lulus,
        tidakLulus,
        belumDitetapkan,
        persentaseKelulusan,
        totalUnduhanSKL: db.downloadLogs.length,
        totalImpor: db.importHistory.length,
        perKelas,
        serverTime: now.toISOString(),
        isAnnouncementOpen,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat statistik.' });
  }
});

// ==========================================
// ADMIN STUDENTS CRUD & IMPORT
// ==========================================

app.get('/api/admin/students', requireAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    let list = [...db.students];

    const { search, kelas, status, page = '1', limit = '10' } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(s => s.nisn.includes(q) || s.nama.toLowerCase().includes(q));
    }

    if (kelas && typeof kelas === 'string' && kelas !== 'ALL') {
      list = list.filter(s => s.kelas === kelas);
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter(s => s.status_kelulusan === status);
    }

    const totalCount = list.length;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    // Extract unique classes for filter dropdown
    const availableClasses = Array.from(new Set(db.students.map(s => s.kelas).filter(Boolean))).sort();

    res.json({
      success: true,
      students: paginated,
      totalCount,
      totalPages,
      currentPage: pageNum,
      availableClasses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memuat data siswa.' });
  }
});

app.post('/api/admin/students', requireAdmin, (req, res) => {
  try {
    const { nisn, nama, tempat_lahir, tanggal_lahir, kelas, status_kelulusan, nomor_peserta, tahun_pelajaran } = req.body;

    if (!nisn || !nama || !tempat_lahir || !tanggal_lahir || !kelas || !status_kelulusan) {
      return res.status(400).json({ success: false, message: 'Kolom wajib tidak boleh kosong.' });
    }

    const cleanNisn = nisn.toString().trim();
    if (!/^\d{10}$/.test(cleanNisn)) {
      return res.status(400).json({ success: false, message: 'NISN harus berupa 10 digit angka.' });
    }

    const db = dbManager.getDb();
    if (db.students.some(s => s.nisn === cleanNisn)) {
      return res.status(400).json({ success: false, message: `NISN ${cleanNisn} sudah terdaftar dalam sistem.` });
    }

    const newStudent: Student = {
      id: 'std_' + Date.now(),
      nisn: cleanNisn,
      nama: sanitize(nama.toUpperCase()),
      tempat_lahir: sanitize(tempat_lahir),
      tanggal_lahir: sanitize(tanggal_lahir),
      kelas: sanitize(kelas),
      status_kelulusan,
      nomor_peserta: nomor_peserta ? sanitize(nomor_peserta) : undefined,
      tahun_pelajaran: tahun_pelajaran ? sanitize(tahun_pelajaran) : db.settings.tahun_pelajaran,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.students.unshift(newStudent);
    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Tambah Siswa', `Menambahkan siswa: ${newStudent.nama} (${newStudent.nisn})`);

    res.json({ success: true, student: newStudent, message: 'Data siswa berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan data siswa.' });
  }
});

app.put('/api/admin/students/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { nisn, nama, tempat_lahir, tanggal_lahir, kelas, status_kelulusan, nomor_peserta, tahun_pelajaran } = req.body;

    const db = dbManager.getDb();
    const index = db.students.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    const cleanNisn = nisn.toString().trim();
    if (!/^\d{10}$/.test(cleanNisn)) {
      return res.status(400).json({ success: false, message: 'NISN harus berupa 10 digit angka.' });
    }

    // Check if new NISN is already used by another student
    const existing = db.students.find(s => s.nisn === cleanNisn && s.id !== id);
    if (existing) {
      return res.status(400).json({ success: false, message: `NISN ${cleanNisn} sudah digunakan oleh siswa lain.` });
    }

    const current = db.students[index];
    const updated: Student = {
      ...current,
      nisn: cleanNisn,
      nama: sanitize(nama.toUpperCase()),
      tempat_lahir: sanitize(tempat_lahir),
      tanggal_lahir: sanitize(tanggal_lahir),
      kelas: sanitize(kelas),
      status_kelulusan,
      nomor_peserta: nomor_peserta ? sanitize(nomor_peserta) : current.nomor_peserta,
      tahun_pelajaran: tahun_pelajaran ? sanitize(tahun_pelajaran) : current.tahun_pelajaran,
      updated_at: new Date().toISOString(),
    };

    db.students[index] = updated;
    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Edit Siswa', `Memperbarui data siswa: ${updated.nama} (${updated.nisn})`);

    res.json({ success: true, student: updated, message: 'Data siswa berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa.' });
  }
});

app.delete('/api/admin/students/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = dbManager.getDb();
    const index = db.students.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
    }

    const deleted = db.students.splice(index, 1)[0];
    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Hapus Siswa', `Menghapus data siswa: ${deleted.nama} (${deleted.nisn})`);

    res.json({ success: true, message: `Data siswa ${deleted.nama} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data siswa.' });
  }
});

// Bulk Import
app.post('/api/admin/students/import', requireAdmin, (req, res) => {
  try {
    const { items, mode, filename = 'impor_siswa.csv' } = req.body;
    // mode: 'skip' | 'update'

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data impor kosong atau format tidak valid.' });
    }

    const db = dbManager.getDb();
    let berhasil = 0;
    let gagal = 0;
    let diperbarui = 0;
    let dilewati = 0;
    const errors: string[] = [];

    const existingMap = new Map<string, number>();
    db.students.forEach((s, idx) => existingMap.set(s.nisn, idx));

    const fileNisns = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowNum = i + 1;
      const rawNisn = (row.nisn || '').toString().trim();

      if (!/^\d{10}$/.test(rawNisn)) {
        gagal++;
        errors.push(`Baris ${rowNum}: NISN "${rawNisn}" tidak valid (harus 10 digit angka).`);
        continue;
      }

      if (fileNisns.has(rawNisn)) {
        gagal++;
        errors.push(`Baris ${rowNum}: Duplikasi NISN "${rawNisn}" di dalam file impor.`);
        continue;
      }
      fileNisns.add(rawNisn);

      const nama = (row.nama || '').toString().trim();
      if (!nama) {
        gagal++;
        errors.push(`Baris ${rowNum}: Nama tidak boleh kosong.`);
        continue;
      }

      let status = (row.status_kelulusan || 'LULUS').toString().toUpperCase().trim();
      if (!['LULUS', 'TIDAK LULUS', 'BELUM DITETAPKAN'].includes(status)) {
        status = 'LULUS';
      }

      const tempatLahir = (row.tempat_lahir || '-').toString().trim();
      const tanggalLahir = (row.tanggal_lahir || '-').toString().trim();
      const kelas = (row.kelas || 'XII').toString().trim();
      const tahunPelajaran = (row.tahun_pelajaran || db.settings.tahun_pelajaran).toString().trim();
      const nomorPeserta = (row.nomor_peserta || '').toString().trim();

      const existingIndex = existingMap.get(rawNisn);

      if (existingIndex !== undefined) {
        if (mode === 'skip') {
          dilewati++;
          continue;
        } else {
          // Update mode
          db.students[existingIndex] = {
            ...db.students[existingIndex],
            nama: sanitize(nama.toUpperCase()),
            tempat_lahir: sanitize(tempatLahir),
            tanggal_lahir: sanitize(tanggalLahir),
            kelas: sanitize(kelas),
            status_kelulusan: status as any,
            nomor_peserta: nomorPeserta || db.students[existingIndex].nomor_peserta,
            tahun_pelajaran: tahunPelajaran,
            updated_at: new Date().toISOString(),
          };
          diperbarui++;
          berhasil++;
        }
      } else {
        // New student
        const newStd: Student = {
          id: 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          nisn: rawNisn,
          nama: sanitize(nama.toUpperCase()),
          tempat_lahir: sanitize(tempatLahir),
          tanggal_lahir: sanitize(tanggalLahir),
          kelas: sanitize(kelas),
          status_kelulusan: status as any,
          nomor_peserta: nomorPeserta || undefined,
          tahun_pelajaran: tahunPelajaran,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.students.push(newStd);
        existingMap.set(rawNisn, db.students.length - 1);
        berhasil++;
      }
    }

    dbManager.saveDb(db);

    // Save import history
    const historyItem = {
      id: 'imp_' + Date.now(),
      nama_file: filename,
      total_data: items.length,
      berhasil,
      gagal,
      waktu_impor: new Date().toISOString(),
      admin_id: (req as any).adminUser || 'Admin',
    };
    db.importHistory.unshift(historyItem);
    dbManager.saveDb(db);

    dbManager.logActivity(
      (req as any).adminUser,
      'Impor Data',
      `Impor ${filename}: ${berhasil} berhasil, ${diperbarui} diperbarui, ${dilewati} dilewati, ${gagal} gagal.`
    );

    res.json({
      success: true,
      report: {
        total: items.length,
        berhasil,
        diperbarui,
        dilewati,
        gagal,
        errors: errors.slice(0, 20), // Return first 20 errors
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memproses impor data siswa.' });
  }
});

// ==========================================
// ADMIN SETTINGS & TEMPLATE
// ==========================================

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const db = dbManager.getDb();
  res.json({ success: true, settings: db.settings });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    const newSettings = req.body;

    db.settings = {
      ...db.settings,
      ...newSettings,
    };

    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Pengaturan', 'Memperbarui identitas dan pengaturan sekolah');

    res.json({ success: true, settings: db.settings, message: 'Pengaturan berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
  }
});

app.get('/api/admin/template', requireAdmin, (req, res) => {
  const db = dbManager.getDb();
  res.json({ success: true, template: db.template });
});

app.put('/api/admin/template', requireAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    const {
      nama_template,
      nomor_surat_format,
      konten_pembuka,
      konten_penutup,
      status_aktif,
      logo_kop,
      logo_kop_kanan,
      kop_baris_1,
      kop_baris_2,
      kop_baris_3,
      kop_baris_4,
      kop_baris_5,
      tampilkan_logo_kop,
      tampilkan_logo_kop_kanan,
      tanda_tangan,
      tampilkan_tanda_tangan
    } = req.body;

    db.template = {
      ...db.template,
      nama_template: nama_template || db.template.nama_template,
      nomor_surat_format: nomor_surat_format || db.template.nomor_surat_format,
      konten_pembuka: konten_pembuka !== undefined ? konten_pembuka : db.template.konten_pembuka,
      konten_penutup: konten_penutup !== undefined ? konten_penutup : db.template.konten_penutup,
      status_aktif: status_aktif !== undefined ? status_aktif : db.template.status_aktif,
      logo_kop: logo_kop !== undefined ? logo_kop : db.template.logo_kop,
      logo_kop_kanan: logo_kop_kanan !== undefined ? logo_kop_kanan : (db.template.logo_kop_kanan || ''),
      kop_baris_1: kop_baris_1 !== undefined ? kop_baris_1 : db.template.kop_baris_1,
      kop_baris_2: kop_baris_2 !== undefined ? kop_baris_2 : db.template.kop_baris_2,
      kop_baris_3: kop_baris_3 !== undefined ? kop_baris_3 : db.template.kop_baris_3,
      kop_baris_4: kop_baris_4 !== undefined ? kop_baris_4 : db.template.kop_baris_4,
      kop_baris_5: kop_baris_5 !== undefined ? kop_baris_5 : db.template.kop_baris_5,
      tampilkan_logo_kop: tampilkan_logo_kop !== undefined ? tampilkan_logo_kop : db.template.tampilkan_logo_kop,
      tampilkan_logo_kop_kanan: tampilkan_logo_kop_kanan !== undefined ? tampilkan_logo_kop_kanan : db.template.tampilkan_logo_kop_kanan,
      tanda_tangan: tanda_tangan !== undefined ? tanda_tangan : db.template.tanda_tangan,
      tampilkan_tanda_tangan: tampilkan_tanda_tangan !== undefined ? tampilkan_tanda_tangan : db.template.tampilkan_tanda_tangan,
      updated_at: new Date().toISOString(),
    };

    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Template SKL', 'Memperbarui template surat keterangan lulus & kop surat');

    res.json({ success: true, template: db.template, message: 'Template SKL berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan template SKL.' });
  }
});

app.get('/api/admin/logs', requireAdmin, (req, res) => {
  const db = dbManager.getDb();
  res.json({
    success: true,
    activityLogs: db.activityLogs,
    downloadLogs: db.downloadLogs,
    importHistory: db.importHistory,
  });
});

app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Password lama dan password baru wajib diisi.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal harus 8 karakter.' });
    }

    const db = dbManager.getDb();
    const isOldValid = verifyPassword(oldPassword, db.admin.salt, db.admin.passwordHash);

    if (!isOldValid) {
      return res.status(400).json({ success: false, message: 'Password lama salah.' });
    }

    const { salt, hash } = createPasswordRecord(newPassword);
    db.admin.salt = salt;
    db.admin.passwordHash = hash;

    dbManager.saveDb(db);
    dbManager.logActivity((req as any).adminUser, 'Keamanan', 'Password akun admin berhasil diubah.');

    res.json({ success: true, message: 'Password berhasil diubah. Gunakan password baru untuk login berikutnya.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
});

// Export Students as CSV/JSON
app.get('/api/admin/export/students', requireAdmin, (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const db = dbManager.getDb();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="data_siswa_kelulusan.json"');
      return res.send(JSON.stringify(db.students, null, 2));
    }

    // CSV format
    const headers = ['nisn', 'nama', 'tempat_lahir', 'tanggal_lahir', 'kelas', 'status_kelulusan', 'nomor_peserta', 'tahun_pelajaran'];
    const rows = db.students.map(s => [
      `"${s.nisn}"`,
      `"${(s.nama || '').replace(/"/g, '""')}"`,
      `"${(s.tempat_lahir || '').replace(/"/g, '""')}"`,
      `"${(s.tanggal_lahir || '').replace(/"/g, '""')}"`,
      `"${(s.kelas || '').replace(/"/g, '""')}"`,
      `"${(s.status_kelulusan || '').replace(/"/g, '""')}"`,
      `"${(s.nomor_peserta || '').replace(/"/g, '""')}"`,
      `"${(s.tahun_pelajaran || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="data_siswa_kelulusan.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengekspor data siswa.' });
  }
});

// Full System Backup Export & Restore
app.get('/api/admin/export/backup', requireAdmin, (req, res) => {
  const db = dbManager.getDb();
  // Clone without sensitive hashes
  const backup = {
    settings: db.settings,
    students: db.students,
    template: db.template,
    exported_at: new Date().toISOString()
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup_sistem_kelulusan.json"');
  res.send(JSON.stringify(backup, null, 2));
});

// ==========================================
// VITE DEV SERVER / STATIC SERVING
// ==========================================

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pengumuman Kelulusan] Server berjalan di port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
