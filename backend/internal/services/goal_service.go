package services

import (
	"database/sql"
	"fmt"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

type GoalService struct {
	db         *sql.DB
	goals      *repositories.GoalRepository
	categories *repositories.CategoryRepository
	wallet     *repositories.WalletRepository
}

func NewGoalService(db *sql.DB, goals *repositories.GoalRepository, categories *repositories.CategoryRepository, wallet *repositories.WalletRepository) *GoalService {
	return &GoalService{db: db, goals: goals, categories: categories, wallet: wallet}
}

func (s *GoalService) List(categoryID int64) ([]models.Goal, error) {
	return s.goals.List(categoryID)
}

func (s *GoalService) Get(id int64) (*models.Goal, error) {
	g, err := s.goals.GetByID(id)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, ErrNotFound
	}
	return g, nil
}

func (s *GoalService) fromRequest(g *models.Goal, req models.GoalRequest) error {
	title, err := requireText(req.Title, "título")
	if err != nil {
		return err
	}
	difficulty, err := gamification.ParseDifficulty(req.Difficulty)
	if err != nil {
		return invalid(err.Error())
	}
	target, err := normalizeDate(req.TargetDate, "data limite")
	if err != nil {
		return err
	}
	category, err := s.categories.GetByID(req.CategoryID)
	if err != nil {
		return err
	}
	if category == nil {
		return invalid("categoria não encontrada")
	}
	g.Title = title
	g.Description = req.Description
	g.CategoryID = req.CategoryID
	g.Difficulty = difficulty
	g.TargetDate = target
	return nil
}

func (s *GoalService) Create(req models.GoalRequest) (*models.Goal, error) {
	var g models.Goal
	if err := s.fromRequest(&g, req); err != nil {
		return nil, err
	}
	if err := s.goals.Create(&g); err != nil {
		return nil, err
	}
	return s.Get(g.ID)
}

// Update não altera moedas já ganhas: estornos usam o valor registrado na carteira.
func (s *GoalService) Update(id int64, req models.GoalRequest) (*models.Goal, error) {
	g, err := s.Get(id)
	if err != nil {
		return nil, err
	}
	if err := s.fromRequest(g, req); err != nil {
		return nil, err
	}
	if err := s.goals.Update(g); err != nil {
		return nil, err
	}
	return s.Get(id)
}

// Delete remove o objetivo e suas metas. As moedas já ganhas continuam na carteira.
func (s *GoalService) Delete(id int64) error {
	ok, err := s.goals.Delete(id)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}

// Complete conclui o objetivo e paga o bônus conforme a dificuldade.
func (s *GoalService) Complete(id int64) (models.ProgressResult, error) {
	res, err := runProgress(s.db, s.wallet, func(tx *sql.Tx, w *repositories.WalletRepository) (gamification.Reward, error) {
		goals := s.goals.WithTx(tx)
		g, err := goals.GetByID(id)
		if err != nil {
			return gamification.Reward{}, err
		}
		if g == nil {
			return gamification.Reward{}, ErrNotFound
		}
		changed, err := goals.SetCompleted(id, true)
		if err != nil || !changed {
			return gamification.Reward{}, err // já estava concluído: nada a pagar
		}
		reward := gamification.GoalReward(g.Difficulty)
		return reward, w.Add(&models.WalletTransaction{
			Type:        models.TxGoalCompleted,
			Coins:       reward.Coins,
			XP:          reward.XP,
			Description: fmt.Sprintf("Objetivo concluído: %s", g.Title),
			GoalID:      &g.ID,
		})
	})
	if err != nil {
		return res, err
	}
	res.Goal, err = s.Get(id)
	return res, err
}

// Reopen desfaz a conclusão e estorna o bônus que tinha sido pago.
func (s *GoalService) Reopen(id int64) (models.ProgressResult, error) {
	res, err := runProgress(s.db, s.wallet, func(tx *sql.Tx, w *repositories.WalletRepository) (gamification.Reward, error) {
		goals := s.goals.WithTx(tx)
		g, err := goals.GetByID(id)
		if err != nil {
			return gamification.Reward{}, err
		}
		if g == nil {
			return gamification.Reward{}, ErrNotFound
		}
		changed, err := goals.SetCompleted(id, false)
		if err != nil || !changed {
			return gamification.Reward{}, err
		}
		net, err := w.NetForGoal(id)
		if err != nil || (net.Coins == 0 && net.XP == 0) {
			return gamification.Reward{}, err
		}
		change := negate(net)
		return change, w.Add(&models.WalletTransaction{
			Type:        models.TxGoalReopened,
			Coins:       change.Coins,
			XP:          change.XP,
			Description: fmt.Sprintf("Objetivo reaberto: %s", g.Title),
			GoalID:      &g.ID,
		})
	})
	if err != nil {
		return res, err
	}
	res.Goal, err = s.Get(id)
	return res, err
}
