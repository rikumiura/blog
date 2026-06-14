import { createStore } from 'jotai'
import { HttpResponse, http } from 'msw'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { BlogRepository } from '@/core/ports/blog-repository'
import type { PublishedArticle } from '@/core/types/article'
import { server } from '@/mocks/server'
import {
  blogArticlesAtom,
  blogCurrentPageAtom,
  blogRepositoryAtom,
  blogSearchQueryAtom,
  fetchBlogArticlesAtom,
  searchBlogArticlesAtom,
} from './blog.atom'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('blogRepositoryAtom — 依存注入', () => {
  it('注入したモックリポジトリ経由で公開記事一覧を取得する', async () => {
    const article: PublishedArticle = {
      publicId: 'pub-1',
      title: 'DI テスト記事',
      tags: ['React'],
      status: 'published',
      publishedAt: '2026-01-01T00:00:00.000Z',
      scheduledAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const mockRepository: BlogRepository = {
      findAll: vi.fn().mockResolvedValue({
        items: [article],
        totalCount: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
      findByPublicId: vi.fn(),
    }
    const store = createStore()
    store.set(blogRepositoryAtom, mockRepository)

    await store.set(fetchBlogArticlesAtom)

    expect(mockRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 })
    expect(store.get(blogArticlesAtom)).toEqual([article])
  })
})

describe('searchBlogArticlesAtom', () => {
  it('キーワードを保存し、ページを1にリセットして再フェッチする', async () => {
    const store = createStore()
    store.set(blogCurrentPageAtom, 3)

    await store.set(searchBlogArticlesAtom, 'TypeScript')

    expect(store.get(blogSearchQueryAtom)).toBe('TypeScript')
    expect(store.get(blogCurrentPageAtom)).toBe(1)
  })

  it('確定した検索キーワードが API のクエリに渡る', async () => {
    let capturedSearch: string | null = null
    server.use(
      http.get(`${baseUrl}/api/public/articles`, ({ request }) => {
        capturedSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json({
          items: [],
          totalCount: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      }),
    )
    const store = createStore()

    await store.set(searchBlogArticlesAtom, 'Rust')

    expect(capturedSearch).toBe('Rust')
  })
})
