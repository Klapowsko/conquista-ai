'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MilestoneWithGoal } from '@/types';
import { errorMessage, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
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
      applyProgress(res, m.completed ? 'Meta reaberta' : 'Meta concluída');
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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-600">{pending.length} pendente{pending.length !== 1 ? 's' : ''}, ordenadas por prazo.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Mostrar concluídas
        </label>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-600">
          {items.length === 0 ? 'Nenhuma meta cadastrada ainda. Abra um objetivo para adicionar metas.' : 'Nenhuma meta pendente. 🎉'}
        </div>
      ) : (
        <ul className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {visible.map((m) => {
            const due = m.due_date ?? m.goal_target_date;
            const late = !m.completed && due && due < today;
            return (
              <li key={m.id} className="p-4 flex items-center gap-4">
                <button onClick={() => toggle(m)} disabled={busy === m.id}
                  aria-label={m.completed ? 'Reabrir meta' : 'Concluir meta'}
                  className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center font-bold disabled:opacity-50 ${
                    m.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                  }`}>
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${m.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{m.title}</div>
                  <Link href={`/objetivos/${m.goal_id}`} className="text-sm text-blue-600 hover:underline">{m.goal_title}</Link>
                </div>
                {due && (
                  <span className={`text-sm whitespace-nowrap ${late ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    📅 {formatDate(due)}{!m.due_date && '*'}
                  </span>
                )}
                {!m.completed && <span className="text-sm text-amber-700 font-medium whitespace-nowrap">+🪙 {m.reward.coins}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {visible.some((m) => !m.due_date && m.goal_target_date) && (
        <p className="text-xs text-gray-500 mt-3">* Meta sem prazo próprio: mostra o prazo do objetivo.</p>
      )}
    </div>
  );
}
