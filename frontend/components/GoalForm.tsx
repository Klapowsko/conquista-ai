'use client';

import { useEffect, useState } from 'react';
import { Category, DifficultyRule, Difficulty, GoalRequest } from '@/types';
import { categoriesAPI, shopAPI } from '@/lib/api';
import { DIFFICULTY, todayISO } from '@/lib/utils';
import { CoinAmount, Stars } from './ui';

interface GoalFormProps {
  initial?: GoalRequest;
  submitLabel: string;
  onSubmit: (data: GoalRequest) => Promise<void>;
  onCancel: () => void;
}

function defaultTargetDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: 'border-emerald-500 bg-emerald-50',
  medium: 'border-amber-500 bg-amber-50',
  hard: 'border-rose-500 bg-rose-50',
};

export default function GoalForm({ initial, submitLabel, onSubmit, onCancel }: GoalFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<DifficultyRule[]>([]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category_id ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'medium');
  const [hasDeadline, setHasDeadline] = useState(initial ? !!initial.target_date : true);
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? defaultTargetDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesAPI.getAll().then((data) => {
      setCategories(data);
      setCategoryId((current) => current || data[0]?.id || '');
    }).catch(() => setError('Não foi possível carregar as categorias.'));
    shopAPI.rules().then((r) => setRules(r.difficulties)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {
      setError('Preencha o título e a categoria.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        difficulty,
        target_date: hasDeadline && targetDate ? targetDate : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="label">Objetivo</label>
        <input id="title" className="input text-lg" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Juntar R$ 3.000 de reserva de emergência" required autoFocus />
      </div>

      <div>
        <label htmlFor="description" className="label">Descrição <span className="normal-case tracking-normal font-semibold text-slate-400">(opcional)</span></label>
        <textarea id="description" className="input" rows={2} value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder="Por que esse objetivo importa para vocês?" />
      </div>

      <div>
        <span className="label">Dificuldade</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const rule = rules.find((r) => r.difficulty === d);
            const selected = difficulty === d;
            return (
              <button type="button" key={d} onClick={() => setDifficulty(d)} aria-pressed={selected}
                className={`text-left p-4 rounded-2xl border-2 border-b-4 transition-all active:translate-y-[2px] ${
                  selected ? `${DIFF_STYLE[d]} -translate-y-0.5` : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-game text-xl text-slate-900">{DIFFICULTY[d].label}</span>
                  <Stars difficulty={d} className="text-lg" />
                </div>
                {rule && (
                  <div className="mt-2 space-y-1 text-xs font-bold text-slate-500">
                    <div className="flex items-center justify-between">Cada meta <CoinAmount value={rule.milestone_reward.coins} size={14} className="text-amber-600 text-sm" /></div>
                    <div className="flex items-center justify-between">Ao concluir <CoinAmount value={rule.goal_reward.coins} size={14} className="text-amber-600 text-sm" /></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">Categoria</label>
          <select id="category" className="input" value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 accent-violet-600" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} />
            Tem prazo
          </label>
          <input type="date" className="input disabled:opacity-50" value={targetDate} disabled={!hasDeadline}
            min={initial?.target_date && initial.target_date < todayISO() ? initial.target_date : todayISO()}
            onChange={(e) => setTargetDate(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn btn-primary btn-lg flex-1">
          {saving ? 'Salvando...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-lg">Cancelar</button>
      </div>
    </form>
  );
}
