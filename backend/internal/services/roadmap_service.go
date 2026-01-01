package services

import (
	"fmt"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/services/spellbook"
	"github.com/conquista-ai/conquista-ai/internal/utils"
)

type RoadmapService struct {
	roadmapRepo              *repositories.RoadmapRepository
	educationalRoadmapRepo   *repositories.EducationalRoadmapRepository
	educationalTrailRepo     *repositories.EducationalTrailRepository
	keyResultRepo            *repositories.KeyResultRepository
	okrRepo                  *repositories.OKRRepository
	spellbookClient          *spellbook.Client
}

func NewRoadmapService(
	roadmapRepo *repositories.RoadmapRepository,
	educationalRoadmapRepo *repositories.EducationalRoadmapRepository,
	educationalTrailRepo *repositories.EducationalTrailRepository,
	keyResultRepo *repositories.KeyResultRepository,
	okrRepo *repositories.OKRRepository,
	spellbookClient *spellbook.Client,
) *RoadmapService {
	return &RoadmapService{
		roadmapRepo:            roadmapRepo,
		educationalRoadmapRepo:  educationalRoadmapRepo,
		educationalTrailRepo:    educationalTrailRepo,
		keyResultRepo:          keyResultRepo,
		okrRepo:                okrRepo,
		spellbookClient:         spellbookClient,
	}
}

func (s *RoadmapService) GenerateRoadmap(keyResultID int64) (*models.Roadmap, error) {
	// Verificar se Key Result existe
	kr, err := s.keyResultRepo.GetByID(keyResultID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar Key Result: %w", err)
	}
	if kr == nil {
		return nil, fmt.Errorf("Key Result não encontrado")
	}

	// Verificar se já existe roadmap
	existing, err := s.roadmapRepo.GetByKeyResultID(keyResultID)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar roadmap existente: %w", err)
	}
	if existing != nil {
		return existing, nil
	}

	// Buscar OKR e calcular tempo disponível do Key Result
	var availableDays *int
	okr, err := s.okrRepo.GetByID(kr.OKRID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar OKR: %w", err)
	}
	
	if okr != nil && okr.CompletionDate != nil {
		// Buscar todos os Key Results do OKR para contar
		allKeyResults, err := s.keyResultRepo.GetByOKRID(okr.ID)
		if err != nil {
			return nil, fmt.Errorf("erro ao buscar Key Results: %w", err)
		}
		
		totalKeyResults := len(allKeyResults)
		if totalKeyResults > 0 {
			now := time.Now()
			completionDate := *okr.CompletionDate
			
			// Calcular dias restantes
			daysRemaining := int(completionDate.Sub(now).Hours() / 24)
			
			if daysRemaining > 0 {
				// Dividir o tempo pelo número de Key Results
				calculatedDays := daysRemaining / totalKeyResults
				
				// Aplicar limites: mínimo 3 dias, máximo 30 dias
				if calculatedDays < 3 {
					calculatedDays = 3
				} else if calculatedDays > 30 {
					calculatedDays = 30
				}
				
				availableDays = &calculatedDays
			}
		}
	}
	
	// Se não calculou tempo ou completion_date é nulo/passado, usar padrão de 30 dias para roadmap
	if availableDays == nil {
		defaultDays := 30
		availableDays = &defaultDays
	}

	// Gerar roadmap via Spellbook
	roadmapResp, err := s.spellbookClient.GenerateRoadmap(kr.Title, availableDays)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar roadmap: %w", err)
	}

	// Converter resposta do Spellbook para modelo interno
	roadmap := &models.Roadmap{
		KeyResultID: keyResultID,
		Topic:       roadmapResp.Topic,
		Categories:  make([]models.RoadmapCategory, 0),
	}

	for _, catResp := range roadmapResp.Roadmap {
		category := models.RoadmapCategory{
			RoadmapID: 0, // Será preenchido no repositório
			Category:   catResp.Category,
			Items:     make([]models.RoadmapItem, 0),
		}

		for _, itemResp := range catResp.Items {
			category.Items = append(category.Items, models.RoadmapItem{
				CategoryID: 0, // Será preenchido no repositório
				Title:      itemResp.Title,
				Completed:  itemResp.Completed,
			})
		}

		roadmap.Categories = append(roadmap.Categories, category)
	}

	// Salvar no banco
	if err := s.roadmapRepo.Create(roadmap); err != nil {
		return nil, fmt.Errorf("erro ao salvar roadmap: %w", err)
	}

	return roadmap, nil
}

func (s *RoadmapService) GetRoadmapByKeyResultID(keyResultID int64) (*models.Roadmap, error) {
	return s.roadmapRepo.GetByKeyResultID(keyResultID)
}

