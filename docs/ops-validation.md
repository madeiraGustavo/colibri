# Validação operacional (Wave 9)

Checklist reproduzível para staging/produção. Não substitui testes automatizados (`pnpm test`).

## Build local (obrigatório)

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Smoke automatizado (produção)

```powershell
.\scripts\wave-9-smoke.ps1
```

Variáveis opcionais: `COLIBRI_API_URL`, `COLIBRI_WEB_URL`.

O check `POST /marketplace/quotes` cria um orçamento de teste em produção (`wave9-smoke@colibri.local`); remova no admin se não quiser mantê-lo.

## URLs de referência

| Serviço | URL |
|---------|-----|
| Web (Vercel) | https://colibri-web-lovat.vercel.app |
| API (Render) | https://colibri-api-djm1.onrender.com |

## Rotas web

| Rota | Esperado (sem sessão) |
|------|------------------------|
| `/`, `/produtos`, `/orcamento` | 200 |
| `/produtos/[slug]` | 200 se existir produto publicado; 404 se slug inválido |
| `/minha-conta`, `/admin/*` | 307 → `/login` |
| `/marketplace`, `/marketplace/*` | **404** (sem redirect) |
| `/pluma` | **404** |

Redirects permitidos em `next.config.mjs`: `/categoria/*`, `/register`, `/dashboard/marketplace` → `/admin` (legado admin).

## API pública

| Endpoint | Esperado |
|----------|----------|
| `GET /health` | `{ "status": "ok", "service": "colibri-api" }` |
| `GET /marketplace/products` | JSON com `data` + `meta`; **sem** `tenantId` / `siteId` |
| `GET /marketplace/categories` | JSON com `data` |
| `POST /marketplace/quotes` | 200/201 (corpo mínimo: nome, email, mensagem) |

Prefixo `/marketplace` na **API** permanece (contrato interno); apenas rotas **web** `/marketplace/*` devem 404.

## Auth / admin (manual)

Use credenciais do seed local apenas em staging; em produção, rotacione a senha do admin e não commite segredos.

Passos (staging ou prod com conta admin):

1. Login em `/login` → redirecionamento admin ou conta
2. F5 em `/admin/products` — sessão persiste (cookie refresh)
3. Logout — cookies limpos; `/admin` volta a 307
4. CRUD produto/categoria, upload de imagem, listagem de quotes (incl. quote sem `productId`)

## Deploy

- **Render:** ver `docs/deploy-render.md` — não definir `PORT` no painel; health `/health`
- **Vercel:** `NEXT_PUBLIC_API_URL` = URL Render (sem barra final)
- **Supabase:** `DATABASE_URL` + `STORAGE_BUCKET` + service role key
- **CORS:** `ALLOWED_ORIGINS` inclui domínio Vercel

## Observability

- Logs estruturados (Pino) na API
- Header `X-Request-ID` nas respostas (ver `apps/api/src/plugins/observability.test.ts`)
- Erros em produção sem stack trace exposto ao cliente

## Troubleshooting rápido

| Sintoma | Ação |
|---------|------|
| Web 503 / API offline | `curl` em `/health`; cold start Render (~30–60s) |
| CORS | Conferir `ALLOWED_ORIGINS` |
| Admin 307 em loop | Cookies bloqueados; conferir domínio e `Secure` em HTTPS |
| Catálogo vazio | Esperado até seed ou CRUD admin |
| Upload falha | `STORAGE_BUCKET`, service role, CORS |

## Pós-validação

1. Branch `wave-9-final-validation` → PR → CI verde → merge `main`
2. Redeploy Vercel + Render se necessário
3. Rodar `.\scripts\wave-9-smoke.ps1` após deploy
