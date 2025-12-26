import {
  Category,
  OKR,
  KeyResult,
  Roadmap,
  EducationalRoadmap,
  EducationalTrail,
  CreateCategoryRequest,
  CreateOKRRequest,
  UpdateOKRRequest,
  CreateKeyResultRequest,
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
    const errorMessage = error.error || `HTTP error! status: ${response.status}`;
    const apiError = new Error(errorMessage) as any;
    apiError.status = response.status;
    throw apiError;
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
  create: (data: CreateKeyResultRequest): Promise<KeyResult> =>
    fetchAPI<KeyResult>('/key-results', { method: 'POST', body: JSON.stringify(data) }),
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
  generateEducational: (roadmapItemId: number, itemTitle: string): Promise<EducationalRoadmap> =>
    fetchAPI<EducationalRoadmap>('/educational-roadmap', {
      method: 'POST',
      body: JSON.stringify({ roadmap_item_id: roadmapItemId, item_title: itemTitle }),
    }),
  getEducationalByRoadmapItemId: (roadmapItemId: number): Promise<EducationalRoadmap> =>
    fetchAPI<EducationalRoadmap>(`/roadmap-items/${roadmapItemId}/educational-roadmap`),
  updateEducationalResource: (resourceId: number, completed: boolean): Promise<void> =>
    fetchAPI<void>(`/educational-resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),
  generateEducationalTrail: (roadmapItemId: number, itemTitle: string): Promise<EducationalTrail> =>
    fetchAPI<EducationalTrail>('/educational-trail', {
      method: 'POST',
      body: JSON.stringify({ roadmap_item_id: roadmapItemId, item_title: itemTitle }),
    }),
  getEducationalTrailByRoadmapItemId: (roadmapItemId: number): Promise<EducationalTrail> =>
    fetchAPI<EducationalTrail>(`/roadmap-items/${roadmapItemId}/educational-trail`),
  updateTrailActivity: (activityId: number, completed: boolean): Promise<void> =>
    fetchAPI<void>(`/trail-activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),
};

