package repositories

import (
	"database/sql"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type RewardRepository struct {
	q Querier
}

func NewRewardRepository(q Querier) *RewardRepository {
	return &RewardRepository{q: q}
}

func (r *RewardRepository) WithTx(tx *sql.Tx) *RewardRepository {
	return &RewardRepository{q: tx}
}

const rewardColumns = `id, name, description, icon, cost, created_at, updated_at`

func scanReward(row interface{ Scan(...any) error }) (*models.Reward, error) {
	var rw models.Reward
	err := row.Scan(&rw.ID, &rw.Name, &rw.Description, &rw.Icon, &rw.Cost, &rw.CreatedAt, &rw.UpdatedAt)
	return &rw, err
}

func (r *RewardRepository) List() ([]models.Reward, error) {
	rows, err := r.q.Query(`SELECT ` + rewardColumns + ` FROM rewards ORDER BY cost ASC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.Reward, 0)
	for rows.Next() {
		rw, err := scanReward(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *rw)
	}
	return list, rows.Err()
}

func (r *RewardRepository) GetByID(id int64) (*models.Reward, error) {
	rw, err := scanReward(r.q.QueryRow(`SELECT `+rewardColumns+` FROM rewards WHERE id = $1`, id))
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return rw, nil
}

func (r *RewardRepository) Create(rw *models.Reward) error {
	return r.q.QueryRow(`
		INSERT INTO rewards (name, description, icon, cost, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, created_at, updated_at`,
		rw.Name, rw.Description, rw.Icon, rw.Cost,
	).Scan(&rw.ID, &rw.CreatedAt, &rw.UpdatedAt)
}

func (r *RewardRepository) Update(rw *models.Reward) error {
	return r.q.QueryRow(`
		UPDATE rewards SET name = $1, description = $2, icon = $3, cost = $4, updated_at = NOW()
		WHERE id = $5 RETURNING updated_at`,
		rw.Name, rw.Description, rw.Icon, rw.Cost, rw.ID,
	).Scan(&rw.UpdatedAt)
}

func (r *RewardRepository) Delete(id int64) (bool, error) {
	res, err := r.q.Exec(`DELETE FROM rewards WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n > 0, err
}
