'use client';

import { Roadmap } from '@/types';
import { roadmapsAPI } from '@/lib/api';
import { useState } from 'react';

interface RoadmapViewProps {
  roadmap: Roadmap;
}

export default function RoadmapView({ roadmap }: RoadmapViewProps) {
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);

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

  return (
    <div className="mt-4 border-t pt-4">
      <h5 className="text-lg font-semibold mb-4">Roadmap: {localRoadmap.topic}</h5>
      {localRoadmap.categories.map((category) => (
        <div key={category.id} className="mb-6">
          <h6 className="text-md font-medium text-gray-700 mb-2">{category.category}</h6>
          <ul className="space-y-2">
            {category.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleItem(item.id, item.completed)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span
                  className={item.completed ? 'line-through text-gray-500' : 'text-gray-900'}
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

