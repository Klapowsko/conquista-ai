import { Difficulty } from '@/types';
import { formatNumber } from '@/lib/utils';

/** Moeda desenhada em CSS (o emoji 🪙 varia muito entre sistemas). */
export function Coin({ size = 18 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full shrink-0 font-game text-amber-800"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: 'radial-gradient(circle at 35% 30%, #fef3c7, #fbbf24 45%, #d97706)',
        boxShadow: `inset 0 -${Math.max(1, size / 10)}px 0 #b45309, 0 0 0 ${Math.max(1, size / 14)}px #92400e33`,
      }}
    >
      $
    </span>
  );
}

export function CoinAmount({ value, size = 18, className = '', sign = false }: { value: number; size?: number; className?: string; sign?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-game ${className}`}>
      <Coin size={size} />
      {sign && value > 0 ? '+' : ''}
      {formatNumber(value)}
    </span>
  );
}

export function XP({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-game text-violet-600 ${className}`}>
      <span aria-hidden>⚡</span>
      {value > 0 ? '+' : ''}
      {formatNumber(value)} XP
    </span>
  );
}

/** Escudo hexagonal com o número do nível. */
export function LevelBadge({ level, size = 44 }: { level: number; size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size * 1.1 }} aria-label={`Nível ${level}`}>
      <svg viewBox="0 0 40 44" className="absolute inset-0 w-full h-full drop-shadow-[0_3px_0_rgba(76,29,149,0.45)]">
        <defs>
          <linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <path d="M20 1 L38 11 V33 L20 43 L2 33 V11 Z" fill="url(#lvl)" stroke="#4c1d95" strokeWidth="2" />
        <path d="M20 6 L33 13.5 V30.5 L20 38 L7 30.5 V13.5 Z" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      </svg>
      <span className="relative font-game text-white" style={{ fontSize: size * 0.42, textShadow: '0 2px 0 #4c1d95' }}>
        {level}
      </span>
    </span>
  );
}

const STARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

export function Stars({ difficulty, className = '' }: { difficulty: Difficulty; className?: string }) {
  const n = STARS[difficulty];
  return (
    <span className={`inline-flex ${className}`} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'text-amber-400' : 'text-slate-300'}>★</span>
      ))}
    </span>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-game text-4xl text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 font-semibold mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-6xl mb-3 animate-[pop_500ms_ease-out]">{icon}</div>
      <p className="font-game text-2xl text-slate-800 mb-1">{title}</p>
      <p className="text-slate-500 font-semibold mb-6 max-w-md mx-auto">{text}</p>
      {action}
    </div>
  );
}

/** Botão redondo de marcar meta. */
export function CheckButton({ checked, onClick, disabled }: { checked: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={checked ? 'Reabrir meta' : 'Concluir meta'}
      className={`w-9 h-9 shrink-0 rounded-xl border-2 border-b-4 flex items-center justify-center text-lg font-black transition-all active:translate-y-[2px] active:border-b-2 disabled:opacity-50 ${
        checked
          ? 'bg-emerald-500 border-emerald-700 text-white'
          : 'bg-white border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-400'
      }`}
    >
      ✓
    </button>
  );
}
