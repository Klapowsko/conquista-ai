'use client';

import { KeyResult } from '@/types';
import { keyResultsAPI, roadmapsAPI } from '@/lib/api';
import { useState } from 'react';
import RoadmapView from './RoadmapView';
import StatusBadge from './StatusBadge';

interface KeyResultCardProps {
  keyResult: KeyResult;
  onUpdate: () => void;
}

export default function KeyResultCard({ keyResult, onUpdate }: KeyResultCardProps) {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const handleToggleComplete = async () => {
    try {
      await keyResultsAPI.update(keyResult.id, {
        title: keyResult.title,
        completed: !keyResult.completed,
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar Key Result:', error);
      alert('Erro ao atualizar Key Result');
    }
  };

  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      // Primeiro tenta carregar o roadmap existente
      try {
        const existingRoadmap = await roadmapsAPI.getByKeyResultId(keyResult.id);
        setRoadmap(existingRoadmap);
        setShowRoadmap(true);
        setLoading(false);
        return;
      } catch (error: any) {
        // Se não existe (404), continua para gerar um novo
        const errorStatus = error?.status;
        const errorMessage = error?.message || String(error);
        
        if (errorStatus === 404 || 
            errorMessage.includes('404') || 
            errorMessage.includes('não encontrado') || 
            errorMessage.includes('not found')) {
          console.log('Roadmap não encontrado, gerando novo...');
        } else {
          // Se for outro erro, mostra e retorna
          console.error('Erro ao buscar roadmap:', error);
          alert('Erro ao buscar roadmap: ' + errorMessage);
          setLoading(false);
          return;
        }
      }
      
      // Gera um novo roadmap se não existir
      const data = await roadmapsAPI.generate(keyResult.id);
      setRoadmap(data);
      setShowRoadmap(true);
    } catch (error) {
      console.error('Erro ao gerar roadmap:', error);
      alert('Erro ao gerar roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await roadmapsAPI.getByKeyResultId(keyResult.id);
      setRoadmap(data);
      setShowRoadmap(true);
    } catch (error) {
      console.error('Erro ao carregar roadmap:', error);
      alert('Roadmap não encontrado. Gere um novo roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar o Key Result "${keyResult.title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await keyResultsAPI.delete(keyResult.id);
      onUpdate();
    } catch (error) {
      console.error('Erro ao deletar Key Result:', error);
      alert('Erro ao deletar Key Result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={keyResult.completed}
              onChange={handleToggleComplete}
              className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500 cursor-pointer transition-all"
            />
            <div className="flex-1 min-w-0">
              <h4 className={`text-lg font-semibold mb-2 ${keyResult.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {keyResult.title}
              </h4>
              <StatusBadge 
                status={keyResult.completed ? 'complete' : 'in-progress'} 
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
        {!showRoadmap && (
          <>
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium text-sm"
            >
              {loading ? 'Gerando...' : 'Gerar Roadmap'}
            </button>
            <button
              onClick={handleLoadRoadmap}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Ver Roadmap
            </button>
          </>
        )}
        {showRoadmap && (
          <button
            onClick={() => setShowRoadmap(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Ocultar Roadmap
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm ml-auto"
        >
          Deletar
        </button>
      </div>

      {showRoadmap && roadmap && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <RoadmapView roadmap={roadmap} />
        </div>
      )}
    </div>
  );
}

