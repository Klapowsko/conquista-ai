-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de OKRs
CREATE TABLE IF NOT EXISTS okrs (
    id SERIAL PRIMARY KEY,
    objective TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Key Results
CREATE TABLE IF NOT EXISTS key_results (
    id SERIAL PRIMARY KEY,
    okr_id INTEGER NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
    id SERIAL PRIMARY KEY,
    key_result_id INTEGER NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Roadmap Categories
CREATE TABLE IF NOT EXISTS roadmap_categories (
    id SERIAL PRIMARY KEY,
    roadmap_id INTEGER NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Roadmap Items
CREATE TABLE IF NOT EXISTS roadmap_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES roadmap_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_okrs_category_id ON okrs(category_id);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_key_result_id ON roadmaps(key_result_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_categories_roadmap_id ON roadmap_categories(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category_id ON roadmap_items(category_id);

-- Inserir categorias padrão
INSERT INTO categories (name) VALUES 
    ('Profissional'),
    ('Espiritual'),
    ('Saúde'),
    ('Família')
ON CONFLICT (name) DO NOTHING;

