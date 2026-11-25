'use client';

import { useCallback, useEffect, useState } from 'react';
import { TransactionType, WalletTransaction } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import StatCard from '@/components/StatCard';
import { CoinAmount, EmptyState, LevelBadge, PageTitle, XP } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

const ICON: Record<TransactionType, string> = {
  milestone_completed: '✅',
  milestone_reopened: '↩️',
  goal_completed: '🏆',
  goal_reopened: '↩️',
  reward_purchased: '🛍️',
};

export default function HistoryPage() {
  const { wallet, refreshWallet } = useGame();
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list] = await Promise.all([shopAPI.history(200), refreshWallet()]);
      setItems(list);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [refreshWallet]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto">
      <PageTitle title="Histórico" subtitle="Tudo que o casal ganhou e gastou." />

      {wallet && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Saldo" value={<CoinAmount value={wallet.coins} size={26} />} color="amber" />
          <StatCard title="Total ganho" value={<CoinAmount value={wallet.total_earned} size={26} />} color="emerald" />
          <StatCard title="Gasto na loja" value={<CoinAmount value={wallet.total_spent} size={26} />} color="sky" />
          <StatCard title="Nível" value={<span className="flex items-center gap-2"><LevelBadge level={wallet.level} size={30} /> <span className="text-xl text-slate-400">{wallet.total_xp} XP</span></span>} color="violet" />
        </div>
      )}

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState icon="📜" title="Nada por aqui ainda" text="Concluam a primeira meta para ganhar as primeiras moedas!" />
      ) : (
        <ul className="card divide-y-2 divide-slate-100 overflow-hidden">
          {items.map((t) => (
            <li key={t.id} className="p-4 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">{ICON[t.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{t.description}</div>
                <div className="text-xs font-semibold text-slate-400">{formatDateTime(t.created_at)}</div>
              </div>
              <div className="text-right whitespace-nowrap">
                <CoinAmount value={t.coins} sign className={`text-lg ${t.coins >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
                {t.xp !== 0 && <div><XP value={t.xp} className="text-xs" /></div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
