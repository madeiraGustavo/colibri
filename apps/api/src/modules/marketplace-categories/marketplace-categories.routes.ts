import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticateAdmin } from '../../hooks/authenticate.js'
import {
  createCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listPublicCategoriesHandler,
} from './marketplace-categories.controller.js'

export async function marketplaceCategoriesRoutes(fastify: FastifyInstance): Promise<void> {
  // Private (authenticated)
  fastify.post('/dashboard/marketplace/categories', { preHandler: authenticateAdmin }, createCategoryHandler)
  fastify.get('/dashboard/marketplace/categories', { preHandler: authenticateAdmin }, listCategoriesHandler)
  fastify.patch('/dashboard/marketplace/categories/:id', { preHandler: authenticateAdmin }, updateCategoryHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/categories/:id', { preHandler: authenticateAdmin }, deleteCategoryHandler as RouteHandlerMethod)

  // Public
  fastify.get('/marketplace/categories', listPublicCategoriesHandler)
}
