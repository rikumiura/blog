import { describe, expect, it, vi } from 'vitest'
import type { DraftArticle, PublishedArticle } from '../domain/models/article'
import type { PaginatedResult } from '../domain/ports/article-repository'
import type { CreateArticleResult } from '../use-cases/create-article'
import type { GetArticleResult } from '../use-cases/get-article'
import type { PublishArticleResult } from '../use-cases/publish-article'

// --- モック定義 ---

const mockCreateArticle = vi.fn<() => Promise<CreateArticleResult>>()
const mockGetArticle = vi.fn<() => Promise<GetArticleResult>>()
const mockListArticlesPaginated =
  vi.fn<() => Promise<PaginatedResult<DraftArticle | PublishedArticle>>>()
const mockListPublishedArticlesPaginated =
  vi.fn<() => Promise<PaginatedResult<PublishedArticle>>>()
const mockListPublishedArticles = vi.fn<() => Promise<PublishedArticle[]>>()
const mockPublishArticle = vi.fn<() => Promise<PublishArticleResult>>()

vi.mock('../use-cases/create-article', () => ({
  createArticle: (...args: unknown[]) => mockCreateArticle(...args),
}))

vi.mock('../use-cases/get-article', () => ({
  getArticle: (...args: unknown[]) => mockGetArticle(...args),
}))

vi.mock('../use-cases/list-articles', () => ({
  listArticlesPaginated: (...args: unknown[]) =>
    mockListArticlesPaginated(...args),
}))

vi.mock('../use-cases/list-published-articles', () => ({
  listPublishedArticlesPaginated: (...args: unknown[]) =>
    mockListPublishedArticlesPaginated(...args),
  listPublishedArticles: (...args: unknown[]) =>
    mockListPublishedArticles(...args),
}))

vi.mock('../use-cases/publish-article', () => ({
  publishArticle: (...args: unknown[]) => mockPublishArticle(...args),
}))

vi.mock('../use-cases/cancel-schedule', () => ({
  cancelSchedule: vi.fn(),
}))

vi.mock('../use-cases/schedule-article', () => ({
  scheduleArticle: vi.fn(),
}))

vi.mock('../use-cases/delete-article', () => ({
  deleteArticle: vi.fn(),
}))

vi.mock('../use-cases/update-article', () => ({
  updateArticle: vi.fn(),
}))

vi.mock('../use-cases/update-article-tags', () => ({
  updateArticleTags: vi.fn(),
}))

vi.mock('../use-cases/publish-scheduled-articles', () => ({
  publishScheduledArticles: vi.fn(),
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

vi.mock('../infrastructure/auth/auth-middleware', () => ({
  createAuthMiddleware:
    () => async (_c: unknown, next: () => Promise<void>) => {
      await next()
    },
}))

// app をモック後にインポート
const { app } = await import('../index')

// --- テストデータ ---

const draftArticle: DraftArticle = {
  id: 'art-1' as DraftArticle['id'],
  publicId: 'pub-1' as DraftArticle['publicId'],
  title: 'テスト記事' as DraftArticle['title'],
  bodyKey: 'body-1' as DraftArticle['bodyKey'],
  status: 'draft',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: null,
  scheduledAt: null,
}

const publishedArticle: PublishedArticle = {
  ...draftArticle,
  status: 'published',
  updatedAt: '2026-03-02T00:00:00.000Z',
  publishedAt: '2026-03-02T00:00:00.000Z',
} as PublishedArticle

// --- テスト ---

describe('GET /api/articles', () => {
  it('200: ページネーション付きで記事一覧をDTO配列で返す', async () => {
    mockListArticlesPaginated.mockResolvedValue({
      items: [draftArticle, publishedArticle],
      totalCount: 2,
    })

    const res = await app.request('/api/articles', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.items).toHaveLength(2)
    expect(data.totalCount).toBe(2)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(20)
    expect(data.totalPages).toBe(1)
    expect(data.items[0]).toEqual({
      publicId: 'pub-1',
      title: 'テスト記事',
      status: 'draft',
      tags: [],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    })
  })
})

describe('GET /api/public/articles', () => {
  it('200: search クエリがユースケースに渡る', async () => {
    mockListPublishedArticlesPaginated.mockClear()
    mockListPublishedArticlesPaginated.mockResolvedValue({
      items: [publishedArticle],
      totalCount: 1,
    })

    const res = await app.request(
      '/api/public/articles?search=Type',
      undefined,
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(200)
    expect(mockListPublishedArticlesPaginated).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ search: 'Type' }),
    )
  })

  it('search の前後空白はトリムされて渡る', async () => {
    mockListPublishedArticlesPaginated.mockClear()
    mockListPublishedArticlesPaginated.mockResolvedValue({
      items: [],
      totalCount: 0,
    })

    await app.request(
      '/api/public/articles?search=%20%20Type%20%20',
      undefined,
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(mockListPublishedArticlesPaginated).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ search: 'Type' }),
    )
  })

  it('search が空白のみの場合はユースケースに渡されない', async () => {
    mockListPublishedArticlesPaginated.mockClear()
    mockListPublishedArticlesPaginated.mockResolvedValue({
      items: [],
      totalCount: 0,
    })

    await app.request('/api/public/articles?search=%20%20', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(mockListPublishedArticlesPaginated).toHaveBeenCalledWith(
      expect.anything(),
      { page: 1, limit: 20 },
    )
  })
})

