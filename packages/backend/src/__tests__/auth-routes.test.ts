import { describe, expect, it, vi } from 'vitest'
import type { AuthenticateResult } from '../use-cases/authenticate-admin'

// --- モック定義 ---

const mockAuthenticateAdmin = vi.fn<() => Promise<AuthenticateResult>>()

vi.mock('../use-cases/authenticate-admin', () => ({
  authenticateAdmin: (...args: unknown[]) => mockAuthenticateAdmin(...args),
}))

vi.mock('../infrastructure/database', () => ({
  createDbClient: () => ({}),
}))

vi.mock('../infrastructure/repositories/drizzle-article-repository', () => ({
  DrizzleArticleRepository: vi.fn(),
}))

vi.mock('../infrastructure/storage/r2-body-storage', () => ({
  R2BodyStorage: vi.fn(),
}))

vi.mock('../infrastructure/id/article-id-generator-impl', () => ({
  ArticleIdGeneratorImpl: vi.fn(),
}))

vi.mock('../infrastructure/repositories/drizzle-tag-repository', () => ({
  DrizzleTagRepository: class {
    async findByArticleIds() {
      return new Map()
    }
    async findByArticleId() {
      return []
    }
  },
}))

vi.mock('../use-cases/create-article', () => ({ createArticle: vi.fn() }))
vi.mock('../use-cases/get-article', () => ({ getArticle: vi.fn() }))
vi.mock('../use-cases/list-articles', () => ({
  listArticlesPaginated: vi.fn(),
}))
vi.mock('../use-cases/list-published-articles', () => ({
  listPublishedArticlesPaginated: vi.fn(),
}))
vi.mock('../use-cases/publish-article', () => ({ publishArticle: vi.fn() }))
vi.mock('../use-cases/cancel-schedule', () => ({ cancelSchedule: vi.fn() }))
vi.mock('../use-cases/schedule-article', () => ({ scheduleArticle: vi.fn() }))
vi.mock('../use-cases/delete-article', () => ({ deleteArticle: vi.fn() }))
vi.mock('../use-cases/update-article', () => ({ updateArticle: vi.fn() }))
vi.mock('../use-cases/update-article-tags', () => ({
  updateArticleTags: vi.fn(),
}))
vi.mock('../use-cases/publish-scheduled-articles', () => ({
  publishScheduledArticles: vi.fn(),
}))

// 認証ミドルウェア: /api/auth/me 用にユーザー情報をコンテキストに設定
vi.mock('../infrastructure/auth/auth-middleware', () => ({
  createAuthMiddleware:
    () =>
    async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>,
    ) => {
      c.set('user', { sub: 'admin' })
      await next()
    },
}))

const { app } = await import('../index')

const env = {
  DB: {},
  ARTICLE_BUCKET: {},
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD_HASH: 'hashed-password',
  JWT_SECRET: 'test-secret',
}

// --- テスト ---

describe('POST /api/auth/login', () => {
  it('200: 認証成功でトークンが返る', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      status: 'authenticated',
      token: 'jwt-token-value',
    })

    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'correct' }),
      },
      env,
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ token: 'jwt-token-value' })
  })

  it('401: 認証失敗でエラーが返る', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      status: 'invalid_credentials',
    })

    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      },
      env,
    )

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toEqual({
      error: 'ユーザー名またはパスワードが正しくありません',
    })
  })

  it('400: ユーザー名が空の場合はZodバリデーションエラー', async () => {
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: 'password' }),
      },
      env,
    )

    expect(res.status).toBe(400)
  })

  it('400: パスワードが空の場合はZodバリデーションエラー', async () => {
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '' }),
      },
      env,
    )

    expect(res.status).toBe(400)
  })

  it('400: リクエストボディが不正な場合', async () => {
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      env,
    )

    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  it('200: 認証済みユーザーのユーザー名が返る', async () => {
    const res = await app.request('/api/auth/me', undefined, env)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ username: 'admin' })
  })
})
