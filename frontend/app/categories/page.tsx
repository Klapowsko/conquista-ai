'use client';

import { useEffect, useState } from 'react';
import { Category } from '@/types';
import { categoriesAPI } from '@/lib/api';
import CategoryTooltip from '@/components/CategoryTooltip';
import { getAllFixedCategories } from '@/lib/categories';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      // Filtrar apenas as categorias fixas
      const fixedCategories = getAllFixedCategories();
      const fixedNames = fixedCategories.map(c => c.name);
      const filtered = data.filter(cat => fixedNames.includes(cat.name));
      setCategories(filtered);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
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

  const fixedCategories = getAllFixedCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Categorias</h1>
          <p className="text-gray-600 text-lg">Os três pilares da sua vida</p>
        </div>

        {/* Layout em Tripé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {fixedCategories.map((categoryData, index) => {
            const category = categories.find(c => c.name === categoryData.name);
            if (!category) return null;

            const colors = [
              { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100' },
              { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'bg-green-100' },
              { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100' },
            ];
            const color = colors[index % colors.length];

            return (
              <CategoryTooltip key={category.id} categoryName={category.name} position="top">
                <div className={`${color.bg} ${color.border} border-2 rounded-xl p-8 hover:shadow-lg transition-all cursor-help h-full`}>
                  <div className="text-center">
                    <div className={`${color.icon} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-2xl font-bold">{category.name.charAt(0)}</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${color.text} mb-2`}>{category.name}</h3>
                    {categoryData.description && (
                      <p className="text-sm text-gray-600 mb-4">{categoryData.description}</p>
                    )}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Passe o mouse para ver subcategorias</p>
                    </div>
                  </div>
                </div>
              </CategoryTooltip>
            );
          })}
        </div>

        {/* Informação adicional */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-600">
            <span className="font-semibold">Nota:</span> As categorias são fixas e representam os três pilares fundamentais.
            Passe o mouse sobre cada categoria para ver suas subcategorias.
          </p>
        </div>
      </div>
    </div>
  );
}

