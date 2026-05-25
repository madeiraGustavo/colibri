/**
 * sites.ts
 *
 * Config estática do site Colibri (backend).
 * O id `marketplace` é mantido por compatibilidade com cookies e X-Site-Id.
 */

import type { FastifyRequest } from 'fastify'

export interface SiteTheme {
  primaryColor: string
  secondaryColor?: string
  backgroundColor?: string
  gradientMain?: string
}

export interface SiteConfig {
  id: string
  slug: string
  displayName: string
  logo?: string
  theme: SiteTheme
  authEnabled: boolean
  cookieName: string
}

export const SITES: Record<string, SiteConfig> = {
  marketplace: {
    id: 'marketplace',
    slug: 'marketplace',
    displayName: 'Toldos Colibri',
    theme: {
      primaryColor: '#D4A017',
      backgroundColor: '#1A1A1A',
    },
    authEnabled: true,
    cookieName: 'ah_marketplace_refresh',
  },
}

export function getSiteBySlug(slug: string): SiteConfig | null {
  return SITES[slug] ?? null
}

export function getSiteById(id: string): SiteConfig | null {
  return SITES[id] ?? null
}

export const VALID_SITE_IDS = Object.keys(SITES)

/**
 * Resolve o site da request. Ordem:
 * 1. Header X-Site-Id (proxy Next.js)
 * 2. Fallback marketplace (loja única)
 */
export function resolveSiteFromRequest(req: FastifyRequest): SiteConfig {
  const headerSiteId = req.headers['x-site-id'] as string | undefined

  if (headerSiteId && SITES[headerSiteId]) {
    return SITES[headerSiteId]
  }

  return SITES.marketplace
}
