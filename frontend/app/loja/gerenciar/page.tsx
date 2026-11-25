'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopReward, ShopRewardRequest } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { formatNumber } from '@/lib/utils';

const EMPTY: ShopRewardRequest = { name: '', description: '', icon: '🎁', cost: 100 };
const ICONS = ['🎁', '☕', '🍦', '🍕', '🌳', '🎬', '🛍️', '💆', '🍫', '🎮', '✈️', '🍷'];
const input = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

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
        notify('success', 'Recompensa adicionada à loja');
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
      <Link href="/loja" className="inline-block text-blue-600 hover:text-blue-800 font-medium">← Loja</Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-6">Cadastro de recompensas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 h-fit">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar recompensa' : 'Nova recompensa'}</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input id="name" className={input} value={form.name} required placeholder="Ex: Café no fim de semana"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea id="desc" className={input} rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Ícone</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button type="button" key={icon} onClick={() => setForm({ ...form, icon })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 ${form.icon === icon ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {icon}
                </button>
              ))}
              <input aria-label="Outro emoji" className="w-16 px-2 border-2 border-gray-200 rounded-lg text-center text-xl" maxLength={8}
                value={ICONS.includes(form.icon) ? '' : form.icon} placeholder="…"
                onChange={(e) => setForm({ ...form, icon: e.target.value || '🎁' })} />
            </div>
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">Preço em moedas</label>
            <input id="cost" type="number" min={1} step={1} className={input} value={form.cost || ''} required
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            <p className="text-xs text-gray-500 mt-1">Referência: uma meta média vale 🪙 10 e um objetivo médio concluído vale 🪙 150.</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.name.trim() || form.cost <= 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
            )}
          </div>
        </form>

        <div className="lg:col-span-3">
          {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : rewards.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">Nenhuma recompensa cadastrada.</div>
          ) : (
            <ul className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {rewards.map((r) => (
                <li key={r.id} className={`p-4 flex items-center gap-4 ${editingId === r.id ? 'bg-blue-50' : ''}`}>
                  <span className="text-3xl">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.description && <div className="text-sm text-gray-500 truncate">{r.description}</div>}
                  </div>
                  <span className="font-semibold text-amber-700 whitespace-nowrap">🪙 {formatNumber(r.cost)}</span>
                  <button onClick={() => { setEditingId(r.id); setForm({ name: r.name, description: r.description, icon: r.icon, cost: r.cost }); }}
                    className="text-sm text-gray-500 hover:text-blue-600">Editar</button>
                  <button onClick={() => remove(r)} className="text-sm text-gray-500 hover:text-red-600">Excluir</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
