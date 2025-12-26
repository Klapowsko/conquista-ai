'use client';

import { EducationalTrail, TrailActivity } from '@/types';
import { roadmapsAPI } from '@/lib/api';
import { useState } from 'react';

interface EducationalTrailViewProps {
  trail: EducationalTrail;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'read_book':
    case 'read_chapters':
      return '📖';
    case 'watch_video':
      return '🎥';
    case 'read_article':
      return '📄';
    case 'take_course':
      return '🎓';
    case 'do_project':
      return '🛠️';
    default:
      return '📚';
  }
};

const getActivityTypeLabel = (type: string) => {
  switch (type) {
    case 'read_book':
      return 'Ler Livro';
    case 'read_chapters':
      return 'Ler Capítulos';
    case 'watch_video':
      return 'Assistir Vídeo';
    case 'read_article':
      return 'Ler Artigo';
    case 'take_course':
      return 'Fazer Curso';
    case 'do_project':
      return 'Fazer Projeto';
    default:
      return 'Atividade';
  }
};

export default function EducationalTrailView({ trail: initialTrail }: EducationalTrailViewProps) {
  const [localTrail, setLocalTrail] = useState(initialTrail);
  
  // Inicializar atividades completadas baseado no estado da trilha
  const initializeCompleted = () => {
    const completed = new Set<string>();
    initialTrail.steps.forEach((step, stepIndex) => {
      step.activities.forEach((activity, activityIndex) => {
        if (activity.completed) {
          completed.add(`${stepIndex}-${activityIndex}`);
        }
      });
    });
    return completed;
  };
  
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(initializeCompleted());

  const toggleActivity = async (activityId: number, stepIndex: number, activityIndex: number, currentCompleted: boolean) => {
    const key = `${stepIndex}-${activityIndex}`;
    const newCompleted = !currentCompleted;
    
    try {
      await roadmapsAPI.updateTrailActivity(activityId, newCompleted);
      
      // Atualizar estado local
      setCompletedActivities((prev) => {
        const next = new Set(prev);
        if (newCompleted) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      
      // Atualizar trilha local
      setLocalTrail((prev) => ({
        ...prev,
        steps: prev.steps.map((step, sIdx) => {
          if (sIdx === stepIndex) {
            return {
              ...step,
              activities: step.activities.map((act, aIdx) => {
                if (aIdx === activityIndex) {
                  return { ...act, completed: newCompleted };
                }
                return act;
              }),
            };
          }
          return step;
        }),
      }));
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      alert('Erro ao atualizar atividade');
    }
  };

  const renderActivity = (activity: TrailActivity, stepIndex: number, activityIndex: number) => {
    const key = `${stepIndex}-${activityIndex}`;
    // Usar o estado da atividade ou o estado local
    const isCompleted = activity.completed || completedActivities.has(key);
    const resource = localTrail.resources[activity.resource_id];

    return (
      <div
        key={activityIndex}
        className={`bg-white rounded-lg p-4 mb-3 border-2 transition-all ${
          isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => toggleActivity(activity.id, stepIndex, activityIndex, activity.completed)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
        />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getActivityTypeLabel(activity.type)}
              </span>
            </div>
            <h4
              className={`font-semibold text-lg mb-1 ${
                isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {activity.title}
            </h4>
            {activity.description && (
              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
            )}
            
            {resource && (
              <div className="bg-gray-50 rounded p-3 mb-2">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  📚 {resource.title}
                </p>
                {resource.author && (
                  <p className="text-xs text-gray-500">Autor: {resource.author}</p>
                )}
                {resource.description && (
                  <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                )}
              </div>
            )}

            {activity.chapters && activity.chapters.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Capítulos:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside">
                  {activity.chapters.map((chapter, idx) => (
                    <li key={idx}>{chapter}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {activity.duration && (
                <span>⏱️ {activity.duration}</span>
              )}
              {activity.progress && (
                <span>📊 {activity.progress}</span>
              )}
            </div>

            {activity.url && (
              <a
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                🔗 Acessar recurso →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalActivities = localTrail.steps.reduce((sum, step) => sum + step.activities.length, 0);
  const completedCount = localTrail.steps.reduce((sum, step) => 
    sum + step.activities.filter(act => act.completed || completedActivities.has(`${localTrail.steps.indexOf(step)}-${step.activities.indexOf(act)}`)).length, 0
  );
  const progressPercentage = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🗺️ Trilha Educacional: {localTrail.topic}
        </h3>
        {localTrail.description && (
          <p className="text-gray-600 mb-4">{localTrail.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>📅 {localTrail.total_days} dias</span>
          <span>📚 {totalActivities} atividades</span>
          <span className="font-semibold text-blue-600">
            {completedCount}/{totalActivities} concluídas ({progressPercentage}%)
          </span>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-6">
        {localTrail.steps.map((step, stepIndex) => (
          <div key={step.day} className="border-l-4 border-blue-500 pl-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {step.day}
                </span>
                <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
              </div>
              {step.description && (
                <p className="text-sm text-gray-600 ml-10">{step.description}</p>
              )}
            </div>

            <div className="ml-10 space-y-2">
              {step.activities.map((activity, activityIndex) =>
                renderActivity(activity, stepIndex, activityIndex)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

