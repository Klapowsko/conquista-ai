import {
  Category,
  Goal,
  GoalRequest,
  Milestone,
  MilestoneWithGoal,
  ProgressResult,
  PurchaseResult,
  ShopReward,
  ShopRewardRequest,
  Wallet,
  WalletTransaction,
  DifficultyRule,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new ApiError(
      `Não foi possível conectar ao servidor em ${API_URL}. Verifique se o backend está rodando.`,
      0,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error || `Erro HTTP ${response.status}`, response.status);
  }
  return response.json();
}

const post = <T>(endpoint: string, body?: unknown) =>
  fetchAPI<T>(endpoint, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const put = <T>(endpoint: string, body: unknown) =>
  fetchAPI<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
const del = (endpoint: string) => fetchAPI<void>(endpoint, { method: 'DELETE' });

export const categoriesAPI = {
  getAll: () => fetchAPI<Category[]>('/categories'),
};

export const goalsAPI = {
  getAll: (categoryId?: number) =>
    fetchAPI<Goal[]>(categoryId ? `/goals?category_id=${categoryId}` : '/goals'),
  getById: (id: number) => fetchAPI<Goal>(`/goals/${id}`),
  create: (data: GoalRequest) => post<Goal>('/goals', data),
  update: (id: number, data: GoalRequest) => put<Goal>(`/goals/${id}`, data),
  delete: (id: number) => del(`/goals/${id}`),
  complete: (id: number) => post<ProgressResult>(`/goals/${id}/complete`),
  reopen: (id: number) => post<ProgressResult>(`/goals/${id}/reopen`),
  milestones: (id: number) => fetchAPI<Milestone[]>(`/goals/${id}/milestones`),
};

export const milestonesAPI = {
  getAll: () => fetchAPI<MilestoneWithGoal[]>('/milestones'),
  create: (data: { goal_id: number; title: string; due_date: string | null }) =>
    post<Milestone>('/milestones', data),
  update: (id: number, data: { title: string; due_date: string | null }) =>
    put<Milestone>(`/milestones/${id}`, data),
  delete: (id: number) => del(`/milestones/${id}`),
  complete: (id: number) => post<ProgressResult>(`/milestones/${id}/complete`),
  reopen: (id: number) => post<ProgressResult>(`/milestones/${id}/reopen`),
};

export const shopAPI = {
  rules: () => fetchAPI<{ difficulties: DifficultyRule[]; xp_per_level_step: number }>('/gamification/rules'),
  wallet: () => fetchAPI<Wallet>('/wallet'),
  history: (limit = 100) => fetchAPI<WalletTransaction[]>(`/wallet/transactions?limit=${limit}`),
  rewards: () => fetchAPI<ShopReward[]>('/rewards'),
  createReward: (data: ShopRewardRequest) => post<ShopReward>('/rewards', data),
  updateReward: (id: number, data: ShopRewardRequest) => put<ShopReward>(`/rewards/${id}`, data),
  deleteReward: (id: number) => del(`/rewards/${id}`),
  purchase: (id: number) => post<PurchaseResult>(`/rewards/${id}/purchase`),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido';
}
