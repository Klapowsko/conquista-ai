package repositories

import (
	"database/sql"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
)

type MilestoneRepository struct {
	q Querier
}

func NewMilestoneRepository(q Querier) *MilestoneRepository {
	return &MilestoneRepository{q: q}
}

func (r *MilestoneRepository) WithTx(tx *sql.Tx) *MilestoneRepository {
	return &MilestoneRepository{q: tx}
}

const milestoneColumns = `m.id, m.goal_id, m.title, m.completed, m.due_date, m.completed_at, m.created_at, m.updated_at`

func scanMilestone(row interface{ Scan(...any) error }, extra ...any) (*models.Milestone, error) {
	var m models.Milestone
	var due, completed sql.NullTime
	dest := append([]any{&m.ID, &m.GoalID, &m.Title, &m.Completed, &due, &completed, &m.CreatedAt, &m.UpdatedAt}, extra...)
	if err := row.Scan(dest...); err != nil {
		return nil, err
	}
	m.DueDate = dateString(due)
	m.CompletedAt = timePtr(completed)
	return &m, nil
}

func (r *MilestoneRepository) ListByGoal(goalID int64) ([]models.Milestone, error) {
	rows, err := r.q.Query(`SELECT `+milestoneColumns+` FROM milestones m
		WHERE m.goal_id = $1 ORDER BY m.due_date ASC NULLS LAST, m.created_at ASC`, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Milestone, 0)
	for rows.Next() {
		m, err := scanMilestone(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *m)
	}
	return list, rows.Err()
}

// ListAll retorna todas as metas com dados do objetivo, por prazo.
func (r *MilestoneRepository) ListAll() ([]models.MilestoneWithGoal, error) {
	rows, err := r.q.Query(`SELECT ` + milestoneColumns + `,
		       g.title, g.difficulty, g.target_date, g.completed_at
		FROM milestones m
		JOIN goals g ON g.id = m.goal_id
		ORDER BY m.completed, COALESCE(m.due_date, g.target_date) ASC NULLS LAST, m.created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.MilestoneWithGoal, 0)
	for rows.Next() {
		var mg models.MilestoneWithGoal
		var goalTarget, goalCompleted sql.NullTime
		m, err := scanMilestone(rows, &mg.GoalTitle, &mg.GoalDifficulty, &goalTarget, &goalCompleted)
		if err != nil {
			return nil, err
		}
		mg.Milestone = *m
		mg.GoalTargetDate = dateString(goalTarget)
		mg.GoalCompletedAt = timePtr(goalCompleted)
		mg.Reward = gamification.MilestoneReward(mg.GoalDifficulty)
		list = append(list, mg)
	}
	return list, rows.Err()
}

func (r *MilestoneRepository) GetByID(id int64) (*models.Milestone, error) {
	m, err := scanMilestone(r.q.QueryRow(`SELECT `+milestoneColumns+` FROM milestones m WHERE m.id = $1`, id))
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return m, err
}

func (r *MilestoneRepository) Create(m *models.Milestone) error {
	return r.q.QueryRow(`
		INSERT INTO milestones (goal_id, title, completed, due_date, created_at, updated_at)
		VALUES ($1, $2, FALSE, $3, NOW(), NOW()) RETURNING id`,
		m.GoalID, m.Title, nullDate(m.DueDate),
	).Scan(&m.ID)
}

func (r *MilestoneRepository) Update(m *models.Milestone) error {
	_, err := r.q.Exec(`UPDATE milestones SET title = $1, due_date = $2, updated_at = NOW() WHERE id = $3`,
		m.Title, nullDate(m.DueDate), m.ID)
	return err
}

func (r *MilestoneRepository) Delete(id int64) (bool, error) {
	res, err := r.q.Exec(`DELETE FROM milestones WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}

// SetCompleted muda o estado da meta. Retorna false se ela já estava no estado
// pedido (ex.: clique duplo), o que evita pagar a recompensa duas vezes.
func (r *MilestoneRepository) SetCompleted(id int64, completed bool) (bool, error) {
	query := `UPDATE milestones SET completed = TRUE, completed_at = NOW(), updated_at = NOW()
	          WHERE id = $1 AND completed = FALSE`
	if !completed {
		query = `UPDATE milestones SET completed = FALSE, completed_at = NULL, updated_at = NOW()
		         WHERE id = $1 AND completed = TRUE`
	}
	res, err := r.q.Exec(query, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}
