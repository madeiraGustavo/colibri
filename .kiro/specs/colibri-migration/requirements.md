# Requirements Document

## Introduction

This document defines the requirements for migrating the public project Arte Hub (https://github.com/madeiraGustavo/arte-hub) into a new repository called Colibri (https://github.com/madeiraGustavo/colibri). The migration transforms the project from a multi-site hub into a single commercial site for the company "Toldos Colibri", specializing in toldos, coberturas, capotas, capas de mesa, and produtos de lona. The migration reuses the existing architecture, backend, API, security, authentication, database, uploads, and test structure while removing multi-tenant and hub-specific functionality.

## Glossary

- **Colibri_Web**: The Next.js frontend application located in `apps/web`, serving the Toldos Colibri commercial site.
- **Colibri_API**: The Fastify backend application located in `apps/api`, handling authentication, business rules, and database access.
- **Monorepo**: The pnpm workspace containing `apps/web`, `apps/api`, `packages`, `docs`, and `.github/workflows`.
- **Marketplace**: The existing `/marketplace` route group in Arte Hub that becomes the root of the Colibri site.
- **Brand_Config**: A centralized configuration file at `apps/web/src/config/site.ts` containing all brand-specific values (name, contacts, domain, colors).
- **Tenant**: A site/artist entity in the original Arte Hub multi-tenant model.
- **Access_Token**: A short-lived JWT used for API authentication.
- **Refresh_Token**: A long-lived token stored in an HttpOnly cookie used to obtain new Access_Tokens.
- **RBAC**: Role-Based Access Control governing user permissions in the API.
- **Admin_Panel**: The protected administrative interface for managing products, images, categories, and quotes.
- **Build_Pipeline**: The set of commands (`pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build`) that must pass for the project to be considered functional.

## Requirements

### Requirement 1: Monorepo Structure Preservation

**User Story:** As a developer, I want the Colibri repository to maintain the monorepo structure from Arte Hub, so that the separation of concerns between frontend, backend, and shared packages is preserved.

#### Acceptance Criteria

1. THE Monorepo SHALL contain the directories `apps/web`, `apps/api`, `packages`, `docs`, and `.github/workflows`.
2. THE Monorepo SHALL define a `pnpm-workspace.yaml` file at the repository root that lists `apps/*` and `packages/*` as workspace packages.
3. THE Monorepo SHALL include a root `package.json` with workspace scripts named `install`, `typecheck`, `test`, and `build` that execute across all workspace packages.
4. WHEN a developer runs `pnpm install` at the root, THE Monorepo SHALL resolve all workspace dependencies and exit with code 0 and no error output.
5. THE Monorepo SHALL specify the minimum required Node.js version (via an `engines` field in the root `package.json`) and the required pnpm version (via a `packageManager` field or `.npmrc` configuration).

### Requirement 2: Route Migration from Marketplace to Root

**User Story:** As a user, I want the marketplace content to be accessible from the site root, so that the Colibri site functions as a standalone commercial store without the `/marketplace` prefix.

#### Acceptance Criteria

1. THE Colibri_Web SHALL serve the former `/marketplace` page at the route `/`.
2. THE Colibri_Web SHALL serve the former `/marketplace/produtos` page at the route `/produtos`.
3. THE Colibri_Web SHALL serve the former `/marketplace/produtos/[slug]` page at the route `/produtos/[slug]`.
4. THE Colibri_Web SHALL serve the former `/marketplace/minha-conta` page at the route `/minha-conta`.
5. WHEN a user navigates to `/`, THE Colibri_Web SHALL display the product catalog as the home page.
6. IF a user navigates to a path prefixed with `/marketplace`, THEN THE Colibri_Web SHALL return a 404 response (the old `/marketplace` routes SHALL NOT be accessible).
7. THE Colibri_Web SHALL update all internal navigation links and redirects to reference the new root-level paths (`/`, `/produtos`, `/produtos/[slug]`, `/minha-conta`) instead of their former `/marketplace`-prefixed equivalents.

### Requirement 3: Multi-Tenant Removal

**User Story:** As a developer, I want the multi-tenant logic removed or simplified, so that the codebase operates as a single-site application without unnecessary complexity.

#### Acceptance Criteria

1. THE Colibri_API SHALL retain a single default tenant record with identifier `DEFAULT_TENANT_ID=colibri` in the database to preserve referential integrity and reduce migration risk.
2. THE Colibri_API SHALL automatically inject the default tenant identifier internally on all operations that require a `tenantId` or `siteId`; no API request SHALL require `tenantId` or `siteId` as a client-supplied parameter, and no API response body SHALL include `tenantId` or `siteId`.
3. THE Colibri_Web SHALL not expose tenant selection, site switching, or multi-artist navigation to users.
4. THE Colibri_API SHALL remove all API endpoints that exclusively serve multi-tenant management (tenant CRUD, site listing).
5. IF a client sends a request to a removed multi-tenant endpoint, THEN THE Colibri_API SHALL return a 404 status.
6. THE default tenant strategy SHALL be treated as an intermediate step; the codebase SHALL be structured so that `tenantId`/`siteId` columns can be removed in a future migration without requiring application logic changes beyond removing the default injection.

### Requirement 4: Brand Identity Replacement

**User Story:** As a business owner, I want all references to "Arte Hub" replaced with "Toldos Colibri" branding, so that the site reflects the correct company identity.

#### Acceptance Criteria

1. THE Colibri_Web SHALL display "Toldos Colibri" as the site name in all user-facing locations including the HTML document title, page header, page footer, and meta tags (og:site_name, description).
2. THE Colibri_Web SHALL load brand values (name, tagline, contacts, domain, colors) from the Brand_Config file at `apps/web/src/config/site.ts`.
3. THE Colibri_Web SHALL not contain hardcoded brand text, contact information, or company-specific values outside of Brand_Config; all components referencing brand identity SHALL read values from Brand_Config.
4. THE Colibri_Web SHALL display exclusively the product categories toldos, coberturas, capotas, capas de mesa, and produtos de lona in navigation and catalog views.
5. THE Brand_Config SHALL be the single file requiring modification to update brand information; no other source file SHALL duplicate brand values defined in Brand_Config.
6. THE Colibri_Web SHALL not contain any remaining references to "Arte Hub" or "arte-hub" in user-facing rendered output.

### Requirement 5: Authentication and Session Preservation

**User Story:** As a user, I want login, session management, and token refresh to continue working, so that my authentication experience remains secure and seamless.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Colibri_API SHALL issue an Access_Token as a JWT with a maximum lifetime of 15 minutes.
2. THE Colibri_API SHALL store Refresh_Tokens in HttpOnly cookies with Secure and SameSite=Strict attributes, with a maximum lifetime of 7 days.
3. WHEN an Access_Token expires, THE Colibri_Web SHALL use the Refresh_Token cookie to obtain a new Access_Token without requiring re-login and without user-visible interruption.
4. IF a Refresh_Token is invalid or expired, THEN THE Colibri_API SHALL return a 401 status and THE Colibri_Web SHALL redirect the user to the login page.
5. IF authentication credentials are invalid, THEN THE Colibri_API SHALL return a 401 status with a structured error response indicating authentication failure without revealing which credential was incorrect.
6. THE Colibri_API SHALL validate all incoming requests with Zod schemas before processing.
7. THE Colibri_API SHALL enforce RBAC rules on protected endpoints based on user roles.

### Requirement 6: API Architecture Preservation

**User Story:** As a developer, I want the API to maintain its existing architecture (Fastify, Prisma, Zod, Supabase), so that backend reliability and security are not compromised during migration.

#### Acceptance Criteria

1. THE Colibri_API SHALL use Fastify as the HTTP framework.
2. THE Colibri_API SHALL use Prisma as the ORM for database access with PostgreSQL on Supabase.
3. THE Colibri_API SHALL validate all request body, query parameter, and path parameter inputs using Zod schemas before processing the request.
4. THE Colibri_API SHALL handle file uploads through Supabase Storage.
5. THE Colibri_Web SHALL not import or reference the Prisma client, database connection modules, or any direct database access libraries; all data access SHALL go through the Colibri_API via HTTP requests.
6. THE Colibri_API SHALL retain all existing Prisma migration files and the resulting database schema SHALL remain compatible with the existing data, ensuring no tables, columns, or relationships required by preserved features are removed or altered.
7. IF a file upload to Supabase Storage fails, THEN THE Colibri_API SHALL return an error response indicating the upload failure without persisting incomplete records to the database.

### Requirement 7: Security Configuration

**User Story:** As a security-conscious developer, I want all existing security measures preserved, so that the migration does not introduce vulnerabilities.

#### Acceptance Criteria

1. THE Colibri_API SHALL restrict CORS to origins listed in the `ALLOWED_ORIGINS` environment variable.
2. IF a request originates from an origin not present in the `ALLOWED_ORIGINS` list, THEN THE Colibri_API SHALL reject the request with a 403 status.
3. IF the `ALLOWED_ORIGINS` environment variable is unset or empty, THEN THE Colibri_API SHALL deny all cross-origin requests.
4. THE Colibri_API SHALL enforce ownership checks on resource mutations so that non-admin users can only modify resources associated with their own user ID.
5. IF a non-admin user attempts to mutate a resource they do not own, THEN THE Colibri_API SHALL return a 403 status.
6. WHILE running in production mode, THE Colibri_API SHALL return only a generic error message and HTTP status code to API consumers, omitting stack traces, internal service names, and database error details.
7. IF an input fails Zod validation, THEN THE Colibri_API SHALL return a 400 status with a JSON response containing at minimum the HTTP status code, an error type indicator, and an array of field-level validation messages.

### Requirement 8: Admin Panel Preservation

**User Story:** As an administrator, I want a protected admin panel for managing products, images, categories, and quotes, so that I can operate the store without direct database access.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only to authenticated users with an admin role.
2. WHEN an unauthenticated user attempts to access the Admin_Panel, THE Colibri_Web SHALL redirect to the login page.
3. IF an authenticated user without an admin role attempts to access the Admin_Panel, THEN THE Colibri_Web SHALL deny access and display a message indicating insufficient permissions.
4. THE Admin_Panel SHALL provide interfaces for managing products (create, read, update, delete).
5. THE Admin_Panel SHALL provide interfaces for managing product images (upload, view, reorder, delete) and categories (create, read, update, delete).
6. WHERE quote/budget management functionality exists in the source project, THE Admin_Panel SHALL provide equivalent interfaces for listing, viewing, and updating quotes or budgets.
7. WHERE scheduling functionality exists in the source project, THE Admin_Panel SHALL provide equivalent interfaces for listing, viewing, creating, and updating scheduled entries.

### Requirement 9: Hub-Specific Code Removal

**User Story:** As a developer, I want all Arte Hub-specific pages and components removed, so that the codebase is clean and focused on the Colibri use case.

#### Acceptance Criteria

1. THE Colibri_Web SHALL not contain pages for artist profiles, multi-site navigation, or hub landing pages.
2. THE Colibri_Web SHALL not contain components that reference multiple sites, artists, or tenants through imports, props, or rendered content.
3. THE Colibri_API SHALL not contain routes or controllers that serve hub-specific features (artist onboarding, site creation, cross-site search), and routes that serve both hub and Colibri purposes SHALL be retained with hub-specific parameters and logic branches removed.
4. THE Colibri_Web and Colibri_API SHALL retain shared utilities, helpers, and library code that are used by remaining Colibri functionality, even if those modules were originally also used by hub-specific code.
5. WHEN hub-specific code is removed, THE Build_Pipeline SHALL continue to pass all four steps (install, typecheck, test, build) without errors.
6. WHEN hub-specific code is removed, THE Colibri_Web and Colibri_API SHALL not contain hub-specific environment variables or configuration keys that are no longer referenced by any remaining code.

### Requirement 10: Quote Request Flow

**User Story:** As a potential customer, I want to request a quote for products/services from Toldos Colibri, so that I can get pricing information without needing to call or visit the store.

#### Acceptance Criteria

1. THE Colibri_Web SHALL provide a quote request form accessible from product pages and a dedicated route.
2. THE quote request form SHALL collect the following fields: name (required), phone (required), city (required), description (required), product of interest (required, selected from available categories), and images (optional, up to 5 files).
3. WHEN a user submits a valid quote request, THE Colibri_API SHALL persist the request with status "pending" and return a success confirmation to the user.
4. IF any required field is missing or invalid, THEN THE Colibri_API SHALL return a 400 status with field-level validation errors.
5. THE Admin_Panel SHALL display a list of all quote requests with filtering by status (pending, in_progress, completed, rejected).
6. THE Admin_Panel SHALL allow an admin to view quote request details, update the status, and add internal notes.
7. THE Colibri_API SHALL store uploaded quote images in Supabase Storage and associate them with the corresponding quote record.

### Requirement 11: Package and Configuration Renaming

**User Story:** As a developer, I want all package names and configurations updated from "arte-hub" to "colibri", so that the project identity is consistent throughout the codebase.

#### Acceptance Criteria

1. THE Monorepo SHALL use package names prefixed with `@colibri/` (e.g., `@colibri/web`, `@colibri/api`) in all `package.json` `name` fields, and all workspace dependency references in `dependencies` and `devDependencies` SHALL use the corresponding `@colibri/` package names.
2. THE Monorepo SHALL include an updated `README.md` describing the Colibri project, its architecture, and setup instructions.
3. THE Monorepo SHALL include a `.env.example` file at the repository root documenting all environment variables required for the Build_Pipeline to complete successfully, each with a descriptive placeholder value.
4. THE Monorepo SHALL include updated architecture documentation in the `docs` directory reflecting the single-site design.
5. WHEN a developer clones the repository and follows the README instructions, THE Build_Pipeline SHALL complete successfully.
6. THE Monorepo SHALL not contain any references to "arte-hub", "hub-art", or "@arte-hub/" in `package.json` files, import statements, configuration files, or documentation.

### Requirement 12: Build and Test Integrity

**User Story:** As a developer, I want the project to build and pass tests after migration, so that I can verify the migration did not introduce regressions.

#### Acceptance Criteria

1. WHEN `pnpm install` is executed at the monorepo root, THE Build_Pipeline SHALL complete without dependency resolution errors.
2. WHEN `pnpm typecheck` is executed, THE Build_Pipeline SHALL report zero TypeScript type errors.
3. WHEN `pnpm test` is executed, THE Build_Pipeline SHALL run all existing tests and report zero test failures.
4. WHEN `pnpm build` is executed, THE Build_Pipeline SHALL exit with code 0 and produce build output directories for both Colibri_Web and Colibri_API.
5. THE Monorepo SHALL contain platform-specific configuration for independent deployment: a Vercel-compatible configuration for Colibri_Web, a start script in Colibri_API's `package.json` for Railway, and Prisma migration files for Supabase PostgreSQL.
6. THE Monorepo SHALL include a `.env.example` at the repository root with all environment variables required by Colibri_Web and Colibri_API, using Colibri-specific placeholder values and app names that have no dependency on the arte-hub project.
7. THE Monorepo SHALL use independent app names, domains, and configuration keys (e.g., `COLIBRI_API_URL`, `COLIBRI_WEB_URL`) so that deployment does not reference or depend on the arte-hub project in any way.

### Requirement 13: Commit Strategy

**User Story:** As a reviewer, I want the migration delivered in small, auditable commits, so that each change can be reviewed and understood independently.

#### Acceptance Criteria

1. THE Monorepo SHALL organize migration changes into small, focused commits with descriptive messages following the conventional commits format (e.g., `feat:`, `refactor:`, `chore:`).
2. WHEN a commit is made, THE commit SHALL address a single logical change (e.g., route migration, brand replacement, tenant removal).
3. THE Monorepo SHALL maintain a passing Build_Pipeline at each commit boundary where feasible; IF a commit intentionally breaks the build as an intermediate step, THEN the commit message SHALL state this and the subsequent commit SHALL restore a passing build.
