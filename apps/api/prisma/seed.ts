/**
 * Seed script — creates the default tenant and admin user for Colibri.
 *
 * Idempotent: uses upsert so it can be run multiple times safely.
 * Works in development and staging environments.
 *
 * Usage: npx tsx prisma/seed.ts
 *        pnpm seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'colibri'
const ADMIN_EMAIL = 'admin@colibri.local'
const ADMIN_PASSWORD = 'change-me'
const SALT_ROUNDS = 12

async function main() {
  console.log('🌱 Seeding Colibri database...')
  console.log(`   Tenant: ${DEFAULT_TENANT_ID}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')

  // ── 1. Upsert default admin user (acts as the "colibri" tenant record) ────
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)
  const adminId = randomUUID()

  const admin = await prisma.user.upsert({
    where: {
      siteId_email: {
        siteId: DEFAULT_TENANT_ID,
        email: ADMIN_EMAIL,
      },
    },
    update: {
      role: 'admin',
      // Do not overwrite password on subsequent runs — admin may have changed it
    },
    create: {
      id: adminId,
      siteId: DEFAULT_TENANT_ID,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: 'admin',
    },
  })

  console.log(`✓ Admin user upserted: ${admin.email} (siteId: ${DEFAULT_TENANT_ID})`)
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Default admin credentials:')
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log('')
  console.log('⚠️  Change the admin password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
