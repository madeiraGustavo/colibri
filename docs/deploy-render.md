# Deploy da API no Render

Guia para migrar de Railway → Render sem derrubar o serviço.

## Sintomas comuns após a migração

| Sintoma | Causa provável |
|---------|----------------|
| Deploy falha no build | Monorepo: build rodando só em `apps/api` sem `pnpm` na raiz ou sem `prisma generate` |
| Serviço "Live" mas `/health` timeout | **PORT=3333 no painel** — log mostra `listening at 0.0.0.0:3333`; remova `PORT` das env vars |
| Serviço "Live" mas `/health` timeout | Crash loop: variáveis de ambiente inválidas (app sai com código 1) |
| Log: `Variáveis de ambiente inválidas` | Falta `JWT_SECRET` (32+ chars), `DATABASE_URL`, `ALLOWED_ORIGINS`, etc. |
| Log: `SUPABASE_SERVICE_ROLE_KEY: Required` | No Railway estava `SUPABASE_SERVICE_KEY` — use o nome correto ou alias (código aceita os dois) |
| Frontend: `Serviço indisponível` (503) | `NEXT_PUBLIC_API_URL` na Vercel aponta para URL errada ou API offline |
| CORS bloqueado no browser | `ALLOWED_ORIGINS` sem a URL do site Vercel |
| Erro Prisma ao conectar | `DATABASE_URL` do Supabase incorreta (use pooler **ou** direct, com `?sslmode=require`) |

## Configuração recomendada no Render

| Campo | Valor |
|-------|--------|
| **Root Directory** | `.` (raiz do repositório) |
| **Build Command** | Ver `render.yaml` na raiz |
| **Start Command** | `pnpm --filter @colibri/api start` |
| **Health Check Path** | `/health` |
| **Node version** | 20+ |

Ou importe o blueprint: **New → Blueprint →** conecte o repo (usa `render.yaml`).

## Variáveis de ambiente obrigatórias

Copie do Railway e ajuste os nomes:

| Variável | Obrigatória | Notas |
|----------|-------------|-------|
| `DATABASE_URL` | Sim | Supabase: Session mode (pooler `:6543`) ou Direct (`:5432`) + `?sslmode=require` |
| `JWT_SECRET` | Sim | Mínimo **32 caracteres** |
| `JWT_REFRESH_SECRET` | Sim | Mínimo **32 caracteres** |
| `ALLOWED_ORIGINS` | Sim | Ex.: `https://colibri-web-lovat.vercel.app,https://toldoscolibri.com.br` |
| `STORAGE_BUCKET` | Sim | Nome do bucket Supabase |
| `SUPABASE_URL` | Sim | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service role key (não anon) |
| `DEFAULT_TENANT_ID` | Recomendado | `colibri` |
| `NODE_ENV` | Sim | `production` |
| `PORT` | **Não definir** | Render injeta automaticamente. Se aparecer `listening at 0.0.0.0:3333` nos logs, **apague** `PORT` do painel e redeploy |

## Vercel (frontend)

Atualize na Vercel:

```
NEXT_PUBLIC_API_URL=https://colibri-api-djm1.onrender.com
```

Sem barra no final. Após deploy da API, teste:

```bash
curl https://SEU-SERVICO.onrender.com/health
```

Resposta esperada: `{"status":"ok","service":"colibri-api"}`

## Supabase `DATABASE_URL`

Para **Web Service** no Render (processo longo), prefira conexão **Direct** (porta 5432) ou pooler em **Session** mode.

Exemplo:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require
```

Evite misturar URL de Transaction pooler com Prisma se aparecer erro de prepared statements.

## Ver logs no Render

1. Dashboard → seu serviço → **Logs**
2. Procure no boot:
   - `❌ Variáveis de ambiente inválidas` → corrigir env vars
   - `Cannot find module '@prisma/client'` → build sem `prisma generate`
   - `Error: listen EADDRINUSE` → removeu `PORT` fixo do painel?

## Checklist pós-deploy

- [ ] `GET /health` retorna 200
- [ ] Login no site não retorna 503
- [ ] `POST /marketplace/quotes` (formulário `/orcamento`) funciona
- [ ] Upload de imagem (se testado) grava no Supabase Storage
