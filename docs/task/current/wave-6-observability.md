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
- [x] PR #4 mergeada em `main`
- [x] Deploy Render — `X-Request-ID` propagado (`verify-observability-remote.mjs`)
- [x] Logs no Render — conferir linhas JSON com `requestId`, `event: http.request` (Dashboard → Logs)

### Comando de smoke (staging/produção)

```bash
node apps/api/scripts/verify-observability-remote.mjs https://colibri-api-djm1.onrender.com
```

Resposta esperada: `Observability check OK` com `responseId` igual ao ID enviado.

### O que buscar nos logs Render

```json
{"level":"info","requestId":"<uuid>","event":"http.request","method":"GET","path":"/health","statusCode":200,"durationMs":...}
```

## Próximo passo
Wave 7 — Hub cleanup
