package services

import (
	"fmt"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/services/spellbook"
)

type RoadmapService struct {
	roadmapRepo              *repositories.RoadmapRepository
	educationalRoadmapRepo   *repositories.EducationalRoadmapRepository
	keyResultRepo            *repositories.KeyResultRepository
	spellbookClient          *spellbook.Client
}

func NewRoadmapService(
	roadmapRepo *repositories.RoadmapRepository,
	educationalRoadmapRepo *repositories.EducationalRoadmapRepository,
	keyResultRepo *repositories.KeyResultRepository,
	spellbookClient *spellbook.Client,
) *RoadmapService {
	return &RoadmapService{
		roadmapRepo:            roadmapRepo,
		educationalRoadmapRepo:  educationalRoadmapRepo,
		keyResultRepo:          keyResultRepo,
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

	// Gerar roadmap via Spellbook
	roadmapResp, err := s.spellbookClient.GenerateRoadmap(kr.Title)
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

