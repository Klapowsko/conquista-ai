'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { okrsAPI, categoriesAPI } from '@/lib/api';
import CategoryTooltip from '@/components/CategoryTooltip';

export default function NewOKRPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [objective, setObjective] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  
  // Calcular data padrão: 3 meses a partir de hoje
  const getDefaultCompletionDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };
  
  const [completionDate, setCompletionDate] = useState<string>(getDefaultCompletionDate());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective || !categoryId) {
      alert('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const okr = await okrsAPI.create({
        objective,
        category_id: categoryId as number,
        completion_date: completionDate,
      });
      router.push(`/okrs/${okr.id}`);
    } catch (error) {
      console.error('Erro ao criar OKR:', error);
      alert('Erro ao criar OKR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Criar Novo OKR</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo
              </label>
              <input
                type="text"
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Aprender Golang"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                {categoryId && categories.find(c => c.id === categoryId) && (
                  <CategoryTooltip 
                    categoryName={categories.find(c => c.id === categoryId)!.name} 
                    position="right"
                  >
                    <span className="text-xs text-blue-600 cursor-help hover:text-blue-700">
                      ℹ️ Ver subcategorias
                    </span>
                  </CategoryTooltip>
                )}
              </div>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoryId && categories.find(c => c.id === categoryId) && (
                <p className="mt-2 text-xs text-gray-500">
                  Passe o mouse sobre o ícone ℹ️ para ver as subcategorias desta categoria
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Conclusão
              </label>
              <input
                type="date"
                id="completionDate"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                Data prevista para conclusão do OKR. Padrão: 3 meses a partir de hoje.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar OKR'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

