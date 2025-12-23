package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/services"
)

type OKRHandler struct {
	service *services.OKRService
}

func NewOKRHandler(service *services.OKRService) *OKRHandler {
	return &OKRHandler{service: service}
}

func (h *OKRHandler) Create(c *gin.Context) {
	var req models.CreateOKRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	okr, err := h.service.CreateOKR(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, okr)
}

func (h *OKRHandler) GetAll(c *gin.Context) {
	categoryID := c.Query("category_id")
	if categoryID != "" {
		id, err := strconv.ParseInt(categoryID, 10, 64)
		if err == nil {
			okrs, err := h.service.GetOKRsByCategory(id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar OKRs"})
				return
			}
			c.JSON(http.StatusOK, okrs)
			return
		}
	}

	okrs, err := h.service.GetAllOKRs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar OKRs"})
		return
	}

	c.JSON(http.StatusOK, okrs)
}

func (h *OKRHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	okr, err := h.service.GetOKRByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar OKR"})
		return
	}

	if okr == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "OKR não encontrado"})
		return
	}

	c.JSON(http.StatusOK, okr)
}

func (h *OKRHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req models.UpdateOKRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	okr, err := h.service.UpdateOKR(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, okr)
}

func (h *OKRHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.DeleteOKR(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao deletar OKR"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OKR deletado com sucesso"})
}

func (h *OKRHandler) GenerateKeyResults(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.service.GenerateKeyResults(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Key Results gerados com sucesso"})
}

