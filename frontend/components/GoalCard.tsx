'use client';

import Link from 'next/link';
import { Goal } from '@/types';
import ProgressBar from './ProgressBar';
import { DIFFICULTY, TONE_CLASSES, deadlineLabel, goalProgress } from '@/lib/utils';

export function DifficultyBadge({ difficulty }: { difficulty: Goal['difficulty'] }) {
  const d = DIFFICULTY[difficulty];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${d.className}`}>
      {d.emoji} {d.label}
    </span>
  );
}

export default function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  const done = !!goal.completed_at;
  const deadline = goal.target_date && !done ? deadlineLabel(goal.target_date) : null;

  return (
    <Link
      href={`/objetivos/${goal.id}`}
      className={`block bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
        done ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{goal.title}</h3>
        {done && <span className="text-2xl" title="Concluído">🏆</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {goal.category && (
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
            {goal.category.name}
          </span>
        )}
        <DifficultyBadge difficulty={goal.difficulty} />
        {deadline && (
          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${TONE_CLASSES[deadline.tone]}`}>
            📅 {deadline.text}
          </span>
        )}
      </div>
      <ProgressBar progress={progress} size="sm" />
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
        <span className="text-gray-600">
          {goal.milestones_completed}/{goal.milestones_total} metas
        </span>
        <span className="font-semibold text-amber-700">
          {done ? 'Conquistado!' : `Vale 🪙 ${goal.rewards.on_complete.coins}`}
        </span>
      </div>
    </Link>
  );
}
