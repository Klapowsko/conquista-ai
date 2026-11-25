package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

// ShopService cuida da loja de recompensas e da carteira do casal.
type ShopService struct {
	db      *sql.DB
	rewards *repositories.RewardRepository
	wallet  *repositories.WalletRepository
}

func NewShopService(db *sql.DB, rewards *repositories.RewardRepository, wallet *repositories.WalletRepository) *ShopService {
	return &ShopService{db: db, rewards: rewards, wallet: wallet}
}

func (s *ShopService) Wallet() (models.Wallet, error) {
	return s.wallet.Summary()
}

func (s *ShopService) History(limit int) ([]models.WalletTransaction, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	return s.wallet.List(limit)
}

func (s *ShopService) ListRewards() ([]models.Reward, error) {
	return s.rewards.List()
}

func (s *ShopService) getReward(id int64) (*models.Reward, error) {
	rw, err := s.rewards.GetByID(id)
	if err != nil {
		return nil, err
	}
	if rw == nil {
		return nil, ErrNotFound
	}
	return rw, nil
}

func fillReward(rw *models.Reward, req models.RewardRequest) error {
	name, err := requireText(req.Name, "nome")
	if err != nil {
		return err
	}
	if req.Cost <= 0 {
		return invalid("o preço deve ser maior que zero")
	}
	icon := strings.TrimSpace(req.Icon)
	if icon == "" {
		icon = "🎁"
	}
	if len([]rune(icon)) > 16 {
		return invalid("ícone muito longo: use um emoji")
	}
	rw.Name, rw.Description, rw.Icon, rw.Cost = name, strings.TrimSpace(req.Description), icon, req.Cost
	return nil
}

func (s *ShopService) CreateReward(req models.RewardRequest) (*models.Reward, error) {
	var rw models.Reward
	if err := fillReward(&rw, req); err != nil {
		return nil, err
	}
	if err := s.rewards.Create(&rw); err != nil {
		return nil, err
	}
	return &rw, nil
}

func (s *ShopService) UpdateReward(id int64, req models.RewardRequest) (*models.Reward, error) {
	rw, err := s.getReward(id)
	if err != nil {
		return nil, err
	}
	if err := fillReward(rw, req); err != nil {
		return nil, err
	}
	if err := s.rewards.Update(rw); err != nil {
		return nil, err
	}
	return rw, nil
}

// DeleteReward remove o item da loja; o histórico de compras é mantido.
func (s *ShopService) DeleteReward(id int64) error {
	ok, err := s.rewards.Delete(id)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}

// Purchase compra a recompensa, descontando o preço do saldo.
func (s *ShopService) Purchase(id int64) (models.PurchaseResult, error) {
	var res models.PurchaseResult
	err := repositories.InTx(s.db, func(tx *sql.Tx) error {
		w := s.wallet.WithTx(tx)
		if err := w.Lock(); err != nil {
			return err
		}
		rw, err := s.rewards.WithTx(tx).GetByID(id)
		if err != nil {
			return err
		}
		if rw == nil {
			return ErrNotFound
		}
		wallet, err := w.Summary()
		if err != nil {
			return err
		}
		if wallet.Coins < rw.Cost {
			return fmt.Errorf("%w: faltam %d moedas para %q", ErrInsufficientCoins, rw.Cost-wallet.Coins, rw.Name)
		}
		t := models.WalletTransaction{
			Type:        models.TxRewardPurchased,
			Coins:       -rw.Cost,
			Description: fmt.Sprintf("%s %s", rw.Icon, rw.Name),
			RewardID:    &rw.ID,
		}
		if err := w.Add(&t); err != nil {
			return err
		}
		res.Reward, res.Transaction = *rw, t
		res.Wallet, err = w.Summary()
		return err
	})
	return res, err
}
