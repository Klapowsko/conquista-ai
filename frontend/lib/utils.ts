import { Difficulty, Goal } from '@/types';

export const DIFFICULTY: Record<Difficulty, { label: string; emoji: string; className: string }> = {
  easy: { label: 'Fácil', emoji: '🌱', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Médio', emoji: '🔥', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: 'Difícil', emoji: '⚔️', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function goalProgress(goal: Pick<Goal, 'milestones_total' | 'milestones_completed' | 'completed_at'>): number {
  if (goal.completed_at) return 100;
  if (goal.milestones_total === 0) return 0;
  return Math.round((goal.milestones_completed / goal.milestones_total) * 100);
}

/** Converte "YYYY-MM-DD" em Date local (evita o deslocamento de fuso do new Date(string)). */
export function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Dias até a data (negativo = atrasado). */
export function daysUntil(value: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(value).getTime() - today.getTime()) / 86_400_000);
}

export function deadlineLabel(value: string): { text: string; tone: 'late' | 'soon' | 'ok' } {
  const days = daysUntil(value);
  if (days < 0) return { text: `Atrasado ${Math.abs(days)}d`, tone: 'late' };
  if (days === 0) return { text: 'Vence hoje', tone: 'soon' };
  return { text: `${days}d restante${days !== 1 ? 's' : ''}`, tone: days <= 14 ? 'soon' : 'ok' };
}

export const TONE_CLASSES = {
  late: 'bg-red-50 text-red-700 border-red-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  ok: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}
