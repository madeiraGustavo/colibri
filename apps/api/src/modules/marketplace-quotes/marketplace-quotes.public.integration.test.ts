/**
 * Integration: POST /marketplace/quotes (orçamento sem productId)
 * Uses Fastify inject — no external HTTP server or DATABASE_URL required.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../app.js'

vi.mock('./marketplace-quotes.repository.js', () => ({
  create: vi.fn().mockResolvedValue({
    id: 'quote-integration-1',
    status: 'PENDING',
    createdAt: new Date(),
  }),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    marketplaceProduct: { findFirst: vi.fn() },
    artist: { findFirst: vi.fn() },
  },
}))

vi.mock('../../lib/storage.js', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  createSignedUrl: vi.fn(),
}))

vi.mock('../../env.js', () => ({
  env: {
    STORAGE_BUCKET: 'test-bucket',
    SUPABASE_URL: 'https://test.supabase.co',
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    ALLOWED_ORIGINS: 'http://localhost:3000',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    PORT: 3333,
  },
}))

import { prisma } from '../../lib/prisma.js'

describe('POST /marketplace/quotes (integration)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    vi.mocked(prisma.artist.findFirst).mockResolvedValue({ id: 'artist-colibri' } as never)
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 201 for orçamento payload without productId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/marketplace/quotes',
      headers: { 'content-type': 'application/json' },
      payload: {
        requesterName: 'Maria Teste',
        requesterEmail: 'maria@test.com',
        requesterPhone: '11999999999',
        city: 'São Paulo',
        message: 'Preciso de toldo 4x3',
        quantity: 1,
        source: 'orcamento-page',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json() as { data?: { id: string } }
    expect(body.data?.id).toBe('quote-integration-1')
    expect(res.body).not.toContain('Loja não configurada')
  })
})
