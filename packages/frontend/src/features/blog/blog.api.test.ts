import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { blogApi } from '@/features/blog/blog.api'
import { server } from '@/mocks/server'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('blogApi.findAll', () => {
  it('正常系: ページネーション付きで公開記事一覧が返る', async () => {
    const result = await blogApi.findAll({ page: 1, limit: 20 })

    expect(result.items).toBeInstanceOf(Array)
    expect(result.totalCount).toBeDefined()
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.totalPages).toBeDefined()
    for (const item of result.items) {
      expect(item.status).toBe('published')
      expect(item.publishedAt).toBeDefined()
    }
  })

  it('パラメータなしでもデフォルト値で取得できる', async () => {
    const result = await blogApi.findAll()

    expect(result.items).toBeInstanceOf(Array)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('publishedAt が null の場合 updatedAt がフォールバックされる', async () => {
    server.use(
      http.get(`${baseUrl}/api/public/articles`, () => {
        return HttpResponse.json({
          items: [
            {
              publicId: 'fallback-test',
              title: 'フォールバックテスト',
              tags: [],
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T12:00:00.000Z',
              publishedAt: null,
            },
          ],
          totalCount: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      }),
    )

    const result = await blogApi.findAll()

    expect(result.items[0].publishedAt).toBe('2026-03-01T12:00:00.000Z')
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.get(`${baseUrl}/api/public/articles`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(blogApi.findAll()).rejects.toThrow(
      '記事一覧の取得に失敗しました: 500',
    )
  })
})

describe('blogApi.findByPublicId', () => {
  it('正常系: 記事詳細が返る（body を含む）', async () => {
    const result = await blogApi.findByPublicId('abc123')

    expect(result.publicId).toBe('abc123')
    expect(result.title).toBe('はじめてのブログ記事')
    expect(result.body).toBeDefined()
    expect(result.status).toBe('published')
    expect(result.publishedAt).toBeDefined()
  })

  it('存在しない記事の場合「記事が見つかりません」でthrowする', async () => {
    await expect(blogApi.findByPublicId('nonexistent')).rejects.toThrow(
      '記事が見つかりません',
    )
  })

  it('404以外のエラー時はステータスコード付きでthrowする', async () => {
    server.use(
      http.get(`${baseUrl}/api/public/articles/:publicId`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(blogApi.findByPublicId('abc123')).rejects.toThrow(
      '記事の取得に失敗しました: 500',
    )
  })
})
