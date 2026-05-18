# Technical Design Document: Colibri Migration

## Overview

This design describes the migration of the Arte Hub multi-tenant monorepo into a single-site commercial application for Toldos Colibri. The migration preserves the existing architecture (pnpm workspaces, Next.js App Router, Fastify, Prisma, Supabase) while removing multi-tenant complexity and rebranding the application.

**Key Design Decision:** A default tenant record (`DEFAULT_TENANT_ID=colibri`) is retained in the database to preserve referential integrity and minimize breakage risk. This tenant abstraction is invisible to API consumers and frontend users — no request or response exposes `tenantId`/`siteId`. The codebase is structured so that tenant columns can be dropped in a future migration without application logic changes beyond removing the default injection.

### Migration Strategy

The migration follows a copy-and-transform approach:
1. Clone the Arte Hub repository structure into the Colibri repository
2. Apply transformations in small, focused commits (conventional commits)
3. Each commit targets a single logical change (route migration, brand replacement, tenant removal, etc.)
4. The build pipeline (`pnpm install → typecheck → test → build`) must pass at each commit boundary

### Migration Order

The migration MUST follow this sequence to minimize risk:

1. Bootstrap do novo repositório colibri (scaffold, pnpm workspace, CI)
2. Renomeação segura de pacotes e configs (@colibri/*)
3. Brand_Config centralizado (apps/web/src/config/site.ts)
4. Tenant default invisível na API (middleware injection)
5. Migração das rotas /marketplace para raiz
6. Ajustes visuais Toldos Colibri (UI, meta tags, categorias)
7. Quote/QuoteImage no Prisma e API (migração aditiva)
8. Admin CRUD protegido (produtos, categorias, orçamentos)
9. Remoção final de código hub (páginas, rotas, env vars)
10. Testes, build e documentação final

### Rollback Strategy

- **Build integrity**: Each migration step MUST leave the project in a buildable state. If a step breaks the build, it must be reverted before proceeding.
- **Additive migrations first**: Prisma migrations MUST be additive (new tables, new columns) during the initial phases. Destructive schema changes (column removal, table drops) are deferred to a future post-migration cleanup.
- **Hub removal after equivalence**: Hub-specific code removal SHALL only occur after the equivalent Colibri routes and functionality are confirmed working via tests.
- **Commit-level rollback**: In case of failure at any step, the rollback procedure is `git revert` to the previous passing commit. No data loss occurs because schema changes are additive and no existing data is modified or deleted during migration.
- **Database safety**: No existing rows, columns, or tables are dropped during migration. The default tenant record is inserted via a seed script, not a destructive migration.

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Monorepo (@colibri)"
        subgraph "apps/web (Colibri_Web)"
            NextJS[Next.js App Router]
            Pages[Pages: /, /produtos, /produtos/slug, /minha-conta]
            Admin[Admin Panel: /admin/*]
            BrandConfig[Brand_Config: site.ts]
        end
        
        subgraph "apps/api (Colibri_API)"
            Fastify[Fastify HTTP Server]
            AuthModule[Auth Module: JWT + Refresh]
            TenantMiddleware[Tenant Injection Middleware]
            ZodValidation[Zod Request Validation]
            RBAC[RBAC Middleware]
            Routes[API Routes]
        end
        
        subgraph "packages"
            SharedTypes[Shared Types/Schemas]
            SharedUtils[Shared Utilities]
        end
    end
    
    subgraph "External Services"
        Supabase[(Supabase PostgreSQL)]
        SupaStorage[Supabase Storage]
    end
    
    NextJS -->|HTTP API calls| Fastify
    Fastify --> Supabase
    Fastify --> SupaStorage
    TenantMiddleware -->|Injects DEFAULT_TENANT_ID| Routes
```

### Deployment Architecture

```mermaid
graph LR
    subgraph "Vercel"
        Web[Colibri_Web]
    end
    
    subgraph "Railway"
        API[Colibri_API]
    end
    
    subgraph "Supabase"
        DB[(PostgreSQL)]
        Storage[Storage Buckets]
    end
    
    Web -->|COLIBRI_API_URL| API
    API -->|DATABASE_URL| DB
    API -->|SUPABASE_URL + KEY| Storage
```

### Tenant Removal Strategy

```mermaid
sequenceDiagram
    participant Client
    participant API as Colibri_API
    participant MW as Tenant Middleware
    participant DB as PostgreSQL
    
    Client->>API: POST /products (no tenantId)
    API->>MW: preHandler hook
    MW->>MW: Inject tenantId = "colibri"
    MW->>API: request.tenantId = "colibri"
    API->>DB: INSERT INTO products (tenantId = "colibri", ...)
    DB-->>API: OK
    API-->>Client: 201 Created (no tenantId in response)
```

## Components and Interfaces

### 1. Colibri_Web (apps/web)

**Framework:** Next.js (App Router)

#### Route Structure

| Old Route (Arte Hub) | New Route (Colibri) | Description |
|---|---|---|
| `/marketplace` | `/` | Product catalog home |
| `/marketplace/produtos` | `/produtos` | Product listing |
| `/marketplace/produtos/[slug]` | `/produtos/[slug]` | Product detail |
| `/marketplace/minha-conta` | `/minha-conta` | User account |
| `/admin/*` | `/admin/*` | Admin panel (preserved) |
| `/marketplace/orcamento` | `/orcamento` | Quote request form |

#### Key Modules

- **`apps/web/src/config/site.ts`** (Brand_Config): Single source of truth for brand values
- **`apps/web/src/app/(store)/`**: Route group for public store pages
- **`apps/web/src/app/(admin)/admin/`**: Route group for admin panel
- **`apps/web/src/lib/api.ts`**: HTTP client for Colibri_API communication
- **`apps/web/src/middleware.ts`**: Next.js middleware for auth redirects

#### Brand_Config Interface

```typescript
// apps/web/src/config/site.ts
export interface SiteConfig {
  name: string;           // "Toldos Colibri"
  tagline: string;        // Company tagline
  description: string;    // Meta description
  domain: string;         // Production domain
  contacts: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  categories: string[];   // ["toldos", "coberturas", "capotas", "capas de mesa", "produtos de lona"]
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  social: {
    instagram?: string;
    facebook?: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "Toldos Colibri",
  // ... values populated per brand requirements
};
```

### 2. Colibri_API (apps/api)

**Framework:** Fastify  
**ORM:** Prisma (PostgreSQL on Supabase)  
**Validation:** Zod  
**Storage:** Supabase Storage

#### Middleware Stack

```typescript
// Request lifecycle (Fastify hooks)
1. onRequest  → CORS validation (ALLOWED_ORIGINS)
2. preHandler → Auth token verification (JWT)
3. preHandler → Tenant injection (DEFAULT_TENANT_ID)
4. preHandler → RBAC check (role-based)
5. preHandler → Zod schema validation
6. handler    → Business logic
7. onSend     → Error masking (production)
```

#### Tenant Injection Middleware

```typescript
// apps/api/src/middleware/tenant.ts
import { FastifyRequest } from 'fastify';

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'colibri';

export async function injectTenant(request: FastifyRequest) {
  // Automatically inject tenant on every request
  request.tenantId = DEFAULT_TENANT_ID;
}
```

#### API Endpoints (Preserved)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate user |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Auth | Invalidate refresh token |
| GET | `/products` | Public | List products |
| GET | `/products/:slug` | Public | Get product by slug |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |
| GET | `/categories` | Public | List categories |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |
| POST | `/uploads/images` | Auth | Upload image(s) |
| DELETE | `/uploads/images/:id` | Owner/Admin | Delete image |
| POST | `/quotes` | Public | Submit quote request |
| GET | `/quotes` | Admin | List quote requests |
| GET | `/quotes/:id` | Admin | Get quote details |
| PUT | `/quotes/:id` | Admin | Update quote status/notes |

#### Removed Endpoints (Multi-Tenant)

| Method | Path | Reason |
|---|---|---|
| GET | `/tenants` | Multi-tenant management |
| POST | `/tenants` | Tenant creation |
| PUT | `/tenants/:id` | Tenant update |
| DELETE | `/tenants/:id` | Tenant deletion |
| GET | `/sites` | Site listing |
| POST | `/sites` | Site creation |
| GET | `/artists` | Artist profiles |
| POST | `/artists/onboard` | Artist onboarding |

### 3. Shared Packages

- **`packages/types`** (`@colibri/types`): Shared TypeScript types and Zod schemas
- **`packages/utils`** (`@colibri/utils`): Shared utility functions (if present in source)

### 4. Quote Request Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Colibri_Web
    participant API as Colibri_API
    participant DB as PostgreSQL
    participant S3 as Supabase Storage
    
    User->>Web: Fill quote form
    Web->>API: POST /quotes (multipart)
    API->>API: Zod validation
    alt Validation fails
        API-->>Web: 400 + field errors
        Web-->>User: Show field errors
    else Validation passes
        API->>S3: Upload images (if any)
        alt Upload fails
            API-->>Web: 500 upload error
        else Upload succeeds
            API->>DB: INSERT quote (status: pending)
            DB-->>API: Quote record
            API-->>Web: 201 Created
            Web-->>User: Success confirmation
        end
    end
```

## Data Models

### Prisma Schema (Key Models)

```prisma
// Existing models preserved with tenantId column retained for referential integrity

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  products  Product[]
  categories Category[]
  quotes    Quote[]
  users     User[]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(USER)
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  quotes       Quote[]
}

enum Role {
  USER
  ADMIN
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal?
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  images      ProductImage[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductImage {
  id        String  @id @default(cuid())
  url       String
  order     Int     @default(0)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  tenantId String
  tenant   Tenant    @relation(fields: [tenantId], references: [id])
  products Product[]
}

model Quote {
  id          String      @id @default(cuid())
  name        String
  phone       String
  city        String
  description String
  product     String      // Category/product of interest
  status      QuoteStatus @default(PENDING)
  notes       String?     // Admin internal notes
  userId      String?     // Optional: if user is authenticated
  user        User?       @relation(fields: [userId], references: [id])
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  images      QuoteImage[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum QuoteStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
}

model QuoteImage {
  id      String @id @default(cuid())
  url     String
  quoteId String
  quote   Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

### Key Design Decisions for Data Models

1. **Tenant table retained**: The `Tenant` model stays with a single `colibri` record. All foreign keys (`tenantId`) remain intact, preserving referential integrity without requiring a data migration.

2. **Quote model is new**: The `Quote` and `QuoteImage` models are added via a new Prisma migration. The quote flow is a new feature for Colibri.

3. **No schema-breaking changes**: Existing migration files are preserved. New migrations are additive only (adding Quote tables, no column removals).

4. **Future-proofing**: The `tenantId` injection happens at the middleware layer. When ready to remove multi-tenancy entirely, only the middleware and the database columns need to change — no business logic modifications required.

### Environment Variables

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:password@host:5432/colibri

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Tenant (internal)
DEFAULT_TENANT_ID=colibri

# CORS
ALLOWED_ORIGINS=https://colibri.com.br,http://localhost:3000

# App URLs
COLIBRI_API_URL=https://api.colibri.com.br
COLIBRI_WEB_URL=https://colibri.com.br
NEXT_PUBLIC_API_URL=https://api.colibri.com.br

# Node
NODE_ENV=production
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Old marketplace routes are inaccessible

*For any* URL path prefixed with `/marketplace` (including `/marketplace`, `/marketplace/produtos`, `/marketplace/anything`), the Colibri_Web application SHALL return a 404 response.

**Validates: Requirements 2.6**

### Property 2: Tenant abstraction is invisible to API consumers

*For any* API endpoint and *for any* valid request to that endpoint, the response body SHALL NOT contain `tenantId` or `siteId` fields, and the endpoint SHALL NOT require `tenantId` or `siteId` as a client-supplied parameter (query, body, or path).

**Validates: Requirements 3.2**

### Property 3: Access token lifetime constraint

*For any* successful authentication request, the issued JWT access token SHALL have an expiration time (`exp` claim) that is at most 15 minutes from the issuance time (`iat` claim).

**Validates: Requirements 5.1**

### Property 4: Refresh token cookie security attributes

*For any* successful authentication response that sets a refresh token cookie, the `Set-Cookie` header SHALL include the `HttpOnly`, `Secure`, and `SameSite=Strict` attributes, and the cookie's max-age SHALL NOT exceed 7 days.

**Validates: Requirements 5.2**

### Property 5: Invalid credentials yield generic 401

*For any* authentication attempt with invalid credentials (wrong email, wrong password, or both), the API SHALL return a 401 status with an error message that does not reveal which specific credential was incorrect.

**Validates: Requirements 5.4, 5.5**

### Property 6: Input validation with structured error response

*For any* API endpoint that accepts input and *for any* request with data that violates the endpoint's Zod schema, the API SHALL return a 400 status with a JSON body containing at minimum: an HTTP status code, an error type indicator, and an array of field-level validation messages — and no side effects (database writes, file uploads) SHALL occur.

**Validates: Requirements 5.6, 6.3, 7.7**

### Property 7: RBAC enforcement on protected endpoints

*For any* protected API endpoint and *for any* authenticated user whose role does not satisfy the endpoint's required role, the API SHALL return a 403 status and SHALL NOT execute the endpoint's business logic.

**Validates: Requirements 5.7, 8.1**

### Property 8: CORS origin restriction

*For any* cross-origin request whose `Origin` header value is not present in the `ALLOWED_ORIGINS` list, the API SHALL reject the request with a 403 status. When `ALLOWED_ORIGINS` is unset or empty, all cross-origin requests SHALL be rejected.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 9: Resource ownership enforcement

*For any* resource mutation endpoint and *for any* non-admin authenticated user attempting to modify a resource they do not own (their user ID does not match the resource's owner ID), the API SHALL return a 403 status and SHALL NOT modify the resource.

**Validates: Requirements 7.4, 7.5**

### Property 10: Production error masking

*For any* request that triggers an internal error while the API is running in production mode (`NODE_ENV=production`), the error response SHALL contain only a generic error message and HTTP status code, and SHALL NOT include stack traces, internal service names, or database error details.

**Validates: Requirements 7.6**

### Property 11: Upload failure atomicity

*For any* request that includes a file upload, if the upload to Supabase Storage fails, the API SHALL NOT persist any associated database record and SHALL return an error response indicating the upload failure.

**Validates: Requirements 6.7**

### Property 12: Valid quote request persistence

*For any* valid quote request containing all required fields (name, phone, city, description, product of interest), the API SHALL persist the quote with status `PENDING` and return a success confirmation.

**Validates: Requirements 10.3**

### Property 13: Invalid quote request rejection

*For any* quote request where one or more required fields (name, phone, city, description, product of interest) are missing or invalid, the API SHALL return a 400 status with field-level validation errors identifying each invalid field.

**Validates: Requirements 10.4**

## Error Handling

### API Error Response Format

All API errors follow a consistent JSON structure:

```typescript
interface ApiError {
  statusCode: number;        // HTTP status code
  error: string;             // Error type (e.g., "ValidationError", "Unauthorized", "Forbidden")
  message: string;           // Human-readable message (generic in production)
  details?: FieldError[];    // Field-level errors (validation only)
}

interface FieldError {
  field: string;             // Field path (e.g., "body.name", "query.page")
  message: string;           // Validation message
  code: string;              // Zod error code
}
```

### Error Categories

| Status | Error Type | When | Response |
|---|---|---|---|
| 400 | ValidationError | Zod schema validation fails | Includes `details` array with field errors |
| 401 | Unauthorized | Invalid/expired token, bad credentials | Generic "Authentication failed" message |
| 403 | Forbidden | CORS violation, RBAC denial, ownership check failure | "Access denied" without revealing reason details |
| 404 | NotFound | Resource not found, removed endpoints | "Resource not found" |
| 500 | InternalError | Unhandled exceptions | Generic message in production; full details in development |

### Error Handling Strategy by Layer

```mermaid
graph TD
    A[Incoming Request] --> B{CORS Check}
    B -->|Rejected| C[403 Forbidden]
    B -->|Passed| D{Auth Check}
    D -->|No token/Invalid| E[401 Unauthorized]
    D -->|Passed| F{Zod Validation}
    F -->|Invalid| G[400 ValidationError + field details]
    F -->|Valid| H{RBAC Check}
    H -->|Insufficient role| I[403 Forbidden]
    H -->|Passed| J{Ownership Check}
    J -->|Not owner & not admin| K[403 Forbidden]
    J -->|Passed| L[Business Logic]
    L -->|Upload fails| M[500 Upload Error, no DB write]
    L -->|DB error| N[500 InternalError, masked in prod]
    L -->|Success| O[2xx Response]
```

### Production vs Development Error Behavior

- **Development** (`NODE_ENV=development`): Full error details including stack traces, Prisma query errors, and internal service names are returned to aid debugging.
- **Production** (`NODE_ENV=production`): Only the status code, error type, and a generic message are returned. Stack traces, database details, and internal service names are logged server-side but never sent to the client.

### File Upload Error Handling

File uploads use a transactional pattern:
1. Validate request (Zod) → fail fast with 400
2. Upload files to Supabase Storage → if any upload fails, return 500 immediately
3. Persist database record with file URLs → if DB write fails, attempt to clean up uploaded files (best-effort)

This ensures no orphaned database records reference non-existent files.

## Testing Strategy

### Testing Approach

The migration uses a dual testing strategy combining unit/example-based tests with property-based tests:

- **Unit tests**: Verify specific examples, edge cases, integration points, and UI rendering
- **Property-based tests**: Verify universal properties across randomized inputs (API behavior, validation, auth, CORS)
- **Integration tests**: Verify build pipeline, deployment configs, and external service interactions
- **Smoke tests**: Verify structural/configuration requirements (file existence, package names, env vars)

### Property-Based Testing Configuration

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (TypeScript/JavaScript PBT library)

**Configuration:**
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: colibri-migration, Property {number}: {property_text}`

### Test Categories

#### Property-Based Tests (fast-check)

| Property | What It Tests | Generator Strategy |
|---|---|---|
| P1: Old routes 404 | /marketplace/* returns 404 | Generate random path suffixes |
| P2: Tenant invisible | No tenantId in responses | Generate requests to all endpoints |
| P3: JWT lifetime | Access token exp <= 15min | Generate valid user credentials |
| P4: Cookie attributes | HttpOnly, Secure, SameSite | Generate successful auth requests |
| P5: Generic 401 | No credential leak in errors | Generate invalid email/password combos |
| P6: Validation errors | 400 + field errors, no side effects | Generate malformed request bodies |
| P7: RBAC enforcement | 403 for insufficient roles | Generate user/endpoint/role combinations |
| P8: CORS restriction | 403 for non-allowed origins | Generate random origin strings |
| P9: Ownership check | 403 for non-owner mutations | Generate user/resource ownership combos |
| P10: Error masking | No internals in prod errors | Generate error-triggering requests |
| P11: Upload atomicity | No DB record on upload failure | Generate requests with simulated upload failures |
| P12: Quote persistence | Valid quotes saved as PENDING | Generate valid quote data |
| P13: Quote validation | Invalid quotes rejected with field errors | Generate quotes with missing/invalid fields |

#### Unit/Example-Based Tests

- Route rendering (/, /produtos, /produtos/[slug], /minha-conta)
- Brand_Config values appear in rendered pages
- Admin panel access control (redirect for unauth, deny for non-admin)
- Quote form field presence and constraints
- Admin quote management UI

#### Integration Tests

- Build pipeline (install, typecheck, test, build) passes
- Token refresh flow works end-to-end
- File upload to Supabase Storage
- Quote image association with quote record

#### Smoke Tests

- Directory structure exists (apps/web, apps/api, packages, docs, .github/workflows)
- pnpm-workspace.yaml content correct
- Package names use @colibri/ prefix
- No "arte-hub" references in codebase
- .env.example contains all required variables
- No Prisma imports in apps/web
- Deployment configs present (Vercel, Railway, Prisma migrations)

### Test File Organization

```
apps/api/
  src/
    __tests__/
      properties/          # Property-based tests
        auth.property.ts
        cors.property.ts
        validation.property.ts
        ownership.property.ts
        quotes.property.ts
        tenant.property.ts
        errors.property.ts
      unit/                # Unit tests
        auth.test.ts
        products.test.ts
        quotes.test.ts
      integration/         # Integration tests
        build-pipeline.test.ts
        upload.test.ts

apps/web/
  src/
    __tests__/
      properties/          # Property-based tests
        routes.property.ts
      unit/                # Unit tests
        pages.test.ts
        admin.test.ts
        brand.test.ts
      smoke/               # Smoke tests
        structure.test.ts
        naming.test.ts
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

## Future Architecture (post-MVP, document only)

The following capabilities are planned for post-MVP phases. They are documented here for architectural awareness but SHALL NOT be implemented during the migration.

### Media Pipeline
- Image resize on upload (multiple sizes: thumbnail, medium, large)
- WebP conversion for performance
- Thumbnail generation for product listings
- Consider: Supabase Edge Functions, Sharp, or external image CDN

### Full-Text Search
- Product search with relevance ranking
- Consider: PostgreSQL `pg_trgm` extension, Supabase full-text search, or Meilisearch
- Autocomplete suggestions for product names and categories

### Filters and Autocomplete
- Category filters, price ranges
- Autocomplete suggestions in search
- Faceted navigation for product catalog

### CRM Operacional
Extended lifecycle management beyond quotes:
- **Lead** → **Quote** → **Sale** → **Installation** → **Post-sale**
- Status tracking and timeline per customer
- Notifications (email, WhatsApp)
- Customer relationship history
- Revenue reporting

### Multi-Tenant Expansion
The `DEFAULT_TENANT_ID` pattern supports future scenarios without architectural changes:
- White-label: multiple brands on same infrastructure
- Franchise: independent stores sharing platform
- Multi-store: single brand with multiple locations
- The tenant injection middleware simply reads from a different source (subdomain, header, or config) instead of env var

