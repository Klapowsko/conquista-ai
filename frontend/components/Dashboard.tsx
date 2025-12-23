'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OKR, Category } from '@/types';
import { okrsAPI, categoriesAPI } from '@/lib/api';
import OKRCard from './OKRCard';

export default function Dashboard() {
  const router = useRouter();
  const [okrs, setOKRs] = useState<OKR[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOKRs();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [okrsData, categoriesData] = await Promise.all([
        okrsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setOKRs(okrsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOKRs = async () => {
    try {
      const data = selectedCategory
        ? await okrsAPI.getAll(selectedCategory)
        : await okrsAPI.getAll();
      setOKRs(data);
    } catch (error) {
      console.error('Erro ao carregar OKRs:', error);
    }
  };

  const handleDeleteOKR = async (id: number) => {
    try {
      await okrsAPI.delete(id);
      setOKRs(okrs.filter((okr) => okr.id !== id));
    } catch (error) {
      console.error('Erro ao deletar OKR:', error);
      alert('Erro ao deletar OKR');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  const totalOKRs = okrs.length;
  const completedOKRs = okrs.filter((okr) => {
    // Lógica simplificada - em produção seria mais complexa
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard - Conquista AI</h1>
          <button
            onClick={() => router.push('/okrs/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Criar Novo OKR
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total de OKRs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalOKRs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Categorias</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Em Progresso</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalOKRs - completedOKRs}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de OKRs */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">OKRs</h2>
          {okrs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">Nenhum OKR encontrado</p>
              <button
                onClick={() => router.push('/okrs/new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeiro OKR
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {okrs.map((okr) => (
                <OKRCard
                  key={okr.id}
                  okr={okr}
                  onDelete={handleDeleteOKR}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

