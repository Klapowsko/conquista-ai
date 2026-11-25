# Conquista - Objetivos gamificados do casal

Plataforma para cadastrar objetivos do casal, acompanhar o progresso juntos e ganhar
recompensas por isso. Cada meta concluída rende **moedas** e **XP**. O XP faz o casal
**subir de nível**, e as moedas são trocadas na **loja de recompensas** (um café no fim
de semana, um passeio no parque, uma besteirinha...).

## 🎮 Como funciona

- **Objetivo**: algo grande, como "Juntar R$ 3.000 de reserva de emergência". Tem categoria
  (Pessoal, Profissional ou Social), prazo opcional e **dificuldade**.
- **Metas**: as etapas do objetivo, como "Guardar os primeiros R$ 1.000".
- **Moedas e XP** dependem da dificuldade do objetivo:

  | Dificuldade | Cada meta concluída | Bônus ao concluir o objetivo |
  |-------------|---------------------|------------------------------|
  | 🌱 Fácil    | 5 moedas · 5 XP     | 50 moedas · 50 XP            |
  | 🔥 Médio    | 10 moedas · 10 XP   | 150 moedas · 150 XP          |
  | ⚔️ Difícil  | 20 moedas · 20 XP   | 300 moedas · 300 XP          |

- **Níveis**: para ir do nível N ao N+1 são necessários `N × 100` XP. O nível 2 vem com
  100 XP, o 3 com 300, o 4 com 600 e o 5 com 1000.
- **Loja**: as recompensas são cadastradas com um preço em moedas. Resgatar uma desconta o
  saldo, e o XP não diminui.
- Reabrir uma meta ou um objetivo **estorna** exatamente o que ele tinha rendido. Concluir
  duas vezes não paga em dobro.
- A carteira é única, do casal, e guarda um histórico completo (`/historico`).

As regras ficam em [backend/internal/gamification/rules.go](backend/internal/gamification/rules.go).

## 🏗️ Arquitetura

- **Frontend**: Next.js (App Router), TypeScript e Tailwind CSS
- **Backend**: Go, Gin e `database/sql`
- **Banco**: PostgreSQL

## 🚀 Início rápido

Pré-requisitos: Docker, Docker Compose e Make.

```bash
make build      # Constrói as imagens
make up         # Sobe postgres, backend (porta 8083) e frontend (porta 3003)
make migrate    # Aplica as migrations pendentes
make test       # Testes unitários + cenários BDD (rodam contra a API em execução)
make logs
make down
```

Há variantes de produção: `build-prod`, `up-prod`, `migrate-prod` etc.

### Migrations

`cmd/migrate` registra o que já foi aplicado na tabela `schema_migrations` e só roda os
arquivos novos, cada um dentro de uma transação. Em bancos criados antes desse controle,
as migrations 001 a 006 são apenas registradas, sem rodar de novo. Novas migrations devem
usar o próximo número (`008_...`).

## 📡 API (`/api/v1`)

| Recurso     | Rotas |
|-------------|-------|
| Categorias  | `GET /categories` |
| Objetivos   | `GET/POST /goals`, `GET/PUT/DELETE /goals/:id`, `POST /goals/:id/complete`, `POST /goals/:id/reopen`, `GET /goals/:id/milestones` |
| Metas       | `GET/POST /milestones`, `PUT/DELETE /milestones/:id`, `POST /milestones/:id/complete`, `POST /milestones/:id/reopen` |
| Carteira    | `GET /wallet`, `GET /wallet/transactions`, `GET /gamification/rules` |
| Loja        | `GET/POST /rewards`, `PUT/DELETE /rewards/:id`, `POST /rewards/:id/purchase` |

## 🧪 Testes

- Unitários: `backend/internal/gamification` (moedas e níveis).
- BDD (Godog, em português): `backend/features/gamificacao.feature`. Os cenários rodam contra
  a API (`API_BASE_URL`, padrão `http://localhost:8080`) e desfazem o que ganharam ao final.
  Use um banco de desenvolvimento.
