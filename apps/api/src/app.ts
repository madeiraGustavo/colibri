import Fastify, { type FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import multipart      from '@fastify/multipart'
import { buildLoggerOptions } from './lib/logger.js'
import observabilityPlugin, { resolveIncomingRequestId } from './plugins/observability.js'
import sensiblePlugin  from './plugins/sensible.js'
import corsPlugin      from './plugins/cors.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import jwtPlugin       from './plugins/jwt.js'
import tenantPlugin    from './middleware/tenant.js'
import { authRoutes }     from './modules/auth/auth.routes.js'
import { uploadRoutes }           from './modules/upload/upload.routes.js'
import { marketplaceCategoriesRoutes } from './modules/marketplace-categories/marketplace-categories.routes.js'
import { marketplaceProductsRoutes } from './modules/marketplace-products/marketplace-products.routes.js'
import { marketplaceQuotesRoutes } from './modules/marketplace-quotes/marketplace-quotes.routes.js'
import { marketplaceOrdersRoutes } from './modules/marketplace-orders/marketplace-orders.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: buildLoggerOptions(),
    disableRequestLogging: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: (request) =>
      resolveIncomingRequestId(request.headers['x-request-id']) ?? randomUUID(),
  })

  // Plugins — ordem: observability → sensible → cors → rateLimit → jwt → multipart → tenant
  await fastify.register(observabilityPlugin)
  await fastify.register(sensiblePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })
  await fastify.register(tenantPlugin)

  // Healthcheck — used by Railway for uptime monitoring and auto-restart
  fastify.get('/health', async () => ({ status: 'ok', service: 'colibri-api' }))

  // Rotas
  await fastify.register(authRoutes)
  await fastify.register(uploadRoutes)
  await fastify.register(marketplaceCategoriesRoutes)
  await fastify.register(marketplaceProductsRoutes)
  await fastify.register(marketplaceQuotesRoutes)
  await fastify.register(marketplaceOrdersRoutes)

  return fastify
}

export type { FastifyInstance }
