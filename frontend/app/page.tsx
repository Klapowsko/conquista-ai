'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Category, Goal } from '@/types';
import { categoriesAPI, errorMessage, goalsAPI } from '@/lib/api';
import GoalCard from '@/components/GoalCard';
import LevelCard from '@/components/LevelCard';
import Loading, { ErrorBox } from '@/components/Loading';
import { EmptyState, PageTitle } from '@/components/ui';

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [g, c] = await Promise.all([goalsAPI.getAll(category ?? undefined), categoriesAPI.getAll()]);
      setGoals(g);
      setCategories(c);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const active = goals.filter((g) => !g.completed_at);
  const done = goals.filter((g) => g.completed_at);

  return (
    <div>
      <PageTitle title="Nossos objetivos" subtitle="Cada meta concluída rende moedas e XP para o casal."
        action={<Link href="/objetivos/novo" className="btn btn-primary btn-lg">+ Novo objetivo</Link>} />

      <LevelCard />

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: null as number | null, name: 'Todas' }, ...categories].map((c) => (
          <button key={c.id ?? 'all'} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
            className={`btn btn-sm ${category === c.id ? 'btn-primary' : 'btn-ghost'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : goals.length === 0 ? (
        <EmptyState icon="🎯" title="Nenhum objetivo ainda" text="Cadastrem o primeiro objetivo do casal e comecem a juntar moedas."
          action={<Link href="/objetivos/novo" className="btn btn-primary btn-lg">Criar primeiro objetivo</Link>} />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="font-game text-2xl text-slate-800 mb-4">⚔️ Em andamento <span className="text-slate-400">{active.length}</span></h2>
            {active.length === 0 ? (
              <p className="font-bold text-slate-500">Tudo conquistado! Que tal um novo desafio?</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="font-game text-2xl text-slate-800 mb-4">🏆 Conquistados <span className="text-slate-400">{done.length}</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {done.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
