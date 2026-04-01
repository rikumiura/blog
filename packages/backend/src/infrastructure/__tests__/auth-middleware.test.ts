import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import type { TokenGenerator } from '../../domain/ports/token-generator'
import { createAuthMiddleware } from '../auth/auth-middleware'

class FakeTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    return `valid-token:${payload.sub}`
  }
  async verify(token: string): Promise<{ sub: string } | null> {
    if (token.startsWith('valid-token:')) {
      return { sub: token.slice(12) }
    }
    return null
  }
}

function createTestApp() {
  const tokenGenerator = new FakeTokenGenerator()
  const app = new Hono()
  const authMiddleware = createAuthMiddleware(() => tokenGenerator)

  app.use('/api/articles/*', authMiddleware)
  app.use('/api/articles', authMiddleware)
  app.get('/api/articles', (c) => c.json({ message: 'list ok' }))
  app.get('/api/articles/test', (c) => c.json({ message: 'ok' }))
  app.get('/api/public/test', (c) => c.json({ message: 'public ok' }))

  return app
}

describe('認証ミドルウェア', () => {
  it('有効なトークンでリクエストが通過する', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles/test', {
      headers: { Authorization: 'Bearer valid-token:admin' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'ok' })
  })

  it('Authorization ヘッダーがない場合は 401 が返る', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles/test')

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: '認証が必要です' })
  })

  it('Bearer 形式でないトークンは 401 が返る', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles/test', {
      headers: { Authorization: 'Basic invalid' },
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: '認証が必要です' })
  })

  it('無効なトークンは 401 が返る', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles/test', {
      headers: { Authorization: 'Bearer invalid-token' },
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'トークンが無効です' })
  })

  it('/api/articles（サブパスなし）も認証が必要', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles')

    expect(res.status).toBe(401)
  })

  it('/api/articles に有効なトークンでアクセスできる', async () => {
    const app = createTestApp()

    const res = await app.request('/api/articles', {
      headers: { Authorization: 'Bearer valid-token:admin' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'list ok' })
  })

  it('認証成功時にユーザー情報がコンテキストに設定される', async () => {
    const tokenGenerator = new FakeTokenGenerator()
    const app = new Hono()
    const authMiddleware = createAuthMiddleware(() => tokenGenerator)
    app.use('/api/test', authMiddleware)
    app.get('/api/test', (c) => {
      const user = c.get('user')
      return c.json({ user })
    })

    const res = await app.request('/api/test', {
      headers: { Authorization: 'Bearer valid-token:admin' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ user: { sub: 'admin' } })
  })

  it('公開APIはミドルウェアの影響を受けない', async () => {
    const app = createTestApp()

    const res = await app.request('/api/public/test')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'public ok' })
  })
})
