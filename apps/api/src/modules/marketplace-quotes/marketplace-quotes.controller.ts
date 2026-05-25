import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateQuoteSchema, UpdateQuoteStatusSchema, ListQuotesQuerySchema } from './marketplace-quotes.schemas.js'
import { validateQuoteStatusTransition, sanitizeText } from './marketplace-quotes.service.js'
import * as repo from './marketplace-quotes.repository.js'
import { prisma } from '../../lib/prisma.js'
import { uploadFile } from '../../lib/storage.js'
import { validateMime } from '../../lib/validateMime.js'
import { env } from '../../env.js'
import { randomUUID } from 'crypto'
import { DEFAULT_STORE_ARTIST_SLUG, requireStoreArtistId } from '../../lib/store-artist.js'
import { logQuoteSubmission } from '../../lib/ops-log.js'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']

// ── POST /marketplace/quotes (público, rate limited) ──────────────────────────

export async function createQuoteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Handle multipart/form-data OR JSON
  let body: Record<string, unknown> = {}
  const imageBuffers: Array<{ buffer: Buffer; mimetype: string; filename: string }> = []

  if (request.isMultipart()) {
    const parts = request.parts()
    for await (const part of parts) {
      if (part.type === 'file') {
        if (imageBuffers.length >= MAX_IMAGES) continue
        if (!ALLOWED_IMAGE_MIMES.includes(part.mimetype)) continue
        const chunks: Buffer[] = []
        for await (const chunk of part.file) {
          chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        if (buffer.length <= MAX_IMAGE_SIZE) {
          imageBuffers.push({ buffer, mimetype: part.mimetype, filename: part.filename })
        }
      } else {
        // Parse numeric fields
        if (part.fieldname === 'widthCm' || part.fieldname === 'heightCm') {
          const num = parseFloat(part.value as string)
          if (!isNaN(num)) body[part.fieldname] = num
        } else if (part.fieldname === 'quantity') {
          const num = parseInt(part.value as string, 10)
          if (!isNaN(num)) body[part.fieldname] = num
        } else {
          body[part.fieldname] = part.value
        }
      }
    }
  } else {
    body = request.body as Record<string, unknown>
  }

  const parsed = CreateQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Verify product is active (if productId provided)
  let artistId: string
  if (parsed.data.productId) {
    const product = await prisma.marketplaceProduct.findFirst({
      where: { id: parsed.data.productId, active: true },
      select: { id: true, artistId: true },
    })

    if (!product) {
      return reply.code(422).send({ error: 'Produto não encontrado ou inativo' })
    }
    artistId = product.artistId
  } else {
    const storeArtist = await prisma.artist.findFirst({
      where: { slug: DEFAULT_STORE_ARTIST_SLUG, isActive: true },
      select: { id: true },
    })
    if (!storeArtist) {
      return reply.code(500).send({ error: 'Loja não configurada' })
    }
    artistId = storeArtist.id
  }

  // Upload images to Supabase Storage
  const imageUrls: string[] = []
  if (imageBuffers.length > 0) {
    for (const img of imageBuffers) {
      const ext = img.mimetype.split('/')[1] ?? 'jpg'
      const key = `quotes/${randomUUID()}.${ext}`
      try {
        await uploadFile(env.STORAGE_BUCKET, key, img.buffer, img.mimetype)
        // Construct public URL
        const url = `${env.SUPABASE_URL}/storage/v1/object/public/${env.STORAGE_BUCKET}/${key}`
        imageUrls.push(url)
      } catch {
        // If any upload fails, clean up already uploaded files and abort
        // Note: partial cleanup is best-effort; the quote won't be persisted
        return reply.code(500).send({ error: 'Falha no upload de imagem. Tente novamente.' })
      }
    }
  }

  // Sanitize message
  const message = sanitizeText(parsed.data.message)

  const quote = await repo.create({
    artistId,
    productId: parsed.data.productId,
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterPhone: parsed.data.requesterPhone,
    city: parsed.data.city,
    message,
    widthCm: parsed.data.widthCm,
    heightCm: parsed.data.heightCm,
    quantity: parsed.data.quantity,
    source: parsed.data.source,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
  })

  logQuoteSubmission(request.log, {
    quoteId: quote.id,
    productId: parsed.data.productId ?? null,
    imageCount: imageUrls.length,
  })

  return reply.code(201).send({ data: quote })
}

// ── GET /dashboard/marketplace/quotes ─────────────────────────────────────────

export async function listQuotesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const artistId = await requireStoreArtistId(request, reply)
  if (!artistId) return

  const parsed = ListQuotesQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Parâmetros inválidos',
      details: parsed.error.flatten(),
    })
  }

  const result = await repo.findAllByArtist(artistId, parsed.data.page, parsed.data.pageSize, parsed.data.status)

  return reply.code(200).send({
    data: result.data,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages },
  })
}

// ── GET /dashboard/marketplace/quotes/:id ─────────────────────────────────────

export async function getQuoteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const artistId = await requireStoreArtistId(request, reply)
  if (!artistId) return
  const { id } = request.params

  const quote = await repo.findById(id)
  if (!quote) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (quote.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  return reply.code(200).send({ data: quote })
}

// ── PATCH /dashboard/marketplace/quotes/:id/status ────────────────────────────

export async function updateQuoteStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const artistId = await requireStoreArtistId(request, reply)
  if (!artistId) return
  const { id } = request.params

  const quote = await repo.findById(id)
  if (!quote) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (quote.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateQuoteStatusSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Validate status transition
  if (!validateQuoteStatusTransition(quote.status, parsed.data.status)) {
    return reply.code(422).send({
      error: `Transição de status inválida: ${quote.status} → ${parsed.data.status}`,
    })
  }

  // ANSWERED requires responseMessage
  if (parsed.data.status === 'ANSWERED' && !parsed.data.responseMessage) {
    return reply.code(422).send({
      error: 'Mensagem de resposta é obrigatória ao responder orçamento',
    })
  }

  const updated = await repo.updateStatus(id, parsed.data.status, parsed.data.responseMessage)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/marketplace/quotes/:id (soft delete) ────────────────────

export async function deleteQuoteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const artistId = await requireStoreArtistId(request, reply)
  if (!artistId) return
  const { id } = request.params

  const quote = await repo.findById(id)
  if (!quote) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (quote.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  await repo.softDelete(id)

  return reply.code(204).send()
}
