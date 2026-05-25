/**
 * middleware.ts — Auth da loja Colibri (rotas na raiz).
 */

import { NextRequest, NextResponse } from 'next/server'
import { SITES } from '@/lib/sites'

const STORE_SITE_ID = 'marketplace'

const STORE_PROTECTED_PATHS = ['/minha-conta', '/admin']

const PROTECTED_API_PATHS = ['/api/upload']

function hasValidRefreshCookie(req: NextRequest): boolean {
  const site = SITES[STORE_SITE_ID]
  if (!site) return false

  if (req.cookies.has(site.cookieName)) return true
  if (req.cookies.has('refreshToken')) return true

  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (STORE_PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!hasValidRefreshCookie(req)) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  if (PROTECTED_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!hasValidRefreshCookie(req)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|data/).*)'],
}
