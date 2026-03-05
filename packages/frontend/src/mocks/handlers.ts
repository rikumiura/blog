import { HttpResponse, http } from 'msw'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

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

  http.get(`${baseUrl}/api/articles`, () => {
    return HttpResponse.json([
      {
        id: '019577a0-0000-7000-8000-000000000001',
        publicId: 'abc123def456',
        title: 'テスト記事',
        bodyKey: '019577a0-0000-7000-8000-000000000001.md',
        status: 'draft',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        publishedAt: null,
      },
      {
        id: '019577a0-0000-7000-8000-000000000002',
        publicId: 'xyz789ghi012',
        title: '公開済み記事',
        bodyKey: '019577a0-0000-7000-8000-000000000002.md',
        status: 'published',
        createdAt: '2026-03-01T01:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
        publishedAt: '2026-03-02T00:00:00.000Z',
      },
    ])
  }),

  http.post(`${baseUrl}/api/articles`, async ({ request }) => {
    const body = (await request.json()) as { title: string; body: string }
    return HttpResponse.json(
      {
        id: '019577a0-0000-7000-8000-000000000003',
        publicId: 'new123article',
        title: body.title,
        bodyKey: '019577a0-0000-7000-8000-000000000003.md',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
      },
      { status: 201 },
    )
  }),
]
