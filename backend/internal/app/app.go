package app

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/conquista-ai/conquista-ai/internal/config"
	"github.com/conquista-ai/conquista-ai/internal/database"
	"github.com/conquista-ai/conquista-ai/internal/handlers"
	"github.com/conquista-ai/conquista-ai/internal/repositories"
	"github.com/conquista-ai/conquista-ai/internal/routes"
	"github.com/conquista-ai/conquista-ai/internal/services"
	"github.com/gin-gonic/gin"
)

type App struct {
	Config *config.Config
	DB     *sql.DB
	Router *gin.Engine
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
	goalRepo := repositories.NewGoalRepository(db)
	milestoneRepo := repositories.NewMilestoneRepository(db)
	rewardRepo := repositories.NewRewardRepository(db)
	walletRepo := repositories.NewWalletRepository(db)

	// Serviços
	goalService := services.NewGoalService(db, goalRepo, categoryRepo, walletRepo)
	milestoneService := services.NewMilestoneService(db, milestoneRepo, goalRepo, walletRepo)
	shopService := services.NewShopService(db, rewardRepo, walletRepo)

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	routes.SetupRoutes(router, routes.Handlers{
		Category:  handlers.NewCategoryHandler(categoryRepo),
		Goal:      handlers.NewGoalHandler(goalService, milestoneService),
		Milestone: handlers.NewMilestoneHandler(milestoneService),
		Shop:      handlers.NewShopHandler(shopService),
	})

	return &App{Config: cfg, DB: db, Router: router}, nil
}

func (a *App) Run() error {
	addr := fmt.Sprintf(":%s", a.Config.Port)
	log.Printf("Servidor Conquista AI iniciado na porta %s", a.Config.Port)
	log.Printf("API disponível em: http://localhost%s/api/v1", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      a.Router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	return srv.ListenAndServe()
}
