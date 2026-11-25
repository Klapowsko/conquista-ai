package handlers

import (
	"net/http"
	"strconv"

	"github.com/conquista-ai/conquista-ai/internal/gamification"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
)

const rewardNotFound = "recompensa não encontrada"

type ShopHandler struct {
	shop *services.ShopService
}

func NewShopHandler(shop *services.ShopService) *ShopHandler {
	return &ShopHandler{shop: shop}
}

// Rules expõe a tabela de moedas/XP por dificuldade e a regra de níveis.
func (h *ShopHandler) Rules(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"difficulties":      gamification.Rules,
		"xp_per_level_step": gamification.XPPerLevelStep,
	})
}

func (h *ShopHandler) Wallet(c *gin.Context) {
	w, err := h.shop.Wallet()
	if err != nil {
		respondError(c, err, "")
		return
	}
	c.JSON(http.StatusOK, w)
}

func (h *ShopHandler) History(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	list, err := h.shop.History(limit)
	if err != nil {
		respondError(c, err, "")
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ShopHandler) ListRewards(c *gin.Context) {
	list, err := h.shop.ListRewards()
	if err != nil {
		respondError(c, err, rewardNotFound)
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ShopHandler) CreateReward(c *gin.Context) {
	var req models.RewardRequest
	if !bindJSON(c, &req) {
		return
	}
	rw, err := h.shop.CreateReward(req)
	if err != nil {
		respondError(c, err, rewardNotFound)
		return
	}
	c.JSON(http.StatusCreated, rw)
}

func (h *ShopHandler) UpdateReward(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	var req models.RewardRequest
	if !bindJSON(c, &req) {
		return
	}
	rw, err := h.shop.UpdateReward(id, req)
	if err != nil {
		respondError(c, err, rewardNotFound)
		return
	}
	c.JSON(http.StatusOK, rw)
}

func (h *ShopHandler) DeleteReward(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	if err := h.shop.DeleteReward(id); err != nil {
		respondError(c, err, rewardNotFound)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "recompensa removida"})
}

func (h *ShopHandler) Purchase(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	res, err := h.shop.Purchase(id)
	if err != nil {
		respondError(c, err, rewardNotFound)
		return
	}
	c.JSON(http.StatusOK, res)
}
