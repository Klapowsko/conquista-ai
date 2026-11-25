'use client';

import Link from 'next/link';
import { useGame } from './GameProvider';
import { formatNumber } from '@/lib/utils';

export default function LevelCard() {
  const { wallet } = useGame();
  if (!wallet) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="md:col-span-2 rounded-2xl p-6 text-white bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm uppercase tracking-wide opacity-80">Nível do casal</div>
            <div className="text-4xl font-bold">⭐ {wallet.level}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">XP total</div>
            <div className="text-2xl font-semibold">{formatNumber(wallet.total_xp)}</div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${wallet.progress_percent}%` }} />
        </div>
        <div className="mt-2 text-sm opacity-90">
          {formatNumber(wallet.xp_into_level)} / {formatNumber(wallet.xp_for_next_level)} XP · faltam{' '}
          {formatNumber(wallet.xp_to_next_level)} para o nível {wallet.level + 1}
        </div>
      </div>
      <Link
        href="/loja"
        className="rounded-2xl p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg flex flex-col justify-between"
      >
        <div className="text-sm uppercase tracking-wide opacity-90">Moedas para gastar</div>
        <div className="text-4xl font-bold my-2">🪙 {formatNumber(wallet.coins)}</div>
        <div className="text-sm opacity-90">Ir para a loja de recompensas →</div>
      </Link>
    </div>
  );
}
