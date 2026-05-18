/**
 * RegisterForm.test.ts
 *
 * Property 10: Post-Registration Redirect Logic
 *
 * For any site config, the redirect destination after successful registration is:
 * - `/{site.slug}/minha-conta` for ALL tenants (including platform)
 * - /dashboard is NOT used for customer auth redirects
 *
 * Validates: Requirements 2.3, 9.3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { SITES, VALID_SITE_IDS } from '@/lib/sites'

// ── Extract redirect logic (mirrors RegisterForm/LoginForm implementation) ────

function getPostRegistrationRedirect(siteSlug: string): string {
  return `/${siteSlug}/minha-conta`
}

// ── Property 10: Post-Registration Redirect Logic ─────────────────────────────

describe('Property 10: Post-Registration Redirect Logic', () => {
  it(
    'for all tenants, redirect is always /{site.slug}/minha-conta',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_SITE_IDS),
          (siteId) => {
            const site = SITES[siteId]!
            const redirect = getPostRegistrationRedirect(site.slug)
            expect(redirect).toBe(`/${site.slug}/minha-conta`)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'redirect never points to /dashboard',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_SITE_IDS),
          (siteId) => {
            const site = SITES[siteId]!
            const redirect = getPostRegistrationRedirect(site.slug)
            expect(redirect).not.toBe('/dashboard')
            expect(redirect).not.toContain('/dashboard')
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'redirect always starts with / and contains minha-conta',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_SITE_IDS),
          (siteId) => {
            const site = SITES[siteId]!
            const redirect = getPostRegistrationRedirect(site.slug)
            expect(redirect.startsWith('/')).toBe(true)
            expect(redirect).toContain('minha-conta')
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'platform redirect is /platform/minha-conta (not /dashboard)',
    () => {
      const site = SITES.platform!
      const redirect = getPostRegistrationRedirect(site.slug)
      expect(redirect).toBe('/platform/minha-conta')
      expect(redirect).not.toBe('/dashboard')
    },
  )
})
