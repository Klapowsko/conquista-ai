import { OKR, KeyResult } from '@/types';

/**
 * Calcula o progresso de um OKR baseado nos Key Results completos
 * @param keyResults Array de Key Results do OKR
 * @returns Porcentagem de progresso (0-100)
 */
export function calculateOKRProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;
  
  const completed = keyResults.filter(kr => kr.completed).length;
  return Math.round((completed / keyResults.length) * 100);
}

/**
 * Obtém o status do OKR baseado no progresso
 * @param progress Porcentagem de progresso (0-100)
 * @returns Status do OKR
 */
export function getOKRStatus(progress: number): 'complete' | 'in-progress' | 'started' | 'not-started' {
  if (progress === 100) return 'complete';
  if (progress > 0) return 'in-progress';
  return 'started';
}

/**
 * Formata um número para exibição
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

