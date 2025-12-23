package routes

import (
	"github.com/conquista-ai/conquista-ai/internal/handlers"
	"github.com/conquista-ai/conquista-ai/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	categoryHandler *handlers.CategoryHandler,
	okrHandler *handlers.OKRHandler,
	keyResultHandler *handlers.KeyResultHandler,
	roadmapHandler *handlers.RoadmapHandler,
) {
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "conquista-ai",
		})
	})

	// API v1
	api := router.Group("/api/v1")
	{
		// Categories
		api.GET("/categories", categoryHandler.GetAll)
		api.POST("/categories", categoryHandler.Create)
		api.GET("/categories/:id", categoryHandler.GetByID)
		api.PUT("/categories/:id", categoryHandler.Update)
		api.DELETE("/categories/:id", categoryHandler.Delete)

		// OKRs
		api.GET("/okrs", okrHandler.GetAll)
		api.POST("/okrs", okrHandler.Create)

		// Rotas específicas de OKR (devem vir antes das genéricas)
		okrs := api.Group("/okrs/:id")
		{
			okrs.GET("", okrHandler.GetByID)
			okrs.PUT("", okrHandler.Update)
			okrs.DELETE("", okrHandler.Delete)
			okrs.POST("/generate-key-results", okrHandler.GenerateKeyResults)
			okrs.GET("/key-results", keyResultHandler.GetByOKRID)
		}
		api.PUT("/key-results/:id", keyResultHandler.Update)
		api.DELETE("/key-results/:id", keyResultHandler.Delete)

		// Roadmaps
		api.POST("/key-results/:key_result_id/roadmap", roadmapHandler.GenerateRoadmap)
		api.GET("/key-results/:key_result_id/roadmap", roadmapHandler.GetByKeyResultID)
		api.PUT("/roadmap-items/:item_id", roadmapHandler.UpdateItem)
	}
}
