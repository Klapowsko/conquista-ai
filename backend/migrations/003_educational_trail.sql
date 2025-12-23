-- Criar tabela de Educational Trails (trilhas educacionais)
CREATE TABLE IF NOT EXISTS educational_trails (
    id SERIAL PRIMARY KEY,
    roadmap_item_id INTEGER NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    total_days INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(roadmap_item_id)
);

-- Criar tabela de Trail Steps (etapas/dias da trilha)
CREATE TABLE IF NOT EXISTS educational_trail_steps (
    id SERIAL PRIMARY KEY,
    trail_id INTEGER NOT NULL REFERENCES educational_trails(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Trail Activities (atividades de cada etapa)
CREATE TABLE IF NOT EXISTS educational_trail_activities (
    id SERIAL PRIMARY KEY,
    step_id INTEGER NOT NULL REFERENCES educational_trail_steps(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'read_book', 'read_chapters', 'watch_video', etc
    resource_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    url TEXT,
    progress VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Trail Activity Chapters (capítulos para atividades de leitura)
CREATE TABLE IF NOT EXISTS educational_trail_activity_chapters (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES educational_trail_activities(id) ON DELETE CASCADE,
    chapter_title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de Trail Resources (recursos referenciados na trilha)
CREATE TABLE IF NOT EXISTS educational_trail_resources (
    id SERIAL PRIMARY KEY,
    trail_id INTEGER NOT NULL REFERENCES educational_trails(id) ON DELETE CASCADE,
    resource_id VARCHAR(255) NOT NULL, -- ID único do recurso na trilha
    title TEXT NOT NULL,
    description TEXT,
    author VARCHAR(255),
    duration VARCHAR(100),
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trail_id, resource_id)
);

-- Criar tabela de Trail Resource Chapters (capítulos de recursos)
CREATE TABLE IF NOT EXISTS educational_trail_resource_chapters (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES educational_trail_resources(id) ON DELETE CASCADE,
    chapter_title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_educational_trails_roadmap_item_id ON educational_trails(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_educational_trail_steps_trail_id ON educational_trail_steps(trail_id);
CREATE INDEX IF NOT EXISTS idx_educational_trail_activities_step_id ON educational_trail_activities(step_id);
CREATE INDEX IF NOT EXISTS idx_educational_trail_activity_chapters_activity_id ON educational_trail_activity_chapters(activity_id);
CREATE INDEX IF NOT EXISTS idx_educational_trail_resources_trail_id ON educational_trail_resources(trail_id);
CREATE INDEX IF NOT EXISTS idx_educational_trail_resource_chapters_resource_id ON educational_trail_resource_chapters(resource_id);

