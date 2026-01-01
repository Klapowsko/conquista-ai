'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OKR, KeyResult } from '@/types';
import { okrsAPI, keyResultsAPI } from '@/lib/api';
import KeyResultCard from '@/components/KeyResultCard';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';
import CategoryTooltip from '@/components/CategoryTooltip';
import { calculateOKRProgress, getOKRStatus } from '@/lib/utils';

export default function OKRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [okr, setOKR] = useState<OKR | null>(null);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyResultTitle, setNewKeyResultTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [okrData, keyResultsData] = await Promise.all([
        okrsAPI.getById(id),
        keyResultsAPI.getByOKRId(id),
      ]);
      setOKR(okrData);
      setKeyResults(keyResultsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar OKR');
      router.push('/okrs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    loadData();
  };

  const handleCreateKeyResult = async () => {
    if (!newKeyResultTitle.trim()) {
      alert('Digite um título para o Key Result');
      return;
    }

    setCreating(true);
    try {
      await keyResultsAPI.create({
        okr_id: id,
        title: newKeyResultTitle.trim(),
      });
      setNewKeyResultTitle('');
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao criar Key Result:', error);
      alert('Erro ao criar Key Result');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!okr) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">OKR não encontrado</div>
          <button
            onClick={() => router.push('/okrs')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para OKRs
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateOKRProgress(keyResults);
  const status = getOKRStatus(progress);
  const completedCount = keyResults.filter(kr => kr.completed).length;
  const totalCount = keyResults.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium transition-colors inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        {/* Header com Progresso */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{okr.objective}</h1>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {okr.category && (
                  <CategoryTooltip categoryName={okr.category.name} position="bottom">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200 cursor-help hover:bg-blue-100 transition-colors">
                      {okr.category.name}
                    </span>
                  </CategoryTooltip>
                )}
                <StatusBadge status={status} />
              </div>
              {okr.completion_date && (() => {
                const completionDate = new Date(okr.completion_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysRemaining = Math.ceil((completionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysRemaining < 0;
                const isNearDeadline = daysRemaining >= 0 && daysRemaining <= 30;
                
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isOverdue 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : isNearDeadline 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    <span>📅</span>
                    <span>
                      {isOverdue 
                        ? `Prazo vencido há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''}`
                        : `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                      }
                    </span>
                    <span className="text-xs opacity-75">
                      (Conclusão: {completionDate.toLocaleDateString('pt-BR')})
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{completedCount}</div>
              <div className="text-sm text-gray-600 mt-1">Completos</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">{totalCount - completedCount}</div>
              <div className="text-sm text-gray-600 mt-1">Pendentes</div>
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <ProgressBar progress={progress} size="lg" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Key Results</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await okrsAPI.generateKeyResults(id);
                    loadData();
                  } catch (error) {
                    console.error('Erro ao gerar Key Results:', error);
                    alert('Erro ao gerar Key Results');
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
              >
                {generating && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {generating ? 'Gerando...' : 'Gerar Automaticamente'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Criar Manualmente
              </button>
            </div>
          </div>

          {keyResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">Nenhum Key Result encontrado</p>
              <p className="text-sm text-gray-500">Use os botões acima para criar Key Results automaticamente ou manualmente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keyResults.map((kr) => (
                <KeyResultCard key={kr.id} keyResult={kr} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>

        {/* Modal para criar Key Result */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Criar Key Result</h3>
              <div className="mb-6">
                <label htmlFor="keyResultTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Key Result
                </label>
                <input
                  type="text"
                  id="keyResultTitle"
                  value={newKeyResultTitle}
                  onChange={(e) => setNewKeyResultTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ex: Aprender os fundamentos de Go"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateKeyResult();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyResultTitle('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateKeyResult}
                  disabled={creating || !newKeyResultTitle.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

