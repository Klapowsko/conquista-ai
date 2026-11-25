'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopReward, ShopRewardRequest } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { CoinAmount, PageTitle } from '@/components/ui';

const EMPTY: ShopRewardRequest = { name: '', description: '', icon: '🎁', cost: 100 };
const ICONS = ['🎁', '☕', '🍦', '🍕', '🌳', '🎬', '🛍️', '💆', '🍫', '🎮', '✈️', '🍷'];

export default function ManageRewardsPage() {
  const { notify } = useGame();
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ShopRewardRequest>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRewards(await shopAPI.rewards());
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

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await shopAPI.updateReward(editingId, form);
        notify('success', 'Recompensa atualizada');
      } else {
        await shopAPI.createReward(form);
        notify('success', `${form.icon} ${form.name} está na loja!`);
      }
      reset();
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: ShopReward) => {
    if (!confirm(`Remover "${r.name}" da loja? O histórico de resgates é mantido.`)) return;
    try {
      await shopAPI.deleteReward(r.id);
      if (editingId === r.id) reset();
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/loja" className="btn btn-ghost btn-sm mb-4">← Loja</Link>
      <PageTitle title="Cadastro de recompensas" subtitle="O que vocês querem poder comprar com as moedas?" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 card p-6 space-y-5 h-fit">
          <h2 className="font-game text-2xl text-slate-900">{editingId ? 'Editar recompensa' : 'Nova recompensa'}</h2>
          <div>
            <label htmlFor="name" className="label">Nome</label>
            <input id="name" className="input" value={form.name} required placeholder="Ex: Café no fim de semana"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="desc" className="label">Descrição <span className="normal-case tracking-normal font-semibold text-slate-400">(opcional)</span></label>
            <textarea id="desc" className="input" rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <span className="label">Ícone</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button type="button" key={icon} onClick={() => setForm({ ...form, icon })} aria-pressed={form.icon === icon}
                  className={`w-11 h-11 text-2xl rounded-xl border-2 border-b-4 transition-all active:translate-y-[2px] ${
                    form.icon === icon ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                  {icon}
                </button>
              ))}
              <input aria-label="Outro emoji" className="input w-16 text-center text-xl px-1" maxLength={8}
                value={ICONS.includes(form.icon) ? '' : form.icon} placeholder="…"
                onChange={(e) => setForm({ ...form, icon: e.target.value || '🎁' })} />
            </div>
          </div>
          <div>
            <label htmlFor="cost" className="label">Preço em moedas</label>
            <input id="cost" type="number" min={1} step={1} className="input font-game text-xl text-amber-600" value={form.cost || ''} required
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            <p className="text-xs font-semibold text-slate-400 mt-2">Referência: uma meta média vale 10 moedas e um objetivo médio concluído, 150.</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.name.trim() || form.cost <= 0} className="btn btn-primary flex-1">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : '+ Adicionar'}
            </button>
            {editingId && <button type="button" onClick={reset} className="btn btn-ghost">Cancelar</button>}
          </div>
        </form>

        <div className="lg:col-span-3">
          {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : rewards.length === 0 ? (
            <div className="card p-10 text-center font-bold text-slate-400">Nenhuma recompensa cadastrada ainda.</div>
          ) : (
            <ul className="space-y-2">
              {rewards.map((r) => (
                <li key={r.id} className={`card p-4 flex items-center gap-4 ${editingId === r.id ? 'border-violet-400' : ''}`}>
                  <span className="text-4xl">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-game text-lg text-slate-900">{r.name}</div>
                    {r.description && <div className="text-sm font-semibold text-slate-500 truncate">{r.description}</div>}
                  </div>
                  <CoinAmount value={r.cost} className="text-amber-600 text-lg whitespace-nowrap" />
                  <button onClick={() => { setEditingId(r.id); setForm({ name: r.name, description: r.description, icon: r.icon, cost: r.cost }); }}
                    className="text-slate-400 hover:text-violet-600" aria-label="Editar">✏️</button>
                  <button onClick={() => remove(r)} className="text-slate-400 hover:text-rose-600" aria-label="Excluir">🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
