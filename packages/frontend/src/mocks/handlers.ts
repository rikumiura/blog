import { HttpResponse, http } from 'msw'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

type MockArticle = {
  publicId: string
  title: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/** モック用の記事データ（APIレスポンスのDTO構造に準拠） */
const mockArticles: MockArticle[] = [
  {
    publicId: 'abc123',
    title: 'はじめてのブログ記事',
    status: 'published',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    publishedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    publicId: 'def456',
    title: '下書きの記事',
    status: 'draft',
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    publishedAt: null,
  },
  {
    publicId: 'ghi789',
    title: 'Markdownで書く技術記事',
    status: 'draft',
    createdAt: '2026-03-03T10:00:00.000Z',
    updatedAt: '2026-03-03T10:00:00.000Z',
    publishedAt: null,
  },
]

export const handlers = [
  http.get(`${baseUrl}/api/hello`, () => {
    return HttpResponse.json({ message: 'Hello from MSW!' })
  }),

  http.get(`${baseUrl}/api/companies`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: '株式会社サンプル',
        address: '東京都渋谷区1-1-1',
        phone: '03-1234-5678',
        postalCode: '150-0001',
        contactPerson: '山田太郎',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'テスト合同会社',
        address: '大阪府大阪市北区2-2-2',
        phone: '06-9876-5432',
        postalCode: '530-0001',
        contactPerson: '佐藤花子',
        createdAt: '2026-03-01T01:00:00.000Z',
        updatedAt: '2026-03-01T01:00:00.000Z',
      },
    ])
  }),

  /** 記事一覧の取得 */
  http.get(`${baseUrl}/api/articles`, () => {
    return HttpResponse.json(mockArticles)
  }),

  /** 記事の作成（下書き） */
  http.post(`${baseUrl}/api/articles`, async ({ request }) => {
    const body = (await request.json()) as { title: string; body: string }
    const now = new Date().toISOString()
    const newArticle = {
      publicId: `mock-${Date.now()}`,
      title: body.title,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
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
    if (article.status !== 'draft') {
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
