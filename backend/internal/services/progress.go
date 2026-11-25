package services

import (
	"database/sql"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

// runProgress executa uma mudança de progresso numa transação e devolve
// quanto a carteira mudou e se o casal subiu de nível.
func runProgress(
	db *sql.DB,
	wallet *repositories.WalletRepository,
	fn func(tx *sql.Tx, w *repositories.WalletRepository) (gamification.Reward, error),
) (models.ProgressResult, error) {
	var res models.ProgressResult
	err := repositories.InTx(db, func(tx *sql.Tx) error {
		w := wallet.WithTx(tx)
		if err := w.Lock(); err != nil {
			return err
		}
		before, err := w.Summary()
		if err != nil {
			return err
		}
		change, err := fn(tx, w)
		if err != nil {
			return err
		}
		after, err := w.Summary()
		if err != nil {
			return err
		}
		res.Change = change
		res.Wallet = after
		res.LevelUp = after.Level.Level > before.Level.Level
		return nil
	})
	return res, err
}

func negate(r gamification.Reward) gamification.Reward {
	return gamification.Reward{Coins: -r.Coins, XP: -r.XP}
}
