import type { FastifyServerOptions } from 'fastify'

/**
 * Configuração central do Pino (via Fastify logger).
 * JSON em todos os ambientes exceto test (logger desligado).
 */
export function buildLoggerOptions(): FastifyServerOptions['logger'] {
  if (process.env.NODE_ENV === 'test') {
    return false
  }

  const isProduction = process.env.NODE_ENV === 'production'

  return {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
      ],
      censor: '[Redacted]',
    },
    base: {
      service: 'colibri-api',
      env: process.env.NODE_ENV ?? 'development',
    },
  }
}
