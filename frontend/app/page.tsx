'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Category, Goal } from '@/types';
import { categoriesAPI, errorMessage, goalsAPI } from '@/lib/api';
import GoalCard from '@/components/GoalCard';
import LevelCard from '@/components/LevelCard';
import Loading, { ErrorBox } from '@/components/Loading';

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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nossos objetivos</h1>
          <p className="text-gray-600">Cada meta concluída vale moedas e XP.</p>
        </div>
        <Link href="/objetivos/novo"
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md font-medium">
          + Novo objetivo
        </Link>
      </div>

      <LevelCard />

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: null as number | null, name: 'Todas' }, ...categories].map((c) => (
          <button key={c.id ?? 'all'} onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              category === c.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-lg font-medium text-gray-800 mb-1">Nenhum objetivo por aqui</p>
          <p className="text-gray-500 mb-6">Cadastrem o primeiro objetivo do casal e comecem a juntar moedas.</p>
          <Link href="/objetivos/novo" className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Criar primeiro objetivo
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Em andamento ({active.length})</h2>
            {active.length === 0 ? (
              <p className="text-gray-500">Tudo conquistado! Que tal um novo desafio?</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Conquistados ({done.length})</h2>
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
