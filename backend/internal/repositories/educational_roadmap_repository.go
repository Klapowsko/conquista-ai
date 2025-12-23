package repositories

import (
	"database/sql"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type EducationalRoadmapRepository struct {
	db *sql.DB
}

func NewEducationalRoadmapRepository(db *sql.DB) *EducationalRoadmapRepository {
	return &EducationalRoadmapRepository{db: db}
}

func (r *EducationalRoadmapRepository) Create(roadmap *models.EducationalRoadmap) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now()
	roadmap.CreatedAt = now
	roadmap.UpdatedAt = now

	// Criar educational roadmap
	query := `INSERT INTO educational_roadmaps (roadmap_item_id, topic, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4) RETURNING id`
	err = tx.QueryRow(query, roadmap.RoadmapItemID, roadmap.Topic, roadmap.CreatedAt, roadmap.UpdatedAt).Scan(&roadmap.ID)
	if err != nil {
		return err
	}

	// Criar recursos educacionais
	resourceTypes := map[string][]models.EducationalResource{
		"book":    roadmap.Books,
		"course":  roadmap.Courses,
		"video":   roadmap.Videos,
		"article": roadmap.Articles,
		"project": roadmap.Projects,
	}

	for resourceType, resources := range resourceTypes {
		for i := range resources {
			res := &resources[i]
			res.RoadmapID = roadmap.ID
			res.Type = resourceType
			res.CreatedAt = now
			res.UpdatedAt = now

			resourceQuery := `INSERT INTO educational_resources 
			                  (educational_roadmap_id, resource_type, title, description, url, author, duration, completed, created_at, updated_at) 
			                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`
			err = tx.QueryRow(resourceQuery, res.RoadmapID, res.Type, res.Title, res.Description,
				res.URL, res.Author, res.Duration, res.Completed, res.CreatedAt, res.UpdatedAt).Scan(&res.ID)
			if err != nil {
				return err
			}

			// Criar capítulos se for livro
			if resourceType == "book" && len(res.Chapters) > 0 {
				for _, chapterTitle := range res.Chapters {
					chapterQuery := `INSERT INTO educational_resource_chapters (resource_id, chapter_title, created_at) 
					                 VALUES ($1, $2, $3)`
					_, err = tx.Exec(chapterQuery, res.ID, chapterTitle, now)
					if err != nil {
						return err
					}
				}
			}
		}
	}

	// Atualizar os slices no roadmap
	roadmap.Books = resourceTypes["book"]
	roadmap.Courses = resourceTypes["course"]
	roadmap.Videos = resourceTypes["video"]
	roadmap.Articles = resourceTypes["article"]
	roadmap.Projects = resourceTypes["project"]

	return tx.Commit()
}

func (r *EducationalRoadmapRepository) GetByRoadmapItemID(roadmapItemID int64) (*models.EducationalRoadmap, error) {
	// Buscar educational roadmap
	query := `SELECT id, roadmap_item_id, topic, created_at, updated_at 
	          FROM educational_roadmaps WHERE roadmap_item_id = $1`

	var roadmap models.EducationalRoadmap
	err := r.db.QueryRow(query, roadmapItemID).Scan(&roadmap.ID, &roadmap.RoadmapItemID,
		&roadmap.Topic, &roadmap.CreatedAt, &roadmap.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Buscar recursos educacionais
	resourcesQuery := `SELECT id, educational_roadmap_id, resource_type, title, description, url, author, duration, completed, created_at, updated_at 
	                   FROM educational_resources WHERE educational_roadmap_id = $1 ORDER BY resource_type, id`
	resourceRows, err := r.db.Query(resourcesQuery, roadmap.ID)
	if err != nil {
		return nil, err
	}
	defer resourceRows.Close()

	roadmap.Books = make([]models.EducationalResource, 0)
	roadmap.Courses = make([]models.EducationalResource, 0)
	roadmap.Videos = make([]models.EducationalResource, 0)
	roadmap.Articles = make([]models.EducationalResource, 0)
	roadmap.Projects = make([]models.EducationalResource, 0)

	for resourceRows.Next() {
		var res models.EducationalResource
		err := resourceRows.Scan(&res.ID, &res.RoadmapID, &res.Type, &res.Title, &res.Description,
			&res.URL, &res.Author, &res.Duration, &res.Completed, &res.CreatedAt, &res.UpdatedAt)
		if err != nil {
			resourceRows.Close()
			return nil, err
		}

		// Buscar capítulos se for livro
		if res.Type == "book" {
			chaptersQuery := `SELECT chapter_title FROM educational_resource_chapters WHERE resource_id = $1 ORDER BY id`
			chapterRows, err := r.db.Query(chaptersQuery, res.ID)
			if err != nil {
				resourceRows.Close()
				return nil, err
			}

			res.Chapters = make([]string, 0)
			for chapterRows.Next() {
				var chapter string
				if err := chapterRows.Scan(&chapter); err != nil {
					chapterRows.Close()
					resourceRows.Close()
					return nil, err
				}
				res.Chapters = append(res.Chapters, chapter)
			}
			chapterRows.Close()
		}

		// Adicionar ao slice apropriado
		switch res.Type {
		case "book":
			roadmap.Books = append(roadmap.Books, res)
		case "course":
			roadmap.Courses = append(roadmap.Courses, res)
		case "video":
			roadmap.Videos = append(roadmap.Videos, res)
		case "article":
			roadmap.Articles = append(roadmap.Articles, res)
		case "project":
			roadmap.Projects = append(roadmap.Projects, res)
		}
	}

	return &roadmap, nil
}

func (r *EducationalRoadmapRepository) UpdateResourceCompleted(resourceID int64, completed bool) error {
	query := `UPDATE educational_resources SET completed = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, completed, time.Now(), resourceID)
	return err
}

