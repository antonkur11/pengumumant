import {
  Student,
  SchoolSettings,
  SKLTemplate,
  ActivityLog,
  ImportHistory,
  DownloadLog,
  DashboardStats,
  StudentSearchResult
} from '../types.ts';

const TOKEN_KEY = 'skl_admin_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: `Respon server tidak valid (${response.status})`
  }));

  if (!response.ok) {
    if (response.status === 401) {
      authStorage.removeToken();
    }
    throw new Error(data.message || `Permintaan gagal dengan status ${response.status}`);
  }

  return data as T;
}

// Public API
export async function getPublicInfo(): Promise<{
  success: boolean;
  data: SchoolSettings & { isOpen: boolean; serverTime: string };
}> {
  return request('/api/public/info');
}

export async function searchNisn(nisn: string): Promise<StudentSearchResult> {
  return request('/api/check-nisn', {
    method: 'POST',
    body: JSON.stringify({ nisn }),
  });
}

export async function verifyAndFetchSklData(nisn: string): Promise<{
  success: boolean;
  student: Student;
  settings: SchoolSettings;
  template: SKLTemplate;
}> {
  return request('/api/download-skl-check', {
    method: 'POST',
    body: JSON.stringify({ nisn }),
  });
}

// Admin API
export async function loginAdmin(username: string, password: string): Promise<{
  success: boolean;
  token: string;
  username: string;
  message: string;
}> {
  const result = await request<{ success: boolean; token: string; username: string; message: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (result.token) {
    authStorage.setToken(result.token);
  }
  return result;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await request('/api/admin/logout', { method: 'POST' });
  } finally {
    authStorage.removeToken();
  }
}

export async function getAdminStats(): Promise<{ success: boolean; stats: DashboardStats }> {
  return request('/api/admin/stats');
}

export async function getAdminStudents(params: {
  page?: number;
  limit?: number;
  search?: string;
  kelas?: string;
  status?: string;
}): Promise<{
  success: boolean;
  students: Student[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  availableClasses: string[];
}> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.kelas) query.set('kelas', params.kelas);
  if (params.status) query.set('status', params.status);

  return request(`/api/admin/students?${query.toString()}`);
}

export async function createStudent(studentData: Partial<Student>): Promise<{ success: boolean; student: Student; message: string }> {
  return request('/api/admin/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
}

export async function updateStudent(id: string, studentData: Partial<Student>): Promise<{ success: boolean; student: Student; message: string }> {
  return request(`/api/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  });
}

export async function deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
  return request(`/api/admin/students/${id}`, {
    method: 'DELETE',
  });
}

export async function importStudents(
  items: any[],
  mode: 'skip' | 'update',
  filename: string
): Promise<{
  success: boolean;
  report: {
    total: number;
    berhasil: number;
    diperbarui: number;
    dilewati: number;
    gagal: number;
    errors: string[];
  };
}> {
  return request('/api/admin/students/import', {
    method: 'POST',
    body: JSON.stringify({ items, mode, filename }),
  });
}

export async function getAdminSettings(): Promise<{ success: boolean; settings: SchoolSettings }> {
  return request('/api/admin/settings');
}

export async function updateAdminSettings(settings: Partial<SchoolSettings>): Promise<{ success: boolean; settings: SchoolSettings; message: string }> {
  return request('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function getAdminTemplate(): Promise<{ success: boolean; template: SKLTemplate }> {
  return request('/api/admin/template');
}

export async function updateAdminTemplate(template: Partial<SKLTemplate>): Promise<{ success: boolean; template: SKLTemplate; message: string }> {
  return request('/api/admin/template', {
    method: 'PUT',
    body: JSON.stringify(template),
  });
}

export async function getAdminLogs(): Promise<{
  success: boolean;
  activityLogs: ActivityLog[];
  downloadLogs: DownloadLog[];
  importHistory: ImportHistory[];
}> {
  return request('/api/admin/logs');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return request('/api/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}
