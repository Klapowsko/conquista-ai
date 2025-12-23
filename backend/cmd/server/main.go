package main

import (
	"log"

	"github.com/conquista-ai/conquista-ai/internal/app"
)

func main() {
	application, err := app.NewApp()
	if err != nil {
		log.Fatalf("Erro ao inicializar aplicação: %v", err)
	}

	if err := application.Run(); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}

