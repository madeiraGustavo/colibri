/**
 * Staging/production smoke check for Wave 6 observability.
 * Usage: node scripts/verify-observability-remote.mjs [API_BASE_URL]
 */
const baseUrl = (process.argv[2] ?? process.env.API_URL ?? 'https://colibri-api-djm1.onrender.com').replace(/\/$/, '')
const testId = `wave6-${Date.now()}`

async function checkHealth() {
  const res = await fetch(`${baseUrl}/health`, {
    headers: { 'x-request-id': testId },
  })
  const body = await res.json().catch(() => null)
  const responseId = res.headers.get('x-request-id')

  return {
    ok: res.ok && body?.status === 'ok' && responseId === testId,
    status: res.status,
    body,
    sentId: testId,
    responseId,
  }
}

const result = await checkHealth()

if (!result.ok) {
  console.error('Observability check FAILED')
  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}

console.log('Observability check OK')
console.log(JSON.stringify(result, null, 2))
