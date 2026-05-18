/**
 * auth.controller.ts
 *
 * Recebe requests, valida input com Zod, chama o service, retorna response.
 * Não contém lógica de negócio — apenas orquestra.
 *
 * Single-tenant: uses request.tenantId injected by tenant middleware.
 * No siteId is exposed in responses.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { LoginSchema, RegisterSchema, RefreshSchema } from './auth.schema.js'
import * as authService from './auth.service.js'
import { env } from '../../env.js'

function getCookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 dias em segundos
  }
}

/**
 * Lê o refresh token do cookie.
 */
function getRefreshCookie(request: FastifyRequest): string | undefined {
  const cookies = request.cookies as Record<string, string | undefined>
  return cookies['refreshToken']
}

// ── POST /auth/login ──────────────────────────────────────────────────────────

export async function loginHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const parsed = LoginSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  try {
    const { accessToken, refreshToken } = await authService.login(
      parsed.data.email,
      parsed.data.password,
      request.tenantId,
    )

    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(200).send({ accessToken })
  } catch {
    return reply.code(401).send({ error: 'Credenciais inválidas' })
  }
}

// ── POST /auth/register ───────────────────────────────────────────────────────

export async function registerHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const parsed = RegisterSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  try {
    const { accessToken, refreshToken } = await authService.register(
      parsed.data.email,
      parsed.data.password,
      request.tenantId,
      parsed.data.name,
    )

    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(201).send({ accessToken })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar'
    if (message.includes('já cadastrado')) {
      return reply.code(409).send({ error: message })
    }
    return reply.code(500).send({ error: 'Erro interno' })
  }
}

// ── POST /auth/refresh ────────────────────────────────────────────────────────

export async function refreshHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  // Aceita refresh token do cookie ou body
  const cookieToken = getRefreshCookie(request)
  const parsed      = RefreshSchema.safeParse(request.body)
  const bodyToken   = parsed.success ? parsed.data.refreshToken : undefined
  const token       = cookieToken ?? bodyToken

  if (!token) {
    return reply.code(401).send({ error: 'Refresh token ausente' })
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(token)
    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(200).send({ accessToken })
  } catch {
    return reply.code(401).send({ error: 'Refresh token inválido ou expirado' })
  }
}

// ── POST /auth/logout ─────────────────────────────────────────────────────────

export async function logoutHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const token = getRefreshCookie(request)

  if (!token) {
    reply.clearCookie('refreshToken', { path: '/' })
    return reply.code(400).send({ error: 'Refresh token ausente ou inválido' })
  }

  let userId: string
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }
    userId = payload.sub
  } catch {
    reply.clearCookie('refreshToken', { path: '/' })
    return reply.code(400).send({ error: 'Refresh token ausente ou inválido' })
  }

  await authService.logout(userId)
  reply.clearCookie('refreshToken', { path: '/' })
  return reply.code(204).send()
}

// ── GET /auth/session ─────────────────────────────────────────────────────────

export async function sessionHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const session = await authService.getSession(request.user.userId)
  return reply.code(200).send(session)
}
