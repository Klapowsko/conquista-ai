'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopReward } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { formatNumber } from '@/lib/utils';

export default function ShopPage() {
  const { wallet, setWallet, notify } = useGame();
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<ShopReward | null>(null);
  const [buying, setBuying] = useState(false);

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

  const buy = async (r: ShopReward) => {
    setBuying(true);
    try {
      const res = await shopAPI.purchase(r.id);
      setWallet(res.wallet);
      notify('success', `${r.icon} ${r.name} resgatado!`, `-${r.cost} 🪙 · aproveitem!`);
      setConfirming(null);
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setBuying(false);
    }
  };

  const coins = wallet?.coins ?? 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loja de recompensas</h1>
          <p className="text-gray-600">
            Saldo: <strong className="text-amber-700">🪙 {formatNumber(coins)}</strong>
          </p>
        </div>
        <Link href="/loja/gerenciar" className="px-5 py-3 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-100 font-medium">
          ✏️ Cadastrar recompensas
        </Link>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : rewards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-lg font-medium text-gray-800 mb-1">A loja está vazia</p>
          <p className="text-gray-500 mb-6">Cadastrem recompensas como &quot;Café no fim de semana&quot; ou &quot;Passeio no parque&quot;.</p>
          <Link href="/loja/gerenciar" className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Cadastrar recompensa
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.map((r) => {
            const affordable = coins >= r.cost;
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="text-5xl mb-3">{r.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{r.name}</h3>
                {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                  <span className="text-xl font-bold text-amber-700">🪙 {formatNumber(r.cost)}</span>
                  <button onClick={() => setConfirming(r)} disabled={!affordable}
                    className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow hover:from-amber-500 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500 disabled:shadow-none">
                    {affordable ? 'Resgatar' : `Faltam ${formatNumber(r.cost - coins)}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !buying && setConfirming(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-2">{confirming.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Resgatar &quot;{confirming.name}&quot;?</h3>
            <p className="text-gray-600 mb-6">
              Serão descontadas <strong>🪙 {formatNumber(confirming.cost)}</strong>. Saldo depois: 🪙 {formatNumber(coins - confirming.cost)}.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} disabled={buying} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
                Cancelar
              </button>
              <button onClick={() => buy(confirming)} disabled={buying}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold disabled:opacity-50">
                {buying ? 'Resgatando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
