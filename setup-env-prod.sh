#!/bin/bash

# Script para criar arquivos .env.prod a partir dos exemplos

echo "🚀 Configurando variáveis de ambiente de produção..."

# Backend .env.prod
if [ ! -f backend/.env.prod ]; then
    echo "📝 Criando backend/.env.prod..."
    cat > backend/.env.prod << 'EOF'
# Backend Configuration - PRODUÇÃO
PORT=8080

# Database Configuration (PostgreSQL)
POSTGRES_USER=conquista
POSTGRES_PASSWORD=conquista123
POSTGRES_DB=conquista_ai
POSTGRES_HOST=postgres
POSTGRES_PORT=5434
# IMPORTANTE: Use porta 5432 (interna) no DATABASE_URL para comunicação entre containers
DATABASE_URL=postgres://conquista:conquista123@postgres:5432/conquista_ai?sslmode=disable

# Spellbook API
SPELLBOOK_API_URL=https://spellbook-api.klapowsko.com

# Porta EXTERNA do backend (mapeamento Docker)
BACKEND_PORT=8083

# CORS - Deixe vazio para usar defaults
CORS_ALLOWED_ORIGINS=
EOF
    echo "✅ backend/.env.prod criado!"
else
    echo "⚠️  backend/.env.prod já existe!"
    echo "🔍 Verificando se DATABASE_URL está correto..."
    # Verifica se DATABASE_URL usa porta 5432 (correta)
    if grep -q "postgres:543[^2]" backend/.env.prod 2>/dev/null; then
        echo "❌ ERRO: DATABASE_URL está usando porta incorreta!"
        echo "   Deve usar 'postgres:5432' (porta interna do container)"
        echo "   Corrija manualmente o arquivo backend/.env.prod"
        exit 1
    fi
    echo "✅ DATABASE_URL parece estar correto"
fi

# Frontend .env.prod
if [ ! -f frontend/.env.prod ]; then
    echo "📝 Criando frontend/.env.prod..."
    cat > frontend/.env.prod << 'EOF'
# Frontend Configuration - PRODUÇÃO
FRONTEND_PORT=3003
NEXT_PUBLIC_API_URL=https://conquista-ai-api.klapowsko.com/api/v1
EOF
    echo "✅ frontend/.env.prod criado!"
else
    echo "⚠️  frontend/.env.prod já existe, pulando..."
fi

echo ""
echo "✨ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revise e ajuste os valores em backend/.env.prod e frontend/.env.prod"
echo "   2. Execute: make build-prod"
echo "   3. Execute: make up-prod"

