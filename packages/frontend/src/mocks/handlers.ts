import { HttpResponse, http } from 'msw'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

export const handlers = [
  http.get(`${baseUrl}/api/hello`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),

  http.get(`${baseUrl}/api/posts`, () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'はじめての投稿',
        content: 'これはテスト投稿です。',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 2,
        title: '2番目の投稿',
        content: 'MSWによるモックデータです。',
        createdAt: '2026-03-01T01:00:00.000Z',
        updatedAt: '2026-03-01T01:00:00.000Z',
      },
    ])
  }),
]
