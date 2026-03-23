import { HttpResponse, http } from 'msw'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

type MockArticle = {
  publicId: string
  title: string
  status: 'draft' | 'published' | 'scheduled'
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
}

/** モック用の記事データ（APIレスポンスのDTO構造に準拠） */
const mockArticles: MockArticle[] = [
  {
    publicId: 'abc123',
    title: 'はじめてのブログ記事',
    status: 'published',
    tags: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    publishedAt: '2026-03-01T12:00:00.000Z',
    scheduledAt: null,
  },
  {
    publicId: 'def456',
    title: '下書きの記事',
    status: 'draft',
    tags: [],
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  },
  {
    publicId: 'ghi789',
    title: 'Markdownで書く技術記事',
    status: 'draft',
    tags: [],
    createdAt: '2026-03-03T10:00:00.000Z',
    updatedAt: '2026-03-03T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  },
]

export const handlers = [
  http.get(`${baseUrl}/api/hello`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),

  /** 記事一覧の取得（ページネーション付き） */
  http.get(`${baseUrl}/api/articles`, ({ request }) => {
    const url = new URL(request.url)
    const rawPage = Number(url.searchParams.get('page') ?? '1')
    const rawLimit = Number(url.searchParams.get('limit') ?? '20')
    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= 100
        ? rawLimit
        : 20
    const start = (page - 1) * limit
    const items = mockArticles.slice(start, start + limit)
    return HttpResponse.json({
      items,
      totalCount: mockArticles.length,
      page,
      limit,
      totalPages: Math.ceil(mockArticles.length / limit),
    })
  }),

  /** 記事の作成（下書き） */
  http.post(`${baseUrl}/api/articles`, async ({ request }) => {
    const parsed: unknown = await request.json()
    const isValidBody = (v: unknown): v is { title: string; body: string } =>
      typeof v === 'object' &&
      v !== null &&
      'title' in v &&
      'body' in v &&
      typeof (v as Record<string, unknown>).title === 'string' &&
      typeof (v as Record<string, unknown>).body === 'string'
    if (!isValidBody(parsed)) {
      return HttpResponse.json(
        { message: 'title と body は必須です' },
        { status: 400 },
      )
    }
    const { title } = parsed
    const now = new Date().toISOString()
    const newArticle: MockArticle = {
      publicId: `mock-${Date.now()}`,
      title,
      status: 'draft',
      tags: [],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      scheduledAt: null,
    }
    mockArticles.push(newArticle)
    return HttpResponse.json(newArticle, { status: 201 })
  }),

  /** 単一記事の取得 */
  http.get(`${baseUrl}/api/articles/:publicId`, ({ params }) => {
    const article = mockArticles.find((a) => a.publicId === params.publicId)
    if (!article) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    return HttpResponse.json({
      ...article,
      body: `# ${article.title}\n\nこれはモック記事の本文です。`,
    })
  }),

  /** 記事の公開 */
  http.patch(`${baseUrl}/api/articles/:publicId/publish`, ({ params }) => {
    const article = mockArticles.find((a) => a.publicId === params.publicId)
    if (!article) {
      return HttpResponse.json(
        { message: '記事が見つかりません' },
        { status: 404 },
      )
    }
    if (article.status === 'published') {
      return HttpResponse.json(
        { message: 'この記事は既に公開されています' },
        { status: 400 },
      )
    }
    const now = new Date().toISOString()
    article.status = 'published'
    article.updatedAt = now
    article.publishedAt = now
    return HttpResponse.json(article)
  }),
]
