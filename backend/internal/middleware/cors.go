package middleware

import (
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupCORS(router *gin.Engine) {
	config := cors.DefaultConfig()
	allowedOrigins := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	switch {
	case allowedOrigins == "":
		// Defaults: dev hosts + produção
		config.AllowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3003",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:3003",
			"http://hiagoserver.local:3000",
			"http://hiagoserver.local:3001",
			"http://hiagoserver.local:3003",
			"http://hiagoserver.local",
			"https://conquista-ai-api.klapowsko.com",
			"https://conquista-ai.klapowsko.com",
		}
	case allowedOrigins == "*":
		// Permite tudo (sem credentials)
		config.AllowAllOrigins = true
	default:
		origins := []string{}
		for _, origin := range strings.Split(allowedOrigins, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
		config.AllowOrigins = origins
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	config.AllowHeaders = []string{"Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"}
	// Credenciais só quando não é wildcard
	config.AllowCredentials = !config.AllowAllOrigins
	router.Use(cors.New(config))
}
