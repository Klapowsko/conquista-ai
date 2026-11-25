'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Goal, Milestone } from '@/types';
import { errorMessage, goalsAPI, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import GoalForm from '@/components/GoalForm';
import { DifficultyBadge } from '@/components/GoalCard';
import Loading, { ErrorBox } from '@/components/Loading';
import { CoinAmount, Eyebrow, ProgressRing, XP } from '@/components/ui';
import { TONE_CLASSES, deadlineLabel, formatDate, formatDateTime, goalProgress, todayISO } from '@/lib/utils';

const RING = { easy: '#10b981', medium: '#f59e0b', hard: '#f43f5e' } as const;

export default function GoalDetailPage() {
  const id = Number(useParams().id);
  const router = useRouter();
  const { applyProgress, notify } = useGame();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<number | 'goal' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, m] = await Promise.all([goalsAPI.getById(id), goalsAPI.milestones(id)]);
      setGoal(g);
      setMilestones(m);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (error || !goal) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <ErrorBox message={error || 'Objetivo não encontrado'} onRetry={load} />
        <Link href="/" className="btn btn-ghost">← Voltar aos objetivos</Link>
      </div>
    );
  }

  const done = !!goal.completed_at;
  const progress = goalProgress(goal);
  const allMilestonesDone = milestones.length > 0 && milestones.every((m) => m.completed);
  const deadline = goal.target_date && !done ? deadlineLabel(goal.target_date) : null;
  const nextId = milestones.find((m) => !m.completed)?.id;

  const run = async (key: number | 'goal', fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const toggleMilestone = (m: Milestone) =>
    run(m.id, async () => {
      const res = m.completed ? await milestonesAPI.reopen(m.id) : await milestonesAPI.complete(m.id);
      applyProgress(res, m.completed ? 'Meta reaberta' : 'Meta concluída!');
    });

  const toggleGoal = () => {
    if (!done && !allMilestonesDone && milestones.length > 0 &&
      !confirm('Ainda há metas pendentes. Concluir o objetivo mesmo assim?')) return;
    if (done && !confirm(`Reabrir o objetivo? As ${goal.rewards.on_complete.coins} moedas do bônus serão estornadas.`)) return;
    run('goal', async () => {
      const res = done ? await goalsAPI.reopen(goal.id) : await goalsAPI.complete(goal.id);
      applyProgress(res, done ? 'Objetivo reaberto' : 'Objetivo conquistado! 🏆');
    });
  };

  const addMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    run(-1, async () => {
      await milestonesAPI.create({ goal_id: goal.id, title: newTitle.trim(), due_date: newDate || null });
      setNewTitle('');
      setNewDate('');
    });
  };

  const saveEdit = (m: Milestone) =>
    run(m.id, async () => {
      await milestonesAPI.update(m.id, { title: editTitle.trim(), due_date: editDate || null });
      setEditId(null);
    });

  const deleteMilestone = (m: Milestone) => {
    if (!confirm(`Remover a meta "${m.title}"? Moedas já ganhas com ela continuam na carteira.`)) return;
    run(m.id, () => milestonesAPI.delete(m.id));
  };

  const deleteGoal = async () => {
    if (!confirm(`Remover o objetivo "${goal.title}" e todas as suas metas? Moedas já ganhas continuam na carteira.`)) return;
    try {
      await goalsAPI.delete(goal.id);
      router.push('/');
    } catch (err) {
      notify('error', errorMessage(err));
    }
  };

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto card p-6 sm:p-8">
        <h2 className="font-game text-3xl text-slate-900 mb-5">Editar objetivo</h2>
        <GoalForm submitLabel="Salvar"
          initial={{ title: goal.title, description: goal.description, category_id: goal.category_id, difficulty: goal.difficulty, target_date: goal.target_date }}
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await goalsAPI.update(goal.id, data);
            setEditing(false);
            notify('success', 'Objetivo atualizado');
            await load();
          }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
      {/* Painel do objetivo */}
      <aside className="lg:sticky lg:top-24 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="btn btn-ghost btn-sm">← Objetivos</Link>
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm" aria-label="Editar objetivo">✏️</button>
            <button onClick={deleteGoal} className="btn btn-ghost btn-sm" aria-label="Excluir objetivo">🗑️</button>
          </div>
        </div>

        <div className={`card p-6 text-center ${done ? 'border-emerald-300' : ''}`} style={done ? { boxShadow: '0 4px 0 #a7f3d0' } : undefined}>
          <ProgressRing value={progress} size={112} stroke={12} color={RING[goal.difficulty]}>
            {done ? <span className="text-5xl">🏆</span> : <span className="font-game text-3xl text-slate-800">{progress}%</span>}
          </ProgressRing>
          <h1 className="font-game text-3xl leading-tight text-slate-900 mt-4">{goal.title}</h1>
          {goal.description && <p className="text-slate-500 font-semibold mt-1">{goal.description}</p>}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {goal.category && <span className="chip bg-sky-50 text-sky-700 border-sky-200">{goal.category.name}</span>}
            <DifficultyBadge difficulty={goal.difficulty} />
            {goal.target_date && (
              <span className={`chip ${deadline ? TONE_CLASSES[deadline.tone] : TONE_CLASSES.ok}`}>
                ⏳ {formatDate(goal.target_date)}{deadline && ` · ${deadline.text}`}
              </span>
            )}
          </div>
          {done && <p className="text-xs font-bold text-emerald-600 mt-3">Conquistado em {formatDateTime(goal.completed_at!)}</p>}
        </div>

        <div className="rounded-[1.5rem] p-5 bg-amber-50 border-2 border-amber-200">
          <Eyebrow className="!text-amber-700 mb-3">Recompensas</Eyebrow>
          <div className="space-y-2 font-bold text-slate-600">
            <div className="flex items-center justify-between">
              <span>Cada meta</span>
              <span className="flex items-center gap-2"><CoinAmount value={goal.rewards.per_milestone.coins} className="text-amber-600" /><XP value={goal.rewards.per_milestone.xp} className="text-xs" /></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bônus final</span>
              <span className="flex items-center gap-2"><CoinAmount value={goal.rewards.on_complete.coins} className="text-amber-600" /><XP value={goal.rewards.on_complete.xp} className="text-xs" /></span>
            </div>
          </div>
          <button onClick={toggleGoal} disabled={busy === 'goal'} className={`btn btn-lg w-full mt-4 ${done ? 'btn-ghost' : 'btn-success'}`}>
            {busy === 'goal' ? 'Salvando...' : done ? 'Reabrir objetivo' : '🏆 Concluir objetivo'}
          </button>
          {!done && allMilestonesDone && (
            <p className="mt-3 text-sm font-extrabold text-emerald-600 text-center animate-pulse">Todas as metas feitas! Peguem o bônus.</p>
          )}
        </div>
      </aside>

      {/* Trilha de metas */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-game text-3xl text-slate-900">Trilha</h2>
          <span className="font-game text-xl text-slate-400">{goal.milestones_completed}/{goal.milestones_total} metas</span>
        </div>

        <ol className="relative">
          {milestones.map((m, i) => {
            const late = !m.completed && m.due_date && m.due_date < todayISO();
            const isNext = m.id === nextId;
            return (
              <li key={m.id} className="relative flex gap-4 pb-4">
                {/* Linha da trilha */}
                <span aria-hidden className={`absolute left-[1.45rem] top-12 bottom-0 w-1 rounded-full ${m.completed ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                {/* Nó */}
                <button onClick={() => toggleMilestone(m)} disabled={busy === m.id}
                  aria-label={m.completed ? `Reabrir meta ${m.title}` : `Concluir meta ${m.title}`}
                  className={`relative z-10 w-12 h-12 shrink-0 rounded-full border-2 border-b-[5px] flex items-center justify-center font-game text-lg transition-all active:translate-y-[3px] active:border-b-2 disabled:opacity-50 ${
                    m.completed ? 'bg-emerald-500 border-emerald-700 text-white'
                      : isNext ? 'bg-violet-600 border-violet-800 text-white ring-4 ring-violet-200'
                        : 'bg-white border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-500'
                  }`}>
                  {m.completed ? '✓' : i + 1}
                </button>

                <div className={`flex-1 min-w-0 rounded-2xl border-2 px-4 py-3 ${
                  m.completed ? 'bg-emerald-50/60 border-emerald-200' : isNext ? 'bg-white border-violet-300 shadow-[0_4px_0_#ddd6fe]' : 'bg-white border-slate-200'
                }`}>
                  {editId === m.id ? (
                    <div className="flex flex-wrap gap-2">
                      <input className="input flex-1 min-w-40 py-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                      <input type="date" className="input w-auto py-2" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                      <button onClick={() => saveEdit(m)} disabled={!editTitle.trim()} className="btn btn-primary btn-sm">Salvar</button>
                      <button onClick={() => setEditId(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {isNext && <Eyebrow className="!text-violet-500">Próxima</Eyebrow>}
                        <div className={`font-bold ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.title}</div>
                        {m.due_date && (
                          <div className={`text-xs font-bold ${late ? 'text-rose-600' : 'text-slate-400'}`}>⏳ {formatDate(m.due_date)}{late && ' · atrasada'}</div>
                        )}
                      </div>
                      {!m.completed && <CoinAmount value={goal.rewards.per_milestone.coins} sign size={16} className="text-amber-600 whitespace-nowrap" />}
                      <button onClick={() => { setEditId(m.id); setEditTitle(m.title); setEditDate(m.due_date ?? ''); }}
                        className="text-slate-300 hover:text-violet-600" aria-label="Editar meta">✏️</button>
                      <button onClick={() => deleteMilestone(m)} className="text-slate-300 hover:text-rose-600" aria-label="Excluir meta">🗑️</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {/* Adicionar meta */}
          <li className="relative flex gap-4 pb-4">
            <span aria-hidden className="absolute left-[1.45rem] top-12 bottom-0 w-1 rounded-full bg-slate-200" />
            <span className="relative z-10 w-12 h-12 shrink-0 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-xl text-slate-400">+</span>
            <form onSubmit={addMilestone} className="flex-1 flex flex-wrap gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-2">
              <input className="input flex-1 min-w-44 bg-white" placeholder={milestones.length ? 'Próxima etapa...' : 'Primeira etapa, ex.: Guardar R$ 1.000'}
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <input type="date" className="input w-auto bg-white" value={newDate} min={todayISO()} onChange={(e) => setNewDate(e.target.value)} title="Prazo (opcional)" />
              <button type="submit" disabled={!newTitle.trim() || busy === -1} className="btn btn-primary">Adicionar</button>
            </form>
          </li>

          {/* Fim da trilha */}
          <li className="relative flex gap-4 items-center">
            <span className={`relative z-10 w-12 h-12 shrink-0 rounded-2xl border-2 border-b-[5px] flex items-center justify-center text-2xl ${
              done ? 'bg-emerald-400 border-emerald-600' : 'bg-amber-300 border-amber-500'}`}>🏆</span>
            <div className="font-bold text-slate-500 flex items-center gap-2 flex-wrap">
              {done ? 'Objetivo conquistado!' : <>Fim da trilha: bônus de <CoinAmount value={goal.rewards.on_complete.coins} className="text-amber-600" /></>}
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
