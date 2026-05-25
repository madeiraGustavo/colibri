/**
 * Testes de integração — fluxo Web → API Fastify
 *
 * Cobrem:
 * 1. Login via proxy → recebe accessToken → chama /marketplace/products com Bearer
 * 2. Refresh automático: 401 → interceptor faz refresh → retry bem-sucedido
 *
 * Requirements: 4.1, 4.8, 4.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  setAccessToken,
  getAccessToken,
} from './client'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeEmptyResponse(status: number): Response {
  return new Response(null, { status })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Limpa o token em memória antes de cada teste
  setAccessToken(null)
  vi.stubGlobal('fetch', vi.fn())
  // Evita erros de window.location em ambiente Node
  vi.stubGlobal('window', { location: { href: '' } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Testes ────────────────────────────────────────────────────────────────────

describe('apiGet', () => {
  it('envia Authorization: Bearer quando accessToken está em memória', async () => {
    setAccessToken('token-abc')
    const mockFetch = vi.fn().mockResolvedValue(makeResponse({ data: [] }))
    vi.stubGlobal('fetch', mockFetch)

    await apiGet('/marketplace/products')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    const headers = options.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer token-abc')
  })

  it('envia credentials: include para o cookie de refresh', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse({ data: [] }))
    vi.stubGlobal('fetch', mockFetch)

    await apiGet('/marketplace/products')

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.credentials).toBe('include')
  })

  it('retorna os dados da resposta corretamente', async () => {
    const tracks = [{ id: '1', title: 'Track A' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ data: tracks })))

    const result = await apiGet<{ data: typeof tracks }>('/marketplace/products')

    expect(result.data).toEqual(tracks)
  })

  it('lança erro quando a resposta não é ok (sem 401)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ error: 'Não encontrado' }, 404)))

    await expect(apiGet('/marketplace/products')).rejects.toThrow('Não encontrado')
  })
})

describe('apiPost', () => {
  it('envia método POST com body serializado', async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse({ data: { id: '1' } }, 201))
    vi.stubGlobal('fetch', mockFetch)

    await apiPost('/marketplace/products', { title: 'Nova Faixa', genre: 'jazz' })

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify({ title: 'Nova Faixa', genre: 'jazz' }))
  })
})

describe('apiPatch', () => {
  it('envia método PATCH com body serializado', async () => {
    setAccessToken('token-xyz')
    const mockFetch = vi.fn().mockResolvedValue(makeResponse({ data: { id: '1' } }))
    vi.stubGlobal('fetch', mockFetch)

    await apiPatch('/marketplace/products/1', { name: 'Novo Nome' })

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('PATCH')
    expect(options.body).toBe(JSON.stringify({ name: 'Novo Nome' }))
  })
})

describe('apiDelete', () => {
  it('envia método DELETE e aceita 204 sem body', async () => {
    setAccessToken('token-xyz')
    const mockFetch = vi.fn().mockResolvedValue(makeEmptyResponse(204))
    vi.stubGlobal('fetch', mockFetch)

    const result = await apiDelete('/marketplace/products/1')

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(options.method).toBe('DELETE')
    expect(result).toBeUndefined()
  })
})

describe('Interceptor de 401 — refresh automático', () => {
  it('faz refresh e retenta a chamada original quando recebe 401', async () => {
    setAccessToken('token-expirado')

    const mockFetch = vi.fn()
      // 1ª chamada: /marketplace/products → 401
      .mockResolvedValueOnce(makeResponse({ error: 'Não autorizado' }, 401))
      // 2ª chamada: /auth/refresh → 200 com novo token
      .mockResolvedValueOnce(makeResponse({ accessToken: 'token-novo' }))
      // 3ª chamada: retry /marketplace/products → 200
      .mockResolvedValueOnce(makeResponse({ data: [{ id: '1', title: 'Track A' }] }))

    vi.stubGlobal('fetch', mockFetch)

    const result = await apiGet<{ data: { id: string; title: string }[] }>('/marketplace/products')

    // Deve ter feito 3 chamadas: original + refresh + retry
    expect(mockFetch).toHaveBeenCalledTimes(3)

    // 2ª chamada deve ser para /auth/refresh
    const [refreshUrl, refreshOptions] = mockFetch.mock.calls[1] as [string, RequestInit]
    expect(refreshUrl).toContain('/auth/refresh')
    expect(refreshOptions.method).toBe('POST')
    expect(refreshOptions.credentials).toBe('include')

    // Token em memória deve ter sido atualizado
    expect(getAccessToken()).toBe('token-novo')

    // Resultado final deve ser os dados do retry
    expect(result.data).toEqual([{ id: '1', title: 'Track A' }])
  })

  it('redireciona para /login quando o refresh também falha', async () => {
    setAccessToken('token-expirado')

    const mockFetch = vi.fn()
      // 1ª chamada: /marketplace/products → 401
      .mockResolvedValueOnce(makeResponse({ error: 'Não autorizado' }, 401))
      // 2ª chamada: /auth/refresh → 401 (refresh inválido)
      .mockResolvedValueOnce(makeResponse({ error: 'Refresh inválido' }, 401))

    vi.stubGlobal('fetch', mockFetch)

    const windowMock = { location: { href: '', pathname: '/marketplace/products' } }
    vi.stubGlobal('window', windowMock)

    await expect(apiGet('/marketplace/products')).rejects.toThrow('Sessão expirada')

    // Token deve ter sido limpo
    expect(getAccessToken()).toBeNull()
    // Deve ter redirecionado para login do tenant correto
    expect(windowMock.location.href).toBe('/login')
  })

  it('não faz loop infinito de refresh (tenta apenas uma vez)', async () => {
    setAccessToken('token-expirado')

    const mockFetch = vi.fn()
      // 1ª chamada: /marketplace/products → 401
      .mockResolvedValueOnce(makeResponse({ error: 'Não autorizado' }, 401))
      // 2ª chamada: /auth/refresh → 200
      .mockResolvedValueOnce(makeResponse({ accessToken: 'token-novo' }))
      // 3ª chamada: retry /marketplace/products → 401 novamente
      .mockResolvedValueOnce(makeResponse({ error: 'Não autorizado' }, 401))

    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('window', { location: { href: '', pathname: '/marketplace/products' } })

    await expect(apiGet('/marketplace/products')).rejects.toThrow('Sessão expirada')

    // Deve ter feito exatamente 3 chamadas — sem loop
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('retry usa o novo accessToken no header Authorization', async () => {
    setAccessToken('token-antigo')

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse({ error: 'Não autorizado' }, 401))
      .mockResolvedValueOnce(makeResponse({ accessToken: 'token-renovado' }))
      .mockResolvedValueOnce(makeResponse({ data: [] }))

    vi.stubGlobal('fetch', mockFetch)

    await apiGet('/marketplace/products')

    // 3ª chamada (retry) deve usar o token renovado
    const [, retryOptions] = mockFetch.mock.calls[2] as [string, RequestInit]
    const retryHeaders = retryOptions.headers as Record<string, string>
    expect(retryHeaders['Authorization']).toBe('Bearer token-renovado')
  })
})

describe('Fluxo completo: login → accessToken → chamada autenticada', () => {
  it('armazena accessToken em memória após login e o usa nas chamadas seguintes', async () => {
    // Simula o fluxo: frontend chama /api/auth/login (proxy) que retorna accessToken
    // Depois usa esse token para chamar /marketplace/products
    const loginResponse = { accessToken: 'token-do-login', user: { id: '1', email: 'test@test.com' } }
    const tracksResponse = { data: [{ id: 'track-1', title: 'Minha Faixa' }] }

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(makeResponse(loginResponse))
      .mockResolvedValueOnce(makeResponse(tracksResponse))

    vi.stubGlobal('fetch', mockFetch)

    // 1. Login via proxy
    const loginResult = await apiPost<typeof loginResponse>('/auth/login', {
      email: 'test@test.com',
      password: 'senha123',
    })

    // 2. Armazena o token em memória
    setAccessToken(loginResult.accessToken)
    expect(getAccessToken()).toBe('token-do-login')

    // 3. Chama /marketplace/products com Bearer
    const tracksResult = await apiGet<typeof tracksResponse>('/marketplace/products')

    expect(tracksResult.data).toEqual([{ id: 'track-1', title: 'Minha Faixa' }])

    // Verifica que o Bearer foi enviado na chamada de tracks
    const [, tracksOptions] = mockFetch.mock.calls[1] as [string, RequestInit]
    const headers = tracksOptions.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer token-do-login')
  })
})
