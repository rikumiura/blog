import { describe, expect, it, vi } from 'vitest'

// migration gate は index.tsx の default export fetch ハンドラーで実装される
// api-contracts.test.ts が使う app.request() とは別経路なので独立したテストが必要

vi.mock('../infrastructure/auth/auth-middleware', () => ({
  createAuthMiddleware:
    () => async (_c: unknown, next: () => Promise<void>) => {
      await next()
    },
}))

const defaultExport = await import('../index')

const makeCtx = (): ExecutionContext =>
  ({ waitUntil: (_p: Promise<unknown>) => {} }) as unknown as ExecutionContext

describe('migration gate', () => {
  it('pending_body_key_deletions テーブルが存在しない場合、503 を返す', async () => {
    const env = {
      DB: {
        prepare: () => {
          throw new Error('no such table: pending_body_key_deletions')
        },
      },
      ARTICLE_BUCKET: {},
    }

    const request = new Request('http://localhost/api/hello')
    const res = await defaultExport.default.fetch(
      request,
      env as unknown as { DB: D1Database; ARTICLE_BUCKET: R2Bucket },
      makeCtx(),
    )

    expect(res.status).toBe(503)
    const body = await res.json<{ error: string }>()
    expect(body.error).toBeDefined()
  })
})
