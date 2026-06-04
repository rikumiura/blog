import { createStore } from 'jotai'
import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import {
  blogCurrentPageAtom,
  blogSearchQueryAtom,
  searchBlogArticlesAtom,
} from './blog.atom'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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
