'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from './GameProvider';
import { CoinAmount, LevelBadge } from './ui';

const LINKS = [
  { href: '/', label: 'Objetivos', icon: '🎯' },
  { href: '/metas', label: 'Metas', icon: '✅' },
  { href: '/loja', label: 'Loja', icon: '🛍️' },
  { href: '/historico', label: 'Histórico', icon: '📜' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { wallet } = useGame();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/objetivos') : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b-2 border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:h-16 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link href="/" className="font-game text-2xl text-violet-700 whitespace-nowrap">
          🏆 Conquista
        </Link>
        <nav className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 flex gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide whitespace-nowrap border-2 transition-colors ${
                isActive(l.href) ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-transparent text-slate-500 hover:bg-slate-100'
              }`}>
              <span className="mr-1">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        {wallet && (
          <Link href="/historico" className="order-2 sm:order-3 ml-auto flex items-center gap-3 shrink-0"
            title={`${wallet.xp_to_next_level} XP para o nível ${wallet.level + 1}`}>
            <span className="flex items-center gap-2">
              <LevelBadge level={wallet.level} size={30} />
              <span className="hidden md:block w-20">
                <span className="block bar h-2.5">
                  <span className="bar-fill bg-violet-500" style={{ width: `${wallet.progress_percent}%` }} />
                </span>
              </span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-700 text-lg">
              <CoinAmount value={wallet.coins} />
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
