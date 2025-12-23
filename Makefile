.PHONY: help build up down logs test migrate

help: ## Mostra comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Constrói imagens Docker
	@if [ ! -f backend/.env ]; then \
		echo "Criando backend/.env a partir do backend/.env.example..."; \
		cp backend/.env.example backend/.env; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Criando frontend/.env a partir do frontend/.env.example..."; \
		cp frontend/.env.example frontend/.env; \
	fi
	@echo "Criando .env temporário na raiz para docker-compose..."
	@cat backend/.env frontend/.env 2>/dev/null | grep -v "^#" | grep -v "^$$" | grep "=" > .env || true
	@docker compose build; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE

up: ## Inicia serviços
	@if [ ! -f backend/.env ]; then \
		echo "Criando backend/.env a partir do backend/.env.example..."; \
		cp backend/.env.example backend/.env; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Criando frontend/.env a partir do frontend/.env.example..."; \
		cp frontend/.env.example frontend/.env; \
	fi
	@echo "Criando .env temporário na raiz para docker-compose..."
	@cat backend/.env frontend/.env 2>/dev/null | grep -v "^#" | grep -v "^$$" | grep "=" > .env || true
	@docker compose up -d; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE

down: ## Para serviços
	docker compose down

logs: ## Mostra logs
	docker compose logs -f

test: ## Executa testes
	docker compose exec backend go test -v ./...

migrate: ## Executa migrations
	docker compose exec backend go run cmd/migrate/main.go
