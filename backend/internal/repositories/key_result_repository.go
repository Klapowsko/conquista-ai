package repositories

import (
	"database/sql"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type KeyResultRepository struct {
	db *sql.DB
}

func NewKeyResultRepository(db *sql.DB) *KeyResultRepository {
	return &KeyResultRepository{db: db}
}

func (r *KeyResultRepository) Create(kr *models.KeyResult) error {
	query := `INSERT INTO key_results (okr_id, title, completed, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5) RETURNING id`

	now := time.Now()
	kr.CreatedAt = now
	kr.UpdatedAt = now

	err := r.db.QueryRow(query, kr.OKRID, kr.Title, kr.Completed, kr.CreatedAt, kr.UpdatedAt).Scan(&kr.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *KeyResultRepository) GetByOKRID(okrID int64) ([]models.KeyResult, error) {
	query := `SELECT id, okr_id, title, completed, created_at, updated_at 
	          FROM key_results WHERE okr_id = $1 ORDER BY created_at ASC`

	rows, err := r.db.Query(query, okrID)
	if err != nil {
		return []models.KeyResult{}, err
	}
	defer rows.Close()

	keyResults := make([]models.KeyResult, 0)
	for rows.Next() {
		var kr models.KeyResult
		if err := rows.Scan(&kr.ID, &kr.OKRID, &kr.Title, &kr.Completed, &kr.CreatedAt, &kr.UpdatedAt); err != nil {
			return []models.KeyResult{}, err
		}
		keyResults = append(keyResults, kr)
	}

	if err := rows.Err(); err != nil {
		return []models.KeyResult{}, err
	}

	return keyResults, nil
}

func (r *KeyResultRepository) GetByID(id int64) (*models.KeyResult, error) {
	query := `SELECT id, okr_id, title, completed, created_at, updated_at 
	          FROM key_results WHERE id = $1`

	var kr models.KeyResult
	err := r.db.QueryRow(query, id).Scan(&kr.ID, &kr.OKRID, &kr.Title, &kr.Completed, &kr.CreatedAt, &kr.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &kr, nil
}

func (r *KeyResultRepository) Update(kr *models.KeyResult) error {
	query := `UPDATE key_results SET title = $1, completed = $2, updated_at = $3 WHERE id = $4`

	kr.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, kr.Title, kr.Completed, kr.UpdatedAt, kr.ID)
	return err
}

func (r *KeyResultRepository) Delete(id int64) error {
	query := `DELETE FROM key_results WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *KeyResultRepository) CreateBatch(keyResults []models.KeyResult) error {
	query := `INSERT INTO key_results (okr_id, title, completed, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5) RETURNING id`

	now := time.Now()
	for i := range keyResults {
		keyResults[i].CreatedAt = now
		keyResults[i].UpdatedAt = now

		err := r.db.QueryRow(query, keyResults[i].OKRID, keyResults[i].Title,
			keyResults[i].Completed, keyResults[i].CreatedAt, keyResults[i].UpdatedAt).
			Scan(&keyResults[i].ID)
		if err != nil {
			return err
		}
	}

	return nil
}
