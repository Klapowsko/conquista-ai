package repositories

import (
	"database/sql"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type OKRRepository struct {
	db *sql.DB
}

func NewOKRRepository(db *sql.DB) *OKRRepository {
	return &OKRRepository{db: db}
}

func (r *OKRRepository) Create(okr *models.OKR) error {
	query := `INSERT INTO okrs (objective, category_id, completion_date, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5) RETURNING id`

	now := time.Now()
	okr.CreatedAt = now
	okr.UpdatedAt = now

	err := r.db.QueryRow(query, okr.Objective, okr.CategoryID, okr.CompletionDate, okr.CreatedAt, okr.UpdatedAt).Scan(&okr.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *OKRRepository) GetAll() ([]models.OKR, error) {
	query := `SELECT o.id, o.objective, o.category_id, o.completion_date, o.created_at, o.updated_at,
	                 c.id, c.name, c.created_at, c.updated_at
	          FROM okrs o
	          LEFT JOIN categories c ON o.category_id = c.id
	          ORDER BY o.created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return []models.OKR{}, err
	}
	defer rows.Close()

	okrs := make([]models.OKR, 0)
	for rows.Next() {
		var o models.OKR
		var c models.Category
		var completionDate sql.NullTime
		if err := rows.Scan(&o.ID, &o.Objective, &o.CategoryID, &completionDate, &o.CreatedAt, &o.UpdatedAt,
			&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return []models.OKR{}, err
		}
		if completionDate.Valid {
			o.CompletionDate = &completionDate.Time
		}
		o.Category = &c
		okrs = append(okrs, o)
	}

	if err := rows.Err(); err != nil {
		return []models.OKR{}, err
	}

	return okrs, nil
}

func (r *OKRRepository) GetByID(id int64) (*models.OKR, error) {
	query := `SELECT o.id, o.objective, o.category_id, o.completion_date, o.created_at, o.updated_at,
	                 c.id, c.name, c.created_at, c.updated_at
	          FROM okrs o
	          LEFT JOIN categories c ON o.category_id = c.id
	          WHERE o.id = $1`

	var o models.OKR
	var c models.Category
	var completionDate sql.NullTime
	err := r.db.QueryRow(query, id).Scan(&o.ID, &o.Objective, &o.CategoryID, &completionDate, &o.CreatedAt, &o.UpdatedAt,
		&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if completionDate.Valid {
		o.CompletionDate = &completionDate.Time
	}
	o.Category = &c
	return &o, nil
}

func (r *OKRRepository) GetByCategoryID(categoryID int64) ([]models.OKR, error) {
	query := `SELECT o.id, o.objective, o.category_id, o.completion_date, o.created_at, o.updated_at,
	                 c.id, c.name, c.created_at, c.updated_at
	          FROM okrs o
	          LEFT JOIN categories c ON o.category_id = c.id
	          WHERE o.category_id = $1
	          ORDER BY o.created_at DESC`

	rows, err := r.db.Query(query, categoryID)
	if err != nil {
		return []models.OKR{}, err
	}
	defer rows.Close()

	okrs := make([]models.OKR, 0)
	for rows.Next() {
		var o models.OKR
		var c models.Category
		var completionDate sql.NullTime
		if err := rows.Scan(&o.ID, &o.Objective, &o.CategoryID, &completionDate, &o.CreatedAt, &o.UpdatedAt,
			&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return []models.OKR{}, err
		}
		if completionDate.Valid {
			o.CompletionDate = &completionDate.Time
		}
		o.Category = &c
		okrs = append(okrs, o)
	}

	if err := rows.Err(); err != nil {
		return []models.OKR{}, err
	}

	return okrs, nil
}

func (r *OKRRepository) Update(okr *models.OKR) error {
	query := `UPDATE okrs SET objective = $1, category_id = $2, completion_date = $3, updated_at = $4 WHERE id = $5`

	okr.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, okr.Objective, okr.CategoryID, okr.CompletionDate, okr.UpdatedAt, okr.ID)
	return err
}

func (r *OKRRepository) Delete(id int64) error {
	query := `DELETE FROM okrs WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
