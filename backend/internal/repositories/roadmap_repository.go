package repositories

import (
	"database/sql"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type RoadmapRepository struct {
	db *sql.DB
}

func NewRoadmapRepository(db *sql.DB) *RoadmapRepository {
	return &RoadmapRepository{db: db}
}

func (r *RoadmapRepository) Create(roadmap *models.Roadmap) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now()
	roadmap.CreatedAt = now
	roadmap.UpdatedAt = now

	// Criar roadmap
	query := `INSERT INTO roadmaps (key_result_id, topic, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4) RETURNING id`
	err = tx.QueryRow(query, roadmap.KeyResultID, roadmap.Topic, roadmap.CreatedAt, roadmap.UpdatedAt).Scan(&roadmap.ID)
	if err != nil {
		return err
	}

	// Criar categorias e itens
	for _, category := range roadmap.Categories {
		catQuery := `INSERT INTO roadmap_categories (roadmap_id, category, created_at) 
		             VALUES ($1, $2, $3) RETURNING id`
		err = tx.QueryRow(catQuery, roadmap.ID, category.Category, now).Scan(&category.ID)
		if err != nil {
			return err
		}

		for _, item := range category.Items {
			itemQuery := `INSERT INTO roadmap_items (category_id, title, completed, created_at, updated_at) 
			              VALUES ($1, $2, $3, $4, $5) RETURNING id`
			err = tx.QueryRow(itemQuery, category.ID, item.Title, item.Completed, now, now).Scan(&item.ID)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *RoadmapRepository) GetByKeyResultID(keyResultID int64) (*models.Roadmap, error) {
	// Buscar roadmap
	query := `SELECT id, key_result_id, topic, created_at, updated_at 
	          FROM roadmaps WHERE key_result_id = $1`

	var roadmap models.Roadmap
	err := r.db.QueryRow(query, keyResultID).Scan(&roadmap.ID, &roadmap.KeyResultID,
		&roadmap.Topic, &roadmap.CreatedAt, &roadmap.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Buscar categorias
	catQuery := `SELECT id, roadmap_id, category, created_at 
	             FROM roadmap_categories WHERE roadmap_id = $1 ORDER BY id`
	catRows, err := r.db.Query(catQuery, roadmap.ID)
	if err != nil {
		return nil, err
	}
	defer catRows.Close()

	roadmap.Categories = make([]models.RoadmapCategory, 0)
	for catRows.Next() {
		var cat models.RoadmapCategory
		if err := catRows.Scan(&cat.ID, &cat.RoadmapID, &cat.Category, &cat.CreatedAt); err != nil {
			return nil, err
		}

		// Buscar itens da categoria
		itemQuery := `SELECT id, category_id, title, completed, created_at, updated_at 
		              FROM roadmap_items WHERE category_id = $1 ORDER BY id`
		itemRows, err := r.db.Query(itemQuery, cat.ID)
		if err != nil {
			return nil, err
		}

		cat.Items = make([]models.RoadmapItem, 0)
		for itemRows.Next() {
			var item models.RoadmapItem
			if err := itemRows.Scan(&item.ID, &item.CategoryID, &item.Title,
				&item.Completed, &item.CreatedAt, &item.UpdatedAt); err != nil {
				itemRows.Close()
				return nil, err
			}
			cat.Items = append(cat.Items, item)
		}
		itemRows.Close()

		roadmap.Categories = append(roadmap.Categories, cat)
	}

	return &roadmap, nil
}

func (r *RoadmapRepository) UpdateItem(itemID int64, completed bool) error {
	query := `UPDATE roadmap_items SET completed = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, completed, time.Now(), itemID)
	return err
}

// GetOKRByRoadmapItemID busca o OKR relacionado a um roadmap item e retorna também
// o número total de Key Results do OKR e o número total de itens do roadmap
func (r *RoadmapRepository) GetOKRByRoadmapItemID(roadmapItemID int64) (*models.OKR, int, int, error) {
	query := `
		SELECT 
			o.id, 
			o.objective, 
			o.category_id, 
			o.completion_date, 
			o.created_at, 
			o.updated_at,
			COUNT(DISTINCT kr.id) as total_key_results,
			COUNT(DISTINCT ri_all.id) as total_roadmap_items
		FROM roadmap_items ri
		INNER JOIN roadmap_categories rc ON ri.category_id = rc.id
		INNER JOIN roadmaps r ON rc.roadmap_id = r.id
		INNER JOIN key_results kr ON r.key_result_id = kr.id
		INNER JOIN okrs o ON kr.okr_id = o.id
		LEFT JOIN roadmap_categories rc_all ON rc_all.roadmap_id = r.id
		LEFT JOIN roadmap_items ri_all ON ri_all.category_id = rc_all.id
		WHERE ri.id = $1
		GROUP BY o.id, o.objective, o.category_id, o.completion_date, o.created_at, o.updated_at
	`

	var okr models.OKR
	var totalKeyResults int
	var totalRoadmapItems int
	var completionDate sql.NullTime

	err := r.db.QueryRow(query, roadmapItemID).Scan(
		&okr.ID,
		&okr.Objective,
		&okr.CategoryID,
		&completionDate,
		&okr.CreatedAt,
		&okr.UpdatedAt,
		&totalKeyResults,
		&totalRoadmapItems,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, 0, 0, nil
		}
		return nil, 0, 0, err
	}

	if completionDate.Valid {
		okr.CompletionDate = &completionDate.Time
	}

	return &okr, totalKeyResults, totalRoadmapItems, nil
}
