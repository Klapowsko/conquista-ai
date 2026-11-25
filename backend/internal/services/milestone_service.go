package services

import (
	"database/sql"
	"fmt"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

type MilestoneService struct {
	db         *sql.DB
	milestones *repositories.MilestoneRepository
	goals      *repositories.GoalRepository
	wallet     *repositories.WalletRepository
}

func NewMilestoneService(db *sql.DB, milestones *repositories.MilestoneRepository, goals *repositories.GoalRepository, wallet *repositories.WalletRepository) *MilestoneService {
	return &MilestoneService{db: db, milestones: milestones, goals: goals, wallet: wallet}
}

func (s *MilestoneService) ListAll() ([]models.MilestoneWithGoal, error) {
	return s.milestones.ListAll()
}

func (s *MilestoneService) ListByGoal(goalID int64) ([]models.Milestone, error) {
	g, err := s.goals.GetByID(goalID)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, ErrNotFound
	}
	return s.milestones.ListByGoal(goalID)
}

func (s *MilestoneService) get(id int64) (*models.Milestone, error) {
	m, err := s.milestones.GetByID(id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, ErrNotFound
	}
	return m, nil
}

func (s *MilestoneService) Create(req models.CreateMilestoneRequest) (*models.Milestone, error) {
	title, err := requireText(req.Title, "título")
	if err != nil {
		return nil, err
	}
	due, err := normalizeDate(req.DueDate, "data")
	if err != nil {
		return nil, err
	}
	g, err := s.goals.GetByID(req.GoalID)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, invalid("objetivo não encontrado")
	}
	m := models.Milestone{GoalID: req.GoalID, Title: title, DueDate: due}
	if err := s.milestones.Create(&m); err != nil {
		return nil, err
	}
	return s.get(m.ID)
}

func (s *MilestoneService) Update(id int64, req models.UpdateMilestoneRequest) (*models.Milestone, error) {
	m, err := s.get(id)
	if err != nil {
		return nil, err
	}
	if m.Title, err = requireText(req.Title, "título"); err != nil {
		return nil, err
	}
	if m.DueDate, err = normalizeDate(req.DueDate, "data"); err != nil {
		return nil, err
	}
	if err := s.milestones.Update(m); err != nil {
		return nil, err
	}
	return s.get(id)
}

// Delete remove a meta. As moedas já ganhas com ela continuam na carteira.
func (s *MilestoneService) Delete(id int64) error {
	ok, err := s.milestones.Delete(id)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}

// Complete conclui a meta e paga moedas/XP conforme a dificuldade do objetivo.
func (s *MilestoneService) Complete(id int64) (models.ProgressResult, error) {
	return s.setCompleted(id, true)
}

// Reopen desmarca a meta e estorna exatamente o que ela tinha rendido.
func (s *MilestoneService) Reopen(id int64) (models.ProgressResult, error) {
	return s.setCompleted(id, false)
}

func (s *MilestoneService) setCompleted(id int64, completed bool) (models.ProgressResult, error) {
	res, err := runProgress(s.db, s.wallet, func(tx *sql.Tx, w *repositories.WalletRepository) (gamification.Reward, error) {
		milestones := s.milestones.WithTx(tx)
		m, err := milestones.GetByID(id)
		if err != nil {
			return gamification.Reward{}, err
		}
		if m == nil {
			return gamification.Reward{}, ErrNotFound
		}
		changed, err := milestones.SetCompleted(id, completed)
		if err != nil || !changed {
			return gamification.Reward{}, err // já estava no estado pedido
		}

		t := models.WalletTransaction{GoalID: &m.GoalID, MilestoneID: &m.ID}
		if completed {
			g, err := s.goals.WithTx(tx).GetByID(m.GoalID)
			if err != nil {
				return gamification.Reward{}, err
			}
			reward := gamification.MilestoneReward(g.Difficulty)
			t.Type, t.Coins, t.XP = models.TxMilestoneCompleted, reward.Coins, reward.XP
			t.Description = fmt.Sprintf("Meta concluída: %s", m.Title)
		} else {
			net, err := w.NetForMilestone(id)
			if err != nil || (net.Coins == 0 && net.XP == 0) {
				return gamification.Reward{}, err
			}
			change := negate(net)
			t.Type, t.Coins, t.XP = models.TxMilestoneReopened, change.Coins, change.XP
			t.Description = fmt.Sprintf("Meta reaberta: %s", m.Title)
		}
		return gamification.Reward{Coins: t.Coins, XP: t.XP}, w.Add(&t)
	})
	if err != nil {
		return res, err
	}
	res.Milestone, err = s.get(id)
	if err != nil {
		return res, err
	}
	res.Goal, err = s.goals.GetByID(res.Milestone.GoalID)
	return res, err
}
