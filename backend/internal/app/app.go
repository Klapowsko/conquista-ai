package app

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/conquista-ai/conquista-ai/internal/config"
	"github.com/conquista-ai/conquista-ai/internal/database"
	"github.com/conquista-ai/conquista-ai/internal/handlers"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/routes"
	"github.com/conquista-ai/conquista-ai/internal/services"
	spellbookClient "github.com/conquista-ai/conquista-ai/internal/services/spellbook"
)

type App struct {
	Config  *config.Config
	DB      *sql.DB
	Router  *gin.Engine
}

func NewApp() (*App, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("erro ao carregar configurações: %w", err)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("erro ao conectar ao banco: %w", err)
	}

	// Repositórios
	categoryRepo := repositories.NewCategoryRepository(db)
	okrRepo := repositories.NewOKRRepository(db)
	keyResultRepo := repositories.NewKeyResultRepository(db)
	roadmapRepo := repositories.NewRoadmapRepository(db)

	// Cliente Spellbook
	spellbookClient := spellbookClient.NewClient(cfg.SpellbookAPIURL)

	// Serviços
	okrService := services.NewOKRService(okrRepo, keyResultRepo, categoryRepo, spellbookClient)
	roadmapService := services.NewRoadmapService(roadmapRepo, keyResultRepo, spellbookClient)

	// Handlers
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	okrHandler := handlers.NewOKRHandler(okrService)
	keyResultHandler := handlers.NewKeyResultHandler(keyResultRepo)
	roadmapHandler := handlers.NewRoadmapHandler(roadmapService)

	// Router
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	routes.SetupRoutes(router, categoryHandler, okrHandler, keyResultHandler, roadmapHandler)

	return &App{
		Config: cfg,
		DB:     db,
		Router: router,
	}, nil
}

func (a *App) Run() error {
	addr := fmt.Sprintf(":%s", a.Config.Port)
	log.Printf("Servidor Conquista AI iniciado na porta %s", a.Config.Port)
	log.Printf("Health check: http://localhost%s/health", addr)
	log.Printf("API disponível em: http://localhost%s/api/v1", addr)

	return a.Router.Run(addr)
}

