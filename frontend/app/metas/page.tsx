'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MilestoneWithGoal } from '@/types';
import { errorMessage, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { CheckButton, CoinAmount, EmptyState, PageTitle } from '@/components/ui';
import { formatDate, todayISO } from '@/lib/utils';

export default function MilestonesPage() {
  const { applyProgress, notify } = useGame();
  const [items, setItems] = useState<MilestoneWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await milestonesAPI.getAll());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (m: MilestoneWithGoal) => {
    setBusy(m.id);
    try {
      const res = m.completed ? await milestonesAPI.reopen(m.id) : await milestonesAPI.complete(m.id);
      applyProgress(res, m.completed ? 'Meta reaberta' : 'Meta concluída!');
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const today = todayISO();
  const pending = items.filter((m) => !m.completed);
  const visible = showDone ? items : pending;

  return (
    <div className="max-w-4xl mx-auto">
      <PageTitle title="Metas" subtitle={`${pending.length} pendente${pending.length !== 1 ? 's' : ''}, ordenadas por prazo`}
        action={
          <button onClick={() => setShowDone(!showDone)} aria-pressed={showDone} className={`btn btn-sm ${showDone ? 'btn-primary' : 'btn-ghost'}`}>
            {showDone ? '✓ ' : ''}Mostrar concluídas
          </button>
        } />

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : visible.length === 0 ? (
        items.length === 0
          ? <EmptyState icon="📋" title="Nenhuma meta ainda" text="Abram um objetivo e quebrem ele em metas menores." action={<Link href="/" className="btn btn-primary">Ver objetivos</Link>} />
          : <EmptyState icon="🎉" title="Nada pendente!" text="Todas as metas foram concluídas. Hora de um novo desafio?" />
      ) : (
        <ul className="space-y-2">
          {visible.map((m) => {
            const due = m.due_date ?? m.goal_target_date;
            const late = !m.completed && due && due < today;
            return (
              <li key={m.id} className={`card p-4 flex items-center gap-4 ${m.completed ? 'opacity-70' : ''}`}>
                <CheckButton checked={m.completed} disabled={busy === m.id} onClick={() => toggle(m)} />
                <div className="flex-1 min-w-0">
                  <div className={`font-bold ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.title}</div>
                  <Link href={`/objetivos/${m.goal_id}`} className="text-sm font-bold text-violet-600 hover:underline">🎯 {m.goal_title}</Link>
                </div>
                {due && (
                  <span className={`chip whitespace-nowrap ${late ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    ⏳ {formatDate(due)}{!m.due_date && '*'}
                  </span>
                )}
                {!m.completed && <CoinAmount value={m.reward.coins} sign size={16} className="text-amber-600 whitespace-nowrap" />}
              </li>
            );
          })}
        </ul>
      )}
      {visible.some((m) => !m.due_date && m.goal_target_date) && (
        <p className="text-xs font-semibold text-slate-400 mt-3">* Meta sem prazo próprio: mostra o prazo do objetivo.</p>
      )}
    </div>
  );
}
