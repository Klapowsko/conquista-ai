package repositories

import (
	"database/sql"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type GoalRepository struct {
	q Querier
}

func NewGoalRepository(q Querier) *GoalRepository {
	return &GoalRepository{q: q}
}

func (r *GoalRepository) WithTx(tx *sql.Tx) *GoalRepository {
	return &GoalRepository{q: tx}
}

const goalSelect = `
	SELECT g.id, g.title, g.description, g.category_id, g.difficulty, g.target_date,
	       g.completed_at, g.created_at, g.updated_at,
	       c.id, c.name, c.created_at, c.updated_at,
	       COUNT(m.id), COUNT(m.id) FILTER (WHERE m.completed)
	FROM goals g
	JOIN categories c ON c.id = g.category_id
	LEFT JOIN milestones m ON m.goal_id = g.id`

const goalGroupBy = ` GROUP BY g.id, c.id`

func scanGoal(row interface{ Scan(...any) error }) (*models.Goal, error) {
	var g models.Goal
	var c models.Category
	var target, completed sql.NullTime
	if err := row.Scan(&g.ID, &g.Title, &g.Description, &g.CategoryID, &g.Difficulty, &target,
		&completed, &g.CreatedAt, &g.UpdatedAt,
		&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt,
		&g.MilestonesTotal, &g.MilestonesCompleted); err != nil {
		return nil, err
	}
	g.TargetDate = dateString(target)
	g.CompletedAt = timePtr(completed)
	g.Category = &c
	g.FillRewards()
	return &g, nil
}

// List retorna os objetivos; categoryID 0 = todas. Em andamento primeiro.
func (r *GoalRepository) List(categoryID int64) ([]models.Goal, error) {
	query := goalSelect + ` WHERE ($1 = 0 OR g.category_id = $1)` + goalGroupBy +
		` ORDER BY g.completed_at IS NOT NULL, g.target_date ASC NULLS LAST, g.created_at DESC`
	rows, err := r.q.Query(query, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := make([]models.Goal, 0)
	for rows.Next() {
		g, err := scanGoal(rows)
		if err != nil {
			return nil, err
		}
		goals = append(goals, *g)
	}
	return goals, rows.Err()
}

func (r *GoalRepository) GetByID(id int64) (*models.Goal, error) {
	g, err := scanGoal(r.q.QueryRow(goalSelect+` WHERE g.id = $1`+goalGroupBy, id))
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return g, err
}

func (r *GoalRepository) Create(g *models.Goal) error {
	return r.q.QueryRow(`
		INSERT INTO goals (title, description, category_id, difficulty, target_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
		g.Title, g.Description, g.CategoryID, g.Difficulty, nullDate(g.TargetDate),
	).Scan(&g.ID)
}

func (r *GoalRepository) Update(g *models.Goal) error {
	_, err := r.q.Exec(`
		UPDATE goals SET title = $1, description = $2, category_id = $3, difficulty = $4,
		       target_date = $5, updated_at = NOW()
		WHERE id = $6`,
		g.Title, g.Description, g.CategoryID, g.Difficulty, nullDate(g.TargetDate), g.ID)
	return err
}

func (r *GoalRepository) Delete(id int64) (bool, error) {
	res, err := r.q.Exec(`DELETE FROM goals WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

// SetCompleted marca/desmarca o objetivo como concluído. Retorna false se ele
// já estava no estado pedido, o que evita pagar a recompensa duas vezes.
func (r *GoalRepository) SetCompleted(id int64, completed bool) (bool, error) {
	query := `UPDATE goals SET completed_at = NOW(), updated_at = NOW() WHERE id = $1 AND completed_at IS NULL`
	if !completed {
		query = `UPDATE goals SET completed_at = NULL, updated_at = NOW() WHERE id = $1 AND completed_at IS NOT NULL`
	}
	res, err := r.q.Exec(query, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}
