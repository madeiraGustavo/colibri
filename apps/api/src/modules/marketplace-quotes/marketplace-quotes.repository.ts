import { prisma } from '../../lib/prisma.js'

/**
 * Cria uma solicitação de orçamento com imagens opcionais.
 * Transacional: se qualquer parte falhar, nada é persistido.
 */
export async function create(data: {
  artistId: string
  productId: string
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  city?: string
  message: string
  widthCm?: number
  heightCm?: number
  quantity: number
  source?: string
  imageUrls?: string[]
}) {
  const { imageUrls, ...quoteData } = data

  return prisma.$transaction(async (tx) => {
    const quote = await tx.marketplaceQuoteRequest.create({
      data: quoteData,
      select: { id: true, status: true, createdAt: true },
    })

    if (imageUrls && imageUrls.length > 0) {
      await tx.quoteImage.createMany({
        data: imageUrls.map((url) => ({ quoteId: quote.id, url })),
      })
    }

    return quote
  })
}

/**
 * Lista orçamentos do artista com paginação e filtro por status.
 * Exclui soft-deleted (deletedAt IS NULL).
 */
export async function findAllByArtist(artistId: string, page: number, pageSize: number, status?: string) {
  const where: Record<string, unknown> = { artistId, deletedAt: null }
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.marketplaceQuoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        requesterName: true,
        requesterEmail: true,
        requesterPhone: true,
        city: true,
        message: true,
        widthCm: true,
        heightCm: true,
        quantity: true,
        status: true,
        responseMessage: true,
        source: true,
        createdAt: true,
        product: {
          select: { id: true, title: true, slug: true },
        },
        images: {
          select: { id: true, url: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.marketplaceQuoteRequest.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Busca orçamento pelo ID com detalhes completos.
 * Exclui soft-deleted.
 */
export async function findById(id: string) {
  return prisma.marketplaceQuoteRequest.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      artistId: true,
      requesterName: true,
      requesterEmail: true,
      requesterPhone: true,
      city: true,
      message: true,
      widthCm: true,
      heightCm: true,
      quantity: true,
      status: true,
      responseMessage: true,
      source: true,
      statusUpdatedAt: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: { id: true, title: true, slug: true },
      },
      images: {
        select: { id: true, url: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

/**
 * Atualiza status de um orçamento.
 */
export async function updateStatus(id: string, status: string, responseMessage?: string) {
  return prisma.marketplaceQuoteRequest.update({
    where: { id },
    data: {
      status: status as any,
      statusUpdatedAt: new Date(),
      ...(responseMessage !== undefined && { responseMessage }),
    },
    select: { id: true, status: true, updatedAt: true },
  })
}

/**
 * Soft delete de um orçamento.
 */
export async function softDelete(id: string) {
  return prisma.marketplaceQuoteRequest.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  })
}
