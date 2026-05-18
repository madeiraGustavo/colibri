// Feature: api-architecture-migration, Property 6: input validation rejects invalid data

/**
 * validation.property.test.ts
 *
 * Property-based tests for Property 6: Validação de input rejeita dados inválidos
 *
 * Para qualquer payload que viole o schema Zod de um endpoint (campo obrigatório
 * ausente, tipo errado, string fora dos limites), o schema deve rejeitar o payload
 * (safeParse retorna success: false) — garantindo que a API retornaria HTTP 422
 * e o recurso no banco não seria criado ou modificado.
 *
 * Validates: Requirements 4.2, 4.3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

import { LoginSchema }          from './auth/auth.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Asserts that a Zod schema rejects the given payload. */
function assertInvalid(schema: { safeParse: (v: unknown) => { success: boolean } }, payload: unknown): void {
  const result = schema.safeParse(payload)
  expect(result.success).toBe(false)
}

// ─── Generators for invalid values ───────────────────────────────────────────

/** Generates a non-email string (plain string without '@'). */
const invalidEmail = fc.string({ minLength: 1 }).filter(s => !s.includes('@'))

/** Generates a string shorter than 6 characters (violates min(6)). */
const tooShortPassword = fc.string({ maxLength: 5 })

// ─── Property 6.1: LoginSchema rejeita payloads inválidos ────────────────────

describe('Property 6: LoginSchema rejeita payloads inválidos', () => {
  it(
    'rejeita qualquer email sem formato válido (sem @) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidEmail,
          fc.string({ minLength: 6 }),
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita qualquer senha com menos de 6 caracteres — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          tooShortPassword,
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo email — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6 }),
          async (password) => {
            assertInvalid(LoginSchema, { password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload sem campo password — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            assertInvalid(LoginSchema, { email })
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita payload com tipos errados (email como número, password como boolean) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.boolean(),
          async (email, password) => {
            assertInvalid(LoginSchema, { email, password })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
