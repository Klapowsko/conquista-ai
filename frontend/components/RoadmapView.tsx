'use client';

import { Roadmap, EducationalRoadmap } from '@/types';
import { roadmapsAPI } from '@/lib/api';
import { useState } from 'react';
import EducationalRoadmapView from './EducationalRoadmapView';

interface RoadmapViewProps {
  roadmap: Roadmap;
}

export default function RoadmapView({ roadmap }: RoadmapViewProps) {
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [educationalRoadmap, setEducationalRoadmap] = useState<EducationalRoadmap | null>(null);
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
      // Primeiro tenta buscar se já existe
      try {
        const existing = await roadmapsAPI.getEducationalByRoadmapItemId(itemId);
        if (existing) {
          console.log('Roadmap educacional encontrado:', existing);
          setEducationalRoadmap(existing);
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
          console.log('Roadmap educacional não encontrado (404), gerando novo...');
        } else {
          // Se for outro erro, mostra e retorna
          console.error('Erro ao buscar roadmap educacional:', error);
          alert('Erro ao buscar roadmap educacional: ' + errorMessage);
          setLoadingEducational(false);
          return;
        }
      }
      
      // Gera um novo roadmap educacional
      console.log('Gerando novo roadmap educacional para item:', itemId, itemTitle);
      const data = await roadmapsAPI.generateEducational(itemId, itemTitle);
      if (data) {
        console.log('Roadmap educacional gerado com sucesso:', data);
        setEducationalRoadmap(data);
      } else {
        console.error('Roadmap educacional não foi retornado');
        alert('Erro: roadmap educacional não foi gerado');
      }
    } catch (error: any) {
      console.error('Erro ao gerar roadmap educacional:', error);
      const errorMessage = error?.message || String(error);
      alert('Erro ao gerar roadmap educacional: ' + errorMessage);
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
                    ? 'Gerando...'
                    : '📚'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {educationalRoadmap && (
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

