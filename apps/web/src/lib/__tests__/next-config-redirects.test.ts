/**
 * Wave 8 — /marketplace store paths must 404 (no next.config redirects).
 */

import { describe, it, expect } from 'vitest'
import nextConfig from '../../../next.config.mjs'

describe('next.config redirects (wave 8)', () => {
  it('does not define /marketplace store redirects', async () => {
    const redirects = await nextConfig.redirects()
    const legacyStore = redirects.filter((r) => r.source.startsWith('/marketplace'))
    expect(legacyStore).toEqual([])
  })

  it('keeps legacy admin dashboard redirects', async () => {
    const redirects = await nextConfig.redirects()
    const sources = redirects.map((r) => r.source)
    expect(sources).toContain('/dashboard/marketplace')
    expect(sources).toContain('/dashboard/marketplace/:path*')
  })

  it('keeps canonical store path redirects', async () => {
    const redirects = await nextConfig.redirects()
    const sources = redirects.map((r) => r.source)
    expect(sources).toContain('/categoria/:slug')
    expect(sources).toContain('/register')
  })
})
