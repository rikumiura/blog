import { describe, expect, it, vi } from 'vitest'
import type {
  DraftArticle,
  PublishedArticle,
  ScheduledArticle,
} from '../domain/models/article'
import type { Tag } from '../domain/models/tag'
import type { PaginatedResult } from '../domain/ports/article-repository'
import {
  ArticleDetailContract,
  ArticleSummaryContract,
  ErrorResponseContract,
  PaginatedArticlesContract,
  TagsResponseContract,
} from '../presentation/contracts/article-contracts'
import type { CancelScheduleResult } from '../use-cases/cancel-schedule'
import type { CreateArticleResult } from '../use-cases/create-article'
import type { DeleteArticleResult } from '../use-cases/delete-article'
import type { GetArticleResult } from '../use-cases/get-article'
import type { PublishArticleResult } from '../use-cases/publish-article'
import type { ScheduleArticleResult } from '../use-cases/schedule-article'
import type { UpdateArticleResult } from '../use-cases/update-article'
import type { UpdateArticleTagsResult } from '../use-cases/update-article-tags'

// --- モック定義 ---

const mockCreateArticle = vi.fn<() => Promise<CreateArticleResult>>()
const mockGetArticle = vi.fn<() => Promise<GetArticleResult>>()
const mockListArticlesPaginated =
  vi.fn<() => Promise<PaginatedResult<DraftArticle | PublishedArticle>>>()
const mockListPublishedArticlesPaginated =
  vi.fn<() => Promise<PaginatedResult<PublishedArticle>>>()
const mockPublishArticle = vi.fn<() => Promise<PublishArticleResult>>()
const mockScheduleArticle = vi.fn<() => Promise<ScheduleArticleResult>>()
const mockCancelSchedule = vi.fn<() => Promise<CancelScheduleResult>>()
const mockDeleteArticle = vi.fn<() => Promise<DeleteArticleResult>>()
const mockUpdateArticle = vi.fn<() => Promise<UpdateArticleResult>>()
const mockUpdateArticleTags = vi.fn<() => Promise<UpdateArticleTagsResult>>()

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
}))
vi.mock('../use-cases/publish-article', () => ({
  publishArticle: (...args: unknown[]) => mockPublishArticle(...args),
}))
vi.mock('../use-cases/schedule-article', () => ({
  scheduleArticle: (...args: unknown[]) => mockScheduleArticle(...args),
}))
vi.mock('../use-cases/cancel-schedule', () => ({
  cancelSchedule: (...args: unknown[]) => mockCancelSchedule(...args),
}))
vi.mock('../use-cases/delete-article', () => ({
  deleteArticle: (...args: unknown[]) => mockDeleteArticle(...args),
}))
vi.mock('../use-cases/update-article', () => ({
  updateArticle: (...args: unknown[]) => mockUpdateArticle(...args),
}))
vi.mock('../use-cases/update-article-tags', () => ({
  updateArticleTags: (...args: unknown[]) => mockUpdateArticleTags(...args),
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
  ArticleIdGeneratorImpl: class {
    generateTagId() {
      return 'tag-gen-1'
    }
  },
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

const { app } = await import('../index')

// --- テストデータ ---

const env = { DB: {}, ARTICLE_BUCKET: {} }

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
  id: 'art-2' as PublishedArticle['id'],
  publicId: 'pub-2' as PublishedArticle['publicId'],
  title: '公開記事' as PublishedArticle['title'],
  bodyKey: 'body-2' as PublishedArticle['bodyKey'],
  status: 'published',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z',
  publishedAt: '2026-03-02T00:00:00.000Z',
  scheduledAt: null,
} as PublishedArticle

const scheduledArticle: ScheduledArticle = {
  id: 'art-3' as ScheduledArticle['id'],
  publicId: 'pub-3' as ScheduledArticle['publicId'],
  title: '予約記事' as ScheduledArticle['title'],
  bodyKey: 'body-3' as ScheduledArticle['bodyKey'],
  status: 'scheduled',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: null,
  scheduledAt: '2026-04-01T00:00:00.000Z',
} as ScheduledArticle

const sampleTags: Tag[] = [
  { id: 'tag-1' as Tag['id'], name: 'TypeScript' as Tag['name'] },
  { id: 'tag-2' as Tag['id'], name: 'Hono' as Tag['name'] },
]

// --- ヘルパー ---

function parseContract<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean
      error?: unknown
      data?: T
    }
  },
  data: unknown,
) {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `コントラクト違反: ${JSON.stringify(result.error, null, 2)}`,
    )
  }
  return result.data as T
}

