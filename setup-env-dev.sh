#!/bin/bash

# Script para criar arquivos .env de desenvolvimento

echo "🚀 Configurando variáveis de ambiente de desenvolvimento..."

# Backend .env
if [ ! -f backend/.env ]; then
    echo "📝 Criando backend/.env..."
    cat > backend/.env << 'EOF'
# Backend Configuration - DESENVOLVIMENTO
PORT=8080

# Database Configuration (PostgreSQL)
POSTGRES_USER=conquista
POSTGRES_PASSWORD=conquista123
POSTGRES_DB=conquista_ai
POSTGRES_HOST=postgres
# Porta EXTERNA do PostgreSQL (mapeamento Docker)
POSTGRES_PORT=5432
# IMPORTANTE: Use porta 5432 (interna) no DATABASE_URL para comunicação entre containers
DATABASE_URL=postgres://conquista:conquista123@postgres:5432/conquista_ai?sslmode=disable

# Spellbook API
SPELLBOOK_API_URL=http://localhost:8000

# Porta EXTERNA do backend (mapeamento Docker)
BACKEND_PORT=8080

# CORS - Deixe vazio para usar defaults
CORS_ALLOWED_ORIGINS=
EOF
    echo "✅ backend/.env criado!"
else
    echo "⚠️  backend/.env já existe!"
    echo "🔍 Verificando se DATABASE_URL está correto..."
    # Verifica se DATABASE_URL usa porta 5432 (correta)
    if grep -q "postgres:543[^2]" backend/.env 2>/dev/null; then
        echo "❌ ERRO: DATABASE_URL está usando porta incorreta!"
        echo "   Deve usar 'postgres:5432' (porta interna do container)"
        echo ""
        echo "   Corrija manualmente o arquivo backend/.env:"
        echo "   DATABASE_URL=postgres://conquista:conquista123@postgres:5432/conquista_ai?sslmode=disable"
        exit 1
    fi
    echo "✅ DATABASE_URL parece estar correto"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    echo "📝 Criando frontend/.env..."
    cat > frontend/.env << 'EOF'
# Frontend Configuration - DESENVOLVIMENTO
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
EOF
    echo "✅ frontend/.env criado!"
else
    echo "⚠️  frontend/.env já existe, pulando..."
fi

echo ""
echo "✨ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revise e ajuste os valores em backend/.env e frontend/.env se necessário"
echo "   2. Execute: make build"
echo "   3. Execute: make up"

