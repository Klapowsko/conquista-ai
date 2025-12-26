'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OKR, KeyResult } from '@/types';
import { okrsAPI, keyResultsAPI } from '@/lib/api';
import KeyResultCard from '@/components/KeyResultCard';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!okr) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">OKR não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{okr.objective}</h1>
          {okr.category && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {okr.category.name}
            </span>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Key Results</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await okrsAPI.generateKeyResults(id);
                    loadData();
                  } catch (error) {
                    console.error('Erro ao gerar Key Results:', error);
                    alert('Erro ao gerar Key Results');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Gerar Automaticamente
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar Manualmente
              </button>
            </div>
          </div>

          {keyResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum Key Result encontrado.</p>
              <p className="mt-2">Use os botões acima para criar Key Results automaticamente ou manualmente.</p>
            </div>
          ) : (
            <div>
              {keyResults.map((kr) => (
                <KeyResultCard key={kr.id} keyResult={kr} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>

        {/* Modal para criar Key Result */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Criar Key Result</h3>
              <div className="mb-4">
                <label htmlFor="keyResultTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Key Result
                </label>
                <input
                  type="text"
                  id="keyResultTitle"
                  value={newKeyResultTitle}
                  onChange={(e) => setNewKeyResultTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Aprender os fundamentos de Go"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateKeyResult();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyResultTitle('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateKeyResult}
                  disabled={creating || !newKeyResultTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

