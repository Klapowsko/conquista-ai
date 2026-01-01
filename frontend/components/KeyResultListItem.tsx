'use client';

import { KeyResultWithOKR } from '@/types';
import { keyResultsAPI } from '@/lib/api';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import { differenceInDays, format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface KeyResultListItemProps {
  keyResult: KeyResultWithOKR;
  onUpdate: () => void;
  okrProgress?: number;
}

export default function KeyResultListItem({ keyResult, onUpdate, okrProgress }: KeyResultListItemProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const handleToggleComplete = async () => {
    setUpdating(true);
    try {
      await keyResultsAPI.update(keyResult.id, {
        title: keyResult.title,
        completed: !keyResult.completed,
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar Key Result:', error);
      alert('Erro ao atualizar Key Result');
    } finally {
      setUpdating(false);
    }
  };

  const handleOKRClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/okrs/${keyResult.okr_id}`);
  };

  // Calcular dias restantes
  const expectedCompletionDate = keyResult.expected_completion_date 
    ? new Date(keyResult.expected_completion_date) 
    : null;
  const today = new Date();
  const daysRemaining = expectedCompletionDate 
    ? differenceInDays(expectedCompletionDate, today) 
    : null;

  // Determinar cor do badge de urgência
  let urgencyBadgeClass = '';
  let urgencyText = '';
  if (daysRemaining !== null) {
    if (daysRemaining < 0) {
      urgencyBadgeClass = 'bg-red-100 text-red-700 border-red-200';
      urgencyText = `Atrasado ${Math.abs(daysRemaining)}d`;
    } else if (daysRemaining === 0) {
      urgencyBadgeClass = 'bg-red-100 text-red-700 border-red-200';
      urgencyText = 'Vence hoje';
    } else if (daysRemaining <= 7) {
      urgencyBadgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
      urgencyText = `${daysRemaining}d restantes`;
    } else if (daysRemaining <= 30) {
      urgencyBadgeClass = 'bg-orange-100 text-orange-700 border-orange-200';
      urgencyText = `${daysRemaining}d restantes`;
    } else {
      urgencyBadgeClass = 'bg-green-100 text-green-700 border-green-200';
      urgencyText = `${daysRemaining}d restantes`;
    }
  }

  // Usar progresso fornecido ou calcular baseado apenas neste KR (fallback)
  const progress = okrProgress !== undefined ? okrProgress : (keyResult.completed ? 100 : 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={keyResult.completed}
          onChange={handleToggleComplete}
          disabled={updating}
          className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500 cursor-pointer transition-all disabled:opacity-50"
        />

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Título do Key Result */}
          <h3 className={`text-lg font-semibold mb-2 ${keyResult.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {keyResult.title}
          </h3>

          {/* Link para OKR */}
          <div className="mb-3">
            <button
              onClick={handleOKRClick}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              OKR: {keyResult.okr_title}
            </button>
          </div>

          {/* Informações e badges */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {/* Status badge */}
            <StatusBadge 
              status={keyResult.completed ? 'complete' : 'in-progress'} 
              size="sm"
            />

            {/* Data de expiração e dias restantes */}
            {expectedCompletionDate ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Prazo: {format(expectedCompletionDate, 'dd/MM/yyyy')}
                </span>
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${urgencyBadgeClass}`}>
                  {urgencyText}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">Sem data definida</span>
            )}
          </div>

          {/* Progresso do OKR */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Progresso do OKR</span>
              <span className="text-xs font-semibold text-gray-700">{progress}%</span>
            </div>
            <ProgressBar progress={progress} showLabel={false} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

