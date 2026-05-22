# Wave 6 — Observability

## Objetivo
Adicionar observability e logging estruturado no backend preservando a arquitetura atual.

## Escopo

### Structured Logging
- [x] Configurar Pino no Fastify
- [x] JSON structured logs
- [x] Central logger config

### Correlation IDs
- [x] Gerar request ID por request
- [x] Propagar `X-Request-ID`
- [x] Adicionar correlation ID nos logs
- [x] Incluir correlation ID em erros dev-only

### Request Lifecycle Logging
- [x] Log method/path/status/duration
- [x] Log request errors
- [x] Log stack traces apenas server-side

### Operational Logging
- [x] Auth attempts
- [x] Quote submissions
- [x] Admin mutations
- [x] Upload operations

## Regras
- Não alterar contratos públicos da API
- Não quebrar tenant abstraction
- Não adicionar lógica de negócio
- Preservar Fastify architecture
- Preservar build pipeline

## Validação
- [x] pnpm typecheck
- [x] pnpm build
- [x] pnpm test
- [ ] Validar logs no Render/Railway (manual pós-deploy)

## Próximo passo
Wave 7 — Hub cleanup
