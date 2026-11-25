'use client';

import { useCallback, useEffect, useState } from 'react';
import { TransactionType, WalletTransaction } from '@/types';
import { errorMessage, shopAPI } from '@/lib/api';
import { useGame } from '@/components/GameProvider';
import Loading, { ErrorBox } from '@/components/Loading';
import { CoinAmount, EmptyState, LevelBadge, XP } from '@/components/ui';
import { formatNumber } from '@/lib/utils';

const ICON: Record<TransactionType, { icon: string; bg: string }> = {
  milestone_completed: { icon: '✅', bg: 'bg-emerald-100 border-emerald-300' },
  milestone_reopened: { icon: '↩️', bg: 'bg-slate-100 border-slate-300' },
  goal_completed: { icon: '🏆', bg: 'bg-amber-100 border-amber-300' },
  goal_reopened: { icon: '↩️', bg: 'bg-slate-100 border-slate-300' },
  reward_purchased: { icon: '🛍️', bg: 'bg-violet-100 border-violet-300' },
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

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

  const days: { label: string; items: WalletTransaction[] }[] = [];
  for (const t of items) {
    const label = dayLabel(t.created_at);
    if (days[days.length - 1]?.label === label) days[days.length - 1].items.push(t);
    else days.push({ label, items: [t] });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-game text-4xl text-slate-900 mb-4">Histórico</h1>

      {wallet && (
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="chip bg-white border-slate-200 text-slate-600 text-sm py-1.5 px-3"><LevelBadge level={wallet.level} size={20} /> Nível {wallet.level} · {formatNumber(wallet.total_xp)} XP</span>
          <span className="chip bg-amber-50 border-amber-300 text-amber-700 text-sm py-1.5 px-3">Saldo <CoinAmount value={wallet.coins} size={15} /></span>
          <span className="chip bg-emerald-50 border-emerald-300 text-emerald-700 text-sm py-1.5 px-3">Ganho <CoinAmount value={wallet.total_earned} size={15} /></span>
          <span className="chip bg-violet-50 border-violet-300 text-violet-700 text-sm py-1.5 px-3">Gasto <CoinAmount value={wallet.total_spent} size={15} /></span>
        </div>
      )}

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={load} /> : items.length === 0 ? (
        <EmptyState icon="📜" title="Nada por aqui ainda" text="Concluam a primeira meta para ganhar as primeiras moedas!" />
      ) : (
        <div className="space-y-8">
          {days.map((day) => (
            <section key={day.label}>
              <h2 className="font-game text-lg text-slate-500 capitalize mb-3">{day.label}</h2>
              <ol className="relative ml-5 border-l-4 border-slate-200 space-y-3">
                {day.items.map((t) => (
                  <li key={t.id} className="relative pl-8">
                    <span className={`absolute -left-[1.4rem] top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${ICON[t.type].bg}`}>{ICON[t.type].icon}</span>
                    <div className="card px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800">{t.description}</div>
                        <div className="text-xs font-semibold text-slate-400">
                          {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <CoinAmount value={t.coins} sign className={`text-lg ${t.coins >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
                        {t.xp !== 0 && <div><XP value={t.xp} className="text-xs" /></div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
