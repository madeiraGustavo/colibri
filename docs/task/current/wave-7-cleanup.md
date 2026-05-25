# Wave 7 — Hub Cleanup

## Objetivo
Remover definitivamente código legado do Arte Hub preservando apenas funcionalidades necessárias para o Colibri.

## Escopo

### Frontend Cleanup
- [x] Remover páginas hub-specific (`platform/`, `tattoo/`, `music/`, `dashboard/`, `[slug]/`)
- [x] Remover artist profile pages
- [x] Remover multi-site navigation (sites reduzido a `marketplace`)
- [x] Remover hub landing pages
- [x] Remover componentes ligados a artists/tenants (musician, tattoo, shared, scheduling, dashboard nav)
- [x] Validar imports órfãos

### Pluma Removal
- [x] Remover `components/pluma/*`
- [x] Remover testes do Pluma
- [x] Remover rotas `/pluma`
- [x] Remover referências no layout/navigation (AudioProvider removido)
- [x] Remover imports não utilizados

### Backend Cleanup
- [x] Remover rotas hub-specific restantes (`availability`, `appointments`)
- [x] Remover controllers antigos (módulos scheduling)
- [x] Simplificar lógica multi-site residual (`sites.ts` → só `marketplace`)
- [x] Validar endpoints preservados (marketplace, auth, upload)
- [x] Garantir tenant abstraction invisível (fallback `marketplace`)

### Environment Cleanup
- [x] Auditar `.env.example` (sem vars hub-specific)
- [x] Remover env vars antigas (nenhuma extra encontrada)
- [x] Remover configs órfãs
- [ ] Validar configs Render/Vercel (manual pós-merge)

### Reference Cleanup
- [x] Buscar `arte-hub` em `apps/` (limpo)
- [x] Buscar `hub-art` em `apps/` (limpo)
- [x] Buscar `@arte-hub/` em `apps/` (limpo)
- [x] Buscar branding legado em `apps/` (Arte Hub removido de `sites.ts` API)
- [x] Validar output user-facing (loja + admin preservados)

## Regras
- Não quebrar funcionalidades existentes
- Não remover shared utilities em uso
- Preservar arquitetura monorepo
- Preservar API-first architecture
- Não alterar contratos públicos sem necessidade (`/dashboard/marketplace/*` API mantida)
- Fazer mudanças pequenas e auditáveis

## Estratégia
- Remover incrementalmente
- Rodar validação após cada bloco
- Evitar big-bang cleanup
- Fazer commits pequenos por domínio

## Validação

### Build Pipeline
- [x] pnpm install
- [x] pnpm typecheck
- [x] pnpm test (2 skipped: auth isolation cross-site — hub removido)
- [x] pnpm build

### Runtime
- [ ] Validar frontend
- [ ] Validar API
- [ ] Validar auth flow
- [ ] Validar uploads
- [ ] Validar admin panel

### Deploy
- [ ] Validar staging
- [ ] Validar Render logs
- [ ] Validar Vercel build

## Release
- [ ] Commitar mudanças
- [ ] Push branch `wave-7-cleanup`
- [ ] Abrir PR
- [ ] Validar CI

## Commits sugeridos (por etapa)
1. `chore(web): remove pluma landing and tests`
2. `chore(web): remove hub pages and artist profile components`
3. `chore(web): simplify sites config and store middleware`
4. `chore(api): remove scheduling modules and simplify sites`
5. `docs: mark wave-7 hub cleanup progress`

## Próxima wave
Wave 8 — Remove `/marketplace` redirects
