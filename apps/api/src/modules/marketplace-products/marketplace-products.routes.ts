import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticateAdmin } from '../../hooks/authenticate.js'
import {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler,
  listPublicProductsHandler,
  getPublicProductHandler,
} from './marketplace-products.controller.js'
import {
  uploadImageHandler,
  reorderImagesHandler,
  deleteImageHandler,
} from './marketplace-products.images.controller.js'

export async function marketplaceProductsRoutes(fastify: FastifyInstance): Promise<void> {
  // Private (authenticated)
  fastify.post('/dashboard/marketplace/products', { preHandler: authenticateAdmin }, createProductHandler)
  fastify.get('/dashboard/marketplace/products', { preHandler: authenticateAdmin }, listProductsHandler)
  fastify.get('/dashboard/marketplace/products/:id', { preHandler: authenticateAdmin }, getProductHandler as RouteHandlerMethod)
  fastify.patch('/dashboard/marketplace/products/:id', { preHandler: authenticateAdmin }, updateProductHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/products/:id', { preHandler: authenticateAdmin }, deleteProductHandler as RouteHandlerMethod)

  // Image endpoints (authenticated)
  fastify.post('/dashboard/marketplace/products/:id/images', { preHandler: authenticateAdmin }, uploadImageHandler as RouteHandlerMethod)
  fastify.patch('/dashboard/marketplace/products/:id/images/reorder', { preHandler: authenticateAdmin }, reorderImagesHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/marketplace/products/:id/images/:imageId', { preHandler: authenticateAdmin }, deleteImageHandler as RouteHandlerMethod)

  // Public
  fastify.get('/marketplace/products', listPublicProductsHandler)
  fastify.get('/marketplace/products/:slug', getPublicProductHandler as RouteHandlerMethod)
}
