import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  createQuoteHandler,
  listQuotesHandler,
  getQuoteHandler,
  updateQuoteStatusHandler,
  deleteQuoteHandler,
} from './marketplace-quotes.controller.js'

export async function marketplaceQuotesRoutes(fastify: FastifyInstance): Promise<void> {
  // Public (rate limited: 5 req / 15 min per IP)
  fastify.post('/marketplace/quotes', {
    config: {
      rateLimit: { max: 5, timeWindow: '15 minutes' },
    },
  }, createQuoteHandler)

  // Private (authenticated)
  fastify.get('/dashboard/marketplace/quotes', { preHandler: authenticate }, listQuotesHandler)
  fastify.get('/dashboard/marketplace/quotes/:id', { preHandler: authenticate }, getQuoteHandler as RouteHandlerMethod)
  fastify.patch('/dashboard/marketplace/quotes/:id/status', { preHandler: authenticate }, updateQuoteStatusHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/quotes/:id', { preHandler: authenticate }, deleteQuoteHandler as RouteHandlerMethod)
}
