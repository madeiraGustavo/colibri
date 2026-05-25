/**
 * sites.test.ts — Colibri single-store site config
 */

import { describe, it, expect } from 'vitest'
import {
  SITES,
  VALID_SITE_IDS,
  getSiteBySlug,
  getSiteById,
  resolveSiteFromPath,
  postAuthRedirectPath,
} from './sites'

describe('Site config', () => {
  it('contains only marketplace', () => {
    expect(VALID_SITE_IDS).toEqual(['marketplace'])
    expect(VALID_SITE_IDS).toHaveLength(1)
  })

  it('marketplace has auth enabled and cookie name', () => {
    const site = SITES.marketplace!
    expect(site.authEnabled).toBe(true)
    expect(site.cookieName).toBe('ah_marketplace_refresh')
  })
})

describe('getSiteBySlug / getSiteById', () => {
  it('returns marketplace for valid id/slug', () => {
    expect(getSiteBySlug('marketplace')?.id).toBe('marketplace')
    expect(getSiteById('marketplace')?.slug).toBe('marketplace')
  })

  it('returns null for removed hub sites', () => {
    expect(getSiteBySlug('platform')).toBeNull()
    expect(getSiteBySlug('tattoo')).toBeNull()
    expect(getSiteBySlug('music')).toBeNull()
  })
})

describe('resolveSiteFromPath', () => {
  it('always resolves to marketplace', () => {
    expect(resolveSiteFromPath('/login').id).toBe('marketplace')
    expect(resolveSiteFromPath('/').id).toBe('marketplace')
    expect(resolveSiteFromPath('/produtos').id).toBe('marketplace')
  })
})

describe('postAuthRedirectPath', () => {
  it('redirects to store account at root', () => {
    expect(postAuthRedirectPath(SITES.marketplace!)).toBe('/minha-conta')
  })
})

describe('Branding', () => {
  it('marketplace has Toldos Colibri branding', () => {
    const site = SITES.marketplace!
    expect(site.displayName).toBe('Toldos Colibri')
    expect(site.theme.primaryColor).toBe('#D4A017')
    expect(site.theme.backgroundColor).toBe('#1A1A1A')
  })
})
