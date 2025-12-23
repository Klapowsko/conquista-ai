import {
  Category,
  OKR,
  KeyResult,
  Roadmap,
  CreateCategoryRequest,
  CreateOKRRequest,
  UpdateOKRRequest,
  UpdateKeyResultRequest,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Categories
export const categoriesAPI = {
  getAll: (): Promise<Category[]> => fetchAPI<Category[]>('/categories'),
  getById: (id: number): Promise<Category> => fetchAPI<Category>(`/categories/${id}`),
  create: (data: CreateCategoryRequest): Promise<Category> =>
    fetchAPI<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: CreateCategoryRequest): Promise<Category> =>
    fetchAPI<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<void> =>
    fetchAPI<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// OKRs
export const okrsAPI = {
  getAll: (categoryId?: number): Promise<OKR[]> => {
    const url = categoryId ? `/okrs?category_id=${categoryId}` : '/okrs';
    return fetchAPI<OKR[]>(url);
  },
  getById: (id: number): Promise<OKR> => fetchAPI<OKR>(`/okrs/${id}`),
  create: (data: CreateOKRRequest): Promise<OKR> =>
    fetchAPI<OKR>('/okrs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateOKRRequest): Promise<OKR> =>
    fetchAPI<OKR>(`/okrs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<void> =>
    fetchAPI<void>(`/okrs/${id}`, { method: 'DELETE' }),
  generateKeyResults: (id: number): Promise<void> =>
    fetchAPI<void>(`/okrs/${id}/generate-key-results`, { method: 'POST' }),
};

// Key Results
export const keyResultsAPI = {
  getByOKRId: (okrId: number): Promise<KeyResult[]> =>
    fetchAPI<KeyResult[]>(`/okrs/${okrId}/key-results`),
  update: (id: number, data: UpdateKeyResultRequest): Promise<KeyResult> =>
    fetchAPI<KeyResult>(`/key-results/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<void> =>
    fetchAPI<void>(`/key-results/${id}`, { method: 'DELETE' }),
};

// Roadmaps
export const roadmapsAPI = {
  generate: (keyResultId: number): Promise<Roadmap> =>
    fetchAPI<Roadmap>(`/key-results/${keyResultId}/roadmap`, { method: 'POST' }),
  getByKeyResultId: (keyResultId: number): Promise<Roadmap> =>
    fetchAPI<Roadmap>(`/key-results/${keyResultId}/roadmap`),
  updateItem: (itemId: number, completed: boolean): Promise<void> =>
    fetchAPI<void>(`/roadmap-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),
};

