# Wave 8 — Marketplace Cleanup Final

## Objetivo
Remover definitivamente toda compatibilidade `/marketplace` preservando estabilidade, navegação e arquitetura atual do Colibri.

## Escopo

### Redirect Cleanup
- [x] Remover redirects `/marketplace/*`
- [x] Remover middleware de compatibilidade legacy (nenhuma lógica de rota `/marketplace` em `middleware.ts`)
- [x] Remover regras temporárias do `next.config.js`
- [x] Garantir que rotas antigas retornem 404 (sem página/redirect → 404 Next)

### Route Validation
- [ ] Validar `/marketplace`
- [ ] Validar `/marketplace/produtos`
- [ ] Validar `/marketplace/produtos/[slug]`
- [ ] Validar `/marketplace/minha-conta`
- [ ] Confirmar comportamento 404 consistente

### Frontend Cleanup
- [x] Buscar links internos usando `/marketplace` (nenhum href de loja; API `/marketplace/*` mantida)
- [x] Corrigir navegação residual (n/a)
- [x] Validar breadcrumbs (já em `/`, `/produtos/...`)
- [x] Validar redirects client-side (`client.ts` → `/login`)
- [x] Validar canonical URLs (testes metadata)

### Middleware Cleanup
- [x] Remover lógica legacy de marketplace (rota; `STORE_SITE_ID` = cookie/X-Site-Id)
- [x] Auditar middleware.ts
- [x] Auditar redirects SSR (`next.config.mjs`)
- [x] Validar auth flow após cleanup (testes web passando)

### SEO / Navigation
- [x] Garantir navegação root-level
- [x] Validar sitemap (`/`, `/produtos`, `/orcamento`, …)
- [x] Validar meta/canonical URLs
- [x] Garantir ausência de referências `/marketplace` em canonicals

## Regras
- Não quebrar auth
- Não alterar API pública
- Não alterar tenant abstraction
- Não quebrar rotas root-level
- Fazer mudanças pequenas e auditáveis
- Preservar compatibilidade atual do frontend

## Rotas válidas esperadas
- `/`
- `/produtos`
- `/produtos/[slug]`
- `/orcamento`
- `/minha-conta`
- `/admin/*`

## Rotas antigas esperadas
Devem retornar:
- 404
- ou página not found controlada

Rotas:
- `/marketplace`
- `/marketplace/produtos`
- `/marketplace/produtos/[slug]`
- `/marketplace/minha-conta`

## Estratégia
- Remover incrementalmente
- Validar build após cada etapa
- Evitar remoção agressiva
- Priorizar estabilidade

## Validação

### Build Pipeline
- [ ] pnpm install
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] pnpm build

### Runtime
- [ ] Validar frontend
- [ ] Validar auth
- [ ] Validar quotes
- [ ] Validar uploads
- [ ] Validar admin

### Deploy
- [ ] Validar Vercel preview
- [ ] Validar Render API
- [ ] Validar logs
- [ ] Validar rotas 404

## Release
- [ ] Commitar mudanças
- [ ] Push branch `wave-8-marketplace-cleanup`
- [ ] Abrir PR
- [ ] Validar CI

## Próxima wave
Wave 9 — Final validation, deploy and docs
