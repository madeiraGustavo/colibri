import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${siteConfig.domain}`

/**
 * Generates metadata for the marketplace home page.
 */
export function generateHomeMetadata(): Metadata {
  const title = siteConfig.name
  const description = siteConfig.description

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical: `${BASE_URL}/`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/`,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

/**
 * Generates metadata for a product detail page.
 */
export function generateProductMetadata(product: {
  title: string
  shortDescription?: string | null
  description?: string | null
  thumbnailUrl?: string | null
  slug: string
}): Metadata {
  const title = `${product.title} | ${siteConfig.name}`
  const description = buildDescription(
    product.shortDescription,
    product.description
  )
  const canonical = `${BASE_URL}/produtos/${product.slug}`

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
      ...(product.thumbnailUrl
        ? { images: [{ url: product.thumbnailUrl }] }
        : {}),
    },
  }
}

/**
 * Generates metadata for a category listing page.
 */
export function generateCategoryMetadata(category: {
  name: string
  slug: string
  description?: string | null
}): Metadata {
  const title = `${category.name} | ${siteConfig.name}`
  const description = buildDescription(
    category.description,
    `Produtos da categoria ${category.name}. ${siteConfig.description}`
  )
  const canonical = `${BASE_URL}/produtos/categoria/${category.slug}`

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

/**
 * Builds a meta description from available text sources.
 * Uses shortDescription first, then truncates description, or falls back to generic text.
 */
function buildDescription(
  primary?: string | null,
  fallback?: string | null
): string {
  if (primary && primary.trim().length > 0) {
    return truncate(primary.trim())
  }

  if (fallback && fallback.trim().length > 0) {
    return truncate(fallback.trim())
  }

  return siteConfig.description
}

/**
 * Truncates text to a maximum of 160 characters for meta description.
 */
function truncate(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trimEnd() + '...'
}