describe('GET /api/public/feed.xml', () => {
  it('200: RSS 2.0 フィードを application/rss+xml で返す', async () => {
    mockListPublishedArticles.mockClear()
    mockListPublishedArticles.mockResolvedValue([publishedArticle])

    const res = await app.request('/api/public/feed.xml', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/rss+xml')

    const body = await res.text()
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<title>テスト記事</title>')
    expect(body).toContain('/articles/pub-1</link>')
  })

  it('SITE_URL が設定されている場合は記事リンクに反映する', async () => {
    mockListPublishedArticles.mockClear()
    mockListPublishedArticles.mockResolvedValue([publishedArticle])

    const res = await app.request('/api/public/feed.xml', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
      SITE_URL: 'https://my-blog.example.com',
    })

    const body = await res.text()
    expect(body).toContain(
      '<link>https://my-blog.example.com/articles/pub-1</link>',
    )
  })

  it('SITE_URL 未設定時は既定の絶対 URL（http://localhost:5173）を使う', async () => {
    mockListPublishedArticles.mockClear()
    mockListPublishedArticles.mockResolvedValue([publishedArticle])

    const res = await app.request('/api/public/feed.xml', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    const body = await res.text()
    expect(body).toContain('<link>http://localhost:5173/articles/pub-1</link>')
  })

  it('最新 20 件に制限し、21 件目以降は含めない', async () => {
    mockListPublishedArticles.mockClear()
    // 公開日時降順に並んだ 25 件を返す（route 側で先頭 20 件に絞る想定）
    const articles = Array.from({ length: 25 }, (_, i) => ({
      ...publishedArticle,
      publicId: `pub-${i + 1}` as PublishedArticle['publicId'],
    }))
    mockListPublishedArticles.mockResolvedValue(articles)

    const res = await app.request('/api/public/feed.xml', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    const body = await res.text()
    const itemCount = (body.match(/<item>/g) ?? []).length
    expect(itemCount).toBe(20)
    expect(body).toContain('/articles/pub-1</link>')
    expect(body).toContain('/articles/pub-20</link>')
    expect(body).not.toContain('/articles/pub-21</link>')
  })
})

describe('GET /api/articles/:publicId', () => {
  it('200: 記事詳細をDTOで返す', async () => {
    mockGetArticle.mockResolvedValue({
      status: 'found',
      article: draftArticle,
      body: '# 本文',
    })

    const res = await app.request('/api/articles/pub-1', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({
      publicId: 'pub-1',
      title: 'テスト記事',
      status: 'draft',
      tags: [],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
      body: '# 本文',
    })
  })

  it('404: 記事が見つからない場合', async () => {
    mockGetArticle.mockResolvedValue({ status: 'not_found' })

    const res = await app.request('/api/articles/unknown', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data).toEqual({ error: '記事が見つかりません' })
  })

  it('404: 記事本文が見つからない場合', async () => {
    mockGetArticle.mockResolvedValue({ status: 'body_not_found' })

    const res = await app.request('/api/articles/pub-1', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data).toEqual({ error: '記事本文が見つかりません' })
  })
})

describe('POST /api/articles', () => {
  it('201: 記事が作成される', async () => {
    mockCreateArticle.mockResolvedValue({
      status: 'created',
      article: draftArticle,
    })

    const res = await app.request(
      '/api/articles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'テスト記事', body: '本文' }),
      },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.publicId).toBe('pub-1')
    expect(data.title).toBe('テスト記事')
  })

  it('400: ユースケースがvalidation_errorを返す場合', async () => {
    mockCreateArticle.mockResolvedValue({
      status: 'validation_error',
      message: 'タイトルは空にできません',
    })

    const res = await app.request(
      '/api/articles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ' ', body: '本文' }),
      },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toEqual({ error: 'タイトルは空にできません' })
  })

  it('400: Zodバリデーション — タイトルが空文字の場合', async () => {
    const res = await app.request(
      '/api/articles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', body: '本文' }),
      },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(400)
  })

  it('400: Zodバリデーション — タイトルが101文字の場合', async () => {
    const longTitle = 'あ'.repeat(101)

    const res = await app.request(
      '/api/articles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: longTitle, body: '本文' }),
      },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/articles/:publicId/publish', () => {
  it('200: 記事が公開される', async () => {
    mockPublishArticle.mockResolvedValue({
      status: 'published',
      article: publishedArticle,
    })

    const res = await app.request(
      '/api/articles/pub-1/publish',
      { method: 'PATCH' },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('published')
    expect(data.publishedAt).toBe('2026-03-02T00:00:00.000Z')
  })

  it('404: 記事が見つからない場合', async () => {
    mockPublishArticle.mockResolvedValue({ status: 'not_found' })

    const res = await app.request(
      '/api/articles/unknown/publish',
      { method: 'PATCH' },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data).toEqual({ error: '記事が見つかりません' })
  })

  it('400: すでに公開済みの場合', async () => {
    mockPublishArticle.mockResolvedValue({ status: 'already_published' })

    const res = await app.request(
      '/api/articles/pub-1/publish',
      { method: 'PATCH' },
      { DB: {}, ARTICLE_BUCKET: {} },
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toEqual({ error: 'すでに公開されています' })
  })
})
