/**
 * load-env.ts — Carrega variáveis para scripts Prisma (seed, migrations).
 *
 * Ordem (later overrides earlier):
 * 1. apps/api/.env
 * 2. monorepo root .env
 *
 * Independente do cwd (funciona via `pnpm --filter @colibri/api seed` ou `cd apps/api && pnpm seed`).
 */

import { config } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const prismaDir = dirname(fileURLToPath(import.meta.url))
const apiEnvPath = resolve(prismaDir, '../.env')
const rootEnvPath = resolve(prismaDir, '../../../.env')

export function loadPrismaEnv(): void {
  config({ path: apiEnvPath })
  config({ path: rootEnvPath })
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('❌ DATABASE_URL não definida.')
    console.error('')
    console.error('   Crie um dos arquivos abaixo (a partir do .env.example):')
    console.error(`   • ${apiEnvPath}`)
    console.error(`   • ${rootEnvPath}`)
    console.error('')
    console.error('   Em Render/staging, defina DATABASE_URL nas Environment Variables do serviço.')
    process.exit(1)
  }
  return url
}
