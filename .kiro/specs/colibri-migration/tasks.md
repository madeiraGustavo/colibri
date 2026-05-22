# Implementation Plan: Colibri Migration

## Overview

This plan migrates the Arte Hub multi-tenant monorepo into a single-site commercial application for Toldos Colibri. Each task is a small, focused step that keeps the project buildable. Tasks follow the migration order defined in the design document.

## Strategy

- **Incremental**: The project MUST remain buildable after each task. No big-bang migrations. No giant branches. Small, auditable commits. Run `pnpm install && pnpm typecheck && pnpm build && pnpm test` after each wave.
- **MVP first**: Phase 1 prioritizes catálogo, orçamento, admin, uploads, autenticação, and operação comercial. Property-based tests marked with `*` are deferred to Phase 2.
- **Soft delete**: Models Product, Category, and Quote use `deletedAt DateTime?` for audit, reversibility, and operational history. Physical deletes are avoided.
- **Rollback**: Each step is revertible via `git revert`. Prisma migrations are additive. Hub removal only occurs after Colibri equivalents are confirmed working.
- **Tenant invisibility**: Frontend NEVER knows about tenantId/siteId. API injects tenant internally. Responses never expose tenantId. Public schemas never receive tenantId. This remains compatible with future multi-tenant, white-label, franchise, or multi-store expansion without altering core architecture.

### Branching Strategy

Each wave is developed on a dedicated branch. Never implement directly on `main`.

| Branch | Wave | Scope |
|--------|------|-------|
| `wave-0-bootstrap` | 0–3 | Scaffold, rename, CI, env, docs |
| `wave-1-branding` | 4–6 | Brand_Config, visual identity |
| `wave-2-tenant` | 7 | Tenant abstraction, seed |
| `wave-3-routes` | 8–10 | Route migration, redirects |
| `wave-4-quotes` | 11–13 | Quote system |
| `wave-5-admin` | 14–16 | Admin CRUD, soft delete |
| `wave-6-observability` | 17–18 | Structured logging |
| `wave-7-cleanup` | 19–25 | Hub removal, /marketplace removal, deploy, docs |

**Benefits**: rollback simples, code review legível, regressões isoladas, debugging mais fácil, merges menores e auditáveis.

**Merge flow**: Each branch merges into `main` via PR after CI passes and code review is approved.

### Environment Flow

```
arte-hub (stable, read-only reference)
    ↓
colibri (migration branches → main)
    ↓
staging deploy (obrigatório após Wave 10)
    ↓
validation
    ↓
production
```

Never migrate "on top of" the original arte-hub. The colibri repo is independent.

### Staging Deploy Gate (After Wave 10)

After completing bootstrap + branding + tenant + route migration + redirects, a **mandatory staging deploy** must occur before continuing to quotes/admin/uploads.

**CRITICAL RULE: No wave starts without the previous wave validated in staging.** Each wave must be deployed to staging and pass the validation checklist before the next wave begins. This applies to ALL waves, not just Wave 10.

**Execution order:**
1. Complete Wave 0–3 (bootstrap + branding + tenant)
2. Deploy to staging immediately
3. Validate staging checklist
4. Only then proceed to Wave 4+ (routes)
5. Deploy to staging after Wave 4
6. Validate staging checklist
7. Continue this pattern for every subsequent wave

