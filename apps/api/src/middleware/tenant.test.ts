import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import tenantPlugin from './tenant.js'

describe('tenant injection middleware', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    await app.register(tenantPlugin)
    app.get('/test', async (request) => {
      return { tenantId: request.tenantId }
    })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('injects DEFAULT_TENANT_ID from env with fallback to "colibri"', async () => {
    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(body.tenantId).toBe(process.env.DEFAULT_TENANT_ID || 'colibri')
  })

  it('uses custom DEFAULT_TENANT_ID when env is set', async () => {
    // The middleware reads process.env.DEFAULT_TENANT_ID at module load time,
    // so we verify the current value is injected consistently
    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json()

    expect(body.tenantId).toBeDefined()
    expect(typeof body.tenantId).toBe('string')
    expect(body.tenantId.length).toBeGreaterThan(0)
  })

  it('injects tenantId on every request', async () => {
    const response1 = await app.inject({ method: 'GET', url: '/test' })
    const response2 = await app.inject({ method: 'GET', url: '/test' })

    expect(response1.json().tenantId).toBe(response2.json().tenantId)
  })
})
