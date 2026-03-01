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
]
