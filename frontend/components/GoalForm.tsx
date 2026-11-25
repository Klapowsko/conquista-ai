'use client';

import { useEffect, useState } from 'react';
import { Category, DifficultyRule, Difficulty, GoalRequest } from '@/types';
import { categoriesAPI, shopAPI } from '@/lib/api';
import { DIFFICULTY, todayISO } from '@/lib/utils';

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

const input =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
        <input id="title" className={input} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Juntar R$ 3.000 de reserva de emergência" required autoFocus />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descrição <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea id="description" className={input} rows={2} value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder="Por que esse objetivo importa para vocês?" />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">Dificuldade</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const rule = rules.find((r) => r.difficulty === d);
            const selected = difficulty === d;
            return (
              <button type="button" key={d} onClick={() => setDifficulty(d)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="font-semibold text-gray-900">{DIFFICULTY[d].emoji} {DIFFICULTY[d].label}</div>
                {rule && (
                  <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    <div>Cada meta: 🪙 {rule.milestone_reward.coins}</div>
                    <div>Ao concluir: 🪙 {rule.goal_reward.coins}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <select id="category" className={input} value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} />
            Tem prazo
          </label>
          <input type="date" className={input} value={targetDate} disabled={!hasDeadline}
            min={initial?.target_date && initial.target_date < todayISO() ? initial.target_date : todayISO()}
            onChange={(e) => setTargetDate(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium shadow-md">
          {saving ? 'Salvando...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
          Cancelar
        </button>
      </div>
    </form>
  );
}
