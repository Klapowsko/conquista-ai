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
	query := `INSERT INTO key_results (okr_id, title, completed, expected_completion_date, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`

	now := time.Now()
	kr.CreatedAt = now
	kr.UpdatedAt = now

	var expectedCompletionDateSQL sql.NullTime
	if kr.ExpectedCompletionDate != nil {
		expectedCompletionDateSQL = sql.NullTime{Time: *kr.ExpectedCompletionDate, Valid: true}
	}

	err := r.db.QueryRow(query, kr.OKRID, kr.Title, kr.Completed, expectedCompletionDateSQL, kr.CreatedAt, kr.UpdatedAt).Scan(&kr.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *KeyResultRepository) GetByOKRID(okrID int64) ([]models.KeyResult, error) {
	query := `SELECT id, okr_id, title, completed, expected_completion_date, created_at, updated_at 
	          FROM key_results WHERE okr_id = $1 ORDER BY created_at ASC`

	rows, err := r.db.Query(query, okrID)
	if err != nil {
		return []models.KeyResult{}, err
	}
	defer rows.Close()

	keyResults := make([]models.KeyResult, 0)
	for rows.Next() {
		var kr models.KeyResult
		var expectedCompletionDate sql.NullTime
		if err := rows.Scan(&kr.ID, &kr.OKRID, &kr.Title, &kr.Completed, &expectedCompletionDate, &kr.CreatedAt, &kr.UpdatedAt); err != nil {
			return []models.KeyResult{}, err
		}
		if expectedCompletionDate.Valid {
			kr.ExpectedCompletionDate = &expectedCompletionDate.Time
		}
		keyResults = append(keyResults, kr)
	}

	if err := rows.Err(); err != nil {
		return []models.KeyResult{}, err
	}

	return keyResults, nil
}

func (r *KeyResultRepository) GetByID(id int64) (*models.KeyResult, error) {
	query := `SELECT id, okr_id, title, completed, expected_completion_date, created_at, updated_at 
	          FROM key_results WHERE id = $1`

	var kr models.KeyResult
	var expectedCompletionDate sql.NullTime
	err := r.db.QueryRow(query, id).Scan(&kr.ID, &kr.OKRID, &kr.Title, &kr.Completed, &expectedCompletionDate, &kr.CreatedAt, &kr.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if expectedCompletionDate.Valid {
		kr.ExpectedCompletionDate = &expectedCompletionDate.Time
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

// KeyResultWithOKR representa um Key Result com informações do OKR
type KeyResultWithOKR struct {
	KeyResult          models.KeyResult
	OKRTitle           string
	OKRCompletionDate  *time.Time
}

func (r *KeyResultRepository) GetAllWithOKR() ([]KeyResultWithOKR, error) {
	query := `SELECT 
		kr.id, 
		kr.okr_id, 
		kr.title, 
		kr.completed, 
		kr.expected_completion_date, 
		kr.created_at, 
		kr.updated_at,
		o.objective as okr_title,
		o.completion_date as okr_completion_date
	FROM key_results kr
	INNER JOIN okrs o ON kr.okr_id = o.id
	ORDER BY kr.expected_completion_date ASC NULLS LAST, kr.created_at ASC`

	rows, err := r.db.Query(query)
	if err != nil {
		return []KeyResultWithOKR{}, err
	}
	defer rows.Close()

	keyResults := make([]KeyResultWithOKR, 0)
	for rows.Next() {
		var krw KeyResultWithOKR
		var expectedCompletionDate sql.NullTime
		var okrCompletionDate sql.NullTime

		err := rows.Scan(
			&krw.KeyResult.ID,
			&krw.KeyResult.OKRID,
			&krw.KeyResult.Title,
			&krw.KeyResult.Completed,
			&expectedCompletionDate,
			&krw.KeyResult.CreatedAt,
			&krw.KeyResult.UpdatedAt,
			&krw.OKRTitle,
			&okrCompletionDate,
		)
		if err != nil {
			return []KeyResultWithOKR{}, err
		}

		if expectedCompletionDate.Valid {
			krw.KeyResult.ExpectedCompletionDate = &expectedCompletionDate.Time
		}

		if okrCompletionDate.Valid {
			krw.OKRCompletionDate = &okrCompletionDate.Time
		}

		keyResults = append(keyResults, krw)
	}

	if err := rows.Err(); err != nil {
		return []KeyResultWithOKR{}, err
	}

	return keyResults, nil
}
