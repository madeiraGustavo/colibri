# Arquitetura — Toldos Colibri

## Visão geral

Toldos Colibri é um site comercial single-tenant construído como um monorepo pnpm. A aplicação é composta por um frontend Next.js (App Router), uma API Fastify com Prisma ORM, e serviços Supabase para banco de dados e storage.

## Diagrama de alto nível

```
┌─────────────────────────────────────────────────────────────┐
│                    Monorepo (@colibri)                       │
│                                                             │
│  ┌──────────────────┐    HTTP    ┌──────────────────────┐  │
│  │   apps/web        │ ────────► │   apps/api            │  │
│  │   Next.js 14      │           │   Fastify 4           │  │
│  │   App Router      │           │   Prisma + Zod        │  │
│  │   Tailwind CSS    │           │                       │  │
│  └──────────────────┘           └───────────┬───────────┘  │
│                                              │              │
│  ┌──────────────────┐                        │              │
│  │  packages/types   │                        │              │
│  │  Tipos TS         │                        │              │
│  └──────────────────┘                        │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                          ┌────────────────────┼────────────────┐
                          │         Supabase                     │
                          │                                      │
                          │  ┌──────────────┐  ┌─────────────┐  │
                          │  │ PostgreSQL   │  │  Storage     │  │
                          │  │ (banco)      │  │  (uploads)   │  │
                          │  └──────────────┘  └─────────────┘  │
                          └─────────────────────────────────────┘
```

## Componentes

### apps/web — Frontend

- **Framework:** Next.js 14 com App Router
- **Estilização:** Tailwind CSS
- **Estado:** Zustand (client-side)
- **Deploy:** Vercel

**Responsabilidades:**
- Renderização de páginas (SSR/SSG)
- Navegação e roteamento
- Formulários e validação client-side
- Comunicação com a API via HTTP
- Gerenciamento de sessão (refresh token automático)

**Rotas principais:**

| Rota | Descrição |
|------|-----------|
| `/` | Catálogo de produtos (home) |
| `/produtos` | Listagem de produtos |
| `/produtos/[slug]` | Detalhe do produto |
| `/minha-conta` | Área do usuário |
| `/orcamento` | Formulário de orçamento |
| `/admin/*` | Painel administrativo (protegido) |

**Regra importante:** O frontend NUNCA importa Prisma, acessa o banco diretamente, ou conhece o conceito de tenant. Todo acesso a dados passa pela API.

### apps/api — Backend

- **Framework:** Fastify 4
- **ORM:** Prisma (PostgreSQL)
- **Validação:** Zod
- **Storage:** Supabase Storage
- **Deploy:** Railway

**Responsabilidades:**
- Autenticação e autorização (JWT + RBAC)
- Validação de entrada (Zod schemas)
- Lógica de negócio
- Acesso ao banco de dados (Prisma)
- Upload de arquivos (Supabase Storage)
- Injeção automática de tenant

**Ciclo de vida de uma requisição:**

```
Requisição
  │
  ├─ 1. CORS (ALLOWED_ORIGINS)
  ├─ 2. Autenticação (JWT verification)
  ├─ 3. Injeção de tenant (DEFAULT_TENANT_ID)
  ├─ 4. RBAC (verificação de role)
  ├─ 5. Validação Zod (body, query, params)
  ├─ 6. Handler (lógica de negócio)
  └─ 7. Resposta (error masking em produção)
```

### packages/types — Tipos compartilhados

- Tipos TypeScript e schemas Zod reutilizados entre web e api
- Importado como `@colibri/types`

## Autenticação

O sistema usa JWT com refresh token:

1. **Login:** Usuário envia credenciais → API retorna access token (JWT, 15min) + refresh token (HttpOnly cookie, 7 dias)
2. **Requisições autenticadas:** Frontend envia access token no header `Authorization: Bearer <token>`
3. **Refresh:** Quando o access token expira, o frontend usa o cookie de refresh para obter um novo access token automaticamente
4. **Logout:** Invalida o refresh token no banco

**Segurança do cookie de refresh:**
- `HttpOnly` — inacessível via JavaScript
- `Secure` — apenas HTTPS
- `SameSite=Strict` — proteção contra CSRF

## Estratégia de tenant

O projeto mantém uma coluna `tenantId` no banco para preservar integridade referencial, mas opera como single-tenant:

