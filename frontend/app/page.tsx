'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Category, Goal, MilestoneWithGoal } from '@/types';
import { categoriesAPI, errorMessage, goalsAPI, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import GoalCard, { TrophyTile } from '@/components/GoalCard';
import Loading, { ErrorBox } from '@/components/Loading';
import { Coin, CoinAmount, EmptyState, Eyebrow, LevelBadge, Segmented } from '@/components/ui';
import { deadlineLabel, formatNumber, TONE_CLASSES } from '@/lib/utils';

export default function HomePage() {
  const { wallet, applyProgress, notify } = useGame();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [next, setNext] = useState<MilestoneWithGoal | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [g, c, m] = await Promise.all([goalsAPI.getAll(category ?? undefined), categoriesAPI.getAll(), milestonesAPI.getAll()]);
      setGoals(g);
      setCategories(c);
      setNext(m.find((x) => !x.completed && !x.goal_completed_at) ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const completeNext = async () => {
    if (!next) return;
    setBusy(true);
    try {
      applyProgress(await milestonesAPI.complete(next.id), 'Meta concluída!');
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const active = goals.filter((g) => !g.completed_at);
  const done = goals.filter((g) => g.completed_at);
  const nextDeadline = next && (next.due_date ?? next.goal_target_date);

  return (
    <div className="space-y-8">
      {/* Bento: status do casal */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[minmax(9rem,auto)]">
        {/* Nível */}
        <div className="col-span-2 lg:row-span-2 relative overflow-hidden rounded-[1.75rem] p-6 sm:p-7 text-white border-2 border-violet-800 flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#2563eb 100%)', boxShadow: '0 6px 0 #4c1d95' }}>
          <div aria-hidden className="absolute -right-8 -bottom-10 text-[12rem] leading-none opacity-10 select-none">⭐</div>
          <div className="relative">
            <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-200">Olá, casal 👋</div>
            <h1 className="font-game text-3xl sm:text-4xl leading-tight mt-1">Bora conquistar?</h1>
          </div>
          {wallet && (
            <div className="relative mt-6">
              <div className="flex items-center gap-4 mb-4">
                <LevelBadge level={wallet.level} size={64} />
                <div>
                  <div className="font-game text-2xl">Nível {wallet.level}</div>
                  <div className="text-sm font-bold text-violet-100">{formatNumber(wallet.total_xp)} XP no total</div>
                </div>
              </div>
              <div className="bar h-4 bg-violet-950/40">
                <div className="bar-fill bg-gradient-to-r from-amber-300 to-yellow-200"
                  style={{ width: `${wallet.progress_percent}%`, minWidth: wallet.progress_percent > 0 ? '1rem' : 0 }} />
              </div>
              <div className="flex justify-between mt-2 text-xs sm:text-sm font-bold text-violet-100">
                <span>{formatNumber(wallet.xp_into_level)} / {formatNumber(wallet.xp_for_next_level)} XP</span>
                <span>Faltam {formatNumber(wallet.xp_to_next_level)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tesouro */}
        <Link href="/loja" className="group relative overflow-hidden rounded-[1.75rem] p-5 border-2 border-amber-500 text-amber-950 flex flex-col justify-between transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(160deg,#fde68a 0%,#fbbf24 55%,#f59e0b 100%)', boxShadow: '0 6px 0 #b45309' }}>
          <Eyebrow className="!text-amber-800">Tesouro</Eyebrow>
          <div className="flex items-center gap-2 my-2">
            <Coin size={34} />
            <span className="font-game text-4xl">{formatNumber(wallet?.coins ?? 0)}</span>
          </div>
          <div className="text-xs font-extrabold uppercase tracking-wide">Ir à loja <span className="inline-block transition-transform group-hover:translate-x-1">→</span></div>
        </Link>

        {/* Próxima meta */}
        <div className="col-span-2 lg:col-span-1 lg:row-span-2 order-last lg:order-none card p-5 flex flex-col">
          <Eyebrow>Próxima meta</Eyebrow>
          {next ? (
            <>
              <div className="flex-1 mt-3">
                <div className="font-game text-xl leading-snug text-slate-900">{next.title}</div>
                <Link href={`/objetivos/${next.goal_id}`} className="text-sm font-bold text-violet-600 hover:underline line-clamp-1">🎯 {next.goal_title}</Link>
                {nextDeadline && (
                  <span className={`chip mt-3 ${TONE_CLASSES[deadlineLabel(nextDeadline).tone]}`}>⏳ {deadlineLabel(nextDeadline).text}</span>
                )}
              </div>
              <button onClick={completeNext} disabled={busy} className="btn btn-success mt-4 w-full">
                ✓ Concluir · <CoinAmount value={next.reward.coins} size={15} sign />
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-sm font-bold text-slate-500">Nenhuma meta pendente. Adicionem metas aos objetivos!</p>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="card p-5 grid grid-cols-2 gap-2 content-center">
          <div>
            <div className="font-game text-3xl text-violet-600">{active.length}</div>
            <div className="text-xs font-extrabold uppercase text-slate-400">Em jogo</div>
          </div>
          <div>
            <div className="font-game text-3xl text-emerald-600">{done.length}</div>
            <div className="text-xs font-extrabold uppercase text-slate-400">Conquistas</div>
          </div>
        </div>
      </section>

      {/* Objetivos */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-game text-3xl text-slate-900">Objetivos</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Segmented value={category} onChange={setCategory}
              options={[{ value: null, label: 'Todas' }, ...categories.map((c) => ({ value: c.id as number | null, label: c.name }))]} />
            <Link href="/objetivos/novo" className="btn btn-primary hidden sm:inline-flex">+ Novo</Link>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : goals.length === 0 ? (
          <EmptyState icon="🎯" title="Nenhum objetivo ainda" text="Cadastrem o primeiro objetivo do casal e comecem a juntar moedas."
            action={<Link href="/objetivos/novo" className="btn btn-primary btn-lg">Criar primeiro objetivo</Link>} />
        ) : active.length === 0 ? (
          <p className="font-bold text-slate-500">Tudo conquistado! Que tal um novo desafio?</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((g) => <GoalCard key={g.id} goal={g} />)}
          </div>
        )}
      </section>

      {/* Estante de troféus */}
      {done.length > 0 && (
        <section>
          <h2 className="font-game text-2xl text-slate-900 mb-3">🏆 Estante de troféus</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
            {done.map((g) => <TrophyTile key={g.id} goal={g} />)}
          </div>
        </section>
      )}

      {/* Botão flutuante no celular */}
      <Link href="/objetivos/novo" aria-label="Novo objetivo"
        className="sm:hidden fixed right-4 bottom-24 z-30 w-14 h-14 rounded-2xl bg-violet-600 border-2 border-b-[5px] border-violet-800 text-white text-3xl font-black flex items-center justify-center shadow-lg active:translate-y-[3px] active:border-b-2">
        +
      </Link>
    </div>
  );
}
