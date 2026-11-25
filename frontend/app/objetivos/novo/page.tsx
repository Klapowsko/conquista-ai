'use client';

import { useRouter } from 'next/navigation';
import GoalForm from '@/components/GoalForm';
import { goalsAPI } from '@/lib/api';

export default function NewGoalPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6 sm:p-8">
        <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-500 mb-1">Nova missão</div>
        <h1 className="font-game text-4xl text-slate-900 mb-1">Novo objetivo</h1>
        <p className="text-slate-500 font-semibold mb-6">Quanto mais difícil, mais moedas vocês ganham.</p>
        <GoalForm submitLabel="Criar objetivo" onCancel={() => router.back()}
          onSubmit={async (data) => {
            const goal = await goalsAPI.create(data);
            router.push(`/objetivos/${goal.id}`);
          }} />
      </div>
    </div>
  );
}
