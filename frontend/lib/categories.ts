export interface CategorySubcategories {
  name: string;
  subcategories: string[];
  description?: string;
}

export const FIXED_CATEGORIES: Record<string, CategorySubcategories> = {
  'Pessoal': {
    name: 'Pessoal',
    subcategories: ['Saúde', 'Mental', 'Espiritual'],
    description: 'Objetivos relacionados ao seu desenvolvimento pessoal e bem-estar',
  },
  'Profissional': {
    name: 'Profissional',
    subcategories: ['Material', 'Contribuição Social', 'Propósito'],
    description: 'Objetivos relacionados à sua carreira e impacto profissional',
  },
  'Social': {
    name: 'Social',
    subcategories: ['Familiar', 'Amizades', 'Relacionamento'],
    description: 'Objetivos relacionados aos seus relacionamentos e conexões sociais',
  },
};

export const CATEGORY_IDS: Record<string, number> = {
  'Pessoal': 1,
  'Profissional': 2,
  'Social': 3,
};

export const CATEGORY_NAMES: Record<number, string> = {
  1: 'Pessoal',
  2: 'Profissional',
  3: 'Social',
};

/**
 * Obtém as subcategorias de uma categoria
 */
export function getCategorySubcategories(categoryName: string): string[] {
  return FIXED_CATEGORIES[categoryName]?.subcategories || [];
}

/**
 * Obtém a descrição de uma categoria
 */
export function getCategoryDescription(categoryName: string): string | undefined {
  return FIXED_CATEGORIES[categoryName]?.description;
}

/**
 * Verifica se uma categoria é válida (fixa)
 */
export function isValidCategory(categoryName: string): boolean {
  return categoryName in FIXED_CATEGORIES;
}

/**
 * Obtém todas as categorias fixas
 */
export function getAllFixedCategories(): CategorySubcategories[] {
  return Object.values(FIXED_CATEGORIES);
}

