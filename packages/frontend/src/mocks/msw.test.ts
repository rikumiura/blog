import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from './server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MSW', () => {
  it('デフォルトのハンドラーでAPIレスポンスをモックできる', async () => {
    const res = await fetch('http://localhost:8787/api/hello')
    const data = await res.json()

    expect(data).toEqual({ message: 'Hello from MSW!' })
  })

  it('テストごとにハンドラーを上書きできる', async () => {
    server.use(
      http.get('http://localhost:8787/api/hello', () => {
        return HttpResponse.json({ message: 'Overridden!' })
      }),
    )

    const res = await fetch('http://localhost:8787/api/hello')
    const data = await res.json()

    expect(data).toEqual({ message: 'Overridden!' })
  })
})
