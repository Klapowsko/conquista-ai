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

	// Calcular tempo disponível do Key Result
	var availableDays *int
	now := time.Now()
	
	// Prioridade 1: Usar expected_completion_date do Key Result se disponível
	if kr.ExpectedCompletionDate != nil {
		expectedDate := *kr.ExpectedCompletionDate
		daysRemaining := int(expectedDate.Sub(now).Hours() / 24)
		
		if daysRemaining > 0 {
			// Aplicar limite mínimo de 3 dias para evitar roadmaps muito curtos
			if daysRemaining < 3 {
				daysRemaining = 3
			}
			availableDays = &daysRemaining
		}
	}
	
	// Prioridade 2: Se não tiver expected_completion_date, calcular baseado no OKR
	if availableDays == nil {
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
				completionDate := *okr.CompletionDate
				
				// Calcular dias restantes
				daysRemaining := int(completionDate.Sub(now).Hours() / 24)
				
				if daysRemaining > 0 {
					// Dividir o tempo pelo número de Key Results
					calculatedDays := daysRemaining / totalKeyResults
					
					// Aplicar limite mínimo de 3 dias para evitar roadmaps muito curtos
					if calculatedDays < 3 {
						calculatedDays = 3
					}
					
					availableDays = &calculatedDays
				}
			}
		}
	}
	
	// Se não calculou tempo ou completion_date é nulo/passado, usar padrão de 30 dias para roadmap
	if availableDays == nil {
		defaultDays := 30
		availableDays = &defaultDays
	}

	// Calcular número de itens baseado no tempo disponível
	// Cada item do roadmap se tornará uma trilha educacional com tempo específico
	// Definir tempo mínimo por trilha baseado no tempo disponível
	var minDaysPerTrail int
	if *availableDays < 14 {
		// Tempo curto: trilhas curtas (3 dias)
		minDaysPerTrail = 3
	} else if *availableDays <= 30 {
		// Tempo médio: trilhas médias (5 dias)
		minDaysPerTrail = 5
	} else if *availableDays <= 60 {
		// Tempo médio-longo: trilhas mais longas (6 dias)
		minDaysPerTrail = 6
	} else {
		// Tempo longo: trilhas extensas (7 dias)
		minDaysPerTrail = 7
	}

	// Calcular número de itens: dividir tempo disponível pelo tempo mínimo por trilha
	exactItemCount := *availableDays / minDaysPerTrail

	// Garantir limites: mínimo de 3 itens, máximo de 20 itens
	if exactItemCount < 3 {
		exactItemCount = 3
	} else if exactItemCount > 20 {
		exactItemCount = 20
	}

	// Log para debug
	estimatedDaysPerTrail := *availableDays / exactItemCount
	if kr.ExpectedCompletionDate != nil {
		fmt.Printf("[DEBUG] GenerateRoadmap - KeyResultID: %d, ExpectedCompletionDate: %v, AvailableDays: %d, ExactItemCount: %d, MinDaysPerTrail: %d, EstimatedDaysPerTrail: %d\n", 
			keyResultID, *kr.ExpectedCompletionDate, *availableDays, exactItemCount, minDaysPerTrail, estimatedDaysPerTrail)
	} else {
		fmt.Printf("[DEBUG] GenerateRoadmap - KeyResultID: %d, ExpectedCompletionDate: nil, AvailableDays: %d (calculado do OKR), ExactItemCount: %d, MinDaysPerTrail: %d, EstimatedDaysPerTrail: %d\n", 
			keyResultID, *availableDays, exactItemCount, minDaysPerTrail, estimatedDaysPerTrail)
	}

	// Gerar roadmap via Spellbook passando o número exato de itens
	roadmapResp, err := s.spellbookClient.GenerateRoadmap(kr.Title, availableDays, &exactItemCount)
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar roadmap: %w", err)
	}

	// Contar itens gerados para debug
	totalItemsGenerated := 0
	for _, cat := range roadmapResp.Roadmap {
		totalItemsGenerated += len(cat.Items)
	}
	fmt.Printf("[DEBUG] GenerateRoadmap - KeyResultID: %d, TotalItemsGenerated: %d, ExpectedExactItems: %d\n", 
		keyResultID, totalItemsGenerated, exactItemCount)

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

