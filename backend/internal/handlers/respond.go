package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
)

// respondError traduz erros dos services para status HTTP.
func respondError(c *gin.Context, err error, notFoundMsg string) {
	var verr services.ValidationError
	switch {
	case errors.As(err, &verr):
		c.JSON(http.StatusBadRequest, gin.H{"error": verr.Msg})
	case errors.Is(err, services.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": notFoundMsg})
	case errors.Is(err, services.ErrInsufficientCoins):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
	default:
		log.Printf("erro interno em %s %s: %v", c.Request.Method, c.FullPath(), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno, tente novamente"})
	}
}

func paramID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return 0, false
	}
	return id, true
}

func bindJSON(c *gin.Context, dst any) bool {
	if err := c.ShouldBindJSON(dst); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos: preencha os campos obrigatórios"})
		return false
	}
	return true
}
