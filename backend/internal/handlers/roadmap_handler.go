package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
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

func (h *RoadmapHandler) GenerateEducationalRoadmap(c *gin.Context) {
	var req struct {
		RoadmapItemID int64  `json:"roadmap_item_id" binding:"required"`
		ItemTitle     string `json:"item_title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "roadmap_item_id e item_title são obrigatórios"})
		return
	}

	educationalRoadmap, err := h.service.GenerateEducationalRoadmap(req.RoadmapItemID, req.ItemTitle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, educationalRoadmap)
}

func (h *RoadmapHandler) GetEducationalRoadmapByRoadmapItemID(c *gin.Context) {
	roadmapItemID, err := strconv.ParseInt(c.Param("roadmap_item_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	educationalRoadmap, err := h.service.GetEducationalRoadmapByRoadmapItemID(roadmapItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar roadmap educacional"})
		return
	}

	if educationalRoadmap == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "roadmap educacional não encontrado"})
		return
	}

	c.JSON(http.StatusOK, educationalRoadmap)
}

func (h *RoadmapHandler) UpdateEducationalResource(c *gin.Context) {
	resourceID, err := strconv.ParseInt(c.Param("resource_id"), 10, 64)
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

	if err := h.service.UpdateEducationalResourceCompleted(resourceID, req.Completed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar recurso"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "recurso atualizado com sucesso"})
}

func (h *RoadmapHandler) GenerateEducationalTrail(c *gin.Context) {
	var req struct {
		RoadmapItemID int64  `json:"roadmap_item_id" binding:"required"`
		ItemTitle     string `json:"item_title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "roadmap_item_id e item_title são obrigatórios"})
		return
	}

	trail, err := h.service.GenerateEducationalTrail(req.RoadmapItemID, req.ItemTitle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trail)
}

func (h *RoadmapHandler) GetEducationalTrailByRoadmapItemID(c *gin.Context) {
	roadmapItemID, err := strconv.ParseInt(c.Param("roadmap_item_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	trail, err := h.service.GetEducationalTrailByRoadmapItemID(roadmapItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar trilha educacional"})
		return
	}

	if trail == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "trilha educacional não encontrada"})
		return
	}

	c.JSON(http.StatusOK, trail)
}

func (h *RoadmapHandler) UpdateTrailActivity(c *gin.Context) {
	activityID, err := strconv.ParseInt(c.Param("activity_id"), 10, 64)
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

	if err := h.service.UpdateTrailActivityCompleted(activityID, req.Completed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar atividade"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "atividade atualizada com sucesso"})
}

func (h *RoadmapHandler) DeleteEducationalTrail(c *gin.Context) {
	roadmapItemID, err := strconv.ParseInt(c.Param("roadmap_item_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DeleteEducationalTrail(roadmapItemID); err != nil {
		if err.Error() == fmt.Sprintf("trilha educacional não encontrada para roadmap_item_id %d", roadmapItemID) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao deletar trilha educacional"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "trilha educacional deletada com sucesso"})
}