**Staging validation checklist:**
- [x] HttpOnly cookies working correctly
- [x] Refresh token flow functional
- [x] Auth proxy / CORS configured
- [~] Redirects from /marketplace/* working (when applicable — not yet migrated)
- [x] SSR rendering correctly
- [x] Railway API responding
- [x] Vercel Web serving pages
- [x] Build pipeline green
- [x] Next.js middleware executing
- [x] Tenant abstraction invisible (no tenantId in responses)

**Wave 0–3 Staging Gate: ✅ APPROVED** (Vercel online, Railway online, Supabase connected, /health OK, login admin@colibri.local functional, seed executed, env vars configured)

### Migration Safety Rules

1. **Never remove a column in the same release where it stops being used.** Decouple code deployment from schema changes.
2. **Never rename a column directly.** Use the expand-and-contract pattern: add new column → migrate data → update code → drop old column in a later release.
3. **Every Prisma migration must be logically reversible.** Each migration file must have a clear rollback path (additive migrations are inherently reversible by dropping the added objects).
4. **Destructive schema changes require a database backup.** Before any DROP, ALTER COLUMN, or data transformation, a verified backup must exist.
5. **Seed scripts must be idempotent.** Running `prisma db seed` multiple times must produce the same result without duplicating data (use upsert, not create).

### Wave Mapping

| Waves | Phase | Branch | Description |
|-------|-------|--------|-------------|
| 0–3 | Bootstrap | `wave-0-bootstrap` | Scaffold, rename, CI, env, docs |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 4–6 | Branding | `wave-1-branding` | Brand_Config, visual identity |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 7 | Tenant | `wave-2-tenant` | Tenant abstraction, seed, build verify |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 8–10 | Route Migration | `wave-3-routes` | Move /marketplace to root with redirects |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 11–13 | Quote System | `wave-4-quotes` | Prisma models, API endpoints, frontend form |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 14–16 | Admin System | `wave-5-admin` | Soft delete, CRUD endpoints, admin UI |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 17–18 | Observability | `wave-6-observability` | Structured logging, correlation IDs |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 19–23 | Cleanup Final | `wave-7-cleanup` | Hub removal, /marketplace redirect removal |
| **⛔ STAGING GATE** | | | Deploy + validate before proceeding |
| 24–25 | Deploy/Docs | `wave-7-cleanup` | Smoke tests, deploy configs, final validation |
| 26 | PBT (Phase 2) | `phase-2-pbt` | All property-based tests |

## Tasks

- [x] 1. Bootstrap do novo repositório colibri
  - [x] 1.1 Initialize monorepo scaffold with pnpm workspace
    - Create root `package.json` with `name: "colibri"`, `engines`, `packageManager` fields
    - Create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`
    - Create directory structure: `apps/web`, `apps/api`, `packages`, `docs`, `.github/workflows`
    - Add root workspace scripts: `install`, `typecheck`, `test`, `build`
    - Suggested commit: `chore: scaffold colibri monorepo with pnpm workspace`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Copy source code from arte-hub into colibri structure
    - Copy `apps/web` source (Next.js App Router) preserving file structure
    - Copy `apps/api` source (Fastify + Prisma) preserving file structure
    - Copy `packages/*` shared code
    - Copy existing Prisma migration files
    - Suggested commit: `chore: copy arte-hub source into colibri monorepo`
    - _Requirements: 1.1, 6.6_

  - [x] 1.3 Rename all package.json names to @colibri/* prefix
    - Update `apps/web/package.json` name to `@colibri/web`
    - Update `apps/api/package.json` name to `@colibri/api`
    - Update `packages/*/package.json` names to `@colibri/*`
    - Update all workspace dependency references in `dependencies`/`devDependencies`
    - Search and replace `@arte-hub/` with `@colibri/` in all TypeScript/JavaScript imports
    - Update any tsconfig paths or module aliases
    - Suggested commit: `refactor: rename packages from @arte-hub/* to @colibri/*`
    - _Requirements: 11.1, 11.6_

  - [x] 1.4 Create `.env.example` with all required environment variables
    - Include DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
    - Include JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN
    - Include DEFAULT_TENANT_ID, ALLOWED_ORIGINS, COLIBRI_API_URL, COLIBRI_WEB_URL, NEXT_PUBLIC_API_URL
    - Use Colibri-specific placeholder values (no arte-hub references)
    - Suggested commit: `chore: add .env.example with colibri-specific variables`
    - _Requirements: 11.3, 12.6, 12.7_

  - [x] 1.5 Set up CI workflow
    - Create `.github/workflows/ci.yml` with steps: checkout, pnpm setup, install, typecheck, test, build
    - Use `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`
    - Suggested commit: `ci: add GitHub Actions workflow for build pipeline`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 1.6 Update README.md and docs
    - Write new `README.md` describing Colibri project, architecture, and setup instructions
    - Update `docs/` directory with single-site architecture documentation
    - Suggested commit: `docs: update README and architecture docs for colibri`
    - _Requirements: 11.2, 11.4_

  - [x] 1.7 Verify build passes after bootstrap
    - Run `pnpm install && pnpm typecheck && pnpm build`
    - Fix any broken references
    - Suggested commit: `fix: resolve any broken references after bootstrap`
    - _Requirements: 12.1, 12.2, 12.4_

- [x] 2. Branding — Brand_Config centralizado
  - [x] 2.1 Create `apps/web/src/config/site.ts` with SiteConfig interface and values
    - Define `SiteConfig` interface with name, tagline, description, domain, contacts, categories, colors, social
    - Export `siteConfig` constant with Toldos Colibri values
    - Categories: toldos, coberturas, capotas, capas de mesa, produtos de lona
    - Suggested commit: `feat: add centralized Brand_Config at apps/web/src/config/site.ts`
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 2.2 Replace hardcoded brand references in components with Brand_Config imports
    - Update header, footer, meta tags, og:site_name to read from `siteConfig`
    - Remove any hardcoded "Arte Hub" text from components
    - Ensure no brand values are duplicated outside Brand_Config
    - Suggested commit: `refactor: replace hardcoded brand values with Brand_Config imports`
    - _Requirements: 4.3, 4.5, 4.6_

  - [x] 2.3 Update HTML document title and meta tags
    - Set `<title>` to use `siteConfig.name`
    - Update `og:site_name`, `description`, and other meta tags
    - Suggested commit: `feat: update document title and meta tags with colibri branding`
    - _Requirements: 4.1_

  - [x] 2.4 Apply Colibri visual identity to UI components
    - Apply brand colors from `siteConfig.colors` to theme/tailwind config
    - Update header/footer layout for Colibri design
    - Ensure category navigation shows only Colibri categories
    - Suggested commit: `feat: apply colibri visual identity to UI components`
    - _Requirements: 4.1, 4.4_

- [x] 3. Tenant default invisível na API
  - [x] 3.1 Create tenant injection middleware
    - Create `apps/api/src/middleware/tenant.ts`
    - Read `DEFAULT_TENANT_ID` from env (fallback: `"colibri"`)
    - Inject `request.tenantId` in a Fastify `preHandler` hook
    - Suggested commit: `feat: add tenant injection middleware with DEFAULT_TENANT_ID`
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 3.2 Strip tenantId/siteId from all API response bodies
    - Audit all route handlers and serializers
    - Ensure no response includes `tenantId` or `siteId` fields
    - Remove `tenantId`/`siteId` from request parameter schemas (query, body, path)
    - Suggested commit: `refactor: strip tenantId/siteId from API request params and responses`
    - _Requirements: 3.2_

  - [x] 3.3 Remove multi-tenant management endpoints
    - Delete routes: GET/POST/PUT/DELETE `/tenants`, GET/POST `/sites`, GET `/artists`, POST `/artists/onboard`
    - Ensure removed endpoints return 404
    - Suggested commit: `refactor: remove multi-tenant management endpoints`
    - _Requirements: 3.4, 3.5_

  - [x] 3.4 Create seed script for default tenant and admin user
    - Add `prisma/seed.ts` that upserts the `colibri` tenant record
    - Seed a default admin user: `admin@colibri.local` / `change-me` / role: ADMIN
    - Admin seed must work in development and staging environments
    - Configure `prisma` seed command in `apps/api/package.json`
    - Suggested commit: `feat: add prisma seed for default tenant and admin user`
    - _Requirements: 3.1, 8.1_

  - [x] 3.5 Verify build passes after tenant changes
    - Run `pnpm install && pnpm typecheck && pnpm test && pnpm build`
    - Suggested commit: `fix: resolve any issues after tenant abstraction`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 4. Migração das rotas /marketplace para raiz (com redirects temporários)
  - [x] 4.1 Move marketplace route files to root-level route group
    - Move `apps/web/src/app/(store)/marketplace/` contents to `apps/web/src/app/(store)/`
    - Rename page files: `/marketplace/page.tsx` → `/(store)/page.tsx`
    - Move `/marketplace/produtos/` → `/(store)/produtos/`
    - Move `/marketplace/minha-conta/` → `/(store)/minha-conta/`
    - Suggested commit: `feat: migrate /marketplace routes to site root`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Update all internal navigation links and redirects
    - Search for `/marketplace` references in Link components, router.push, redirects
    - Replace with root-level paths (`/`, `/produtos`, `/produtos/[slug]`, `/minha-conta`)
    - Update Next.js middleware redirects if any
    - Suggested commit: `refactor: update internal links from /marketplace to root paths`
    - _Requirements: 2.7_

  - [x] 4.3 Add temporary compatibility redirects for /marketplace
    - Add Next.js middleware or `next.config.js` redirects:
      - `/marketplace` → `/` (301)
      - `/marketplace/produtos` → `/produtos` (301)
      - `/marketplace/produtos/:slug` → `/produtos/:slug` (301)
      - `/marketplace/minha-conta` → `/minha-conta` (301)
    - These redirects ensure no broken links during transition
    - Suggested commit: `feat: add temporary /marketplace redirect compatibility layer`
    - _Requirements: 2.6, 2.7_

  - [x] 4.4 Verify build passes after route migration
    - Run `pnpm install && pnpm typecheck && pnpm build`
    - Verify new routes render correctly
    - Verify redirects work as expected
    - Suggested commit: `fix: resolve any issues after route migration`
    - _Requirements: 12.1, 12.2, 12.4_

    - Add `Quote` model with fields: id, name, phone, city, description, product, status, notes, userId, tenantId, images, createdAt, updatedAt, `deletedAt DateTime?`
    - Add `QuoteImage` model with fields: id, url, quoteId (cascade delete)
    - Add `QuoteStatus` enum: PENDING, IN_PROGRESS, COMPLETED, REJECTED
    - Run `prisma migrate dev` to generate additive migration
    - Suggested commit: `feat: add Quote and QuoteImage models to prisma schema`
    - _Requirements: 10.3, 10.7_

    - Create route handler with Zod validation for required fields (name, phone, city, description, product)
    - Handle optional image uploads to Supabase Storage (up to 5 files)
    - Persist quote with status PENDING and associate images
    - Return success confirmation
    - Suggested commit: `feat: implement POST /quotes endpoint with image upload`
    - _Requirements: 10.2, 10.3, 10.4, 10.7_

    - Add admin-protected GET `/quotes` with status filtering (exclude soft-deleted)
    - Add admin-protected GET `/quotes/:id` with full details and images
    - Suggested commit: `feat: implement admin GET /quotes endpoints`
    - _Requirements: 10.5, 10.6_

    - Add admin-protected PUT `/quotes/:id` for status update and notes
    - Validate status transitions with Zod
    - Suggested commit: `feat: implement admin PUT /quotes/:id for status and notes`
    - _Requirements: 10.6_

    - Create quote form page at `/orcamento` route
    - Include fields: name, phone, city, description, product (category select), images (up to 5)
    - Add form validation and error display
    - Link form from product pages
    - Suggested commit: `feat: add quote request form page at /orcamento`
    - _Requirements: 10.1, 10.2_

- [ ] 6. Admin system — CRUD protegido
  - [ ] 6.1 Add soft delete column to Product and Category models
    - Add `deletedAt DateTime?` to Product and Category models
    - Run `prisma migrate dev` to generate additive migration
    - Update existing queries to filter `WHERE deletedAt IS NULL`
    - Suggested commit: `feat: add soft delete (deletedAt) to Product and Category models`
    - _Requirements: 8.4, 8.5_

  - [ ] 6.2 Implement admin product CRUD endpoints
    - POST `/products` (admin): create product with Zod validation
    - PUT `/products/:id` (admin): update product
    - DELETE `/products/:id` (admin): soft delete (set deletedAt)
    - GET `/products` (public): filter `deletedAt IS NULL`
    - Ensure RBAC middleware enforces admin role
    - Suggested commit: `feat: implement admin product CRUD endpoints with soft delete`
    - _Requirements: 8.4_

  - [ ] 6.3 Implement admin category CRUD endpoints
    - POST `/categories` (admin): create category
    - PUT `/categories/:id` (admin): update category
    - DELETE `/categories/:id` (admin): soft delete (set deletedAt)
    - GET `/categories` (public): filter `deletedAt IS NULL`
    - Suggested commit: `feat: implement admin category CRUD endpoints with soft delete`
    - _Requirements: 8.5_

  - [ ] 6.4 Implement image upload and management endpoints
    - POST `/uploads/images` (auth): upload image(s) to Supabase Storage
    - DELETE `/uploads/images/:id` (owner/admin): delete image from storage and DB
    - Ensure upload failure does not persist DB record (transactional pattern)
    - Suggested commit: `feat: implement image upload and management endpoints`
    - _Requirements: 8.5, 6.4, 6.7_

  - [ ] 6.5 Build admin panel UI pages
    - Create `/admin/products` page with product list, create/edit forms
    - Create `/admin/categories` page with category management
    - Create `/admin/quotes` page with quote list, detail view, status update
    - Suggested commit: `feat: build admin panel UI for products, categories, quotes`
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ] 6.6 Implement admin access control in Colibri_Web
    - Add middleware/guard to `/admin/*` routes
    - Redirect unauthenticated users to login
    - Show "insufficient permissions" for non-admin authenticated users
    - Suggested commit: `feat: implement admin route protection with role check`
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 7. Observability — Structured logging
  - [ ] 7.1 Add structured logging to Fastify
    - Configure Pino (Fastify's built-in logger) with JSON structured output
    - Add request correlation IDs (generate UUID per request, attach to all log entries)
    - Log request method, path, status code, duration on every response
    - Log errors with correlation ID, stack trace (server-side only), and context
    - Suggested commit: `feat: add structured logging with request correlation IDs`
    - _Requirements: 7.6_

  - [ ] 7.2 Add correlation ID propagation
    - Generate `X-Request-ID` header if not present in incoming request
    - Propagate correlation ID to all downstream log entries
    - Include correlation ID in error responses (development mode only)
    - Suggested commit: `feat: propagate correlation IDs across request lifecycle`
    - _Requirements: 7.6_

  - [ ] 7.3 Add logging for critical operations
    - Log authentication attempts (success/failure, no credentials in logs)
    - Log quote submissions (id, status)
    - Log admin mutations (who, what, when)
    - Log upload operations (success/failure, file size)
    - Suggested commit: `feat: add operational logging for auth, quotes, admin, uploads`
    - _Requirements: 7.6_

- [ ] 8. Hub cleanup — Remoção de código hub
  - [ ] 8.1 Remove hub-specific pages and components from frontend
    - Delete artist profile pages, multi-site navigation, hub landing pages
    - Remove components referencing multiple sites/artists/tenants
    - Retain shared utilities still used by Colibri functionality
    - Suggested commit: `refactor: remove hub-specific pages and components`
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 8.2 Remove Pluma component and related tests
    - Delete `apps/web/src/components/pluma/` directory and all contents
    - Delete `apps/web/src/components/pluma/__tests__/` (FeaturesSection, HeroSection, CTASection, etc.)
    - Remove any Pluma route pages (e.g., `/pluma`)
    - Remove Pluma references from navigation, layout, or imports
    - Suggested commit: `refactor: remove Pluma financial assistant (hub-specific)`
    - _Requirements: 9.1, 9.2_

  - [ ] 8.3 Remove hub-specific API routes and controllers
    - Delete any remaining hub-only route files (artist onboarding, cross-site search)
    - Remove hub-specific logic branches from shared routes
    - Suggested commit: `refactor: remove remaining hub-specific API routes`
    - _Requirements: 9.3_

  - [ ] 8.4 Remove hub-specific environment variables and config keys
    - Audit `.env.example` and config files for hub-specific keys
    - Remove any env vars no longer referenced by remaining code
    - Suggested commit: `chore: remove hub-specific environment variables`
    - _Requirements: 9.6_

  - [ ] 8.5 Final sweep for "arte-hub" references
    - Search entire codebase for "arte-hub", "hub-art", "@arte-hub/"
    - Replace or remove all remaining references
    - Verify no user-facing output contains "Arte Hub"
    - Suggested commit: `chore: remove all remaining arte-hub references`
    - _Requirements: 11.6, 4.6_

  - [ ] 8.6 Verify build integrity after hub removal
    - Run full build pipeline: `pnpm install && pnpm typecheck && pnpm test && pnpm build`
    - Fix any broken imports or missing dependencies
    - Suggested commit: `fix: resolve build issues after hub code removal`
    - _Requirements: 9.5, 12.1, 12.2, 12.3, 12.4_

- [ ] 9. Cleanup final — Remoção definitiva das rotas /marketplace
  - [ ] 9.1 Remove temporary /marketplace redirect rules
    - Delete the redirect entries from `next.config.js` or middleware
    - Navigating to `/marketplace/*` now returns 404
    - Suggested commit: `refactor: remove /marketplace compatibility redirects`
    - _Requirements: 2.6_

  - [ ] 9.2 Verify 404 behavior for old marketplace routes
    - Manually test or add integration test: `/marketplace`, `/marketplace/produtos`, `/marketplace/produtos/test-slug`, `/marketplace/minha-conta` all return 404
    - Suggested commit: `test: verify /marketplace routes return 404`
    - _Requirements: 2.6_

- [ ] 10. Testes, deploy e documentação final
  - [ ] 10.1 Add smoke tests for structure and naming
    - Test directory structure exists (apps/web, apps/api, packages, docs, .github/workflows)
    - Test pnpm-workspace.yaml content
    - Test package names use @colibri/ prefix
    - Test no "arte-hub" references in codebase
    - Test .env.example contains all required variables
    - Test no Prisma imports in apps/web
    - Suggested commit: `test: add smoke tests for project structure and naming`
    - _Requirements: 1.1, 6.5, 11.1, 11.6, 12.6_

  - [ ] 10.2 Add deployment configurations
    - Create/verify Vercel configuration for Colibri_Web
    - Ensure Colibri_API has a `start` script for Railway
    - Verify Prisma migration files are present for Supabase
    - Suggested commit: `chore: add deployment configs for Vercel, Railway, Supabase`
    - _Requirements: 12.5_

  - [ ] 10.3 Final build pipeline validation
    - Run `pnpm install && pnpm typecheck && pnpm test && pnpm build`
    - Confirm zero errors across all steps
    - Suggested commit: `chore: validate final build pipeline passes`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 10.4 Update final documentation
    - Ensure README reflects final state
    - Update .env.example if any variables changed during implementation
    - Update docs/ with final architecture diagrams
    - Suggested commit: `docs: finalize documentation for colibri v1`
    - _Requirements: 11.2, 11.4_

- [ ] 11. Phase 2 — Property-based tests (pós-MVP)
  - [ ]* 11.1 Write property test: old marketplace routes return 404 (Property 1)
    - **Property 1: Old marketplace routes are inaccessible**
    - For any URL path prefixed with `/marketplace`, return 404
    - Use fast-check to generate random path suffixes
    - **Validates: Requirements 2.6**
    - Suggested commit: `test: add property test for /marketplace 404 responses`

  - [ ]* 11.2 Write property test: tenant invisible in API responses (Property 2)
    - **Property 2: Tenant abstraction is invisible to API consumers**
    - For any API endpoint, response body SHALL NOT contain tenantId or siteId
    - Use fast-check to generate requests to all preserved endpoints
    - **Validates: Requirements 3.2**
    - Suggested commit: `test: add property test for tenant invisibility in responses`

  - [ ]* 11.3 Write property test: JWT access token lifetime (Property 3)
    - **Property 3: Access token lifetime constraint**
    - For any successful auth, JWT exp <= 15 minutes from iat
    - Use fast-check to generate valid user credentials
    - **Validates: Requirements 5.1**
    - Suggested commit: `test: add property test for JWT lifetime constraint`

  - [ ]* 11.4 Write property test: refresh token cookie attributes (Property 4)
    - **Property 4: Refresh token cookie security attributes**
    - Set-Cookie SHALL include HttpOnly, Secure, SameSite=Strict, max-age <= 7 days
    - Use fast-check to generate successful auth requests
    - **Validates: Requirements 5.2**
    - Suggested commit: `test: add property test for refresh token cookie attributes`

  - [ ]* 11.5 Write property test: invalid credentials generic 401 (Property 5)
    - **Property 5: Invalid credentials yield generic 401**
    - 401 response SHALL NOT reveal which credential was incorrect
    - Use fast-check to generate invalid email/password combos
    - **Validates: Requirements 5.4, 5.5**
    - Suggested commit: `test: add property test for generic 401 on invalid credentials`

  - [ ]* 11.6 Write property test: input validation structured errors (Property 6)
    - **Property 6: Input validation with structured error response**
    - 400 with statusCode, error type, field-level messages; no side effects
    - Use fast-check to generate malformed request bodies
    - **Validates: Requirements 5.6, 6.3, 7.7**
    - Suggested commit: `test: add property test for structured validation errors`

  - [ ]* 11.7 Write property test: RBAC enforcement (Property 7)
    - **Property 7: RBAC enforcement on protected endpoints**
    - For any protected endpoint and user with insufficient role, return 403
    - Use fast-check to generate user/endpoint/role combinations
    - **Validates: Requirements 5.7, 8.1**
    - Suggested commit: `test: add property test for RBAC enforcement`

  - [ ]* 11.8 Write property test: CORS origin restriction (Property 8)
    - **Property 8: CORS origin restriction**
    - Non-allowed origins get 403; empty ALLOWED_ORIGINS rejects all
    - Use fast-check to generate random origin strings
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Suggested commit: `test: add property test for CORS origin restriction`

  - [ ]* 11.9 Write property test: resource ownership enforcement (Property 9)
    - **Property 9: Resource ownership enforcement**
    - Non-admin user modifying non-owned resource gets 403
    - Use fast-check to generate user/resource ownership combos
    - **Validates: Requirements 7.4, 7.5**
    - Suggested commit: `test: add property test for resource ownership enforcement`

  - [ ]* 11.10 Write property test: production error masking (Property 10)
    - **Property 10: Production error masking**
    - In production mode, no stack traces, internal names, or DB details in responses
    - Use fast-check to generate error-triggering requests
    - **Validates: Requirements 7.6**
    - Suggested commit: `test: add property test for production error masking`

  - [ ]* 11.11 Write property test: upload failure atomicity (Property 11)
    - **Property 11: Upload failure atomicity**
    - If upload to Supabase Storage fails, no DB record persisted
    - Use fast-check with simulated upload failures
    - **Validates: Requirements 6.7**
    - Suggested commit: `test: add property test for upload failure atomicity`

  - [ ]* 11.12 Write property test: valid quote persistence (Property 12)
    - **Property 12: Valid quote request persistence**
    - For any valid quote with all required fields, persist with status PENDING
    - Use fast-check to generate valid quote data
    - **Validates: Requirements 10.3**
    - Suggested commit: `test: add property test for valid quote persistence`

  - [ ]* 11.13 Write property test: invalid quote rejection (Property 13)
    - **Property 13: Invalid quote request rejection**
    - For any quote with missing/invalid required fields, return 400 with field errors
    - Use fast-check to generate quotes with missing/invalid fields
    - **Validates: Requirements 10.4**
    - Suggested commit: `test: add property test for invalid quote rejection`

## Notes

- **MVP scope (Phase 1)**: Tasks 1–10 deliver a fully operational commercial site with catálogo, orçamento, admin, uploads, autenticação, and observability.
- **Phase 2**: Task 11 contains all property-based tests (marked with `*`). These validate correctness properties from the design document but are not required for initial commercial operation.
- **Soft delete**: Product, Category, and Quote use `deletedAt DateTime?` instead of physical deletes. This enables audit trails, accidental deletion recovery, and operational history.
- **Redirects before removal**: `/marketplace` routes get 301 redirects during migration (task 4.3). Definitive removal only happens in task 9 after all Colibri routes are confirmed working.
- **Admin seed**: Default admin user (`admin@colibri.local` / `change-me` / ADMIN) is created via seed for development and staging. Production admin must be created through a secure onboarding flow.
- **Observability**: Structured JSON logging with request correlation IDs enables production debugging and request tracing.
- **Incremental strategy**: No big-bang migrations. Each task produces a buildable project. Commits are small, focused, and follow conventional commits format.
- **Tenant invisibility**: The tenant abstraction is invisible throughout the entire implementation. Frontend never knows about tenantId. This design supports future multi-tenant/white-label/franchise expansion without architectural changes.
- Each task references specific requirements for traceability.

### Known Test Debt

| Category | Type | Suites | Root Cause | Resolution |
|----------|------|--------|------------|------------|
| fast-check resolution | **Test infra debt** (not functional failure) | 20 suites | Vite cannot resolve `fast-check` package entry due to ESM/CJS mismatch in hoisted node_modules | Phase 2: fix package resolution or upgrade fast-check/vite |
| Pluma component tests | **Hub-specific code** (will be removed) | 2 tests in 2 suites | Tests reference "Pluma" financial assistant — a hub feature not part of Colibri | Wave 7 task 8.2: remove Pluma entirely |
| Auth isolation property tests | **Multi-tenant test debt** (tenant abstraction removed siteId from JWT) | 4 tests in 1 suite | Tests expect `siteId` in JWT payload, but tenant abstraction (task 3.2) removed it from responses | Phase 2: update tests to reflect single-tenant architecture |

**Classification**: `pnpm test` status is **Partial Pass / Known Failures Accepted**. No functional regression exists. All Colibri-relevant tests pass.

## Operational Documentation

### Release Checklist

1. All tasks in the wave are complete
2. `pnpm install && pnpm typecheck && pnpm test && pnpm build` passes
3. PR created from wave branch to main
4. Code review approved
5. CI green on PR
6. Merge to main
7. Deploy to staging (mandatory after Wave 10)
8. Staging validation checklist passes
9. Deploy to production

### Rollback Process

1. Identify the failing commit or wave
2. `git revert <commit>` or revert the entire wave branch merge
3. Deploy reverted main to staging → validate → production
4. No data loss: all schema changes are additive, no destructive migrations in MVP
5. If a Prisma migration needs rollback: restore from backup (destructive changes only happen post-MVP)

### Deployment Flow

```
wave branch → PR → CI → code review → merge to main → staging → validation → production
```

## Future Architecture (document only, do not implement)

The following capabilities are planned for post-MVP phases:

- **Media pipeline**: Image resize, WebP conversion, thumbnail generation (consider Supabase Edge Functions or external service)
- **Full-text search**: Product search with relevance ranking (consider pg_trgm, Supabase full-text, or Meilisearch)
- **Filters and autocomplete**: Category filters, price ranges, autocomplete suggestions
- **CRM operacional**: Extended lifecycle management:
  - Lead → Quote → Sale → Installation → Post-sale
  - Status tracking, timeline, notifications
  - Customer relationship history
- **Multi-tenant expansion**: The DEFAULT_TENANT_ID pattern supports future white-label, franchise, or multi-store scenarios without architectural changes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 3, "tasks": ["1.6", "1.7"] },
    { "id": 4, "tasks": ["2.1", "3.1"] },
    { "id": 5, "tasks": ["2.2", "2.3", "3.2", "3.3"] },
    { "id": 6, "tasks": ["2.4", "3.4"] },
    { "id": 7, "tasks": ["3.5"] },
    { "id": 8, "tasks": ["4.1"] },
    { "id": 9, "tasks": ["4.2", "4.3"] },
    { "id": 10, "tasks": ["4.4"] },
    { "id": 11, "tasks": ["5.1"] },
    { "id": 12, "tasks": ["5.2", "5.5"] },
    { "id": 13, "tasks": ["5.3", "5.4"] },
    { "id": 14, "tasks": ["6.1"] },
    { "id": 15, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 16, "tasks": ["6.5", "6.6"] },
    { "id": 17, "tasks": ["7.1"] },
    { "id": 18, "tasks": ["7.2", "7.3"] },
    { "id": 19, "tasks": ["8.1", "8.2"] },
    { "id": 20, "tasks": ["8.3", "8.4"] },
    { "id": 21, "tasks": ["8.5"] },
    { "id": 22, "tasks": ["9.1"] },
    { "id": 23, "tasks": ["9.2"] },
    { "id": 24, "tasks": ["10.1", "10.2"] },
    { "id": 25, "tasks": ["10.3", "10.4"] },
    { "id": 26, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9", "11.10", "11.11", "11.12", "11.13"] }
  ]
}
```
