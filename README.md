# Toldos Colibri

Site comercial para **Toldos Colibri** — especializada em toldos, coberturas, capotas, capas de mesa e produtos de lona.

## Arquitetura

Monorepo gerenciado com [pnpm](https://pnpm.io/) workspaces:

```
colibri/
├── apps/
│   ├── web/          → Frontend (Next.js 14, App Router, Tailwind CSS)
│   └── api/          → Backend (Fastify 4, Prisma, Zod)
├── packages/
│   ├── types/        → Tipos TypeScript compartilhados (@colibri/types)
│   └── ui/           → Componentes UI compartilhados (futuro)
├── docs/             → Documentação de arquitetura
└── .github/workflows → CI (GitHub Actions)
```

| Camada | Tecnologia | Deploy |
|--------|-----------|--------|
| Frontend | Next.js 14 (App Router) | Vercel |
| Backend | Fastify 4 + Prisma ORM | Railway |
| Banco de dados | PostgreSQL | Supabase |
| Storage | Supabase Storage | Supabase |
| Autenticação | JWT (access 15min) + Refresh Token (HttpOnly cookie, 7 dias) | — |

## Pré-requisitos

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.x (`corepack enable` para ativar)
- **PostgreSQL** (local ou Supabase)
- **Supabase** projeto configurado (banco + storage)

## Setup

```bash
# 1. Clonar o repositório
git clone https://github.com/madeiraGustavo/colibri.git
cd colibri

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (DATABASE_URL, SUPABASE_*, JWT_SECRET, etc.)

# 4. Rodar migrações do banco
pnpm --filter @colibri/api exec prisma migrate dev

# 5. Popular banco com dados iniciais
pnpm --filter @colibri/api run seed

# 6. Iniciar em modo desenvolvimento
pnpm dev
```

## Scripts disponíveis

### Raiz (workspace)

| Script | Descrição |
|--------|-----------|
| `pnpm install` | Instala todas as dependências do workspace |
| `pnpm typecheck` | Verifica tipos TypeScript em todos os pacotes |
| `pnpm test` | Executa testes em todos os pacotes |
| `pnpm build` | Compila todos os pacotes |

### apps/web (`@colibri/web`)

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Servidor de desenvolvimento Next.js |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm lint` | Linting com ESLint |
| `pnpm typecheck` | Verificação de tipos |
| `pnpm test` | Testes com Vitest |

### apps/api (`@colibri/api`)

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Servidor de desenvolvimento (tsx watch) |
| `pnpm build` | Compilação TypeScript |
| `pnpm start` | Inicia servidor compilado |
| `pnpm typecheck` | Verificação de tipos |
| `pnpm test` | Testes com Vitest |
| `pnpm seed` | Popula banco com dados iniciais |

## Estrutura do projeto

```
apps/web/
├── src/
│   ├── app/              → Rotas (App Router)
│   │   ├── (store)/      → Páginas públicas (/, /produtos, /minha-conta)
│   │   └── (admin)/      → Painel administrativo (/admin/*)
│   ├── config/
│   │   └── site.ts       → Brand_Config (nome, contatos, cores, categorias)
│   ├── components/       → Componentes React
│   └── lib/              → Utilitários (API client, helpers)
└── public/               → Assets estáticos

apps/api/
├── prisma/
│   ├── schema.prisma     → Schema do banco de dados
│   ├── seed.ts           → Script de seed
│   └── migrations/       → Migrações Prisma
└── src/
    ├── modules/          → Módulos de domínio (auth, products, quotes, etc.)
    ├── hooks/            → Hooks Fastify (autenticação)
    ├── lib/              → Bibliotecas compartilhadas (prisma, storage, etc.)
    └── app.ts            → Configuração do servidor Fastify
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores. Variáveis principais:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_KEY` | Chave de serviço do Supabase |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `JWT_REFRESH_SECRET` | Segredo para refresh tokens |
| `ALLOWED_ORIGINS` | Origens permitidas para CORS |
| `NEXT_PUBLIC_API_URL` | URL da API (acessível pelo frontend) |

Consulte `.env.example` para a lista completa com valores de exemplo.

## Deploy

| Serviço | Plataforma | Configuração |
|---------|-----------|--------------|
| **Web** | Vercel | Framework: Next.js, Root: `apps/web` |
| **API** | Railway | Start command: `node dist/server.js`, Root: `apps/api` |
| **Banco** | Supabase | PostgreSQL gerenciado |
| **Storage** | Supabase | Buckets para uploads de imagens |

### Deploy da API (Railway)

1. Conecte o repositório ao Railway
2. Configure o root directory como `apps/api`
3. Build command: `pnpm build`
4. Start command: `pnpm start`
5. Adicione as variáveis de ambiente

### Deploy do Web (Vercel)

1. Conecte o repositório à Vercel
2. Configure o root directory como `apps/web`
3. Framework preset: Next.js
4. Adicione as variáveis de ambiente (incluindo `NEXT_PUBLIC_API_URL`)

### Migrações (Supabase)

```bash
# Aplicar migrações em produção
pnpm --filter @colibri/api exec prisma migrate deploy
```

## CI/CD

O pipeline de CI roda automaticamente em push/PR para `main`:

1. `pnpm install` — Instala dependências
2. `pnpm typecheck` — Verifica tipos
3. `pnpm test` — Executa testes
4. `pnpm build` — Compila o projeto

Configuração em `.github/workflows/ci.yml`.

## Licença

Projeto privado — todos os direitos reservados.
