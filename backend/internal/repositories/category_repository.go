package repositories

import (
	"database/sql"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(category *models.Category) error {
	query := `INSERT INTO categories (name, created_at, updated_at) 
	          VALUES ($1, $2, $3) RETURNING id`
	
	now := time.Now()
	category.CreatedAt = now
	category.UpdatedAt = now
	
	err := r.db.QueryRow(query, category.Name, category.CreatedAt, category.UpdatedAt).Scan(&category.ID)
	if err != nil {
		return err
	}
	
	return nil
}

func (r *CategoryRepository) GetAll() ([]models.Category, error) {
	query := `SELECT id, name, created_at, updated_at FROM categories ORDER BY name`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var categories []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	
	return categories, rows.Err()
}

func (r *CategoryRepository) GetByID(id int64) (*models.Category, error) {
	query := `SELECT id, name, created_at, updated_at FROM categories WHERE id = $1`
	
	var c models.Category
	err := r.db.QueryRow(query, id).Scan(&c.ID, &c.Name, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	
	return &c, nil
}

func (r *CategoryRepository) Update(category *models.Category) error {
	query := `UPDATE categories SET name = $1, updated_at = $2 WHERE id = $3`
	
	category.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, category.Name, category.UpdatedAt, category.ID)
	return err
}

func (r *CategoryRepository) Delete(id int64) error {
	query := `DELETE FROM categories WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

