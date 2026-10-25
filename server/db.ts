import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Student,
  SchoolSettings,
  SKLTemplate,
  ActivityLog,
  ImportHistory,
  DownloadLog,
  AdminUser
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  admin: AdminUser;
  settings: SchoolSettings;
  students: Student[];
  template: SKLTemplate;
  activityLogs: ActivityLog[];
  importHistory: ImportHistory[];
  downloadLogs: DownloadLog[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash;
}

export function createPasswordRecord(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

// Default initial state
function getDefaultDatabase(): DatabaseSchema {
  const initialSalt = 'a8f9c0e2b4d6e8fa1c3e5a7b9d1f3b5e';
  const initialHash = hashPassword('kusayangkamu123', initialSalt);

  // Set default announcement date to current time or earlier so demo is immediately accessible
  const now = new Date();
  const announcementDate = new Date(now.getTime() - 1000 * 60 * 60).toISOString().slice(0, 16);

  return {
    admin: {
      id: 'admin_1',
      username: 'admin',
      salt: initialSalt,
      passwordHash: initialHash,
    },
    settings: {
      nama_sekolah: 'SMK Negeri 1 Pemalang',
      npsn: '20324231',
      alamat: 'Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319',
      logo: '/logo_kop.png',
      telepon: '0284 321386',
      email: 'admin@smkn1pml.sch.id',
      tahun_pelajaran: '2025/2026',
      nama_kepala_sekolah: 'Drs. H. Bambang Sudarsono, M.Pd.',
      nip_kepala_sekolah: '19690412 199403 1 005',
      jabatan_penandatangan: 'Kepala Sekolah',
      warna_tema: '#1e3a8a',
      judul_pengumuman: 'PENGUMUMAN KELULUSAN SISWA KELAS XII',
      deskripsi_pengumuman: 'Portal resmi pengumuman kelulusan siswa Kelas XII SMK Negeri 1 Pemalang Tahun Pelajaran 2025/2026. Masukkan 10 digit NISN Anda untuk memeriksa hasil dan mengunduh Surat Keterangan Lulus (SKL) sah.',
      teks_footer: '© 2026 SMK Negeri 1 Pemalang. Seluruh Hak Cipta Dilindungi Undang-Undang.',
      tanggal_pengumuman: announcementDate,
      zona_waktu: 'Asia/Jakarta',
      status_pengumuman: 'SUDAH_DIBUKA',
      judul_countdown: 'Hitung Mundur Waktu Pengumuman Kelulusan',
      pesan_sebelum_pengumuman: 'Pengumuman hasil kelulusan belum dibuka. Silakan kembali sesuai jadwal yang telah ditentukan.',
      pesan_setelah_pengumuman: 'Pengumuman resmi kelulusan telah dibuka. Silakan masukkan NISN Anda pada kolom di bawah ini.',
      pencarian_aktif: true,
      download_skl_aktif: true,
      batas_pencarian_per_menit: 30,
    },
    students: [
      {
        id: 'std_01',
        nisn: '0012345678',
        nama: 'BUDI SANTOSO',
        tempat_lahir: 'Pemalang',
        tanggal_lahir: '01 Januari 2008',
        kelas: 'XII TJKT 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-001',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_02',
        nisn: '0012345679',
        nama: 'SITI RAHMAWATI',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '15 Maret 2008',
        kelas: 'XII RPL 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-002',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_03',
        nisn: '0012345680',
        nama: 'AHMAD FAUZI',
        tempat_lahir: 'Bandung',
        tanggal_lahir: '22 Juli 2007',
        kelas: 'XII TJKT 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-003',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_04',
        nisn: '0012345681',
        nama: 'DEWI ANGGRAENI',
        tempat_lahir: 'Surabaya',
        tanggal_lahir: '10 Oktober 2007',
        kelas: 'XII DKV 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-004',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_05',
        nisn: '0012345682',
        nama: 'MUHAMMAD RIZKY PRATAMA',
        tempat_lahir: 'Medan',
        tanggal_lahir: '05 Mei 2008',
        kelas: 'XII RPL 2',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-005',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_06',
        nisn: '0012345683',
        nama: 'ANNISA PUTRI KINANTI',
        tempat_lahir: 'Yogyakarta',
        tanggal_lahir: '19 Agustus 2008',
        kelas: 'XII DKV 2',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-006',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_07',
        nisn: '0012345684',
        nama: 'FAJAR HIDAYAT',
        tempat_lahir: 'Semarang',
        tanggal_lahir: '03 September 2007',
        kelas: 'XII TJKT 2',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-007',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_08',
        nisn: '0012345685',
        nama: 'RIAN KURNIAWAN',
        tempat_lahir: 'Bogor',
        tanggal_lahir: '14 Februari 2008',
        kelas: 'XII RPL 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-008',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_09',
        nisn: '0012345686',
        nama: 'MAYA INDAH LESTARI',
        tempat_lahir: 'Malang',
        tanggal_lahir: '27 November 2007',
        kelas: 'XII DKV 1',
        status_kelulusan: 'LULUS',
        nomor_peserta: 'UJN-2026-009',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_10',
        nisn: '0012345687',
        nama: 'DONI SETIAWAN',
        tempat_lahir: 'Cirebon',
        tanggal_lahir: '11 Juni 2007',
        kelas: 'XII TJKT 2',
        status_kelulusan: 'TIDAK LULUS',
        nomor_peserta: 'UJN-2026-010',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'std_11',
        nisn: '0012345688',
        nama: 'NADIA SAVIRA',
        tempat_lahir: 'Surakarta',
        tanggal_lahir: '08 April 2008',
        kelas: 'XII RPL 2',
        status_kelulusan: 'BELUM DITETAPKAN',
        nomor_peserta: 'UJN-2026-011',
        tahun_pelajaran: '2025/2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    template: {
      id: 'tpl_default',
      nama_template: 'Template Resmi SKL SMK Negeri 1 Pemalang',
      nomor_surat_format: '421.5/{{NO_URUT}}/SKL/{{TAHUN}}',
      logo_kop: '/logo_kop.png',
      logo_kop_kanan: '',
      kop_baris_1: 'PEMERINTAH PROVINSI JAWA TENGAH',
      kop_baris_2: 'DINAS PENDIDIKAN',
      kop_baris_3: 'SMK NEGERI 1 PEMALANG',
      kop_baris_4: 'Jln. Gatot Subroto No. 31 Pemalang Kode Pos 52319 Telepon 0284 321386',
      kop_baris_5: 'Faksimile 0284 323376 Surat Elektronik admin@smkn1pml.sch.id',
      tampilkan_logo_kop: true,
      tampilkan_logo_kop_kanan: true,
      tanda_tangan: '',
      tampilkan_tanda_tangan: true,
      konten_pembuka: 'Kepala {{NAMA_SEKOLAH}}, dengan NPSN {{NPSN}}, berdasarkan hasil rapat pleno dewan guru tentang kelulusan peserta didik Tahun Pelajaran {{TAHUN_PELAJARAN}}, dengan ini menerangkan bahwa:',
      konten_penutup: 'Demikian Surat Keterangan Lulus ini diterbitkan untuk dapat dipergunakan sebagaimana mestinya sampai dengan diterbitkannya Ijazah asli.',
      status_aktif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    activityLogs: [
      {
        id: 'log_01',
        aktor: 'Sistem',
        jenis_aktivitas: 'Inisialisasi',
        detail: 'Sistem Pengumuman Kelulusan Sekolah berhasil diinisialisasi.',
        created_at: new Date().toISOString(),
      }
    ],
    importHistory: [],
    downloadLogs: [],
  };
}

class DatabaseManager {
  private memoryDb: DatabaseSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        const initial = getDefaultDatabase();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
        this.memoryDb = initial;
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.memoryDb = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error initializing database file, falling back to memory:', err);
      this.memoryDb = getDefaultDatabase();
    }
  }

  public getDb(): DatabaseSchema {
    if (!this.memoryDb) {
      this.ensureInitialized();
    }
    return this.memoryDb!;
  }

  public saveDb(data: DatabaseSchema): void {
    this.memoryDb = data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public logActivity(aktor: string, jenis_aktivitas: string, detail: string): void {
    const db = this.getDb();
    const newLog: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      aktor,
      jenis_aktivitas,
      detail,
      created_at: new Date().toISOString(),
    };
    db.activityLogs.unshift(newLog);
    // Keep last 300 logs
    if (db.activityLogs.length > 300) {
      db.activityLogs = db.activityLogs.slice(0, 300);
    }
    this.saveDb(db);
  }

  public logDownload(nisn: string, nama_siswa: string, status: string): void {
    const db = this.getDb();
    const log: DownloadLog = {
      id: 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      nisn,
      nama_siswa,
      waktu_download: new Date().toISOString(),
      status,
    };
    db.downloadLogs.unshift(log);
    if (db.downloadLogs.length > 500) {
      db.downloadLogs = db.downloadLogs.slice(0, 500);
    }
    this.saveDb(db);
  }
}

export const dbManager = new DatabaseManager();
