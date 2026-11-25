package models

import (
	"time"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
)

// Goal é um objetivo do casal (ex.: "Juntar R$ 3.000 de reserva de emergência").
// Datas sem horário (target_date) trafegam como "YYYY-MM-DD".
type Goal struct {
	ID                  int64                   `json:"id"`
	Title               string                  `json:"title"`
	Description         string                  `json:"description"`
	CategoryID          int64                   `json:"category_id"`
	Category            *Category               `json:"category,omitempty"`
	Difficulty          gamification.Difficulty `json:"difficulty"`
	TargetDate          *string                 `json:"target_date"`
	CompletedAt         *time.Time              `json:"completed_at"`
	MilestonesTotal     int                     `json:"milestones_total"`
	MilestonesCompleted int                     `json:"milestones_completed"`
	Rewards             GoalRewards             `json:"rewards"`
	CreatedAt           time.Time               `json:"created_at"`
	UpdatedAt           time.Time               `json:"updated_at"`
}

// GoalRewards mostra quanto o objetivo paga, conforme a dificuldade.
type GoalRewards struct {
	PerMilestone gamification.Reward `json:"per_milestone"`
	OnComplete   gamification.Reward `json:"on_complete"`
}

func (g *Goal) FillRewards() {
	g.Rewards = GoalRewards{
		PerMilestone: gamification.MilestoneReward(g.Difficulty),
		OnComplete:   gamification.GoalReward(g.Difficulty),
	}
}

type GoalRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	CategoryID  int64   `json:"category_id" binding:"required"`
	Difficulty  string  `json:"difficulty" binding:"required"`
	TargetDate  *string `json:"target_date"`
}
