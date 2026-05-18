import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'colibri'

export default fp(async function tenantPlugin(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request) => {
    request.tenantId = DEFAULT_TENANT_ID
  })
})
