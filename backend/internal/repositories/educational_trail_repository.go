package repositories

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
)

type EducationalTrailRepository struct {
	db *sql.DB
}

func NewEducationalTrailRepository(db *sql.DB) *EducationalTrailRepository {
	return &EducationalTrailRepository{db: db}
}

func (r *EducationalTrailRepository) Create(trail *models.EducationalTrail) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now()
	trail.CreatedAt = now
	trail.UpdatedAt = now

	// Criar trilha
	query := `INSERT INTO educational_trails (roadmap_item_id, topic, total_days, description, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	err = tx.QueryRow(query, trail.RoadmapItemID, trail.Topic, trail.TotalDays, trail.Description, trail.CreatedAt, trail.UpdatedAt).Scan(&trail.ID)
	if err != nil {
		return err
	}

	// Salvar recursos
	for resourceID, resource := range trail.Resources {
		resourceQuery := `INSERT INTO educational_trail_resources 
		                  (trail_id, resource_id, title, description, author, duration, url, created_at) 
		                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
		var resourceDBID int64
		err = tx.QueryRow(resourceQuery, trail.ID, resourceID, resource.Title, resource.Description,
			resource.Author, resource.Duration, resource.URL, now).Scan(&resourceDBID)
		if err != nil {
			return err
		}

		// Salvar capítulos do recurso
		if len(resource.Chapters) > 0 {
			for _, chapter := range resource.Chapters {
				chapterQuery := `INSERT INTO educational_trail_resource_chapters (resource_id, chapter_title, created_at) 
				                 VALUES ($1, $2, $3)`
				_, err = tx.Exec(chapterQuery, resourceDBID, chapter, now)
				if err != nil {
					return err
				}
			}
		}
	}

	// Salvar steps e atividades
	for _, step := range trail.Steps {
		stepQuery := `INSERT INTO educational_trail_steps (trail_id, day, title, description, created_at) 
		              VALUES ($1, $2, $3, $4, $5) RETURNING id`
		err = tx.QueryRow(stepQuery, trail.ID, step.Day, step.Title, step.Description, now).Scan(&step.ID)
		if err != nil {
			return err
		}
		step.TrailID = trail.ID

		// Salvar atividades
		for i := range step.Activities {
			activity := &step.Activities[i]
			activityQuery := `INSERT INTO educational_trail_activities 
			                  (step_id, activity_type, resource_id, title, description, duration, url, progress, completed, created_at, updated_at) 
			                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`
			err = tx.QueryRow(activityQuery, step.ID, activity.Type, activity.ResourceID, activity.Title,
				activity.Description, activity.Duration, activity.URL, activity.Progress, activity.Completed, now, now).Scan(&activity.ID)
			if err != nil {
				return err
			}
			activity.StepID = step.ID

			// Salvar capítulos da atividade
			if len(activity.Chapters) > 0 {
				for _, chapter := range activity.Chapters {
					chapterQuery := `INSERT INTO educational_trail_activity_chapters (activity_id, chapter_title, created_at) 
					                 VALUES ($1, $2, $3)`
					_, err = tx.Exec(chapterQuery, activity.ID, chapter, now)
					if err != nil {
						return err
					}
				}
			}
		}
	}

	return tx.Commit()
}

