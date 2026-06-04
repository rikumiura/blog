import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { BlogArticleList } from './BlogArticleList'

const baseUrl = 'http://localhost:8787'

function renderList() {
  return render(
    <MemoryRouter>
      <BlogArticleList />
    </MemoryRouter>,
  )
}

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

describe('BlogArticleList — 件数表示', () => {
  it('総件数を「全N件」として表示する', async () => {
    server.use(
      http.get(`${baseUrl}/api/public/articles`, () => {
        return HttpResponse.json({
          items: [
            {
              publicId: 'pub-1',
              title: 'はじめての記事',
              tags: [],
              status: 'published',
              publishedAt: '2026-01-01T00:00:00.000Z',
              scheduledAt: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          totalCount: 42,
          page: 1,
          limit: 20,
          totalPages: 3,
        })
      }),
    )

    renderList()

    await waitFor(() => {
      expect(screen.getByText('全42件')).toBeInTheDocument()
    })
    expect(screen.getByText('はじめての記事')).toBeInTheDocument()
  })

  it('記事が0件のときは件数を表示しない', async () => {
    server.use(
      http.get(`${baseUrl}/api/public/articles`, () => {
        return HttpResponse.json({
          items: [],
          totalCount: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      }),
    )

    renderList()

    await waitFor(() => {
      expect(screen.getByText('まだ記事がありません')).toBeInTheDocument()
    })
    expect(screen.queryByText('全0件')).not.toBeInTheDocument()
  })
})
