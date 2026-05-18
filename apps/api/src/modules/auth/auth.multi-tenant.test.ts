/**
 * auth.multi-tenant.test.ts
 *
 * Tests for single-tenant auth behavior after migration.
 * Validates that:
 * - Login uses the default tenant (colibri) internally
 * - JWT does NOT contain siteId
 * - Session response does NOT contain siteId
 * - Register uses the default tenant
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-mt',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-mt',
  },
}))

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./auth.repository.js', () => ({
  findUserByEmail:        vi.fn(),
  findUserByEmailAndSite: vi.fn(),
  findUserById:           vi.fn(),
  createUser:             vi.fn(),
  createRefreshToken:     vi.fn(),
  findRefreshToken:       vi.fn(),
  revokeRefreshToken:     vi.fn(),
  revokeAllUserTokens:    vi.fn(),
  findArtistById:         vi.fn(),
}))

// ── Mock password lib ─────────────────────────────────────────────────────────
vi.mock('../../lib/password.js', () => ({
  verifyPassword: vi.fn(),
  hashPassword:   vi.fn().mockResolvedValue('$2a$12$hashed'),
}))

import { login, register, getSession } from './auth.service.js'
import {
  findUserByEmailAndSite,
  findUserById,
  createUser,
  createRefreshToken,
} from './auth.repository.js'
import { verifyPassword } from '../../lib/password.js'
import jwt from 'jsonwebtoken'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COLIBRI_USER = {
  id:       'user-colibri-001',
  siteId:   'colibri',
  email:    'cliente@email.com',
  password: '$2a$12$hashedpassword',
  role:     'client' as const,
  artistId: null,
}

const COLIBRI_ADMIN = {
  id:       'admin-001',
  siteId:   'colibri',
  email:    'admin@colibri.local',
  password: '$2a$12$adminhash',
  role:     'admin' as const,
  artistId: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Single-tenant auth — login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('authenticates user using default tenant (colibri)', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(COLIBRI_USER)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await login('cliente@email.com', 'senha123', 'colibri')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('cliente@email.com', 'colibri')
    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')

    // JWT must NOT contain siteId
    const decoded = jwt.decode(result.accessToken) as Record<string, unknown>
    expect(decoded.sub).toBe(COLIBRI_USER.id)
    expect(decoded.role).toBe('client')
    expect(decoded).not.toHaveProperty('siteId')
  })

  it('rejects invalid credentials', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)

    await expect(
      login('cliente@email.com', 'senha123', 'colibri'),
    ).rejects.toThrow('Credenciais inválidas')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('cliente@email.com', 'colibri')
  })

  it('login without siteId uses colibri as default', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(COLIBRI_ADMIN)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await login('admin@colibri.local', 'senha123')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('admin@colibri.local', 'colibri')

    const decoded = jwt.decode(result.accessToken) as Record<string, unknown>
    expect(decoded).not.toHaveProperty('siteId')
    expect(decoded.role).toBe('admin')
  })
})

describe('Single-tenant auth — register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers user in the default tenant', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)
    vi.mocked(createUser).mockResolvedValue(COLIBRI_USER)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await register('cliente@email.com', 'senha123', 'colibri')

    expect(createUser).toHaveBeenCalledWith('colibri', 'cliente@email.com', '$2a$12$hashed', 'client', undefined)
    expect(result).toHaveProperty('accessToken')
  })

  it('blocks duplicate email within the tenant', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(COLIBRI_USER)

    await expect(
      register('cliente@email.com', 'senha123', 'colibri'),
    ).rejects.toThrow('Email já cadastrado neste site')

    expect(createUser).not.toHaveBeenCalled()
  })
})

describe('Single-tenant auth — session does not expose siteId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession does not include siteId in response', async () => {
    vi.mocked(findUserById).mockResolvedValue(COLIBRI_USER)

    const session = await getSession(COLIBRI_USER.id)

    expect(session.user).not.toHaveProperty('siteId')
    expect(session.user.email).toBe('cliente@email.com')
    expect(session.user.role).toBe('client')
    expect(session.user.id).toBe(COLIBRI_USER.id)
  })

  it('getSession for admin does not include siteId', async () => {
    vi.mocked(findUserById).mockResolvedValue(COLIBRI_ADMIN)

    const session = await getSession(COLIBRI_ADMIN.id)

    expect(session.user).not.toHaveProperty('siteId')
    expect(session.user.role).toBe('admin')
  })
})
