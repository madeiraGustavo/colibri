import '@fastify/jwt'
import 'fastify'
import type { UserRole } from '@prisma/client'

export interface AuthContext {
  userId:   string
  artistId: string
  role:     UserRole
}

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string }
    user:    AuthContext
  }
}
