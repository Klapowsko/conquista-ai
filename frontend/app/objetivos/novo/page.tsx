'use client';

import { useRouter } from 'next/navigation';
import GoalForm from '@/components/GoalForm';
import { goalsAPI } from '@/lib/api';

export default function NewGoalPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Novo objetivo</h1>
        <p className="text-gray-600 mb-6">Quanto mais difícil, mais moedas vocês ganham ao concluir.</p>
        <GoalForm
          submitLabel="Criar objetivo"
          onCancel={() => router.back()}
          onSubmit={async (data) => {
            const goal = await goalsAPI.create(data);
            router.push(`/objetivos/${goal.id}`);
          }}
        />
      </div>
    </div>
  );
}
