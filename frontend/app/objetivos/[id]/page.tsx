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
import { TONE_CLASSES, deadlineLabel, formatDate, formatDateTime, goalProgress, todayISO } from '@/lib/utils';

const input = 'px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

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
        <Link href="/" className="text-blue-600 hover:underline">← Voltar aos objetivos</Link>
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
      applyProgress(res, m.completed ? 'Meta reaberta' : 'Meta concluída');
    });

  const toggleGoal = () => {
    if (!done && !allMilestonesDone && milestones.length > 0 &&
      !confirm('Ainda há metas pendentes. Concluir o objetivo mesmo assim?')) return;
    if (done && !confirm(`Reabrir o objetivo? As ${goal.rewards.on_complete.coins} moedas do bônus serão estornadas.`)) return;
    run('goal', async () => {
      const res = done ? await goalsAPI.reopen(goal.id) : await goalsAPI.complete(goal.id);
      applyProgress(res, done ? 'Objetivo reaberto' : 'Objetivo conquistado');
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
      <Link href="/" className="inline-block text-blue-600 hover:text-blue-800 font-medium">← Objetivos</Link>

      <div className={`bg-white rounded-xl shadow-sm border p-6 sm:p-8 ${done ? 'border-emerald-200' : 'border-gray-100'}`}>
        {editing ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Editar objetivo</h2>
            <GoalForm
              submitLabel="Salvar alterações"
              initial={{ title: goal.title, description: goal.description, category_id: goal.category_id, difficulty: goal.difficulty, target_date: goal.target_date }}
              onCancel={() => setEditing(false)}
              onSubmit={async (data) => {
                await goalsAPI.update(goal.id, data);
                setEditing(false);
                notify('success', 'Objetivo atualizado');
                await load();
              }}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{done && '🏆 '}{goal.title}</h1>
                {goal.description && <p className="text-gray-600 mb-3">{goal.description}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {goal.category && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                      {goal.category.name}
                    </span>
                  )}
                  <DifficultyBadge difficulty={goal.difficulty} />
                  {goal.target_date && (
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${deadline ? TONE_CLASSES[deadline.tone] : TONE_CLASSES.ok}`}>
                      📅 {formatDate(goal.target_date)}{deadline && ` · ${deadline.text}`}
                    </span>
                  )}
                  {done && (
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      Conquistado em {formatDateTime(goal.completed_at!)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                  Editar
                </button>
                <button onClick={deleteGoal} className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium">
                  Excluir
                </button>
              </div>
            </div>

            <ProgressBar progress={progress} size="lg" />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-sm text-amber-900">
                <div>Cada meta: <strong>🪙 {goal.rewards.per_milestone.coins}</strong> · {goal.rewards.per_milestone.xp} XP</div>
                <div>Bônus ao conquistar: <strong>🪙 {goal.rewards.on_complete.coins}</strong> · {goal.rewards.on_complete.xp} XP</div>
              </div>
              <button onClick={toggleGoal} disabled={busy === 'goal'}
                className={`px-5 py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 ${
                  done ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                }`}>
                {busy === 'goal' ? 'Salvando...' : done ? 'Reabrir objetivo' : '🏆 Concluir objetivo'}
              </button>
            </div>
            {!done && allMilestonesDone && (
              <p className="mt-3 text-sm font-medium text-emerald-700">
                Todas as metas foram concluídas! Concluam o objetivo para ganhar o bônus.
              </p>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Metas <span className="text-gray-400 font-normal">({goal.milestones_completed}/{goal.milestones_total})</span>
        </h2>

        {milestones.length === 0 && (
          <p className="text-gray-500 mb-4">Quebrem o objetivo em etapas menores. Ex.: &quot;Guardar os primeiros R$ 1.000&quot;.</p>
        )}

        <ul className="divide-y divide-gray-100 mb-4">
          {milestones.map((m) => {
            const late = !m.completed && m.due_date && m.due_date < todayISO();
            return (
              <li key={m.id} className="py-3 flex items-center gap-3">
                <button onClick={() => toggleMilestone(m)} disabled={busy === m.id}
                  aria-label={m.completed ? 'Reabrir meta' : 'Concluir meta'}
                  className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center font-bold disabled:opacity-50 ${
                    m.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                  }`}>
                  ✓
                </button>
                {editId === m.id ? (
                  <div className="flex flex-wrap gap-2 flex-1">
                    <input className={`${input} flex-1 min-w-40`} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                    <input type="date" className={input} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    <button onClick={() => saveEdit(m)} disabled={!editTitle.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Salvar</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${m.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{m.title}</div>
                      {m.due_date && (
                        <div className={`text-xs ${late ? 'text-red-600' : 'text-gray-500'}`}>
                          📅 {formatDate(m.due_date)}{late && ' · atrasada'}
                        </div>
                      )}
                    </div>
                    {!m.completed && <span className="text-sm text-amber-700 font-medium whitespace-nowrap">+🪙 {goal.rewards.per_milestone.coins}</span>}
                    <button onClick={() => { setEditId(m.id); setEditTitle(m.title); setEditDate(m.due_date ?? ''); }}
                      className="text-sm text-gray-500 hover:text-blue-600">Editar</button>
                    <button onClick={() => deleteMilestone(m)} className="text-sm text-gray-500 hover:text-red-600">Excluir</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={addMilestone} className="flex flex-wrap gap-2">
          <input className={`${input} flex-1 min-w-48`} placeholder="Nova meta..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <input type="date" className={input} value={newDate} min={todayISO()} onChange={(e) => setNewDate(e.target.value)} title="Prazo (opcional)" />
          <button type="submit" disabled={!newTitle.trim() || busy === -1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
