package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/conquista-ai/conquista-ai/internal/models"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
)

type CategoryHandler struct {
	repo *repositories.CategoryRepository
}

func NewCategoryHandler(repo *repositories.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) Create(c *gin.Context) {
	// Categorias são fixas e não podem ser criadas
	c.JSON(http.StatusForbidden, gin.H{"error": "categorias são fixas e não podem ser criadas. Use apenas: Pessoal, Profissional ou Social"})
}

func (h *CategoryHandler) GetAll(c *gin.Context) {
	categories, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar categorias"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	category, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar categoria"})
		return
	}

	if category == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "categoria não encontrada"})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos"})
		return
	}

	category, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar categoria"})
		return
	}

	if category == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "categoria não encontrada"})
		return
	}

	category.Name = req.Name
	if err := h.repo.Update(category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar categoria"})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	// Categorias são fixas e não podem ser deletadas
	c.JSON(http.StatusForbidden, gin.H{"error": "categorias são fixas e não podem ser deletadas"})
}