func (r *EducationalTrailRepository) GetByRoadmapItemID(roadmapItemID int64) (*models.EducationalTrail, error) {
	// Buscar trilha
	query := `SELECT id, roadmap_item_id, topic, total_days, description, created_at, updated_at 
	          FROM educational_trails WHERE roadmap_item_id = $1`

	var trail models.EducationalTrail
	err := r.db.QueryRow(query, roadmapItemID).Scan(&trail.ID, &trail.RoadmapItemID, &trail.Topic,
		&trail.TotalDays, &trail.Description, &trail.CreatedAt, &trail.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Buscar recursos
	resourcesQuery := `SELECT id, resource_id, title, description, author, duration, url, created_at 
	                   FROM educational_trail_resources WHERE trail_id = $1`
	resourceRows, err := r.db.Query(resourcesQuery, trail.ID)
	if err != nil {
		return nil, err
	}
	defer resourceRows.Close()

	trail.Resources = make(map[string]models.TrailResource)
	for resourceRows.Next() {
		var res models.TrailResource
		var resourceID string
		err := resourceRows.Scan(&res.ID, &resourceID, &res.Title, &res.Description,
			&res.Author, &res.Duration, &res.URL, &res.CreatedAt)
		if err != nil {
			resourceRows.Close()
			return nil, err
		}
		res.TrailID = trail.ID
		res.ResourceID = resourceID

		// Buscar capítulos do recurso
		chaptersQuery := `SELECT chapter_title FROM educational_trail_resource_chapters WHERE resource_id = $1 ORDER BY id`
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

		trail.Resources[resourceID] = res
	}

	// Buscar steps
	stepsQuery := `SELECT id, trail_id, day, title, description, created_at 
	               FROM educational_trail_steps WHERE trail_id = $1 ORDER BY day`
	stepRows, err := r.db.Query(stepsQuery, trail.ID)
	if err != nil {
		return nil, err
	}
	defer stepRows.Close()

	trail.Steps = make([]models.EducationalTrailStep, 0)
	for stepRows.Next() {
		var step models.EducationalTrailStep
		err := stepRows.Scan(&step.ID, &step.TrailID, &step.Day, &step.Title, &step.Description, &step.CreatedAt)
		if err != nil {
			stepRows.Close()
			return nil, err
		}

		// Buscar atividades
		activitiesQuery := `SELECT id, step_id, activity_type, resource_id, title, description, duration, url, progress, completed, created_at, updated_at 
		                   FROM educational_trail_activities WHERE step_id = $1 ORDER BY id`
		activityRows, err := r.db.Query(activitiesQuery, step.ID)
		if err != nil {
			stepRows.Close()
			return nil, err
		}

		step.Activities = make([]models.TrailActivity, 0)
		for activityRows.Next() {
			var activity models.TrailActivity
			err := activityRows.Scan(&activity.ID, &activity.StepID, &activity.Type, &activity.ResourceID,
				&activity.Title, &activity.Description, &activity.Duration, &activity.URL, &activity.Progress,
				&activity.Completed, &activity.CreatedAt, &activity.UpdatedAt)
			if err != nil {
				activityRows.Close()
				stepRows.Close()
				return nil, err
			}

			// Buscar capítulos da atividade
			chaptersQuery := `SELECT chapter_title FROM educational_trail_activity_chapters WHERE activity_id = $1 ORDER BY id`
			chapterRows, err := r.db.Query(chaptersQuery, activity.ID)
			if err != nil {
				activityRows.Close()
				stepRows.Close()
				return nil, err
			}

			activity.Chapters = make([]string, 0)
			for chapterRows.Next() {
				var chapter string
				if err := chapterRows.Scan(&chapter); err != nil {
					chapterRows.Close()
					activityRows.Close()
					stepRows.Close()
					return nil, err
				}
				activity.Chapters = append(activity.Chapters, chapter)
			}
			chapterRows.Close()

			step.Activities = append(step.Activities, activity)
		}
		activityRows.Close()

		trail.Steps = append(trail.Steps, step)
	}

	return &trail, nil
}

func (r *EducationalTrailRepository) UpdateActivityCompleted(activityID int64, completed bool) error {
	query := `UPDATE educational_trail_activities SET completed = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, completed, time.Now(), activityID)
	return err
}

// DeleteByRoadmapItemID deleta uma trilha educacional e todos os dados relacionados
// O CASCADE no banco de dados garante que steps, activities, resources e chapters sejam deletados automaticamente
func (r *EducationalTrailRepository) DeleteByRoadmapItemID(roadmapItemID int64) error {
	query := `DELETE FROM educational_trails WHERE roadmap_item_id = $1`
	result, err := r.db.Exec(query, roadmapItemID)
	if err != nil {
		return err
	}
	
	// Verificar se alguma linha foi deletada
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("trilha educacional não encontrada para roadmap_item_id %d", roadmapItemID)
	}
	
	return nil
}

// Helper para converter de spellbook.EducationalTrailResponse para models.EducationalTrail
func ConvertTrailFromSpellbook(spellbookTrail interface{}, roadmapItemID int64) (*models.EducationalTrail, error) {
	// Converter via JSON para garantir compatibilidade
	jsonData, err := json.Marshal(spellbookTrail)
	if err != nil {
		return nil, err
	}

	var trail models.EducationalTrail
	if err := json.Unmarshal(jsonData, &trail); err != nil {
		return nil, err
	}

	trail.RoadmapItemID = roadmapItemID
	return &trail, nil
}

