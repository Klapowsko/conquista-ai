-- Criar tabela de Educational Roadmaps
CREATE TABLE IF NOT EXISTS educational_roadmaps (
    id SERIAL PRIMARY KEY,
    roadmap_item_id INTEGER NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Educational Resources (livros, cursos, vídeos, artigos, projetos)
CREATE TABLE IF NOT EXISTS educational_resources (
    id SERIAL PRIMARY KEY,
    educational_roadmap_id INTEGER NOT NULL REFERENCES educational_roadmaps(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'book', 'course', 'video', 'article', 'project'
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    author VARCHAR(255),
    duration VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Chapters (capítulos de livros)
CREATE TABLE IF NOT EXISTS educational_resource_chapters (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    chapter_title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_educational_roadmaps_roadmap_item_id ON educational_roadmaps(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_educational_resources_roadmap_id ON educational_resources(educational_roadmap_id);
CREATE INDEX IF NOT EXISTS idx_educational_resources_type ON educational_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_educational_resource_chapters_resource_id ON educational_resource_chapters(resource_id);

