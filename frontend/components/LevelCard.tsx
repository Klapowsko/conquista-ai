'use client';

import Link from 'next/link';
import { useGame } from './GameProvider';
import { Coin, LevelBadge } from './ui';
import { formatNumber } from '@/lib/utils';

export default function LevelCard() {
  const { wallet } = useGame();
  if (!wallet) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="md:col-span-2 relative overflow-hidden rounded-3xl p-6 text-white border-2 border-violet-800"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%)', boxShadow: '0 6px 0 #4c1d95' }}>
        <div aria-hidden className="absolute -right-6 -top-6 text-[9rem] leading-none opacity-10 select-none">⭐</div>
        <div className="relative flex items-center gap-5">
          <LevelBadge level={wallet.level} size={76} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-200">Nível do casal</div>
            <div className="font-game text-4xl leading-tight">Nível {wallet.level}</div>
            <div className="text-sm font-bold text-violet-100">{formatNumber(wallet.total_xp)} XP no total</div>
          </div>
        </div>
        <div className="relative mt-5">
          <div className="bar h-5 bg-violet-950/40">
            <div className="bar-fill bg-gradient-to-r from-amber-300 to-yellow-200"
              style={{ width: `${wallet.progress_percent}%`, minWidth: wallet.progress_percent > 0 ? '1.25rem' : 0 }} />
          </div>
          <div className="flex justify-between mt-2 text-sm font-bold text-violet-100">
            <span>{formatNumber(wallet.xp_into_level)} / {formatNumber(wallet.xp_for_next_level)} XP</span>
            <span>Faltam {formatNumber(wallet.xp_to_next_level)} para o nível {wallet.level + 1}</span>
          </div>
        </div>
      </div>

      <Link href="/loja" className="group relative overflow-hidden rounded-3xl p-6 border-2 border-amber-500 text-amber-950 flex flex-col justify-between transition-transform hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(160deg, #fde68a 0%, #fbbf24 55%, #f59e0b 100%)', boxShadow: '0 6px 0 #b45309' }}>
        <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-800">Tesouro</div>
        <div className="flex items-center gap-3 my-3">
          <Coin size={44} />
          <span className="font-game text-5xl">{formatNumber(wallet.coins)}</span>
        </div>
        <div className="text-sm font-extrabold uppercase tracking-wide">Gastar na loja <span className="inline-block transition-transform group-hover:translate-x-1">→</span></div>
      </Link>
    </div>
  );
}