func (s *RoadmapService) UpdateRoadmapItem(itemID int64, completed bool) error {
	return s.roadmapRepo.UpdateItem(itemID, completed)
}

func (s *RoadmapService) GenerateEducationalRoadmap(roadmapItemID int64, itemTitle string) (*models.EducationalRoadmap, error) {
	// Verificar se já existe roadmap educacional para este item
	existing, err := s.educationalRoadmapRepo.GetByRoadmapItemID(roadmapItemID)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar roadmap educacional existente: %w", err)
	}
	if existing != nil {
		return existing, nil
	}

	// Gerar roadmap educacional via Spellbook
	educationalRoadmapResp, err := s.spellbookClient.GenerateEducationalRoadmap(itemTitle)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar roadmap educacional: %w", err)
	}

	// Converter resposta do Spellbook para modelo interno
	educationalRoadmap := &models.EducationalRoadmap{
		RoadmapItemID: roadmapItemID,
		Topic:         educationalRoadmapResp.Topic,
		Books:         make([]models.EducationalResource, 0),
		Courses:       make([]models.EducationalResource, 0),
		Videos:        make([]models.EducationalResource, 0),
		Articles:      make([]models.EducationalResource, 0),
		Projects:      make([]models.EducationalResource, 0),
	}

	// Converter livros
	for _, bookResp := range educationalRoadmapResp.Books {
		book := models.EducationalResource{
			Type:        "book",
			Title:       bookResp.Title,
			Description: bookResp.Description,
			URL:         bookResp.URL,
			Author:      bookResp.Author,
			Chapters:    bookResp.Chapters,
			Completed:   false,
		}
		educationalRoadmap.Books = append(educationalRoadmap.Books, book)
	}

	// Converter cursos
	for _, courseResp := range educationalRoadmapResp.Courses {
		course := models.EducationalResource{
			Type:        "course",
			Title:       courseResp.Title,
			Description: courseResp.Description,
			URL:         courseResp.URL,
			Duration:    courseResp.Duration,
			Completed:   false,
		}
		educationalRoadmap.Courses = append(educationalRoadmap.Courses, course)
	}

	// Converter vídeos
	for _, videoResp := range educationalRoadmapResp.Videos {
		video := models.EducationalResource{
			Type:        "video",
			Title:       videoResp.Title,
			Description: videoResp.Description,
			URL:         videoResp.URL,
			Duration:    videoResp.Duration,
			Completed:   false,
		}
		educationalRoadmap.Videos = append(educationalRoadmap.Videos, video)
	}

	// Converter artigos
	for _, articleResp := range educationalRoadmapResp.Articles {
		article := models.EducationalResource{
			Type:        "article",
			Title:       articleResp.Title,
			Description: articleResp.Description,
			URL:         articleResp.URL,
			Completed:   false,
		}
		educationalRoadmap.Articles = append(educationalRoadmap.Articles, article)
	}

	// Converter projetos
	for _, projectResp := range educationalRoadmapResp.Projects {
		project := models.EducationalResource{
			Type:        "project",
			Title:       projectResp.Title,
			Description: projectResp.Description,
			URL:         projectResp.URL,
			Completed:   false,
		}
		educationalRoadmap.Projects = append(educationalRoadmap.Projects, project)
	}

	// Salvar no banco
	if err := s.educationalRoadmapRepo.Create(educationalRoadmap); err != nil {
		return nil, fmt.Errorf("erro ao salvar roadmap educacional: %w", err)
	}

	return educationalRoadmap, nil
}

func (s *RoadmapService) GetEducationalRoadmapByRoadmapItemID(roadmapItemID int64) (*models.EducationalRoadmap, error) {
	return s.educationalRoadmapRepo.GetByRoadmapItemID(roadmapItemID)
}

func (s *RoadmapService) UpdateEducationalResourceCompleted(resourceID int64, completed bool) error {
	return s.educationalRoadmapRepo.UpdateResourceCompleted(resourceID, completed)
}

