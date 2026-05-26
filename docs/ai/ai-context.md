# Colibri — Contexto técnico (AI)

Contexto mínimo para continuidade em novos chats. Atualizar ao fechar cada wave.

## Stack

- **Monorepo** pnpm: `apps/web` (Next.js 14, App Router), `apps/api` (Fastify + Prisma)
- **DB/auth/storage:** Supabase (Postgres + Storage)
- **Deploy:** Web → Vercel; API → Render (`render.yaml`, `docs/deploy-render.md`)
- **Specs:** `.kiro/specs/colibri-migration/` (`requirements.md`, `design.md`, `tasks.md`)
- **Repo:** `github.com/madeiraGustavo/colibri`

## Arquitetura

- Migração **Arte Hub (multi-tenant) → Toldos Colibri (single-tenant comercial)**
- **Tenant invisível:** `siteId`/`tenantId` só na API (`DEFAULT_TENANT_ID=colibri`); frontend não envia nem exibe tenant
- **Loja:** route group `(store)/` na raiz (`/`, `/produtos`, …)
- **API legada:** rotas públicas `/marketplace/*`; admin `/dashboard/marketplace/*` (UI admin ainda em `/dashboard/marketplace/*`, alvo `/admin/*`)
- **Auth:** JWT + refresh; cookies HttpOnly via proxy Next; `artistId` vem do Prisma, não do token
- **Single-store:** `resolveStoreArtistId()` (`DEFAULT_STORE_ARTIST_SLUG=colibri`) para admin sem `artistId` no user

## Decisões importantes

| Tema | Decisão |
|------|---------|
| Waves | Branch dedicada por wave; merge em `main` só via PR após CI |
| Deletes | Soft delete (`deletedAt`) em Product, Category, Quote |
| Rotas loja | Raiz (`/`, `/produtos`, …); **sem** redirects web `/marketplace` (wave 8) |
| Categorias | `/produtos/categoria/[slug]` (canônico) |
| Hub (Pluma, tattoo, etc.) | Removido em `wave-7-cleanup` |
| Brand | Tudo via `apps/web/src/config/site.ts` |
| Render | Não fixar `PORT=3333` no painel; API usa `PORT` do Render |
| Catálogo vazio | Esperado até admin/seed de produtos |

## Features implementadas

| Área | Status |
|------|--------|
| Bootstrap, CI, `@colibri/*`, `.env.example` | ✅ |
| Branding (`site.ts`) | ✅ |
| Tenant default + seed admin (`admin@colibri.local`) | ✅ |
| Rotas loja + redirects `/marketplace` | ✅ (`wave-3-routes`) |
| Orçamentos: API `marketplace-quotes`, `/orcamento`, soft delete quotes | ✅ (`wave-4-quotes`) |
| Deploy Render + docs | ✅ |
| Admin (Task 6) | ✅ (`wave-5-admin`) |
| Observability (Pino, correlation IDs, ops logs) | ✅ (`wave-6-observability`) |

**Admin (`wave-5-admin`):**

- Migration `015_soft_delete_products_categories.sql` + `deletedAt` no schema
- Repos products/categories filtram `deletedAt: null`; delete = soft
- `authenticateAdmin` nas rotas dashboard de products/categories/quotes
- `resolveStoreArtistId` / `requireStoreArtistId` em products, categories, images, quotes
- Seed: Artist slug `colibri` + `artistId` no admin
- UI `/admin/*` + `AdminGuard` (role admin); redirects `/dashboard/marketplace` → `/admin`

## Estado atual da wave

| Branch | Conteúdo | Status |
|--------|----------|--------|
| **`wave-9-final-validation`** | **Wave 9 — validação final, deploy, docs** | 🔄 Em progresso (docs + smoke) |
| **`main`** | **Waves 3–8** (rotas, orçamentos, admin, observability, hub cleanup, marketplace 404) | ✅ PR #9 mergeada (wave-8) |
| `wave-8-marketplace-cleanup` | Remoção redirects `/marketplace` web | ✅ Integrado em `main` |
| `wave-7-cleanup` | Hub / Pluma / Arte Hub em `apps/` | ✅ Integrado em `main` |
| `wave-6-observability` | Histórico | Integrado em `main` |

**Validação Wave 9 (2026-05-26):** `pnpm install/typecheck/test/build` ✅; smoke prod `scripts/wave-9-smoke.ps1`; guia `docs/ops-validation.md`. Pendente: auth/admin manual, catálogo com slug, PR wave-9.

**URLs de referência:**

- API: `https://colibri-api-djm1.onrender.com`
- Web: `https://colibri-web-lovat.vercel.app`
- Admin seed: `admin@colibri.local` / `change-me`

## Padrões obrigatórios

1. Projeto **buildável** após cada wave: `pnpm install && pnpm typecheck && pnpm build && pnpm test`
2. **Commits pequenos** por subtarefa; sem trabalho direto em `main`
3. **Staging gate** entre waves (deploy + checklist em `tasks.md`)
4. Migrations Prisma **aditivas** e idempotentes; seed com **upsert**
5. Frontend **nunca** conhece tenant; respostas públicas sem `tenantId`
6. Marca só em **`site.ts`**; sem hardcode de brand
7. Sugestões fora do plano: explicar e obter OK antes
8. Hub removido na **wave-7-cleanup**; redirects web `/marketplace` removidos na **wave-8**; prefixo `/marketplace` na **API** permanece (contrato interno)

## Pendências principais

**Wave ativa:** `wave-9-final-validation` — smoke prod + docs ops; auth/admin manual; PR/merge

**Próxima fase:** property-based tests & hardening (Phase 2)

**Ops:** popular catálogo (admin CRUD ou seed); validar `ALLOWED_ORIGINS` (Vercel ↔ Render); rodar `scripts/wave-9-smoke.ps1` após cada deploy.
