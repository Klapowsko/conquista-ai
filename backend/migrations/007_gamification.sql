-- Gamificação: OKRs viram Objetivos (goals), Key Results viram Metas (milestones),
-- e entram a loja de recompensas (rewards) e a carteira do casal (wallet_transactions).
-- Os dados existentes são preservados (apenas renomeados).

-- Objetivos
ALTER TABLE okrs RENAME TO goals;
ALTER SEQUENCE okrs_id_seq RENAME TO goals_id_seq;
ALTER INDEX okrs_pkey RENAME TO goals_pkey;
ALTER INDEX idx_okrs_category_id RENAME TO idx_goals_category_id;
ALTER TABLE goals RENAME COLUMN objective TO title;
ALTER TABLE goals RENAME COLUMN completion_date TO target_date;
COMMENT ON COLUMN goals.target_date IS 'Prazo do objetivo (opcional).';
ALTER TABLE goals ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE goals ADD COLUMN difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard'));
ALTER TABLE goals ADD COLUMN completed_at TIMESTAMP NULL;

-- Metas
ALTER TABLE key_results RENAME TO milestones;
ALTER SEQUENCE key_results_id_seq RENAME TO milestones_id_seq;
ALTER INDEX key_results_pkey RENAME TO milestones_pkey;
ALTER INDEX idx_key_results_okr_id RENAME TO idx_milestones_goal_id;
ALTER TABLE milestones RENAME COLUMN okr_id TO goal_id;
ALTER TABLE milestones RENAME COLUMN expected_completion_date TO due_date;
ALTER TABLE milestones ADD COLUMN completed_at TIMESTAMP NULL;
UPDATE milestones SET completed_at = updated_at WHERE completed = TRUE;

-- Loja de recompensas
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon VARCHAR(16) NOT NULL DEFAULT '🎁',
    cost INTEGER NOT NULL CHECK (cost > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carteira do casal: livro-razão de moedas e XP.
-- Saldo = SUM(coins); XP total = SUM(xp). Nunca se edita uma linha, só se acrescenta.
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(32) NOT NULL CHECK (type IN (
        'milestone_completed', 'milestone_reopened',
        'goal_completed', 'goal_reopened',
        'reward_purchased'
    )),
    coins INTEGER NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    goal_id INTEGER NULL REFERENCES goals(id) ON DELETE SET NULL,
    milestone_id INTEGER NULL REFERENCES milestones(id) ON DELETE SET NULL,
    reward_id INTEGER NULL REFERENCES rewards(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_milestone_id ON wallet_transactions(milestone_id);
CREATE INDEX idx_wallet_transactions_goal_id ON wallet_transactions(goal_id);
