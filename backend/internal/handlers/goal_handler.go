package handlers

import (
	"net/http"
	"strconv"

	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
)

const goalNotFound = "objetivo não encontrado"

type GoalHandler struct {
	goals      *services.GoalService
	milestones *services.MilestoneService
}

func NewGoalHandler(goals *services.GoalService, milestones *services.MilestoneService) *GoalHandler {
	return &GoalHandler{goals: goals, milestones: milestones}
}

func (h *GoalHandler) List(c *gin.Context) {
	categoryID, _ := strconv.ParseInt(c.Query("category_id"), 10, 64)
	goals, err := h.goals.List(categoryID)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, goals)
}

func (h *GoalHandler) Get(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	g, err := h.goals.Get(id)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, g)
}

func (h *GoalHandler) Create(c *gin.Context) {
	var req models.GoalRequest
	if !bindJSON(c, &req) {
		return
	}
	g, err := h.goals.Create(req)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusCreated, g)
}

func (h *GoalHandler) Update(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	var req models.GoalRequest
	if !bindJSON(c, &req) {
		return
	}
	g, err := h.goals.Update(id, req)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, g)
}

func (h *GoalHandler) Delete(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	if err := h.goals.Delete(id); err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "objetivo removido"})
}

func (h *GoalHandler) Complete(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	res, err := h.goals.Complete(id)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *GoalHandler) Reopen(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	res, err := h.goals.Reopen(id)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *GoalHandler) Milestones(c *gin.Context) {
	id, ok := paramID(c)
	if !ok {
		return
	}
	list, err := h.milestones.ListByGoal(id)
	if err != nil {
		respondError(c, err, goalNotFound)
		return
	}
	c.JSON(http.StatusOK, list)
}
