package repositories

import (
	"database/sql"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
)

type WalletRepository struct {
	q Querier
}

func NewWalletRepository(q Querier) *WalletRepository {
	return &WalletRepository{q: q}
}

func (r *WalletRepository) WithTx(tx *sql.Tx) *WalletRepository {
	return &WalletRepository{q: tx}
}

// Lock serializa operações que dependem do saldo (ex.: compras simultâneas).
// Só tem efeito dentro de uma transação.
func (r *WalletRepository) Lock() error {
	_, err := r.q.Exec(`SELECT pg_advisory_xact_lock(7100)`)
	return err
}

func (r *WalletRepository) Summary() (models.Wallet, error) {
	var w models.Wallet
	var xp int
	err := r.q.QueryRow(`
		SELECT COALESCE(SUM(coins), 0),
		       COALESCE(SUM(xp), 0),
		       COALESCE(SUM(coins) FILTER (WHERE type <> 'reward_purchased'), 0),
		       COALESCE(-SUM(coins) FILTER (WHERE type = 'reward_purchased'), 0),
		       COUNT(*) FILTER (WHERE type = 'reward_purchased')
		FROM wallet_transactions`,
	).Scan(&w.Coins, &xp, &w.TotalEarned, &w.TotalSpent, &w.Purchases)
	if err != nil {
		return w, err
	}
	w.Level = gamification.LevelFromXP(xp)
	return w, nil
}

func (r *WalletRepository) Add(t *models.WalletTransaction) error {
	return r.q.QueryRow(`
		INSERT INTO wallet_transactions (type, coins, xp, description, goal_id, milestone_id, reward_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
		t.Type, t.Coins, t.XP, t.Description, t.GoalID, t.MilestoneID, t.RewardID,
	).Scan(&t.ID, &t.CreatedAt)
}

// NetForMilestone soma o que a meta já rendeu (ganhos menos estornos).
func (r *WalletRepository) NetForMilestone(milestoneID int64) (gamification.Reward, error) {
	var net gamification.Reward
	err := r.q.QueryRow(`
		SELECT COALESCE(SUM(coins), 0), COALESCE(SUM(xp), 0) FROM wallet_transactions
		WHERE milestone_id = $1 AND type IN ('milestone_completed', 'milestone_reopened')`,
		milestoneID).Scan(&net.Coins, &net.XP)
	return net, err
}

// NetForGoal soma o bônus de conclusão que o objetivo já rendeu (sem contar as metas).
func (r *WalletRepository) NetForGoal(goalID int64) (gamification.Reward, error) {
	var net gamification.Reward
	err := r.q.QueryRow(`
		SELECT COALESCE(SUM(coins), 0), COALESCE(SUM(xp), 0) FROM wallet_transactions
		WHERE goal_id = $1 AND type IN ('goal_completed', 'goal_reopened')`,
		goalID).Scan(&net.Coins, &net.XP)
	return net, err
}

func (r *WalletRepository) List(limit int) ([]models.WalletTransaction, error) {
	rows, err := r.q.Query(`
		SELECT id, type, coins, xp, description, goal_id, milestone_id, reward_id, created_at
		FROM wallet_transactions ORDER BY created_at DESC, id DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]models.WalletTransaction, 0)
	for rows.Next() {
		var t models.WalletTransaction
		if err := rows.Scan(&t.ID, &t.Type, &t.Coins, &t.XP, &t.Description,
			&t.GoalID, &t.MilestoneID, &t.RewardID, &t.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}
