interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'auto' | 'violet' | 'gold';
  className?: string;
}

export default function ProgressBar({ progress, showLabel = true, size = 'md', tone = 'auto', className = '' }: ProgressBarProps) {
  const p = Math.min(100, Math.max(0, progress));
  const color =
    tone === 'violet' ? 'bg-violet-500' : tone === 'gold' ? 'bg-amber-400' : p === 100 ? 'bg-emerald-500' : 'bg-violet-500';
  const height = size === 'sm' ? 'h-3' : size === 'lg' ? 'h-5' : 'h-4';

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Progresso</span>
          <span className="font-game text-sm text-slate-700">{Math.round(p)}%</span>
        </div>
      )}
      <div className={`bar ${height}`} role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`bar-fill ${color}`} style={{ width: `${p}%`, minWidth: p > 0 ? '1rem' : 0 }} />
      </div>
    </div>
  );
}
