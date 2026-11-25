interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'violet' | 'emerald' | 'amber' | 'sky';
}

const COLORS = {
  violet: 'text-violet-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  sky: 'text-sky-600',
};

export default function StatCard({ title, value, icon, color = 'violet' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`font-game text-3xl ${COLORS[color]}`}>{value}</div>
    </div>
  );
}
