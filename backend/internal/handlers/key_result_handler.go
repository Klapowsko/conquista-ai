package handlers

import (
	"net/http"
	"strconv"
	"time"

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

	// Processar expected_completion_date se fornecido
	if req.ExpectedCompletionDate != nil && *req.ExpectedCompletionDate != "" {
		parsedDate, err := time.Parse("2006-01-02", *req.ExpectedCompletionDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "formato de data de conclusão inválido. Use YYYY-MM-DD"})
			return
		}
		keyResult.ExpectedCompletionDate = &parsedDate
	} else {
		// Se não foi fornecida data, calcular automaticamente baseado no OKR
		if okr.CompletionDate != nil {
			// Buscar todos os Key Results existentes do OKR
			existingKeyResults, err := h.repo.GetByOKRID(req.OKRID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar Key Results existentes"})
				return
			}
			
			// Contar quantos Key Results não têm data definida (incluindo o que está sendo criado)
			keyResultsWithoutDate := 0
			for _, kr := range existingKeyResults {
				if kr.ExpectedCompletionDate == nil {
					keyResultsWithoutDate++
				}
			}
			// Adicionar 1 para o Key Result que está sendo criado
			keyResultsWithoutDate++
			
			now := time.Now()
			completionDate := *okr.CompletionDate
			daysRemaining := int(completionDate.Sub(now).Hours() / 24)
			
			if daysRemaining > 0 && keyResultsWithoutDate > 0 {
				// Dividir o tempo pelo número de Key Results sem data
				daysPerKeyResult := daysRemaining / keyResultsWithoutDate
				
				// Calcular a posição deste Key Result na sequência (último)
				position := keyResultsWithoutDate - 1
				
				// Calcular dias acumulados até este Key Result
				accumulatedDays := 0
				for i := 0; i <= position; i++ {
					daysForThisKR := daysPerKeyResult
					// Se houver resto na divisão, distribuir nos primeiros Key Results
					if i < daysRemaining%keyResultsWithoutDate {
						daysForThisKR++
					}
					accumulatedDays += daysForThisKR
				}
				
				// Calcular data esperada: hoje + dias acumulados até este Key Result
				expectedDate := now.AddDate(0, 0, accumulatedDays)
				keyResult.ExpectedCompletionDate = &expectedDate
			} else if daysRemaining > 0 {
				// Se a data já passou, usar a data de conclusão do OKR
				keyResult.ExpectedCompletionDate = okr.CompletionDate
			}
		}
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

	// Buscar OKR para calcular expected_completion_date
	okr, err := h.okrRepo.GetByID(okrID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar OKR"})
		return
	}

	// Calcular expected_completion_date apenas para Key Results que não têm data definida
	if okr != nil && okr.CompletionDate != nil && len(keyResults) > 0 {
		now := time.Now()
		completionDate := *okr.CompletionDate
		
		// Calcular dias restantes do OKR
		daysRemaining := int(completionDate.Sub(now).Hours() / 24)
		
		// Contar quantos Key Results não têm data definida
		keyResultsWithoutDate := make([]int, 0)
		for i := range keyResults {
			if keyResults[i].ExpectedCompletionDate == nil {
				keyResultsWithoutDate = append(keyResultsWithoutDate, i)
			}
		}
		
		if len(keyResultsWithoutDate) > 0 && daysRemaining > 0 {
			// Dividir o tempo pelo número de Key Results sem data
			daysPerKeyResult := daysRemaining / len(keyResultsWithoutDate)
			
			// Distribuir progressivamente apenas para os que não têm data
			accumulatedDays := 0
			for idx, i := range keyResultsWithoutDate {
				// Calcular dias acumulados até este Key Result
				daysForThisKR := daysPerKeyResult
				
				// Se houver resto na divisão, distribuir nos primeiros Key Results
				if idx < daysRemaining%len(keyResultsWithoutDate) {
					daysForThisKR++
				}
				
				accumulatedDays += daysForThisKR
				
				// Calcular data esperada: hoje + dias acumulados até este Key Result
				expectedDate := now.AddDate(0, 0, accumulatedDays)
				keyResults[i].ExpectedCompletionDate = &expectedDate
			}
		} else if len(keyResultsWithoutDate) > 0 {
			// Se a data já passou, usar a data de conclusão do OKR
			for _, i := range keyResultsWithoutDate {
				keyResults[i].ExpectedCompletionDate = okr.CompletionDate
			}
		}
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

