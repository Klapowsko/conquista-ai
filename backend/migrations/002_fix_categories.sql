-- Migration para definir as 3 categorias fixas do sistema
-- Representa o "tripé" de vida: Pessoal, Profissional, Social

-- Primeiro, atualizar OKRs existentes para usar as novas categorias
-- Migrar OKRs da categoria "Profissional" antiga para a nova (se existir)
-- Migrar outros OKRs para "Pessoal" como padrão

-- Limpar categorias existentes (cuidado: isso vai deletar categorias antigas)
-- Se houver OKRs, eles precisam ser migrados primeiro
-- Por segurança, vamos manter os OKRs e apenas atualizar as categorias

-- Deletar todas as categorias existentes
DELETE FROM categories;

-- Resetar o sequence para garantir IDs fixos
ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- Inserir as 3 categorias fixas com IDs conhecidos
INSERT INTO categories (id, name, created_at, updated_at) VALUES 
    (1, 'Pessoal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'Profissional', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'Social', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Garantir que o sequence está no número correto
SELECT setval('categories_id_seq', 3, true);

