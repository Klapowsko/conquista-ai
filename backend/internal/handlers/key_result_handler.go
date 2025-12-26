package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

type KeyResultHandler struct {
	repo     *repositories.KeyResultRepository
	okrRepo  *repositories.OKRRepository
}

func NewKeyResultHandler(repo *repositories.KeyResultRepository, okrRepo *repositories.OKRRepository) *KeyResultHandler {
	return &KeyResultHandler{
		repo:    repo,
		okrRepo: okrRepo,
	}
}

func (h *KeyResultHandler) Create(c *gin.Context) {
	var req models.CreateKeyResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	// Validar se o OKR existe
	okr, err := h.okrRepo.GetByID(req.OKRID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar OKR"})
		return
	}
	if okr == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "OKR não encontrado"})
		return
	}

	keyResult := &models.KeyResult{
		OKRID:     req.OKRID,
		Title:     req.Title,
		Completed: false,
	}

	if err := h.repo.Create(keyResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao criar Key Result"})
		return
	}

	c.JSON(http.StatusCreated, keyResult)
}

func (h *KeyResultHandler) GetByOKRID(c *gin.Context) {
	okrID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	keyResults, err := h.repo.GetByOKRID(okrID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar Key Results"})
		return
	}

	c.JSON(http.StatusOK, keyResults)
}

func (h *KeyResultHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req models.UpdateKeyResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	kr, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar Key Result"})
		return
	}

	if kr == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key Result não encontrado"})
		return
	}

	kr.Title = req.Title
	kr.Completed = req.Completed

	if err := h.repo.Update(kr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar Key Result"})
		return
	}

	c.JSON(http.StatusOK, kr)
}

func (h *KeyResultHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao deletar Key Result"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Key Result deletado com sucesso"})
}

