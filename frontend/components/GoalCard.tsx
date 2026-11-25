'use client';

import Link from 'next/link';
import { Goal } from '@/types';
import ProgressBar from './ProgressBar';
import { CoinAmount, Stars } from './ui';
import { DIFFICULTY, TONE_CLASSES, deadlineLabel, goalProgress } from '@/lib/utils';

export function DifficultyBadge({ difficulty }: { difficulty: Goal['difficulty'] }) {
  const d = DIFFICULTY[difficulty];
  return (
    <span className={`chip ${d.className}`}>
      <Stars difficulty={difficulty} /> {d.label}
    </span>
  );
}

export default function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  const done = !!goal.completed_at;
  const deadline = goal.target_date && !done ? deadlineLabel(goal.target_date) : null;

  return (
    <Link href={`/objetivos/${goal.id}`}
      className={`card card-hover block p-5 ${done ? 'border-emerald-300 bg-emerald-50/60' : ''}`}
      style={done ? { boxShadow: '0 4px 0 #a7f3d0' } : undefined}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-game text-xl leading-snug text-slate-900 line-clamp-2">{goal.title}</h3>
        {done && <span className="text-3xl animate-[pop_400ms_ease-out]" title="Conquistado">🏆</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {goal.category && <span className="chip bg-sky-50 text-sky-700 border-sky-200">{goal.category.name}</span>}
        <DifficultyBadge difficulty={goal.difficulty} />
        {deadline && <span className={`chip ${TONE_CLASSES[deadline.tone]}`}>⏳ {deadline.text}</span>}
      </div>
      <ProgressBar progress={progress} size="sm" />
      <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-500">
          {goal.milestones_completed}/{goal.milestones_total} metas
        </span>
        {done ? (
          <span className="font-game text-emerald-600">Conquistado!</span>
        ) : (
          <span className="text-amber-600 text-lg"><CoinAmount value={goal.rewards.on_complete.coins} /></span>
        )}
      </div>
    </Link>
  );
}