- Um registro de tenant padrão (`id: "colibri"`) existe no banco
- Um middleware Fastify injeta `tenantId = "colibri"` automaticamente em toda requisição
- Nenhuma API expõe `tenantId` em requests ou responses
- O frontend desconhece completamente o conceito de tenant

**Benefício:** Esta abordagem permite expansão futura (white-label, franquias, multi-loja) sem alterações na arquitetura core.

## Banco de dados

**PostgreSQL** hospedado no Supabase, gerenciado via Prisma.

**Modelos principais:**

| Modelo | Descrição |
|--------|-----------|
| `Tenant` | Registro único "colibri" (integridade referencial) |
| `User` | Usuários com roles (USER, ADMIN) |
| `Product` | Produtos com soft delete |
| `ProductImage` | Imagens de produtos (Supabase Storage) |
| `Category` | Categorias de produtos com soft delete |
| `Quote` | Solicitações de orçamento |
| `QuoteImage` | Imagens anexadas a orçamentos |
| `RefreshToken` | Tokens de refresh ativos |

**Soft delete:** Product, Category e Quote usam `deletedAt DateTime?` em vez de exclusão física. Isso permite auditoria, recuperação e histórico operacional.

**Migrações:** Todas as migrações são aditivas. Nunca removemos colunas ou tabelas na mesma release em que param de ser usadas.

## Storage

Uploads de imagens (produtos e orçamentos) são armazenados no **Supabase Storage**.

**Padrão transacional:**
1. Validar request (Zod) → falha rápida com 400
2. Upload para Supabase Storage → se falhar, retorna erro imediatamente (nenhum registro no banco)
3. Persistir registro no banco com URLs dos arquivos

Isso garante que não existam registros órfãos no banco referenciando arquivos inexistentes.

## Segurança

| Mecanismo | Implementação |
|-----------|---------------|
| CORS | Apenas origens em `ALLOWED_ORIGINS` |
| Autenticação | JWT com expiração curta (15min) |
| Autorização | RBAC por role (USER, ADMIN) |
| Ownership | Usuários só modificam seus próprios recursos |
| Validação | Zod em todas as entradas |
| Error masking | Em produção, sem stack traces ou detalhes internos |
| Cookies | HttpOnly, Secure, SameSite=Strict |

## Deploy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Vercel    │     │   Railway   │     │    Supabase     │
│   (Web)     │────►│   (API)     │────►│  (DB + Storage) │
└─────────────┘     └─────────────┘     └─────────────────┘
```

| Componente | Plataforma | Variáveis chave |
|-----------|-----------|-----------------|
| Web | Vercel | `NEXT_PUBLIC_API_URL` |
| API | Railway | `DATABASE_URL`, `SUPABASE_*`, `JWT_SECRET` |
| Banco | Supabase | Gerenciado |
| Storage | Supabase | `STORAGE_BUCKET` |

## CI/CD

GitHub Actions executa em todo push/PR para `main`:

```
pnpm install → pnpm typecheck → pnpm test → pnpm build
```

Todos os 4 passos devem passar para o pipeline ser considerado verde.

## Decisões de design

1. **Monorepo pnpm** — Separação clara entre frontend, backend e pacotes compartilhados, com resolução de dependências eficiente.

2. **App Router (Next.js 14)** — Server Components por padrão, streaming, e layouts aninhados para melhor performance e DX.

3. **Fastify + Zod** — Framework HTTP performático com validação de schema type-safe em todas as entradas.

4. **Prisma** — ORM type-safe com migrações versionadas e geração automática de tipos.

5. **Tenant invisível** — Mantém integridade referencial sem expor complexidade multi-tenant ao frontend ou consumidores da API.

6. **Soft delete** — Preserva histórico operacional e permite recuperação de dados excluídos acidentalmente.

7. **JWT + Refresh Token** — Access tokens curtos (15min) limitam janela de exposição; refresh tokens em HttpOnly cookies previnem XSS.

## Evolução futura (pós-MVP)

Funcionalidades planejadas para fases futuras (não implementar durante a migração):

- **Pipeline de mídia** — Resize, conversão WebP, thumbnails
- **Busca full-text** — PostgreSQL pg_trgm ou Meilisearch
- **Filtros e autocomplete** — Navegação facetada no catálogo
- **CRM operacional** — Lead → Orçamento → Venda → Instalação → Pós-venda
- **Expansão multi-tenant** — White-label, franquias, multi-loja (arquitetura já preparada)
