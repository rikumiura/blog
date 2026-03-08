import { describe, expect, it, vi } from 'vitest'
import type { DraftArticle, PublishedArticle } from '../domain/models/article'
import type { CreateArticleResult } from '../use-cases/create-article'
import type { GetArticleResult } from '../use-cases/get-article'
import type { PublishArticleResult } from '../use-cases/publish-article'

// --- モック定義 ---

const mockCreateArticle = vi.fn<() => Promise<CreateArticleResult>>()
const mockGetArticle = vi.fn<() => Promise<GetArticleResult>>()
const mockListArticles = vi.fn<() => Promise<(DraftArticle | PublishedArticle)[]>>()
const mockPublishArticle = vi.fn<() => Promise<PublishArticleResult>>()

vi.mock('../use-cases/create-article', () => ({
  createArticle: (...args: unknown[]) => mockCreateArticle(...args),
}))

vi.mock('../use-cases/get-article', () => ({
  getArticle: (...args: unknown[]) => mockGetArticle(...args),
}))

vi.mock('../use-cases/list-articles', () => ({
  listArticles: (...args: unknown[]) => mockListArticles(...args),
}))

vi.mock('../use-cases/publish-article', () => ({
  publishArticle: (...args: unknown[]) => mockPublishArticle(...args),
}))

vi.mock('../infrastructure/database', () => ({
  createDbClient: () => ({}),
}))

vi.mock('../infrastructure/repositories/drizzle-article-repository', () => ({
  DrizzleArticleRepository: vi.fn(),
}))

vi.mock('../infrastructure/repositories/drizzle-company-repository', () => ({
  DrizzleCompanyRepository: vi.fn(),
}))

vi.mock('../infrastructure/storage/r2-body-storage', () => ({
  R2BodyStorage: vi.fn(),
}))

vi.mock('../infrastructure/id/article-id-generator-impl', () => ({
  ArticleIdGeneratorImpl: vi.fn(),
}))

// app をモック後にインポート
const { default: app } = await import('../index')

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
}

const publishedArticle: PublishedArticle = {
  ...draftArticle,
  status: 'published',
  updatedAt: '2026-03-02T00:00:00.000Z',
  publishedAt: '2026-03-02T00:00:00.000Z',
} as PublishedArticle

// --- テスト ---

describe('GET /api/articles', () => {
  it('200: 記事一覧をDTO配列で返す', async () => {
    mockListArticles.mockResolvedValue([draftArticle, publishedArticle])

    const res = await app.request('/api/articles', undefined, {
      DB: {},
      ARTICLE_BUCKET: {},
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0]).toEqual({
      publicId: 'pub-1',
      title: 'テスト記事',
      status: 'draft',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: null,
    })
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
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: null,
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
