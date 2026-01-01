-- Adicionar coluna completion_date na tabela okrs
ALTER TABLE okrs ADD COLUMN IF NOT EXISTS completion_date DATE;

-- Comentário explicativo
COMMENT ON COLUMN okrs.completion_date IS 'Data de conclusão prevista para o OKR. Se não especificada, padrão é 3 meses a partir da criação.';

