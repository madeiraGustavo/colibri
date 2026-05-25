import fp from 'fastify-plugin'
import { randomUUID } from 'crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { logAdminMutation, logUpload } from '../lib/ops-log.js'

const REQUEST_ID_HEADER = 'x-request-id'

function requestPath(request: FastifyRequest): string {
  return request.url.split('?')[0] ?? request.url
}

function isAdminMutation(request: FastifyRequest): boolean {
  const method = request.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return false
  }
  return requestPath(request).includes('/dashboard/marketplace')
}

function isUploadRoute(request: FastifyRequest): boolean {
  if (request.method !== 'POST') return false
  const path = requestPath(request)
  // /upload e quotes têm logs operacionais dedicados nos controllers
  return path.endsWith('/images')
}

export function resolveIncomingRequestId(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim().slice(0, 128)
  }
  return undefined
}

export default fp(async function observabilityPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('X-Request-ID', request.id)
  })

  fastify.addHook('onResponse', async (request, reply) => {
    const path = requestPath(request)
    const durationMs = Math.round(reply.elapsedTime)

    request.log.info({
      event: 'http.request',
      method: request.method,
      path,
      statusCode: reply.statusCode,
      durationMs,
    })

    if (isAdminMutation(request) && reply.statusCode < 500) {
      logAdminMutation(request.log, {
        method: request.method,
        path,
        statusCode: reply.statusCode,
        userId: request.user?.userId,
      })
    }

    if (isUploadRoute(request)) {
      logUpload(request.log, {
        route: path,
        outcome: reply.statusCode < 400 ? 'success' : 'failure',
        statusCode: reply.statusCode,
      })
    }
  })

  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500

    request.log.error(
      {
        event: 'http.error',
        err: error,
        method: request.method,
        path: requestPath(request),
        statusCode,
      },
      error.message,
    )

    const message =
      statusCode < 500 && error.message
        ? error.message
        : 'Erro interno do servidor'

    const payload: Record<string, unknown> = { error: message }

    if (process.env.NODE_ENV !== 'production') {
      payload.requestId = request.id
    }

    void reply.status(statusCode).send(payload)
  })
})

export { REQUEST_ID_HEADER }
