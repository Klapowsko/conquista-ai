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
	middleware.SetupCORS(router)

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
		api.POST("/key-results", keyResultHandler.Create)
		api.PUT("/key-results/:id", keyResultHandler.Update)
		api.DELETE("/key-results/:id", keyResultHandler.Delete)

		// Roadmaps
		api.POST("/key-results/:key_result_id/roadmap", roadmapHandler.GenerateRoadmap)
		api.GET("/key-results/:key_result_id/roadmap", roadmapHandler.GetByKeyResultID)
		api.PUT("/roadmap-items/:item_id", roadmapHandler.UpdateItem)

		// Educational Roadmaps
		api.POST("/educational-roadmap", roadmapHandler.GenerateEducationalRoadmap)
		api.GET("/roadmap-items/:roadmap_item_id/educational-roadmap", roadmapHandler.GetEducationalRoadmapByRoadmapItemID)
		api.PUT("/educational-resources/:resource_id", roadmapHandler.UpdateEducationalResource)

		// Educational Trails
		api.POST("/educational-trail", roadmapHandler.GenerateEducationalTrail)
		api.GET("/roadmap-items/:roadmap_item_id/educational-trail", roadmapHandler.GetEducationalTrailByRoadmapItemID)
		api.DELETE("/roadmap-items/:roadmap_item_id/educational-trail", roadmapHandler.DeleteEducationalTrail)
		api.PUT("/trail-activities/:activity_id", roadmapHandler.UpdateTrailActivity)
	}
}
