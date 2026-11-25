package models

import (
	"time"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
)

type TransactionType string

const (
	TxMilestoneCompleted TransactionType = "milestone_completed"
	TxMilestoneReopened  TransactionType = "milestone_reopened"
	TxGoalCompleted      TransactionType = "goal_completed"
	TxGoalReopened       TransactionType = "goal_reopened"
	TxRewardPurchased    TransactionType = "reward_purchased"
)

// WalletTransaction é uma linha do livro-razão da carteira do casal.
type WalletTransaction struct {
	ID          int64           `json:"id"`
	Type        TransactionType `json:"type"`
	Coins       int             `json:"coins"`
	XP          int             `json:"xp"`
	Description string          `json:"description"`
	GoalID      *int64          `json:"goal_id"`
	MilestoneID *int64          `json:"milestone_id"`
	RewardID    *int64          `json:"reward_id"`
	CreatedAt   time.Time       `json:"created_at"`
}

// Wallet é o resumo da carteira: saldo de moedas e nível.
type Wallet struct {
	Coins       int `json:"coins"`
	TotalEarned int `json:"total_earned"`
	TotalSpent  int `json:"total_spent"`
	Purchases   int `json:"purchases"`
	gamification.Level
}

// ProgressResult é devolvido ao concluir/reabrir algo, para a tela mostrar o ganho.
type ProgressResult struct {
	Change    gamification.Reward `json:"change"`
	LevelUp   bool                `json:"level_up"`
	Wallet    Wallet              `json:"wallet"`
	Goal      *Goal               `json:"goal,omitempty"`
	Milestone *Milestone          `json:"milestone,omitempty"`
}

type PurchaseResult struct {
	Reward      Reward            `json:"reward"`
	Transaction WalletTransaction `json:"transaction"`
	Wallet      Wallet            `json:"wallet"`
}
