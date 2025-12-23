package services

import (
	"fmt"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/services/spellbook"
)

type RoadmapService struct {
	roadmapRepo    *repositories.RoadmapRepository
	keyResultRepo  *repositories.KeyResultRepository
	spellbookClient *spellbook.Client
}

func NewRoadmapService(
	roadmapRepo *repositories.RoadmapRepository,
	keyResultRepo *repositories.KeyResultRepository,
	spellbookClient *spellbook.Client,
) *RoadmapService {
	return &RoadmapService{
		roadmapRepo:    roadmapRepo,
		keyResultRepo:  keyResultRepo,
		spellbookClient: spellbookClient,
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

