import { getAllFixedCategories } from '@/lib/categories';
import { PageTitle } from '@/components/ui';

const STYLE = [
  { icon: '🧘', color: 'text-sky-700', border: 'border-sky-300', shadow: '#bae6fd', bg: 'bg-sky-50' },
  { icon: '💼', color: 'text-emerald-700', border: 'border-emerald-300', shadow: '#a7f3d0', bg: 'bg-emerald-50' },
  { icon: '💞', color: 'text-rose-700', border: 'border-rose-300', shadow: '#fecdd3', bg: 'bg-rose-50' },
];

export default function CategoriesPage() {
  return (
    <div>
      <PageTitle title="Categorias" subtitle="Os três pilares da vida do casal." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {getAllFixedCategories().map((c, i) => {
          const s = STYLE[i % STYLE.length];
          return (
            <div key={c.name} className={`rounded-3xl border-2 p-6 ${s.bg} ${s.border}`} style={{ boxShadow: `0 5px 0 ${s.shadow}` }}>
              <div className="text-5xl mb-3">{s.icon}</div>
              <h2 className={`font-game text-3xl ${s.color}`}>{c.name}</h2>
              {c.description && <p className="font-semibold text-slate-600 mt-1 mb-4">{c.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {c.subcategories.map((sub) => (
                  <span key={sub} className="chip bg-white border-slate-200 text-slate-600">{sub}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
