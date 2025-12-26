.PHONY: help build up down logs test migrate build-prod up-prod down-prod logs-prod migrate-prod

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
	@docker compose exec backend go run -mod=mod cmd/migrate/main.go; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE

# Comandos de Produção
build-prod: ## Constrói imagens Docker de produção
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
	@docker compose -f docker-compose.prod.yml build; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE

up-prod: ## Inicia serviços de produção
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
	@docker compose -f docker-compose.prod.yml up -d; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE

down-prod: ## Para serviços de produção
	@docker compose -f docker-compose.prod.yml down

logs-prod: ## Mostra logs de produção
	@docker compose -f docker-compose.prod.yml logs -f

migrate-prod: ## Executa migrations em produção
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
	@docker compose -f docker-compose.prod.yml exec backend go run -mod=mod cmd/migrate/main.go; EXIT_CODE=$$?; rm -f .env; exit $$EXIT_CODE
