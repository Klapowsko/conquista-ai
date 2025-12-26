package services

import (
	"fmt"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/services/spellbook"
)

type OKRService struct {
	okrRepo         *repositories.OKRRepository
	keyResultRepo   *repositories.KeyResultRepository
	categoryRepo    *repositories.CategoryRepository
	spellbookClient *spellbook.Client
}

func NewOKRService(
	okrRepo *repositories.OKRRepository,
	keyResultRepo *repositories.KeyResultRepository,
	categoryRepo *repositories.CategoryRepository,
	spellbookClient *spellbook.Client,
) *OKRService {
	return &OKRService{
		okrRepo:         okrRepo,
		keyResultRepo:   keyResultRepo,
		categoryRepo:    categoryRepo,
		spellbookClient: spellbookClient,
	}
}

func (s *OKRService) CreateOKR(req models.CreateOKRRequest) (*models.OKR, error) {
	// Verificar se categoria existe
	category, err := s.categoryRepo.GetByID(req.CategoryID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if category == nil {
		return nil, fmt.Errorf("categoria não encontrada")
	}

	okr := &models.OKR{
		Objective:  req.Objective,
		CategoryID: req.CategoryID,
	}

	if err := s.okrRepo.Create(okr); err != nil {
		return nil, fmt.Errorf("erro ao criar OKR: %w", err)
	}

	return okr, nil
}

func (s *OKRService) generateKeyResults(okrID int64, objective string) error {
	// Usar o endpoint /key-results do Spellbook para gerar Key Results
	keyResultsResp, err := s.spellbookClient.GenerateKeyResults(objective, 5)
	if err != nil {
		return fmt.Errorf("erro ao gerar Key Results: %w", err)
	}

	var keyResults []models.KeyResult
	for _, keyResult := range keyResultsResp.KeyResults {
		keyResults = append(keyResults, models.KeyResult{
			OKRID:     okrID,
			Title:     keyResult,
			Completed: false,
		})
	}

	if len(keyResults) > 0 {
		return s.keyResultRepo.CreateBatch(keyResults)
	}

	return nil
}

func (s *OKRService) GetAllOKRs() ([]models.OKR, error) {
	return s.okrRepo.GetAll()
}

func (s *OKRService) GetOKRByID(id int64) (*models.OKR, error) {
	return s.okrRepo.GetByID(id)
}

func (s *OKRService) GetOKRsByCategory(categoryID int64) ([]models.OKR, error) {
	return s.okrRepo.GetByCategoryID(categoryID)
}

func (s *OKRService) UpdateOKR(id int64, req models.UpdateOKRRequest) (*models.OKR, error) {
	okr, err := s.okrRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar OKR: %w", err)
	}
	if okr == nil {
		return nil, fmt.Errorf("OKR não encontrado")
	}

	okr.Objective = req.Objective
	okr.CategoryID = req.CategoryID

	if err := s.okrRepo.Update(okr); err != nil {
		return nil, fmt.Errorf("erro ao atualizar OKR: %w", err)
	}

	return okr, nil
}

func (s *OKRService) DeleteOKR(id int64) error {
	return s.okrRepo.Delete(id)
}

func (s *OKRService) GenerateKeyResults(okrID int64) error {
	okr, err := s.okrRepo.GetByID(okrID)
	if err != nil {
		return fmt.Errorf("erro ao buscar OKR: %w", err)
	}
	if okr == nil {
		return fmt.Errorf("OKR não encontrado")
	}

	return s.generateKeyResults(okrID, okr.Objective)
}
