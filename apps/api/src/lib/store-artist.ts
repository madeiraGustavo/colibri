import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from './prisma.js'
import type { AuthContext } from '../types/fastify.js'

const DEFAULT_STORE_ARTIST_SLUG = process.env.DEFAULT_STORE_ARTIST_SLUG || 'colibri'

export { DEFAULT_STORE_ARTIST_SLUG }

/**
 * Single-store: admin users may not have artistId on the User row.
 * Resolve the Colibri marketplace artist for dashboard mutations.
 */
export async function resolveStoreArtistId(user: AuthContext): Promise<string | null> {
  if (user.artistId) return user.artistId

  if (user.role !== 'admin') return null

  const artist = await prisma.artist.findFirst({
    where: { slug: DEFAULT_STORE_ARTIST_SLUG, isActive: true },
    select: { id: true },
  })

  return artist?.id ?? null
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
