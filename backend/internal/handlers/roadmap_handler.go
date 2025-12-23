package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/conquista-ai/conquista-ai/internal/services"
)

type RoadmapHandler struct {
	service *services.RoadmapService
}

func NewRoadmapHandler(service *services.RoadmapService) *RoadmapHandler {
	return &RoadmapHandler{service: service}
}

func (h *RoadmapHandler) GenerateRoadmap(c *gin.Context) {
	keyResultID, err := strconv.ParseInt(c.Param("key_result_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	roadmap, err := h.service.GenerateRoadmap(keyResultID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, roadmap)
}

func (h *RoadmapHandler) GetByKeyResultID(c *gin.Context) {
	keyResultID, err := strconv.ParseInt(c.Param("key_result_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	roadmap, err := h.service.GetRoadmapByKeyResultID(keyResultID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar roadmap"})
		return
	}

	if roadmap == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "roadmap não encontrado"})
		return
	}

	c.JSON(http.StatusOK, roadmap)
}

func (h *RoadmapHandler) UpdateItem(c *gin.Context) {
	itemID, err := strconv.ParseInt(c.Param("item_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req struct {
		Completed bool `json:"completed"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	if err := h.service.UpdateRoadmapItem(itemID, req.Completed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item atualizado com sucesso"})
}