// --- コントラクトテスト ---

describe('API コントラクトテスト', () => {
  // ===== POST /api/articles =====

  describe('POST /api/articles', () => {
    it('201: レスポンスが ArticleSummaryContract に準拠する', async () => {
      mockCreateArticle.mockResolvedValue({
        status: 'created',
        article: draftArticle,
        tags: [],
      })

      const res = await app.request(
        '/api/articles',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'テスト記事', body: '本文' }),
        },
        env,
      )

      expect(res.status).toBe(201)
      const data = await res.json()
      parseContract(ArticleSummaryContract, data)
    })

    it('400: エラーレスポンスが ErrorResponseContract に準拠する', async () => {
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
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== GET /api/articles =====

  describe('GET /api/articles', () => {
    it('200: レスポンスが PaginatedArticlesContract に準拠する', async () => {
      mockListArticlesPaginated.mockResolvedValue({
        items: [draftArticle, publishedArticle],
        totalCount: 2,
      })

      const res = await app.request('/api/articles', undefined, env)

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(PaginatedArticlesContract, data)
    })

    it('200: 空一覧でも PaginatedArticlesContract に準拠する', async () => {
      mockListArticlesPaginated.mockResolvedValue({
        items: [],
        totalCount: 0,
      })

      const res = await app.request('/api/articles', undefined, env)

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(PaginatedArticlesContract, data)
    })
  })

  // ===== GET /api/articles/:publicId =====

  describe('GET /api/articles/:publicId', () => {
    it('200: レスポンスが ArticleDetailContract に準拠する', async () => {
      mockGetArticle.mockResolvedValue({
        status: 'found',
        article: draftArticle,
        body: '# テスト本文\n\nこれはテストです。',
      })

      const res = await app.request('/api/articles/pub-1', undefined, env)

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(ArticleDetailContract, data)
    })

    it('404: not_found が ErrorResponseContract に準拠する', async () => {
      mockGetArticle.mockResolvedValue({ status: 'not_found' })

      const res = await app.request('/api/articles/unknown', undefined, env)

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('404: body_not_found が ErrorResponseContract に準拠する', async () => {
      mockGetArticle.mockResolvedValue({ status: 'body_not_found' })

      const res = await app.request('/api/articles/pub-1', undefined, env)

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== PATCH /api/articles/:publicId =====

  describe('PATCH /api/articles/:publicId', () => {
    it('200: レスポンスが ArticleDetailContract に準拠する', async () => {
      mockUpdateArticle.mockResolvedValue({
        status: 'updated',
        article: draftArticle,
        body: '更新された本文',
        tags: sampleTags,
      })

      const res = await app.request(
        '/api/articles/pub-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '更新タイトル' }),
        },
        env,
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(ArticleDetailContract, data)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockUpdateArticle.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '更新' }),
        },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('400: validation_error が ErrorResponseContract に準拠する', async () => {
      mockUpdateArticle.mockResolvedValue({
        status: 'validation_error',
        message: 'タイトルは空にできません',
      })

      const res = await app.request(
        '/api/articles/pub-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '更新' }),
        },
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== PATCH /api/articles/:publicId/publish =====

  describe('PATCH /api/articles/:publicId/publish', () => {
    it('200: レスポンスが ArticleSummaryContract に準拠する', async () => {
      mockPublishArticle.mockResolvedValue({
        status: 'published',
        article: publishedArticle,
      })

      const res = await app.request(
        '/api/articles/pub-2/publish',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(ArticleSummaryContract, data)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockPublishArticle.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown/publish',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('400: already_published が ErrorResponseContract に準拠する', async () => {
      mockPublishArticle.mockResolvedValue({ status: 'already_published' })

      const res = await app.request(
        '/api/articles/pub-2/publish',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== PATCH /api/articles/:publicId/schedule =====

  describe('PATCH /api/articles/:publicId/schedule', () => {
    it('200: レスポンスが ArticleSummaryContract に準拠する', async () => {
      mockScheduleArticle.mockResolvedValue({
        status: 'scheduled',
        article: scheduledArticle,
      })

      const res = await app.request(
        '/api/articles/pub-3/schedule',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: '2026-04-01T00:00:00.000Z',
          }),
        },
        env,
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(ArticleSummaryContract, data)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockScheduleArticle.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown/schedule',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: '2026-04-01T00:00:00.000Z',
          }),
        },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('400: not_draft が ErrorResponseContract に準拠する', async () => {
      mockScheduleArticle.mockResolvedValue({ status: 'not_draft' })

      const res = await app.request(
        '/api/articles/pub-3/schedule',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledAt: '2026-04-01T00:00:00.000Z',
          }),
        },
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== PATCH /api/articles/:publicId/cancel-schedule =====

  describe('PATCH /api/articles/:publicId/cancel-schedule', () => {
    it('200: レスポンスが ArticleSummaryContract に準拠する', async () => {
      mockCancelSchedule.mockResolvedValue({
        status: 'cancelled',
        article: draftArticle,
      })

      const res = await app.request(
        '/api/articles/pub-1/cancel-schedule',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(ArticleSummaryContract, data)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockCancelSchedule.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown/cancel-schedule',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('400: not_scheduled が ErrorResponseContract に準拠する', async () => {
      mockCancelSchedule.mockResolvedValue({ status: 'not_scheduled' })

      const res = await app.request(
        '/api/articles/pub-1/cancel-schedule',
        { method: 'PATCH' },
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== PATCH /api/articles/:publicId/tags =====

  describe('PATCH /api/articles/:publicId/tags', () => {
    it('200: レスポンスが TagsResponseContract に準拠する', async () => {
      mockUpdateArticleTags.mockResolvedValue({
        status: 'updated',
        tags: sampleTags,
      })

      const res = await app.request(
        '/api/articles/pub-1/tags',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: ['TypeScript', 'Hono'] }),
        },
        env,
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(TagsResponseContract, data)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockUpdateArticleTags.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown/tags',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: ['TypeScript'] }),
        },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })

    it('400: validation_error が ErrorResponseContract に準拠する', async () => {
      mockUpdateArticleTags.mockResolvedValue({
        status: 'validation_error',
        message: 'タグは10個以内にしてください',
      })

      const res = await app.request(
        '/api/articles/pub-1/tags',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: ['TypeScript'] }),
        },
        env,
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== DELETE /api/articles/:publicId =====

  describe('DELETE /api/articles/:publicId', () => {
    it('204: 空レスポンスを返す', async () => {
      mockDeleteArticle.mockResolvedValue({ status: 'deleted' })

      const res = await app.request(
        '/api/articles/pub-1',
        { method: 'DELETE' },
        env,
      )

      expect(res.status).toBe(204)
    })

    it('404: エラーが ErrorResponseContract に準拠する', async () => {
      mockDeleteArticle.mockResolvedValue({ status: 'not_found' })

      const res = await app.request(
        '/api/articles/unknown',
        { method: 'DELETE' },
        env,
      )

      expect(res.status).toBe(404)
      const data = await res.json()
      parseContract(ErrorResponseContract, data)
    })
  })

  // ===== GET /api/public/articles =====

  describe('GET /api/public/articles', () => {
    it('200: レスポンスが PaginatedArticlesContract に準拠する', async () => {
      mockListPublishedArticlesPaginated.mockResolvedValue({
        items: [publishedArticle],
        totalCount: 1,
      })

      const res = await app.request('/api/public/articles', undefined, env)

      expect(res.status).toBe(200)
      const data = await res.json()
      parseContract(PaginatedArticlesContract, data)
    })
  })

  // ===== GET /api/public/articles/:publicId =====
  // 注: このルートは直接 repository を使うため、モックの構成が異なる
  // 既存の routes.test.ts と同様、ここでは他エンドポイントのコントラクトに集中する

  // ===== Zod バリデーションエラー（リクエスト不正） =====

  describe('Zod バリデーションエラー', () => {
    it('POST /api/articles — body が欠けている場合は 400 を返す', async () => {
      const res = await app.request(
        '/api/articles',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        env,
      )

      expect(res.status).toBe(400)
    })

    it('PATCH /api/articles/:publicId/schedule — scheduledAt が不正な形式の場合は 400 を返す', async () => {
      const res = await app.request(
        '/api/articles/pub-1/schedule',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: 'not-a-date' }),
        },
        env,
      )

      expect(res.status).toBe(400)
    })

    it('PATCH /api/articles/:publicId — 更新フィールドが0個の場合は 400 を返す', async () => {
      const res = await app.request(
        '/api/articles/pub-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        env,
      )

      expect(res.status).toBe(400)
    })
  })
})
