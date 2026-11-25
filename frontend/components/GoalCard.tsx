'use client';

import Link from 'next/link';
import { Goal } from '@/types';
import { CoinAmount, ProgressRing, Stars } from './ui';
import { DIFFICULTY, TONE_CLASSES, deadlineLabel, goalProgress } from '@/lib/utils';

export function DifficultyBadge({ difficulty }: { difficulty: Goal['difficulty'] }) {
  const d = DIFFICULTY[difficulty];
  return (
    <span className={`chip ${d.className}`}>
      <Stars difficulty={difficulty} /> {d.label}
    </span>
  );
}

const RING: Record<Goal['difficulty'], string> = { easy: '#10b981', medium: '#f59e0b', hard: '#f43f5e' };

/** Card de objetivo em andamento: anel de progresso + informações em linha. */
export default function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  const deadline = goal.target_date ? deadlineLabel(goal.target_date) : null;

  return (
    <Link href={`/objetivos/${goal.id}`} className="group card card-hover p-4 sm:p-5 flex items-center gap-4">
      <ProgressRing value={progress} size={68} stroke={8} color={RING[goal.difficulty]} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-400">
          <Stars difficulty={goal.difficulty} />
          {goal.category && <span>{goal.category.name}</span>}
        </div>
        <h3 className="font-game text-lg sm:text-xl leading-snug text-slate-900 line-clamp-2 group-hover:text-violet-700 transition-colors">{goal.title}</h3>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-sm font-bold text-slate-500">
          <span>{goal.milestones_completed}/{goal.milestones_total} metas</span>
          {deadline && <span className={`chip ${TONE_CLASSES[deadline.tone]}`}>⏳ {deadline.text}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <CoinAmount value={goal.rewards.on_complete.coins} className="text-amber-600 text-lg" />
        <span className="text-slate-300 text-xl transition-transform group-hover:translate-x-1" aria-hidden>›</span>
      </div>
    </Link>
  );
}

/** Troféu compacto para objetivos conquistados. */
export function TrophyTile({ goal }: { goal: Goal }) {
  return (
    <Link href={`/objetivos/${goal.id}`}
      className="card card-hover shrink-0 w-44 p-4 text-center snap-start border-emerald-200"
      style={{ boxShadow: '0 4px 0 #a7f3d0', background: 'linear-gradient(180deg,#ecfdf5,#fff 60%)' }}>
      <div className="text-4xl mb-1">🏆</div>
      <div className="font-game text-base leading-tight text-slate-800 line-clamp-2">{goal.title}</div>
      <div className="mt-2 flex justify-center"><Stars difficulty={goal.difficulty} /></div>
    </Link>
  );
}
