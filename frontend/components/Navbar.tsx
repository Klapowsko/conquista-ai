'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from './GameProvider';
import { formatNumber } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Objetivos' },
  { href: '/metas', label: 'Metas' },
  { href: '/loja', label: 'Loja' },
  { href: '/historico', label: 'Histórico' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { wallet } = useGame();

  const isActive = (href: string) => (href === '/' ? pathname === '/' || pathname.startsWith('/objetivos') : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 sm:h-16 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link href="/" className="font-bold text-lg text-gray-900 whitespace-nowrap">
          🏆 Conquista
        </Link>
        <nav className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 flex gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive(l.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {wallet && (
          <Link href="/historico" className="order-2 sm:order-3 ml-auto flex items-center gap-2 shrink-0" title={`${wallet.xp_to_next_level} XP para o próximo nível`}>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
              ⭐ <span className="hidden sm:inline">Nível</span> {wallet.level}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              🪙 {formatNumber(wallet.coins)}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
