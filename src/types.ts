export type GraduationStatus = 'LULUS' | 'TIDAK LULUS' | 'BELUM DITETAPKAN';
export type AnnouncementStatus = 'BELUM_DIBUKA' | 'SUDAH_DIBUKA' | 'DITUTUP';

export interface Student {
  id: string;
  nisn: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  kelas: string;
  status_kelulusan: GraduationStatus;
  nomor_peserta?: string;
  tahun_pelajaran: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolSettings {
  nama_sekolah: string;
  npsn: string;
  alamat: string;
  logo: string;
  telepon: string;
  email: string;
  tahun_pelajaran: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
  jabatan_penandatangan: string;
  warna_tema: string;
  judul_pengumuman: string;
  deskripsi_pengumuman: string;
  teks_footer: string;
  tanggal_pengumuman: string; // ISO 8601 string, e.g. 2026-05-05T10:00:00
  zona_waktu: string; // default: 'Asia/Jakarta'
  status_pengumuman: AnnouncementStatus;
  judul_countdown: string;
  pesan_sebelum_pengumuman: string;
  pesan_setelah_pengumuman: string;
  pencarian_aktif: boolean;
  download_skl_aktif: boolean;
  batas_pencarian_per_menit: number;
}

export interface SKLTemplate {
  id: string;
  nama_template: string;
  nomor_surat_format: string;
  konten_pembuka: string;
  konten_penutup: string;
  status_aktif: boolean;
  logo_kop?: string;
  logo_kop_kanan?: string;
  kop_baris_1?: string;
  kop_baris_2?: string;
  kop_baris_3?: string;
  kop_baris_4?: string;
  kop_baris_5?: string;
  tampilkan_logo_kop?: boolean;
  tampilkan_logo_kop_kanan?: boolean;
  tanda_tangan?: string;
  tampilkan_tanda_tangan?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  aktor: string;
  jenis_aktivitas: string;
  detail: string;
  created_at: string;
}

export interface ImportHistory {
  id: string;
  nama_file: string;
  total_data: number;
  berhasil: number;
  gagal: number;
  waktu_impor: string;
  admin_id: string;
}

export interface DownloadLog {
  id: string;
  nisn: string;
  nama_siswa: string;
  waktu_download: string;
  status: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  lastLogin?: string;
}

export interface DashboardStats {
  totalSiswa: number;
  lulus: number;
  tidakLulus: number;
  belumDitetapkan: number;
  persentaseKelulusan: number;
  totalUnduhanSKL: number;
  totalImpor: number;
  perKelas: { [kelas: string]: { total: number; lulus: number; tidakLulus: number } };
  serverTime: string;
  isAnnouncementOpen: boolean;
}

export interface StudentSearchResult {
  allowed: boolean;
  message?: string;
  data?: {
    nisn: string;
    nama: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    kelas: string;
    status_kelulusan: GraduationStatus;
    nomor_peserta?: string;
    tahun_pelajaran: string;
  };
  settings?: {
    nama_sekolah: string;
    npsn: string;
    alamat: string;
    logo: string;
    download_skl_aktif: boolean;
    tahun_pelajaran: string;
  };
}
