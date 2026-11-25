package routes

import (
	"github.com/conquista-ai/conquista-ai/internal/handlers"
	"github.com/conquista-ai/conquista-ai/internal/middleware"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Category  *handlers.CategoryHandler
	Goal      *handlers.GoalHandler
	Milestone *handlers.MilestoneHandler
	Shop      *handlers.ShopHandler
}

func SetupRoutes(router *gin.Engine, h Handlers) {
	middleware.SetupCORS(router)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "conquista-ai"})
	})

	api := router.Group("/api/v1")

	// Categorias (fixas: Pessoal, Profissional, Social)
	api.GET("/categories", h.Category.GetAll)
	api.POST("/categories", h.Category.Create)
	api.GET("/categories/:id", h.Category.GetByID)
	api.PUT("/categories/:id", h.Category.Update)
	api.DELETE("/categories/:id", h.Category.Delete)

	// Objetivos
	api.GET("/goals", h.Goal.List)
	api.POST("/goals", h.Goal.Create)
	api.GET("/goals/:id", h.Goal.Get)
	api.PUT("/goals/:id", h.Goal.Update)
	api.DELETE("/goals/:id", h.Goal.Delete)
	api.POST("/goals/:id/complete", h.Goal.Complete)
	api.POST("/goals/:id/reopen", h.Goal.Reopen)
	api.GET("/goals/:id/milestones", h.Goal.Milestones)

	// Metas
	api.GET("/milestones", h.Milestone.List)
	api.POST("/milestones", h.Milestone.Create)
	api.PUT("/milestones/:id", h.Milestone.Update)
	api.DELETE("/milestones/:id", h.Milestone.Delete)
	api.POST("/milestones/:id/complete", h.Milestone.Complete)
	api.POST("/milestones/:id/reopen", h.Milestone.Reopen)

	// Carteira, regras e loja
	api.GET("/gamification/rules", h.Shop.Rules)
	api.GET("/wallet", h.Shop.Wallet)
	api.GET("/wallet/transactions", h.Shop.History)
	api.GET("/rewards", h.Shop.ListRewards)
	api.POST("/rewards", h.Shop.CreateReward)
	api.PUT("/rewards/:id", h.Shop.UpdateReward)
	api.DELETE("/rewards/:id", h.Shop.DeleteReward)
	api.POST("/rewards/:id/purchase", h.Shop.Purchase)
}
