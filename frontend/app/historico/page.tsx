'use client';

import { useCallback, useEffect, useState } from 'react';
import { TransactionType, WalletTransaction } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import StatCard from '@/components/StatCard';
import { formatDateTime, formatNumber } from '@/lib/utils';

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Histórico da carteira</h1>

      {wallet && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Saldo" value={`🪙 ${formatNumber(wallet.coins)}`} color="amber" />
          <StatCard title="Total ganho" value={`🪙 ${formatNumber(wallet.total_earned)}`} color="green" />
          <StatCard title="Gasto na loja" value={`🪙 ${formatNumber(wallet.total_spent)}`} color="blue" />
          <StatCard title="Nível" value={`⭐ ${wallet.level}`} color="purple" />
        </div>
      )}

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          Nada por aqui ainda. Concluam a primeira meta para ganhar moedas!
        </div>
      ) : (
        <ul className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {items.map((t) => (
            <li key={t.id} className="p-4 flex items-center gap-4">
              <span className="text-2xl">{ICON[t.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{t.description}</div>
                <div className="text-xs text-gray-500">{formatDateTime(t.created_at)}</div>
              </div>
              <div className="text-right whitespace-nowrap">
                <div className={`font-semibold ${t.coins >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.coins >= 0 ? '+' : ''}{formatNumber(t.coins)} 🪙
                </div>
                {t.xp !== 0 && <div className="text-xs text-violet-600">{t.xp > 0 ? '+' : ''}{t.xp} XP</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