func (s *RoadmapService) DeleteRoadmap(keyResultID int64) error {
	// Verificar se roadmap existe antes de deletar
	existing, err := s.roadmapRepo.GetByKeyResultID(keyResultID)
	if err != nil {
		return fmt.Errorf("erro ao verificar roadmap existente: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("roadmap não encontrado para key_result_id %d", keyResultID)
	}
	
	return s.roadmapRepo.DeleteByKeyResultID(keyResultID)
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

	// Buscar OKR, Key Result e calcular tempo disponível
	okr, keyResult, totalKeyResults, totalRoadmapItems, err := s.roadmapRepo.GetOKRByRoadmapItemID(roadmapItemID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar OKR: %w", err)
	}

	var availableDays *int
	now := time.Now()
	
	// Prioridade 1: Usar expected_completion_date do Key Result se disponível
	if keyResult != nil && keyResult.ExpectedCompletionDate != nil {
		expectedDate := *keyResult.ExpectedCompletionDate
		daysRemaining := int(expectedDate.Sub(now).Hours() / 24)
		
		fmt.Printf("[DEBUG] GenerateEducationalTrail - RoadmapItemID: %d, KeyResultExpectedDate: %v, DaysRemaining: %d, TotalRoadmapItems: %d\n", 
			roadmapItemID, expectedDate, daysRemaining, totalRoadmapItems)
		
		if daysRemaining > 0 && totalRoadmapItems > 0 {
			// Dividir o tempo do Key Result diretamente pelo número total de itens do roadmap
			// Na estrutura de grade curricular, todos os itens (aulas) devem ter conteúdo (trilhas)
			calculatedDays := daysRemaining / totalRoadmapItems
			
			fmt.Printf("[DEBUG] GenerateEducationalTrail - CalculatedDays (before limits): %d (DaysRemaining: %d / TotalItems: %d)\n", 
				calculatedDays, daysRemaining, totalRoadmapItems)
			
			// Aplicar limites: mínimo 3 dias, máximo 30 dias
			if calculatedDays < 3 {
				calculatedDays = 3
			} else if calculatedDays > 30 {
				calculatedDays = 30
			}
			
			fmt.Printf("[DEBUG] GenerateEducationalTrail - FinalAvailableDays: %d\n", calculatedDays)
			availableDays = &calculatedDays
		} else if daysRemaining > 0 {
			// Se não houver itens no roadmap, usar o tempo do Key Result diretamente
			if daysRemaining < 3 {
				daysRemaining = 3
			} else if daysRemaining > 30 {
				daysRemaining = 30
			}
			availableDays = &daysRemaining
		}
	}
	
	// Prioridade 2: Se não tiver expected_completion_date do Key Result, calcular baseado no OKR
	if availableDays == nil && okr != nil && okr.CompletionDate != nil && totalKeyResults > 0 {
		completionDate := *okr.CompletionDate
		
		// Calcular dias restantes do OKR
		daysRemaining := int(completionDate.Sub(now).Hours() / 24)
		
		if daysRemaining > 0 {
			// Primeiro dividir o tempo pelo número de Key Results (tempo do Key Result)
			daysPerKeyResult := daysRemaining / totalKeyResults
			
			// Depois dividir pelo número total de itens do roadmap
			// Na estrutura de grade curricular, todos os itens (aulas) devem ter conteúdo (trilhas)
			if totalRoadmapItems > 0 {
				// Dividir o tempo do Key Result diretamente pelo número total de itens
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
	
	// Se não calculou tempo ou completion_date é nulo/passado, usar padrão de 3 dias (mínimo)
	if availableDays == nil {
		defaultDays := 3
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

