'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OKR, Category, KeyResult } from '@/types';
import { okrsAPI, categoriesAPI, keyResultsAPI } from '@/lib/api';
import OKRCard from './OKRCard';
import StatCard from './StatCard';
import CategoryTooltip from './CategoryTooltip';
import { calculateOKRProgress } from '@/lib/utils';

export default function Dashboard() {
  const router = useRouter();
  const [okrs, setOKRs] = useState<OKR[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyResultsMap, setKeyResultsMap] = useState<Record<number, KeyResult[]>>({});

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
      
      // Carregar Key Results para cada OKR
      const keyResultsPromises = okrsData.map(async (okr) => {
        try {
          const keyResults = await keyResultsAPI.getByOKRId(okr.id);
          return { okrId: okr.id, keyResults };
        } catch (error) {
          console.error(`Erro ao carregar Key Results do OKR ${okr.id}:`, error);
          return { okrId: okr.id, keyResults: [] };
        }
      });
      
      const keyResultsData = await Promise.all(keyResultsPromises);
      const map: Record<number, KeyResult[]> = {};
      keyResultsData.forEach(({ okrId, keyResults }) => {
        map[okrId] = keyResults;
      });
      setKeyResultsMap(map);
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
      
      // Carregar Key Results para os novos OKRs
      const keyResultsPromises = data.map(async (okr) => {
        try {
          const keyResults = await keyResultsAPI.getByOKRId(okr.id);
          return { okrId: okr.id, keyResults };
        } catch (error) {
          return { okrId: okr.id, keyResults: [] };
        }
      });
      
      const keyResultsData = await Promise.all(keyResultsPromises);
      const map: Record<number, KeyResult[]> = {};
      keyResultsData.forEach(({ okrId, keyResults }) => {
        map[okrId] = keyResults;
      });
      setKeyResultsMap(map);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  const totalOKRs = okrs.length;
  const completedOKRs = okrs.filter((okr) => {
    const keyResults = keyResultsMap[okr.id] || [];
    return calculateOKRProgress(keyResults) === 100;
  }).length;
  
  const inProgressOKRs = okrs.filter((okr) => {
    const keyResults = keyResultsMap[okr.id] || [];
    const progress = calculateOKRProgress(keyResults);
    return progress > 0 && progress < 100;
  }).length;
  
  const averageProgress = okrs.length > 0
    ? Math.round(
        okrs.reduce((sum, okr) => {
          const keyResults = keyResultsMap[okr.id] || [];
          return sum + calculateOKRProgress(keyResults);
        }, 0) / okrs.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Acompanhe seu progresso e objetivos</p>
          </div>
          <button
            onClick={() => router.push('/okrs/new')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
          >
            + Criar Novo OKR
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de OKRs"
            value={totalOKRs}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Completos"
            value={completedOKRs}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Em Progresso"
            value={inProgressOKRs}
            color="amber"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Progresso Médio"
            value={`${averageProgress}%`}
            color="purple"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Filtros por Categoria</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <CategoryTooltip key={category.id} categoryName={category.name} position="bottom">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all cursor-help ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              </CategoryTooltip>
            ))}
          </div>
        </div>

        {/* Lista de OKRs */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Seus OKRs</h2>
          {okrs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2 text-lg font-medium">Nenhum OKR encontrado</p>
                <p className="text-gray-500 mb-6">Comece criando seu primeiro objetivo e acompanhe seu progresso</p>
                <button
                  onClick={() => router.push('/okrs/new')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  Criar Primeiro OKR
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {okrs.map((okr) => {
                const keyResults = keyResultsMap[okr.id] || [];
                const progress = calculateOKRProgress(keyResults);
                return (
                  <OKRCard
                    key={okr.id}
                    okr={okr}
                    onDelete={handleDeleteOKR}
                    progress={progress}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

