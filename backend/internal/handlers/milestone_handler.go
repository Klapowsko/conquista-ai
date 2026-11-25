package handlers

import (
	"net/http"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
)

const milestoneNotFound = "meta não encontrada"

type MilestoneHandler struct {
	milestones *services.MilestoneService
}

func NewMilestoneHandler(milestones *services.MilestoneService) *MilestoneHandler {
	return &MilestoneHandler{milestones: milestones}
}

func (h *MilestoneHandler) List(c *gin.Context) {
	list, err := h.milestones.ListAll()
	if err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *MilestoneHandler) Create(c *gin.Context) {
	var req models.CreateMilestoneRequest
	if !bindJSON(c, &req) {
		return
	}
	m, err := h.milestones.Create(req)
	if err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusCreated, m)
}

func (h *MilestoneHandler) Update(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	var req models.UpdateMilestoneRequest
	if !bindJSON(c, &req) {
		return
	}
	m, err := h.milestones.Update(id, req)
	if err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusOK, m)
}

func (h *MilestoneHandler) Delete(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	if err := h.milestones.Delete(id); err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "meta removida"})
}

func (h *MilestoneHandler) Complete(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	res, err := h.milestones.Complete(id)
	if err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *MilestoneHandler) Reopen(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	res, err := h.milestones.Reopen(id)
	if err != nil {
		respondError(c, err, milestoneNotFound)
		return
	}
	c.JSON(http.StatusOK, res)
}
