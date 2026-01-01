'use client';

import { useEffect, useState } from 'react';
import { KeyResultWithOKR } from '@/types';
import { keyResultsAPI } from '@/lib/api';
import KeyResultListItem from '@/components/KeyResultListItem';
import { calculateOKRProgress } from '@/lib/utils';

export default function KeyResultsPage() {
  const [keyResults, setKeyResults] = useState<KeyResultWithOKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [okrProgressMap, setOkrProgressMap] = useState<Record<number, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allKeyResults = await keyResultsAPI.getAll();
      setKeyResults(allKeyResults);

      // Carregar progresso de cada OKR
      const okrIds = [...new Set(allKeyResults.map(kr => kr.okr_id))];
      const progressMap: Record<number, number> = {};

      await Promise.all(
        okrIds.map(async (okrId) => {
          try {
            const krs = await keyResultsAPI.getByOKRId(okrId);
            progressMap[okrId] = calculateOKRProgress(krs);
          } catch (error) {
            console.error(`Erro ao carregar Key Results do OKR ${okrId}:`, error);
            progressMap[okrId] = 0;
          }
        })
      );

      setOkrProgressMap(progressMap);
    } catch (error) {
      console.error('Erro ao carregar Key Results:', error);
      alert('Erro ao carregar Key Results');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Carregando Key Results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Key Results</h1>
          <p className="text-gray-600">
            Todos os Key Results ordenados por data de expiração
            {keyResults.length > 0 && (
              <span className="ml-2 text-gray-500">
                ({keyResults.length} {keyResults.length === 1 ? 'item' : 'itens'})
              </span>
            )}
          </p>
        </div>

        {/* Lista de Key Results */}
        {keyResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">Nenhum Key Result encontrado</p>
            <p className="text-sm text-gray-500">Crie OKRs e Key Results para vê-los aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keyResults.map((kr) => (
              <KeyResultListItem 
                key={kr.id} 
                keyResult={kr}
                onUpdate={handleUpdate}
                okrProgress={okrProgressMap[kr.okr_id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

