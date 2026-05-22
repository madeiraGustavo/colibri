/**
 * middleware.ts
 *
 * Auth middleware — Colibri store (single-site) + legacy hub routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SITES, VALID_SITE_IDS } from '@/lib/sites'

const STORE_SITE_ID = 'marketplace'

const PROTECTED_PATHS = ['/dashboard']

/** Rotas da loja Colibri na raiz (sem prefixo /marketplace). */
const STORE_PROTECTED_PATHS = ['/minha-conta']

const PROTECTED_API_PATHS = ['/api/dashboard', '/api/upload']

function resolveSiteIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0] ?? ''

  if (VALID_SITE_IDS.includes(first)) {
    return first
  }

  return 'platform'
}

function hasValidRefreshCookie(req: NextRequest, siteId: string): boolean {
  const site = SITES[siteId]
  if (!site) return false

  if (req.cookies.has(site.cookieName)) return true
  if (req.cookies.has('refreshToken')) return true

  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Colibri store: /minha-conta na raiz ───────────────────────────────
  if (STORE_PROTECTED_PATHS.includes(pathname)) {
    if (!hasValidRefreshCookie(req, STORE_SITE_ID)) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ── Legacy hub: /{site}/minha-conta ───────────────────────────────────
  const siteId = resolveSiteIdFromPath(pathname)

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && !hasValidRefreshCookie(req, siteId)) {
    const loginUrl = new URL(`/${siteId}/login`, req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const segments = pathname.split('/').filter(Boolean)
  const isTenantProtected =
    segments.length >= 2 &&
    VALID_SITE_IDS.includes(segments[0] ?? '') &&
    segments[1] === 'minha-conta'

  if (isTenantProtected && !hasValidRefreshCookie(req, siteId)) {
    const loginUrl = new URL(`/${siteId}/login`, req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isProtectedApi = PROTECTED_API_PATHS.some((p) => pathname.startsWith(p))

  if (isProtectedApi && !hasValidRefreshCookie(req, siteId)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|data/).*)'],
}
