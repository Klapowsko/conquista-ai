'use client';

import { KeyResult } from '@/types';
import { keyResultsAPI, roadmapsAPI } from '@/lib/api';
import { useState } from 'react';
import RoadmapView from './RoadmapView';

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
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={keyResult.completed}
              onChange={handleToggleComplete}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <h4 className={`text-lg font-medium ${keyResult.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {keyResult.title}
            </h4>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {!showRoadmap && (
          <>
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : 'Gerar Roadmap'}
            </button>
            <button
              onClick={handleLoadRoadmap}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ver Roadmap
            </button>
          </>
        )}
        {showRoadmap && (
          <button
            onClick={() => setShowRoadmap(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Ocultar Roadmap
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          Deletar
        </button>
      </div>

      {showRoadmap && roadmap && (
        <div className="mt-4">
          <RoadmapView roadmap={roadmap} />
        </div>
      )}
    </div>
  );
}

