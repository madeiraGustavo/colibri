# Wave 9 — Final Validation, Deploy & Documentation

## Objetivo
Finalizar estabilização do Colibri em produção, validar fluxo completo da aplicação e concluir documentação operacional do projeto.

**Validação automatizada:** 2026-05-26 (baseline em `main` pós-merge wave-8; entregar via branch `wave-9-final-validation`)

## Escopo

### Runtime Validation
- [ ] Validar login/logout *(manual — ver `docs/ops-validation.md`)*
- [ ] Validar persistência de sessão após F5 *(manual)*
- [x] Validar auth cookies *(middleware + testes `apps/web`)*
- [ ] Validar refresh token flow *(manual)*
- [x] Validar RBAC admin *(middleware 307 sem cookie; testes API `authenticateAdmin`)*

### Marketplace Runtime
- [x] Validar `/`
- [x] Validar `/produtos`
- [ ] Validar `/produtos/[slug]` *(catálogo vazio em prod — validar após seed/CRUD)*
- [x] Validar `/orcamento`
- [x] Validar `/minha-conta` *(307 → login sem sessão)*

### Admin Runtime
- [x] Validar `/admin` *(307 sem sessão)*
- [x] Validar `/admin/products` *(307 sem sessão)*
- [x] Validar `/admin/categories` *(307 sem sessão)*
- [x] Validar `/admin/quotes` *(307 sem sessão)*
- [ ] Validar upload de imagens *(manual com login admin)*
- [ ] Validar quotes sem productId *(manual / admin UI)*

### API Validation
- [x] Validar `/health`
- [x] Validar `/marketplace/products`
- [x] Validar `/marketplace/quotes` *(POST smoke)*
- [x] Validar auth endpoints *(cobertura testes unitários)*
- [x] Validar responses sem tenantId/siteId

### 404 / Cleanup Validation
- [x] Confirmar `/marketplace/*` → 404
- [x] Confirmar ausência de redirects legacy web `/marketplace` (`next-config-redirects.test.ts`)
- [x] Confirmar ausência de referências Arte Hub em `apps/`
- [x] Confirmar ausência de Pluma em `apps/`

### Observability Validation
- [x] Validar structured logs *(plugin Pino)*
- [x] Validar correlation IDs *(testes `observability.test.ts`)*
- [x] Validar request logging
- [x] Validar error masking em produção *(testes segurança auth)*

### Deploy Validation
- [x] Validar Render deploy (`/health` ok)
- [x] Validar Vercel deploy (rotas públicas 200)
- [ ] Validar variáveis de ambiente *(revisão manual painéis)*
- [ ] Validar DATABASE_URL *(conectividade implícita via API ok)*
- [ ] Validar Supabase Storage *(manual — upload admin)*
- [ ] Validar seed em produção *(manual)*

### Build Validation
- [x] pnpm install
- [x] pnpm typecheck
- [x] pnpm test (275 testes: 154 API + 121 web)
- [x] pnpm build

## Regras
- Não introduzir novas features
- Não alterar arquitetura
- Não alterar contratos públicos
- Apenas fixes de estabilização
- Fazer mudanças pequenas e auditáveis

## Estratégia
- Priorizar estabilidade
- Corrigir apenas regressões reais
- Evitar refactors desnecessários
- Validar runtime após cada fix

## Smoke Checklist

### Público
- [x] Navegação homepage
- [x] Navegação catálogo
- [ ] Abrir produto *(aguarda catálogo)*
- [x] Enviar orçamento *(API POST smoke)*

### Auth
- [ ] Login admin
- [ ] Logout
- [ ] Refresh após F5
- [ ] Sessão persistente

### Admin
- [ ] CRUD produtos
- [ ] CRUD categorias
- [ ] Quotes admin
- [ ] Upload imagem

### Infra
- [x] Logs Render *(health + API responde)*
- [x] Logs API *(observability em testes)*
- [x] Build Vercel *(rotas prod OK)*
- [x] Banco Supabase *(API queries ok)*

## Documentação
- [x] Atualizar README final *(deploy Render)*
- [x] `.env.example` *(já alinhado)*
- [x] Atualizar docs operacionais (`docs/ops-validation.md`)
- [x] Documentar deploy flow (`docs/deploy-render.md`)
- [x] Documentar seed flow (`README.md` + ops doc)
- [x] Documentar troubleshooting comum (`docs/ops-validation.md`)

## Release
- [ ] Commitar ajustes finais
- [ ] Push branch `wave-9-final-validation`
- [ ] Abrir PR
- [ ] Validar CI
- [ ] Merge final em `main`
- [ ] Deploy produção
- [ ] Smoke final produção (`scripts/wave-9-smoke.ps1`)

## Pós-Wave
Phase 2 — Property-based tests & advanced hardening

## Regressões encontradas
Nenhuma no build pipeline nem no smoke automatizado de produção.
