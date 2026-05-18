/**
 * sites.ts
 *
 * Config estática de sites/tenants da plataforma Colibri (frontend).
 * Espelho da config do backend — sem lógica de resolução de request.
 *
 * Futuramente será migrada para tabela `sites` no banco.
 * A interface e funções públicas permanecerão as mesmas.
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

// ── Config ────────────────────────────────────────────────────────────────────

export const SITES: Record<string, SiteConfig> = {
  platform: {
    id: 'platform',
    slug: 'platform',
    displayName: 'Toldos Colibri',
    theme: {
      primaryColor: '#D4A017',
      gradientMain: 'linear-gradient(135deg, #D4A017, #F59E0B)',
    },
    authEnabled: true,
    cookieName: 'ah_platform_refresh',
  },
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
  tattoo: {
    id: 'tattoo',
    slug: 'tattoo',
    displayName: 'Studio Tattoo',
    theme: {
      primaryColor: '#111827',
      secondaryColor: '#DC2626',
    },
    authEnabled: true,
    cookieName: 'ah_tattoo_refresh',
  },
  music: {
    id: 'music',
    slug: 'music',
    displayName: 'Toldos Colibri Music',
    theme: {
      primaryColor: '#D4A017',
      gradientMain: 'linear-gradient(135deg, #D4A017, #F59E0B)',
    },
    authEnabled: true,
    cookieName: 'ah_music_refresh',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getSiteBySlug(slug: string): SiteConfig | null {
  return SITES[slug] ?? null
}

export function getSiteById(id: string): SiteConfig | null {
  return SITES[id] ?? null
}

/** IDs válidos de site — útil para validação */
export const VALID_SITE_IDS = Object.keys(SITES)

/**
 * Resolve o siteSlug a partir de um pathname do Next.js.
 * Usado pelo middleware e componentes para determinar o tenant atual.
 *
 * Exemplos:
 *   '/marketplace/login' → 'marketplace'
 *   '/tattoo/checkout'   → 'tattoo'
 *   '/dashboard'         → 'platform'
 *   '/login'             → 'platform'
 */
export function resolveSiteFromPath(pathname: string): SiteConfig {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0] ?? ''

  const site = SITES[firstSegment]
  if (site) {
    return site
  }

  // Rotas sem prefixo de site (dashboard, login antigo) → platform
  return SITES.platform!
}
