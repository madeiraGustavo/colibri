/**
 * RegisterForm.test.ts — post-registration redirect (Colibri store)
 */

import { describe, it, expect } from 'vitest'
import { SITES, postAuthRedirectPath } from '@/lib/sites'

describe('Post-registration redirect', () => {
  it('redirects to /minha-conta for marketplace', () => {
    expect(postAuthRedirectPath(SITES.marketplace!)).toBe('/minha-conta')
  })

  it('does not redirect to legacy hub paths', () => {
    const redirect = postAuthRedirectPath(SITES.marketplace!)
    expect(redirect).not.toBe('/dashboard')
    expect(redirect).not.toContain('/platform')
    expect(redirect).not.toContain('/tattoo')
  })
})
