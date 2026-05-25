import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadPrismaEnv, requireDatabaseUrl } from './load-env.js'

describe('loadPrismaEnv / requireDatabaseUrl', () => {
  const original = process.env.DATABASE_URL

  afterEach(() => {
    if (original === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = original
    }
    vi.restoreAllMocks()
  })

  it('loadPrismaEnv runs without throwing', () => {
    expect(() => loadPrismaEnv()).not.toThrow()
  })

  it('requireDatabaseUrl exits when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => requireDatabaseUrl()).toThrow('exit')
    expect(exit).toHaveBeenCalledWith(1)
    expect(error).toHaveBeenCalled()
  })

  it('requireDatabaseUrl returns DATABASE_URL when set', () => {
    process.env.DATABASE_URL = 'postgresql://localhost/colibri'
    expect(requireDatabaseUrl()).toBe('postgresql://localhost/colibri')
  })
})
