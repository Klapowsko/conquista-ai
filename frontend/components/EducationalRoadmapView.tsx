'use client';

import { EducationalRoadmap, EducationalResource } from '@/types';
import { roadmapsAPI } from '@/lib/api';
import { useState } from 'react';

interface EducationalRoadmapViewProps {
  roadmap: EducationalRoadmap;
}

export default function EducationalRoadmapView({ roadmap: initialRoadmap }: EducationalRoadmapViewProps) {
  const [localRoadmap, setLocalRoadmap] = useState(initialRoadmap);

  const handleToggleResource = async (resourceId: number, currentCompleted: boolean) => {
    try {
      await roadmapsAPI.updateEducationalResource(resourceId, !currentCompleted);
      // Atualizar estado local
      const updateResource = (resources: EducationalResource[]) =>
        resources.map((r) =>
          r.id === resourceId ? { ...r, completed: !currentCompleted } : r
        );

      setLocalRoadmap((prev) => ({
        ...prev,
        books: updateResource(prev.books),
        courses: updateResource(prev.courses),
        videos: updateResource(prev.videos),
        articles: updateResource(prev.articles),
        projects: updateResource(prev.projects),
      }));
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      alert('Erro ao atualizar recurso');
    }
  };

  const renderResource = (resource: EducationalResource, index: number) => (
    <div key={resource.id || index} className="bg-gray-50 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={resource.completed}
          onChange={() => handleToggleResource(resource.id, resource.completed)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
        />
        <div className="flex-1">
          <h4
            className={`font-semibold mb-1 ${
              resource.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {resource.title}
          </h4>
          {resource.description && (
            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
          )}
          {resource.author && (
            <p className="text-xs text-gray-500 mb-1">Autor: {resource.author}</p>
          )}
          {resource.duration && (
            <p className="text-xs text-gray-500 mb-1">Duração: {resource.duration}</p>
          )}
          {resource.chapters && resource.chapters.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 mb-1">Capítulos:</p>
              <ul className="text-xs text-gray-600 list-disc list-inside">
                {resource.chapters.map((chapter: string, idx: number) => (
                  <li key={idx}>{chapter}</li>
                ))}
              </ul>
            </div>
          )}
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              Acessar →
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        📚 Roadmap Educacional: {localRoadmap.topic}
      </h3>

      {localRoadmap.books && localRoadmap.books.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            📖 Livros
          </h4>
          <div className="space-y-2">
            {localRoadmap.books.map((book, index) => renderResource(book, index))}
          </div>
        </div>
      )}

      {localRoadmap.courses && localRoadmap.courses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🎓 Cursos
          </h4>
          <div className="space-y-2">
            {localRoadmap.courses.map((course, index) => renderResource(course, index))}
          </div>
        </div>
      )}

      {localRoadmap.videos && localRoadmap.videos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🎥 Vídeos
          </h4>
          <div className="space-y-2">
            {localRoadmap.videos.map((video, index) => renderResource(video, index))}
          </div>
        </div>
      )}

      {localRoadmap.articles && localRoadmap.articles.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            📄 Artigos
          </h4>
          <div className="space-y-2">
            {localRoadmap.articles.map((article, index) => renderResource(article, index))}
          </div>
        </div>
      )}

      {localRoadmap.projects && localRoadmap.projects.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🛠️ Projetos Lúdicos
          </h4>
          <div className="space-y-2">
            {localRoadmap.projects.map((project, index) => renderResource(project, index))}
          </div>
        </div>
      )}

      {(!localRoadmap.books || localRoadmap.books.length === 0) &&
        (!localRoadmap.courses || localRoadmap.courses.length === 0) &&
        (!localRoadmap.videos || localRoadmap.videos.length === 0) &&
        (!localRoadmap.articles || localRoadmap.articles.length === 0) &&
        (!localRoadmap.projects || localRoadmap.projects.length === 0) && (
          <p className="text-gray-500 text-center py-4">
            Nenhum recurso educacional encontrado.
          </p>
        )}
    </div>
  );
}

