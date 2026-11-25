'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Goal, Milestone } from '@/types';
import { errorMessage, goalsAPI, milestonesAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import GoalForm from '@/components/GoalForm';
import { DifficultyBadge } from '@/components/GoalCard';
import ProgressBar from '@/components/ProgressBar';
import Loading, { ErrorBox } from '@/components/Loading';
import { CheckButton, CoinAmount, XP } from '@/components/ui';
import { TONE_CLASSES, deadlineLabel, formatDate, formatDateTime, goalProgress, todayISO } from '@/lib/utils';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/" className="btn btn-ghost btn-sm">← Objetivos</Link>

      <div className={`card p-6 sm:p-8 ${done ? 'border-emerald-300' : ''}`} style={done ? { boxShadow: '0 4px 0 #a7f3d0' } : undefined}>
        {editing ? (
          <>
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
          </>
        ) : (
          <>
            <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="font-game text-4xl leading-tight text-slate-900 mb-2">{done && '🏆 '}{goal.title}</h1>
                {goal.description && <p className="text-slate-600 font-semibold mb-3">{goal.description}</p>}
                <div className="flex flex-wrap items-center gap-1.5">
                  {goal.category && <span className="chip bg-sky-50 text-sky-700 border-sky-200">{goal.category.name}</span>}
                  <DifficultyBadge difficulty={goal.difficulty} />
                  {goal.target_date && (
                    <span className={`chip ${deadline ? TONE_CLASSES[deadline.tone] : TONE_CLASSES.ok}`}>
                      ⏳ {formatDate(goal.target_date)}{deadline && ` · ${deadline.text}`}
                    </span>
                  )}
                  {done && (
                    <span className="chip bg-emerald-50 text-emerald-700 border-emerald-200">
                      Conquistado em {formatDateTime(goal.completed_at!)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">Editar</button>
                <button onClick={deleteGoal} className="btn btn-ghost btn-sm text-rose-600">Excluir</button>
              </div>
            </div>

            <ProgressBar progress={progress} size="lg" />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Recompensas</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold text-slate-600">
                  Cada meta <CoinAmount value={goal.rewards.per_milestone.coins} className="text-amber-600 text-lg" />
                  <XP value={goal.rewards.per_milestone.xp} className="text-sm" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold text-slate-600">
                  Bônus final <CoinAmount value={goal.rewards.on_complete.coins} className="text-amber-600 text-lg" />
                  <XP value={goal.rewards.on_complete.xp} className="text-sm" />
                </div>
              </div>
              <button onClick={toggleGoal} disabled={busy === 'goal'}
                className={`btn btn-lg ${done ? 'btn-ghost' : 'btn-success'}`}>
                {busy === 'goal' ? 'Salvando...' : done ? 'Reabrir objetivo' : '🏆 Concluir objetivo'}
              </button>
            </div>
            {!done && allMilestonesDone && (
              <p className="mt-3 font-extrabold text-emerald-600 animate-pulse">
                Todas as metas concluídas! Concluam o objetivo para pegar o bônus.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-game text-2xl text-slate-900 mb-4">
          Metas <span className="text-slate-400">{goal.milestones_completed}/{goal.milestones_total}</span>
        </h2>

        {milestones.length === 0 && (
          <p className="font-semibold text-slate-500 mb-4">Quebrem o objetivo em etapas menores. Ex.: &quot;Guardar os primeiros R$ 1.000&quot;.</p>
        )}

        <ul className="space-y-2 mb-5">
          {milestones.map((m) => {
            const late = !m.completed && m.due_date && m.due_date < todayISO();
            return (
              <li key={m.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${m.completed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <CheckButton checked={m.completed} disabled={busy === m.id} onClick={() => toggleMilestone(m)} />
                {editId === m.id ? (
                  <div className="flex flex-wrap gap-2 flex-1">
                    <input className="input flex-1 min-w-40 py-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                    <input type="date" className="input w-auto py-2" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    <button onClick={() => saveEdit(m)} disabled={!editTitle.trim()} className="btn btn-primary btn-sm">Salvar</button>
                    <button onClick={() => setEditId(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.title}</div>
                      {m.due_date && (
                        <div className={`text-xs font-bold ${late ? 'text-rose-600' : 'text-slate-400'}`}>
                          ⏳ {formatDate(m.due_date)}{late && ' · atrasada'}
                        </div>
                      )}
                    </div>
                    {!m.completed && <CoinAmount value={goal.rewards.per_milestone.coins} sign size={16} className="text-amber-600 whitespace-nowrap" />}
                    <button onClick={() => { setEditId(m.id); setEditTitle(m.title); setEditDate(m.due_date ?? ''); }}
                      className="text-xs font-extrabold uppercase text-slate-400 hover:text-violet-600" aria-label="Editar meta">✏️</button>
                    <button onClick={() => deleteMilestone(m)} className="text-xs font-extrabold uppercase text-slate-400 hover:text-rose-600" aria-label="Excluir meta">🗑️</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={addMilestone} className="flex flex-wrap gap-2 p-3 rounded-2xl border-2 border-dashed border-slate-300">
          <input className="input flex-1 min-w-48" placeholder="Nova meta..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <input type="date" className="input w-auto" value={newDate} min={todayISO()} onChange={(e) => setNewDate(e.target.value)} title="Prazo (opcional)" />
          <button type="submit" disabled={!newTitle.trim() || busy === -1} className="btn btn-primary">+ Adicionar</button>
        </form>
      </div>
    </div>
  );
}
