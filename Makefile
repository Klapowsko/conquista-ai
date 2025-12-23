.PHONY: help build up down logs test migrate

help: ## Mostra comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Constrói imagens Docker
	docker compose build

up: ## Inicia serviços
	docker compose up -d

down: ## Para serviços
	docker compose down

logs: ## Mostra logs
	docker compose logs -f

test: ## Executa testes
	docker compose exec backend go test -v ./...

migrate: ## Executa migrations
	docker compose exec backend go run cmd/migrate/main.go
