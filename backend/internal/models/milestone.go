package models

import (
	"time"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
)

// Milestone é uma meta (etapa) dentro de um objetivo.
type Milestone struct {
	ID          int64      `json:"id"`
	GoalID      int64      `json:"goal_id"`
	Title       string     `json:"title"`
	Completed   bool       `json:"completed"`
	DueDate     *string    `json:"due_date"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// MilestoneWithGoal é usado na lista geral de metas.
type MilestoneWithGoal struct {
	Milestone
	GoalTitle       string                  `json:"goal_title"`
	GoalDifficulty  gamification.Difficulty `json:"goal_difficulty"`
	GoalTargetDate  *string                 `json:"goal_target_date"`
	GoalCompletedAt *time.Time              `json:"goal_completed_at"`
	Reward          gamification.Reward     `json:"reward"`
}

type CreateMilestoneRequest struct {
	GoalID  int64   `json:"goal_id" binding:"required"`
	Title   string  `json:"title" binding:"required"`
	DueDate *string `json:"due_date"`
}

type UpdateMilestoneRequest struct {
	Title   string  `json:"title" binding:"required"`
	DueDate *string `json:"due_date"`
}