func (s *RoadmapService) GenerateEducationalTrail(roadmapItemID int64, itemTitle string) (*models.EducationalTrail, error) {
	// Verificar se já existe trilha para este item
	existing, err := s.educationalTrailRepo.GetByRoadmapItemID(roadmapItemID)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar trilha existente: %w", err)
	}
	if existing != nil {
		return existing, nil
	}

	// Buscar OKR e calcular tempo disponível
	okr, totalKeyResults, totalRoadmapItems, err := s.roadmapRepo.GetOKRByRoadmapItemID(roadmapItemID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar OKR: %w", err)
	}

	var availableDays *int
	if okr != nil && okr.CompletionDate != nil && totalKeyResults > 0 {
		now := time.Now()
		completionDate := *okr.CompletionDate
		
		// Calcular dias restantes do OKR
		daysRemaining := int(completionDate.Sub(now).Hours() / 24)
		
		if daysRemaining > 0 {
			// Primeiro dividir o tempo pelo número de Key Results (tempo do Key Result)
			daysPerKeyResult := daysRemaining / totalKeyResults
			
			// Depois dividir pelo número de itens do roadmap (tempo por item)
			if totalRoadmapItems > 0 {
				calculatedDays := daysPerKeyResult / totalRoadmapItems
				
				// Aplicar limites: mínimo 3 dias, máximo 30 dias
				if calculatedDays < 3 {
					calculatedDays = 3
				} else if calculatedDays > 30 {
					calculatedDays = 30
				}
				
				availableDays = &calculatedDays
			} else {
				// Se não houver itens no roadmap, usar o tempo do Key Result
				if daysPerKeyResult < 3 {
					daysPerKeyResult = 3
				} else if daysPerKeyResult > 30 {
					daysPerKeyResult = 30
				}
				availableDays = &daysPerKeyResult
			}
		}
	}
	
	// Se não calculou tempo ou completion_date é nulo/passado, usar padrão de 14 dias
	if availableDays == nil {
		defaultDays := 14
		availableDays = &defaultDays
	}

	// Gerar trilha educacional via Spellbook
	trailResp, err := s.spellbookClient.GenerateEducationalTrail(itemTitle, availableDays)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar trilha educacional: %w", err)
	}

	// Converter resposta do Spellbook para modelo interno
	trail := &models.EducationalTrail{
		RoadmapItemID: roadmapItemID,
		Topic:         trailResp.Topic,
		TotalDays:     trailResp.TotalDays,
		Description:   trailResp.Description,
		Steps:         make([]models.EducationalTrailStep, 0),
		Resources:     make(map[string]models.TrailResource),
	}

	// Converter recursos e validar URLs
	for resourceID, resourceResp := range trailResp.Resources {
		resource := models.TrailResource{
			ResourceID:  resourceID,
			Title:       resourceResp.Title,
			Description: resourceResp.Description,
			Author:      resourceResp.Author,
			Chapters:    resourceResp.Chapters,
			Duration:    resourceResp.Duration,
			URL:         resourceResp.URL,
		}
		
		// Validar URL do recurso
		if resource.URL != "" {
			valid, err := utils.ValidateURL(resource.URL)
			if !valid || err != nil {
				// Logar URL inválida mas não falhar - apenas remover URL
				fmt.Printf("URL inválida removida do recurso %s: %s - Erro: %v\n", resourceID, resource.URL, err)
				resource.URL = ""
			}
		}
		
		trail.Resources[resourceID] = resource
	}

	// Converter steps
	for _, stepResp := range trailResp.Steps {
		step := models.EducationalTrailStep{
			Day:         stepResp.Day,
			Title:       stepResp.Title,
			Description: stepResp.Description,
			Activities:  make([]models.TrailActivity, 0),
		}

		// Converter atividades e validar URLs
		for _, activityResp := range stepResp.Activities {
			activity := models.TrailActivity{
				Type:        activityResp.Type,
				ResourceID:  activityResp.ResourceID,
				Title:       activityResp.Title,
				Description: activityResp.Description,
				Chapters:    activityResp.Chapters,
				Duration:    activityResp.Duration,
				URL:         activityResp.URL,
				Progress:    activityResp.Progress,
				Completed:   false,
			}
			
			// Validar URL da atividade
			if activity.URL != "" {
				valid, err := utils.ValidateURL(activity.URL)
				if !valid || err != nil {
					// Logar URL inválida mas não falhar - apenas remover URL
					fmt.Printf("URL inválida removida da atividade %s: %s - Erro: %v\n", activity.Title, activity.URL, err)
					activity.URL = ""
				}
			}
			
			step.Activities = append(step.Activities, activity)
		}

		trail.Steps = append(trail.Steps, step)
	}

	// Salvar no banco
	if err := s.educationalTrailRepo.Create(trail); err != nil {
		return nil, fmt.Errorf("erro ao salvar trilha educacional: %w", err)
	}

	return trail, nil
}

func (s *RoadmapService) GetEducationalTrailByRoadmapItemID(roadmapItemID int64) (*models.EducationalTrail, error) {
	return s.educationalTrailRepo.GetByRoadmapItemID(roadmapItemID)
}

func (s *RoadmapService) DeleteEducationalTrail(roadmapItemID int64) error {
	return s.educationalTrailRepo.DeleteByRoadmapItemID(roadmapItemID)
}

func (s *RoadmapService) UpdateTrailActivityCompleted(activityID int64, completed bool) error {
	return s.educationalTrailRepo.UpdateActivityCompleted(activityID, completed)
}

