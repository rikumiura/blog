import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- モック定義 ---

const mockPut = vi.fn()
const mockGet = vi.fn()

vi.mock('../infrastructure/storage/r2-image-storage', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../infrastructure/storage/r2-image-storage')
    >()
  return {
    ...actual,
    R2ImageStorage: class {
      async save(_key: string, _data: ArrayBuffer, _contentType: string) {
        return mockPut(_key, _data, _contentType)
      }
      async get(_key: string) {
        return mockGet(_key)
      }
    },
  }
})

vi.mock('../infrastructure/database', () => ({
  createDbClient: () => ({}),
}))

vi.mock('../infrastructure/repositories/drizzle-article-repository', () => ({
  DrizzleArticleRepository: vi.fn(),
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

vi.mock('../infrastructure/storage/r2-body-storage', () => ({
  R2BodyStorage: vi.fn(),
}))

vi.mock('../infrastructure/id/article-id-generator-impl', () => ({
  ArticleIdGeneratorImpl: class {
    generateTagId() {
      return 'tag-1'
    }
  },
}))

vi.mock('../infrastructure/auth/auth-middleware', () => ({
  createAuthMiddleware:
    () => async (_c: unknown, next: () => Promise<void>) => {
      await next()
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
vi.mock('../use-cases/schedule-article', () => ({ scheduleArticle: vi.fn() }))
vi.mock('../use-cases/cancel-schedule', () => ({ cancelSchedule: vi.fn() }))
vi.mock('../use-cases/delete-article', () => ({ deleteArticle: vi.fn() }))
vi.mock('../use-cases/update-article', () => ({ updateArticle: vi.fn() }))
vi.mock('../use-cases/update-article-tags', () => ({
  updateArticleTags: vi.fn(),
}))
vi.mock('../use-cases/publish-scheduled-articles', () => ({
  publishScheduledArticles: vi.fn(),
}))

const { app } = await import('../index')

const env = { DB: {}, ARTICLE_BUCKET: {} }

beforeEach(() => {
  mockPut.mockReset()
  mockGet.mockReset()
})

// --- テスト ---

describe('POST /api/images', () => {
  it('画像をアップロードして key と url を返す', async () => {
    mockPut.mockResolvedValue(undefined)

    const imageData = new Uint8Array([137, 80, 78, 71]) // PNG magic bytes
    const file = new File([imageData], 'test.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('image', file)

    const res = await app.request(
      '/api/images',
      { method: 'POST', body: formData },
      env,
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('key')
    expect(body).toHaveProperty('url')
    expect(typeof body.key).toBe('string')
    expect(body.url).toMatch(/^\/api\/public\/images\//)
  })

  it('サポート外のファイル形式は 400 を返す', async () => {
    const file = new File(['text'], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('image', file)

    const res = await app.request(
      '/api/images',
      { method: 'POST', body: formData },
      env,
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('5MB を超えるファイルは 400 を返す', async () => {
    const largeData = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([largeData], 'large.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('image', file)

    const res = await app.request(
      '/api/images',
      { method: 'POST', body: formData },
      env,
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('image フィールドがない場合は 400 を返す', async () => {
    const formData = new FormData()

    const res = await app.request(
      '/api/images',
      { method: 'POST', body: formData },
      env,
    )

    expect(res.status).toBe(400)
  })
})

describe('GET /api/public/images/:imageKey', () => {
  it('画像が存在する場合はバイナリで返す', async () => {
    const imageData = new Uint8Array([137, 80, 78, 71])
    mockGet.mockResolvedValue({
      found: true,
      data: imageData.buffer,
      contentType: 'image/png',
    })

    const res = await app.request(
      '/api/public/images/01234567-abcd-ef01-2345-6789abcdef01.png',
      undefined,
      env,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })

  it('画像が存在しない場合は 404 を返す', async () => {
    mockGet.mockResolvedValue({ found: false })

    const res = await app.request(
      '/api/public/images/ffffffff-0000-1111-2222-333333333333.png',
      undefined,
      env,
    )

    expect(res.status).toBe(404)
  })
})
