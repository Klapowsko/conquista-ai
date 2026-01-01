'use client';

import { Roadmap, EducationalRoadmap, EducationalTrail } from '@/types';
import { roadmapsAPI } from '@/lib/api';
import { useState } from 'react';
import EducationalRoadmapView from './EducationalRoadmapView';
import EducationalTrailView from './EducationalTrailView';

interface RoadmapViewProps {
  roadmap: Roadmap;
}

export default function RoadmapView({ roadmap }: RoadmapViewProps) {
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [educationalRoadmap, setEducationalRoadmap] = useState<EducationalRoadmap | null>(null);
  const [educationalTrail, setEducationalTrail] = useState<EducationalTrail | null>(null);
  const [loadingEducational, setLoadingEducational] = useState(false);
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null);

  const handleToggleItem = async (itemId: number, currentCompleted: boolean) => {
    try {
      await roadmapsAPI.updateItem(itemId, !currentCompleted);
      // Atualizar estado local
      setLocalRoadmap((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, completed: !currentCompleted } : item
          ),
        })),
      }));
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      alert('Erro ao atualizar item');
    }
  };

  const handleGenerateEducationalRoadmap = async (itemId: number, itemTitle: string) => {
    setLoadingEducational(true);
    setSelectedItemTitle(itemTitle);
    try {
      // Primeiro tenta buscar trilha se já existe
      try {
        const existingTrail = await roadmapsAPI.getEducationalTrailByRoadmapItemId(itemId);
        if (existingTrail) {
          console.log('Trilha educacional encontrada:', existingTrail);
          setEducationalTrail(existingTrail);
          setEducationalRoadmap(null);
          setLoadingEducational(false);
          return;
        }
      } catch (error: any) {
        // Se não existe (404), continua para gerar um novo
        const errorStatus = error?.status;
        const errorMessage = error?.message || String(error);
        
        if (errorStatus === 404 || 
            errorMessage.includes('404') || 
            errorMessage.includes('não encontrado') || 
            errorMessage.includes('not found')) {
          console.log('Trilha educacional não encontrada (404), gerando nova...');
        } else {
          // Se for outro erro, mostra e retorna
          console.error('Erro ao buscar trilha educacional:', error);
          alert('Erro ao buscar trilha educacional: ' + errorMessage);
          setLoadingEducational(false);
          return;
        }
      }
      
      // Gera uma nova trilha educacional (que será salva automaticamente)
      console.log('Gerando nova trilha educacional para item:', itemId, itemTitle);
      const trailData = await roadmapsAPI.generateEducationalTrail(itemId, itemTitle);
      if (trailData) {
        console.log('Trilha educacional gerada e salva com sucesso:', trailData);
        setEducationalTrail(trailData);
        setEducationalRoadmap(null); // Limpa o roadmap antigo se existir
      } else {
        console.error('Trilha educacional não foi retornada');
        alert('Erro: trilha educacional não foi gerada');
      }
    } catch (error: any) {
      console.error('Erro ao gerar trilha educacional:', error);
      const errorMessage = error?.message || String(error);
      alert('Erro ao gerar trilha educacional: ' + errorMessage);
    } finally {
      setLoadingEducational(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h5 className="text-lg font-semibold mb-4">Roadmap: {localRoadmap.topic}</h5>
      {localRoadmap.categories.map((category) => (
        <div key={category.id} className="mb-6">
          <h6 className="text-md font-medium text-gray-700 mb-2">{category.category}</h6>
          <ul className="space-y-2">
            {category.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleItem(item.id, item.completed)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span
                  className={`flex-1 ${
                    item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {item.title}
                </span>
                <button
                  onClick={() => handleGenerateEducationalRoadmap(item.id, item.title)}
                  disabled={loadingEducational && selectedItemTitle === item.title}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Gerar roadmap educacional"
                >
                  {loadingEducational && selectedItemTitle === item.title
                    ? '⏳ Gerando trilha...'
                    : '📚'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {educationalTrail && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">🗺️ Trilha Educacional</h5>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!confirm('Tem certeza que deseja deletar esta trilha educacional? Você poderá gerar uma nova trilha depois.')) {
                    return;
                  }
                  try {
                    // Encontrar o roadmap_item_id da trilha
                    const roadmapItemId = educationalTrail.roadmap_item_id;
                    await roadmapsAPI.deleteEducationalTrail(roadmapItemId);
                    setEducationalTrail(null);
                    setEducationalRoadmap(null);
                    alert('Trilha educacional deletada com sucesso! Você pode gerar uma nova trilha agora.');
                  } catch (error: any) {
                    console.error('Erro ao deletar trilha:', error);
                    alert('Erro ao deletar trilha educacional: ' + (error?.message || 'Erro desconhecido'));
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 border border-red-200 transition-colors"
                title="Deletar trilha educacional"
              >
                🗑️ Deletar Trilha
              </button>
              <button
                onClick={() => {
                  setEducationalTrail(null);
                  setEducationalRoadmap(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
                title="Ocultar trilha educacional"
              >
                Ocultar
              </button>
            </div>
          </div>
          <EducationalTrailView trail={educationalTrail} />
        </div>
      )}
      
      {educationalRoadmap && !educationalTrail && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold">📚 Roadmap Educacional</h5>
            <button
              onClick={() => setEducationalRoadmap(null)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100"
              title="Ocultar roadmap educacional"
            >
              Ocultar
            </button>
          </div>
          <EducationalRoadmapView roadmap={educationalRoadmap} />
        </div>
      )}
    </div>
  );
}

