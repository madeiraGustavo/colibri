import 'dotenv/config'
import { z } from 'zod'

/** Aceita SUPABASE_SERVICE_ROLE_KEY ou legado SUPABASE_SERVICE_KEY (Railway/README antigo). */
function resolveSupabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
}

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres (256 bits)'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres (256 bits)'),
  ALLOWED_ORIGINS: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
})

const envInput = {
  ...process.env,
  SUPABASE_SERVICE_ROLE_KEY: resolveSupabaseServiceKey(),
  // Render injeta PORT; não force PORT=3333 nas env vars do painel.
  PORT: process.env.PORT ?? process.env.API_PORT,
}

const result = EnvSchema.safeParse(envInput)

if (!result.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = result.data

/**
 * Porta HTTP para bind. No Render, PORT=3333 no painel sobrescreve a porta do proxy
 * e causa timeout externo (app escuta 3333, proxy encaminha para outra porta).
 */
export function resolveListenPort(): number {
  const port = env.PORT

  if (process.env.RENDER === 'true' && port === 3333) {
    console.error(
      '❌ PORT=3333 está definido no painel do Render. Remova a variável PORT das Environment Variables — o Render injeta a porta correta automaticamente.',
    )
    process.exit(1)
  }

  return port
}
