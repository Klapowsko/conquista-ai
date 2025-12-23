# Conquista AI - Sistema de OKR

Sistema completo de gerenciamento de OKRs (Objectives and Key Results) com integração ao Spellbook para geração automática de Key Results e Roadmaps.

## 🏗️ Arquitetura

- **Front-end**: Next.js com TypeScript e Tailwind CSS
- **Back-end**: Golang com Gin framework e database/sql
- **Banco de Dados**: PostgreSQL
- **Integração**: API Spellbook para geração automática

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose
- Make (opcional, mas recomendado)

### Comandos Disponíveis

```bash
make help          # Lista todos os comandos
make build         # Constrói imagens Docker
make up            # Inicia todos os serviços
make down          # Para todos os serviços
make logs          # Mostra logs
make test          # Executa todos os testes
make test-unit     # Apenas testes unitários
make test-bdd      # Apenas testes BDD
make migrate       # Executa migrations do banco
```

## 📁 Estrutura do Projeto

```
conquista-ai/
├── frontend/          # Next.js app
├── backend/           # Golang API
├── docker-compose.yml # Orquestração de serviços
├── Makefile          # Automação de comandos
└── README.md
```

## 🧪 Metodologia

Este projeto segue **BDD** (Behavior-Driven Development) e **TDD** (Test-Driven Development):
- Features BDD escritas em Gherkin usando Godog
- Testes unitários antes da implementação
- Cobertura completa de repositórios, serviços e handlers

## 📚 Funcionalidades

- ✅ Gerenciamento de Categorias (Profissional, Espiritual, Saúde, Família)
- ✅ Gerenciamento de OKRs
- ✅ Geração automática de Key Results via Spellbook
- ✅ Geração de Roadmaps de estudo
- ✅ Dashboard com estatísticas
- ✅ Marcação de progresso

