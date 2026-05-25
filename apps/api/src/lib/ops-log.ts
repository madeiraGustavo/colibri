import type { FastifyBaseLogger } from 'fastify'

export type AuthEvent = 'login' | 'register' | 'refresh' | 'logout'

export function logAuthAttempt(
  log: FastifyBaseLogger,
  authEvent: AuthEvent,
  outcome: 'success' | 'failure',
  meta?: { statusCode?: number },
): void {
  log.info({
    event: 'auth.attempt',
    authEvent,
    outcome,
    ...meta,
  })
}

export function logQuoteSubmission(
  log: FastifyBaseLogger,
  meta: { quoteId: string; productId?: string | null; imageCount: number },
): void {
  log.info({
    event: 'quote.submission',
    ...meta,
  })
}

export function logAdminMutation(
  log: FastifyBaseLogger,
  meta: {
    method: string
    path: string
    statusCode: number
    userId?: string
  },
): void {
  log.info({
    event: 'admin.mutation',
    ...meta,
  })
}

export function logUpload(
  log: FastifyBaseLogger,
  meta: {
    route: string
    outcome: 'success' | 'failure'
    statusCode?: number
    mimeType?: string
    sizeBytes?: number
  },
): void {
  log.info({
    event: 'upload.operation',
    ...meta,
  })
}
