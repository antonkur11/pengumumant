import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { Student, GraduationStatus, SchoolSettings } from '../../types.ts';
import {
  getAdminStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAdminTemplate
} from '../../services/api.ts';
import { generateSklPdf } from '../../utils/pdfGenerator.ts';

interface StudentsTabProps {
  settings: SchoolSettings;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ settings }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    kelas: '',
    status_kelulusan: 'LULUS' as GraduationStatus,
    nomor_peserta: '',
    tahun_pelajaran: settings.tahun_pelajaran || '2025/2026',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const fetchStudentsList = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await getAdminStudents({
        page,
        limit: 10,
        search: searchQuery,
        kelas: selectedClass,
        status: selectedStatus,
      });

      if (res.success) {
        setStudents(res.students);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
        setCurrentPage(res.currentPage);
        setAvailableClasses(res.availableClasses);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal mengambil data siswa.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsList(1);
  }, [searchQuery, selectedClass, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      nisn: '',
      nama: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      kelas: availableClasses[0] || 'XII MIPA 1',
      status_kelulusan: 'LULUS',
      nomor_peserta: '',
      tahun_pelajaran: settings.tahun_pelajaran || '2025/2026',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nisn: student.nisn,
      nama: student.nama,
      tempat_lahir: student.tempat_lahir,
      tanggal_lahir: student.tanggal_lahir,
      kelas: student.kelas,
      status_kelulusan: student.status_kelulusan,
      nomor_peserta: student.nomor_peserta || '',
      tahun_pelajaran: student.tahun_pelajaran,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNisn = formData.nisn.trim();

    if (!cleanNisn || !/^\d{10}$/.test(cleanNisn)) {
      setNotification({ type: 'error', message: 'NISN harus terdiri dari tepat 10 digit angka.' });
      return;
    }

    if (!formData.nama.trim() || !formData.tempat_lahir.trim() || !formData.tanggal_lahir.trim() || !formData.kelas.trim()) {
      setNotification({ type: 'error', message: 'Seluruh kolom bertanda bintang (*) wajib diisi.' });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingStudent) {
        const res = await updateStudent(editingStudent.id, formData);
        setNotification({ type: 'success', message: res.message });
      } else {
        const res = await createStudent(formData);
        setNotification({ type: 'success', message: res.message });
      }
      setIsModalOpen(false);
      fetchStudentsList(currentPage);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan data siswa.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      setIsSubmitting(true);
      const res = await deleteStudent(deletingStudent.id);
      setNotification({ type: 'success', message: res.message });
      setDeletingStudent(null);
      fetchStudentsList(currentPage);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menghapus data siswa.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTestPdf = async (student: Student) => {
    try {
      const res = await getAdminTemplate();
      const tpl = res.success ? res.template : undefined;
      const { doc, filename } = generateSklPdf(student, settings, tpl);
      doc.save(filename);
    } catch {
      const { doc, filename } = generateSklPdf(student, settings);
      doc.save(filename);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filters & Add Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative grow max-w-md">
            <input
              type="text"
              placeholder="Cari berdasarkan NISN atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Right Action: Add Student */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchStudentsList(currentPage)}
              title="Refresh Data"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Kelas</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="LULUS">LULUS</option>
            <option value="TIDAK LULUS">TIDAK LULUS</option>
            <option value="BELUM DITETAPKAN">BELUM DITETAPKAN</option>
          </select>

          <span className="text-slate-400 ml-auto font-medium">
            Total {totalCount} Siswa Ditemukan
          </span>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Tempat, Tanggal Lahir</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">Tidak ada data siswa yang cocok.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter kelas.</p>
                  </td>
                </tr>
              ) : (
                students.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-400">
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-50/50">
                      {std.nisn}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {std.nama}
                      {std.nomor_peserta && (
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          No. Ujian: {std.nomor_peserta}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-900">{std.kelas}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {std.tempat_lahir}, {std.tanggal_lahir}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          std.status_kelulusan === 'LULUS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : std.status_kelulusan === 'TIDAK LULUS'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {std.status_kelulusan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleDownloadTestPdf(std)}
                          title="Preview Unduh SKL"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(std)}
                          title="Edit Siswa"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(std)}
                          title="Hapus Siswa"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Halaman <strong className="text-slate-900">{currentPage}</strong> dari{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({totalCount} siswa)
          </span>

          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => fetchStudentsList(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => fetchStudentsList(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    NISN (10 Digit)*
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, '') })}
                    placeholder="0012345678"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nomor Peserta Ujian
                  </label>
                  <input
                    type="text"
                    value={formData.nomor_peserta}
                    onChange={(e) => setFormData({ ...formData, nomor_peserta: e.target.value })}
                    placeholder="Contoh: UJN-2026-001"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Siswa*
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: BUDI SANTOSO"
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tempat Lahir*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    placeholder="Contoh: Pemalang"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tanggal Lahir*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    placeholder="Contoh: 01 Januari 2008"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kelas / Jurusan*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="Contoh: XII TJKT 1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status Kelulusan*
                  </label>
                  <select
                    value={formData.status_kelulusan}
                    onChange={(e) => setFormData({ ...formData, status_kelulusan: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  >
                    <option value="LULUS">LULUS</option>
                    <option value="TIDAK LULUS">TIDAK LULUS</option>
                    <option value="BELUM DITETAPKAN">BELUM DITETAPKAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tahun Pelajaran
                </label>
                <input
                  type="text"
                  value={formData.tahun_pelajaran}
                  onChange={(e) => setFormData({ ...formData, tahun_pelajaran: e.target.value })}
                  placeholder="2025/2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Hapus Siswa</h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus data siswa <strong>{deletingStudent.nama}</strong> ({deletingStudent.nisn})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
