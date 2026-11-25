'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MilestoneWithGoal } from '@/types';
import { errorMessage, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { CheckButton, CoinAmount, EmptyState, Segmented } from '@/components/ui';
import { daysUntil, formatDate } from '@/lib/utils';

type Bucket = { key: string; title: string; tone: string; items: MilestoneWithGoal[] };

function bucketize(items: MilestoneWithGoal[]): Bucket[] {
  const buckets: Bucket[] = [
    { key: 'late', title: '🔥 Atrasadas', tone: 'text-rose-600', items: [] },
    { key: 'week', title: '⚡ Próximos 7 dias', tone: 'text-amber-600', items: [] },
    { key: 'later', title: '🗓️ Mais adiante', tone: 'text-violet-600', items: [] },
    { key: 'none', title: '♾️ Sem prazo', tone: 'text-slate-500', items: [] },
  ];
  for (const m of items) {
    const due = m.due_date ?? m.goal_target_date;
    if (!due) buckets[3].items.push(m);
    else {
      const d = daysUntil(due);
      buckets[d < 0 ? 0 : d <= 7 ? 1 : 2].items.push(m);
    }
  }
  return buckets.filter((b) => b.items.length > 0);
}

export default function MilestonesPage() {
  const { applyProgress, notify } = useGame();
  const [items, setItems] = useState<MilestoneWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'pending' | 'done'>('pending');
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

  const pending = items.filter((m) => !m.completed);
  const done = items.filter((m) => m.completed);
  const groups: Bucket[] = view === 'pending' ? bucketize(pending) : done.length ? [{ key: 'done', title: '✅ Concluídas', tone: 'text-emerald-600', items: done }] : [];

  const row = (m: MilestoneWithGoal) => {
    const due = m.due_date ?? m.goal_target_date;
    return (
      <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <CheckButton checked={m.completed} disabled={busy === m.id} onClick={() => toggle(m)} />
        <div className="flex-1 min-w-0">
          <div className={`font-bold ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.title}</div>
          <div className="flex flex-wrap items-center gap-x-3 text-xs font-bold text-slate-400">
            <Link href={`/objetivos/${m.goal_id}`} className="text-violet-600 hover:underline">🎯 {m.goal_title}</Link>
            {due && <span>⏳ {formatDate(due)}{!m.due_date && ' (prazo do objetivo)'}</span>}
          </div>
        </div>
        {!m.completed && <CoinAmount value={m.reward.coins} sign size={16} className="text-amber-600 whitespace-nowrap" />}
      </li>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-game text-4xl text-slate-900">Metas</h1>
          <p className="text-slate-500 font-semibold">{pending.length} para fazer · {done.length} feitas</p>
        </div>
        <Segmented value={view} onChange={setView} options={[{ value: 'pending', label: 'Para fazer' }, { value: 'done', label: 'Feitas' }]} />
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : groups.length === 0 ? (
        items.length === 0
          ? <EmptyState icon="📋" title="Nenhuma meta ainda" text="Abram um objetivo e quebrem ele em metas menores." action={<Link href="/" className="btn btn-primary">Ver objetivos</Link>} />
          : view === 'pending'
            ? <EmptyState icon="🎉" title="Nada pendente!" text="Todas as metas foram concluídas. Hora de um novo desafio?" />
            : <EmptyState icon="⏳" title="Nenhuma meta feita ainda" text="A primeira está logo ali. Bora!" />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className={`font-game text-xl mb-2 ${g.tone}`}>{g.title} <span className="text-slate-300">{g.items.length}</span></h2>
              <ul className="card p-4 divide-y-2 divide-slate-100">{g.items.map(row)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
