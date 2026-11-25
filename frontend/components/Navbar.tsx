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

  const walletChip = wallet && (
    <Link href="/historico" className="flex items-center gap-2 shrink-0" title={`${wallet.xp_to_next_level} XP para o nível ${wallet.level + 1}`}>
      <LevelBadge level={wallet.level} size={28} />
      <span className="px-3 py-1 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-700">
        <CoinAmount value={wallet.coins} size={16} />
      </span>
    </Link>
  );

  return (
    <>
      {/* Topo: pílula flutuante */}
      <header className="sticky top-0 sm:top-3 z-40 px-0 sm:px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 py-2.5 bg-white/80 backdrop-blur-lg border-b-2 sm:border-2 border-slate-200 sm:rounded-2xl sm:shadow-[0_8px_30px_-12px_rgba(76,29,149,0.25)]">
          <Link href="/" className="font-game text-2xl text-violet-700 whitespace-nowrap">🏆 Conquista</Link>
          <nav className="hidden sm:flex flex-1 justify-center gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-full text-sm font-extrabold transition-colors ${
                  isActive(l.href) ? 'bg-violet-600 text-white shadow-[0_3px_0_#5b21b6]' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto sm:ml-0">{walletChip}</div>
        </div>
      </header>

      {/* Celular: barra de abas inferior */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2 bg-white/90 backdrop-blur-lg border-t-2 border-slate-200"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-4 gap-1">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link key={l.href} href={l.href} className="flex flex-col items-center gap-0.5 py-1">
                <span className={`w-12 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${active ? 'bg-violet-100' : ''}`}>{l.icon}</span>
                <span className={`text-[11px] font-extrabold ${active ? 'text-violet-700' : 'text-slate-400'}`}>{l.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
