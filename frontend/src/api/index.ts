import type { Category, Wiki, SearchResponse, AdminStatsOverview, AdminStatsCategory, AdminActivity } from '../types';

const API_BASE = '/api/v1';

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

const getToken = async (): Promise<string> => {
  if (cachedToken) return cachedToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: 'admin', password: 'admin' }).toString()
      });
      if (!res.ok) throw new Error('Auto-login failed');
      const data = await res.json();
      cachedToken = data.access_token;
      return cachedToken!;
    } finally {
      tokenPromise = null;
    }
  })();
  
  return tokenPromise;
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    cachedToken = null; // invalid token, retry once
    const newToken = await getToken();
    headers.set('Authorization', `Bearer ${newToken}`);
    return fetch(url, { ...options, headers });
  }
  return res;
};

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetchWithAuth(`${API_BASE}/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const getWikis = async (): Promise<Wiki[]> => {
  const res = await fetchWithAuth(`${API_BASE}/wiki/?limit=1000`);
  if (!res.ok) throw new Error('Failed to fetch wikis');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const deleteWiki = async (id: string): Promise<void> => {
  const res = await fetchWithAuth(`${API_BASE}/wiki/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete wiki');
};

export const verifyWiki = async (id: string, action: 'GO' | 'STOP', content?: string): Promise<{id: string, status: string, message: string}> => {
  const res = await fetchWithAuth(`${API_BASE}/wiki/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, content })
  });
  if (!res.ok) throw new Error('Failed to verify wiki');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const updateWiki = async (id: string, updates: Partial<Wiki>): Promise<Wiki> => {
  const res = await fetchWithAuth(`${API_BASE}/wiki/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update wiki');
  const responseData = await res.json(); return responseData.data || responseData;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const uploadFile = async (file: File, prompt?: string, categoryId?: string): Promise<{task_id: string}> => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file);
  if (prompt) formData.append('custom_prompt', prompt);
  if (categoryId) formData.append('category_id', categoryId);
  
  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!res.ok) throw new ApiError('Failed to upload file', res.status);
  return res.json();
};

export const getTaskStatus = async (taskId: string): Promise<{task_id: string, status: string, result_wiki_id: string | null}> => {
  const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}`);
  if (!res.ok) throw new Error('Failed to get task status');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const getWikiById = async (id: string): Promise<Wiki> => {
  const res = await fetchWithAuth(`${API_BASE}/wiki/${id}`);
  if (!res.ok) throw new Error('Failed to fetch wiki');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  const res = await fetchWithAuth(`${API_BASE}/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create category');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<Category> => {
  const res = await fetchWithAuth(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update category');
  const responseData = await res.json(); return responseData.data || responseData;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await fetchWithAuth(`${API_BASE}/categories/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete category');
};

export const searchDocuments = async (params: {
  query?: string;
  category_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  const res = await fetchWithAuth(`${API_BASE}/documents/search?${queryParams.toString()}`);
  if (!res.ok) throw new Error('Failed to search documents');
  return res.json();
};

export const getDocumentById = async (id: string): Promise<Wiki & { category?: Category }> => {
  const res = await fetchWithAuth(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch document details');
  const responseData = await res.json();
  return responseData.data || responseData;
};

export const getAdminStatsOverview = async (): Promise<AdminStatsOverview> => {
  const res = await fetchWithAuth(`${API_BASE}/admin/stats/overview`);
  if (!res.ok) throw new Error('Failed to fetch stats overview');
  return res.json();
};

export const getAdminStatsCategories = async (status?: string): Promise<{ data: AdminStatsCategory[] }> => {
  const url = status ? `${API_BASE}/admin/stats/categories?status=${status}` : `${API_BASE}/admin/stats/categories`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error('Failed to fetch categories stats');
  return res.json();
};

export const getAdminRecentActivities = async (limit: number = 10): Promise<{ data: AdminActivity[] }> => {
  const res = await fetchWithAuth(`${API_BASE}/admin/activities/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent activities');
  return res.json();
};
