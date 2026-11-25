'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShopReward } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { Coin, CoinAmount, EmptyState, PageTitle } from '@/components/ui';
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
      notify('success', `${r.icon} ${r.name} resgatado! Aproveitem!`, -r.cost);
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
      <PageTitle title="Loja de recompensas"
        subtitle={<span className="inline-flex items-center gap-2">Saldo do casal <CoinAmount value={coins} className="text-amber-600 text-xl" /></span>}
        action={<Link href="/loja/gerenciar" className="btn btn-ghost">✏️ Cadastrar recompensas</Link>} />

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : rewards.length === 0 ? (
        <EmptyState icon="🎁" title="A loja está vazia" text='Cadastrem recompensas como "Café no fim de semana" ou "Passeio no parque".'
          action={<Link href="/loja/gerenciar" className="btn btn-gold btn-lg">Cadastrar recompensa</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.map((r) => {
            const affordable = coins >= r.cost;
            const pct = Math.min(100, Math.round((coins / r.cost) * 100));
            return (
              <div key={r.id} className="card card-hover p-5 flex flex-col">
                <div className="h-28 -mx-5 -mt-5 mb-4 rounded-t-[14px] flex items-center justify-center text-6xl border-b-2 border-slate-100"
                  style={{ background: affordable ? 'linear-gradient(160deg,#fef3c7,#fde68a)' : 'linear-gradient(160deg,#f1f5f9,#e2e8f0)' }}>
                  <span className={affordable ? '' : 'grayscale opacity-60'}>{r.icon}</span>
                </div>
                <h3 className="font-game text-xl text-slate-900">{r.name}</h3>
                {r.description && <p className="text-sm font-semibold text-slate-500 mt-1">{r.description}</p>}
                <div className="mt-auto pt-4 space-y-3">
                  {!affordable && (
                    <div>
                      <div className="bar h-2.5"><div className="bar-fill bg-amber-400" style={{ width: `${pct}%` }} /></div>
                      <div className="text-xs font-bold text-slate-400 mt-1">Faltam {formatNumber(r.cost - coins)} moedas</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <CoinAmount value={r.cost} size={22} className="text-2xl text-amber-600" />
                    {affordable ? (
                      <button onClick={() => setConfirming(r)} className="btn btn-gold">Resgatar</button>
                    ) : (
                      <span className="chip bg-slate-100 border-slate-200 text-slate-500 py-1.5 px-3">🔒 Bloqueado</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !buying && setConfirming(null)}>
          <div className="card p-7 max-w-sm w-full text-center animate-[pop_300ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="text-6xl mb-2">{confirming.icon}</div>
            <h3 className="font-game text-2xl text-slate-900 mb-3">Resgatar &quot;{confirming.name}&quot;?</h3>
            <div className="flex items-center justify-center gap-3 mb-6 font-bold text-slate-500">
              <CoinAmount value={coins} className="text-slate-700 text-lg" /> → <CoinAmount value={coins - confirming.cost} className="text-amber-600 text-lg" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} disabled={buying} className="btn btn-ghost flex-1">Cancelar</button>
              <button onClick={() => buy(confirming)} disabled={buying} className="btn btn-gold flex-1">
                <Coin size={16} /> {buying ? 'Resgatando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
