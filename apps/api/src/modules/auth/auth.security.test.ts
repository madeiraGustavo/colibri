/**
 * auth.security.test.ts
 *
 * Security tests for single-tenant auth.
 * Validates:
 * - Authentication hook verifies JWT and fetches user from DB
 * - Role-based access control works correctly
 * - AuthContext does not include siteId
 * - resolveSiteFromRequest behavior (legacy, still present in lib)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate, authenticateRoles } from '../../hooks/authenticate.js'

// Mock Prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../../lib/prisma.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    jwtVerify: vi.fn(),
    user: undefined,
    headers: {},
    ...overrides,
  } as unknown as FastifyRequest
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Security: Authentication and RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access for valid user with correct role', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-002' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'client',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId: 'user-002',
      artistId: '',
      role: 'client',
    })
  })

  it('AuthContext does not include siteId', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'admin-001' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'admin',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId: 'admin-001',
      artistId: '',
      role: 'admin',
    })
    // Ensure siteId is NOT in the AuthContext
    expect(request.user).not.toHaveProperty('siteId')
  })

  it('denies access when user role is insufficient', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'client-001' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'client',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    // Only allow admin
    const adminOnly = authenticateRoles(['admin'])
    await adminOnly(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Permissão insuficiente',
    })
  })

  it('denies access when user is not found in database', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'nonexistent' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Usuário não encontrado',
    })
  })
})

describe('Security: resolveSiteFromRequest behavior', () => {
  it('invalid X-Site-Id header falls back to platform', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: { 'x-site-id': 'hacker-site' },
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('platform')
  })

  it('missing X-Site-Id header falls back to platform', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: {},
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('platform')
  })

  it('valid X-Site-Id header returns correct site', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: { 'x-site-id': 'marketplace' },
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('marketplace')
  })
})
