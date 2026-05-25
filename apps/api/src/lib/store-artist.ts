import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from './prisma.js'
import type { AuthContext } from '../types/fastify.js'

const DEFAULT_STORE_ARTIST_SLUG = process.env.DEFAULT_STORE_ARTIST_SLUG || 'colibri'

export { DEFAULT_STORE_ARTIST_SLUG }

/**
 * Resolve o artista da loja Colibri para rotas públicas (ex.: POST /marketplace/quotes).
 * Não usa X-Site-Id nem contexto de auth — apenas slug configurado + fallback legado.
 */
export async function resolvePublicStoreArtistId(): Promise<string | null> {
  const bySlug = await prisma.artist.findFirst({
    where: { slug: DEFAULT_STORE_ARTIST_SLUG, isActive: true },
    select: { id: true },
  })
  if (bySlug) return bySlug.id

  // DB legada (demo seed): único artista ativo com produtos no marketplace
  const withProducts = await prisma.artist.findFirst({
    where: {
      isActive: true,
      marketplaceProducts: { some: { active: true, deletedAt: null } },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  if (withProducts) return withProducts.id

  const anyActive = await prisma.artist.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return anyActive?.id ?? null
}

/**
 * Single-store: admin users may not have artistId on the User row.
 * Resolve the Colibri marketplace artist for dashboard mutations.
 */
export async function resolveStoreArtistId(user: AuthContext): Promise<string | null> {
  if (user.artistId) return user.artistId

  if (user.role !== 'admin') return null

  return resolvePublicStoreArtistId()
}

export async function requireStoreArtistId(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<string | null> {
  const artistId = await resolveStoreArtistId(request.user as AuthContext)
  if (!artistId) {
    reply.code(403).send({ error: 'Perfil da loja não configurado' })
    return null
  }
  return artistId
}
