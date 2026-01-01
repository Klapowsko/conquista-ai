-- Adicionar coluna expected_completion_date à tabela key_results
ALTER TABLE key_results ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

