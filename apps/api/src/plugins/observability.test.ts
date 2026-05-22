import { describe, it, expect, afterEach } from 'vitest'
import Fastify from 'fastify'
import { randomUUID } from 'crypto'
import observabilityPlugin, { resolveIncomingRequestId } from './observability.js'

describe('resolveIncomingRequestId', () => {
  it('returns trimmed id when header is a non-empty string', () => {
    expect(resolveIncomingRequestId('  test-id  ')).toBe('test-id')
  })

  it('returns undefined for missing or empty header', () => {
    expect(resolveIncomingRequestId(undefined)).toBeUndefined()
    expect(resolveIncomingRequestId('   ')).toBeUndefined()
  })
})

describe('observability plugin', () => {
  const apps: Array<Awaited<ReturnType<typeof Fastify>>> = []

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()))
  })

  async function createTestApp() {
    const app = Fastify({
      logger: false,
      requestIdHeader: 'x-request-id',
      genReqId: (request) =>
        resolveIncomingRequestId(request.headers['x-request-id']) ?? randomUUID(),
    })
    await app.register(observabilityPlugin)
    app.get('/ping', async () => ({ ok: true }))
    apps.push(app)
    return app
  }

  it('returns X-Request-ID on every response', async () => {
    const app = await createTestApp()
    const res = await app.inject({ method: 'GET', url: '/ping' })
    expect(res.headers['x-request-id']).toBeTruthy()
  })

  it('propagates incoming X-Request-ID', async () => {
    const app = await createTestApp()
    const customId = 'correlation-test-id'
    const res = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { 'x-request-id': customId },
    })
    expect(res.headers['x-request-id']).toBe(customId)
  })

  it('includes requestId in dev error payload', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const app = await createTestApp()
    app.get('/boom', async () => {
      throw new Error('test failure')
    })

    const res = await app.inject({ method: 'GET', url: '/boom' })
    expect(res.statusCode).toBe(500)
    const body = res.json() as { requestId?: string }
    expect(body.requestId).toBeTruthy()

    process.env.NODE_ENV = prev
  })
})
