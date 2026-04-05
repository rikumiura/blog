import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { toAbsoluteImageUrl, uploadImage } from './image.api'

const baseUrl = 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('uploadImage', () => {
  it('正常系: key と url が返る', async () => {
    server.use(
      http.post(`${baseUrl}/api/images`, () => {
        return HttpResponse.json(
          { key: 'abc123.png', url: '/api/public/images/abc123.png' },
          { status: 201 },
        )
      }),
    )

    const file = new File(['data'], 'test.png', { type: 'image/png' })
    const result = await uploadImage(file)

    expect(result.key).toBe('abc123.png')
    expect(result.url).toBe('/api/public/images/abc123.png')
  })

  it('サポート外の形式でサーバーが 400 を返したらエラーをスローする', async () => {
    server.use(
      http.post(`${baseUrl}/api/images`, () => {
        return HttpResponse.json(
          {
            error:
              'サポートされていないファイル形式です。JPEG / PNG / GIF / WebP のみ使用できます',
          },
          { status: 400 },
        )
      }),
    )

    const file = new File(['data'], 'test.txt', { type: 'text/plain' })
    await expect(uploadImage(file)).rejects.toThrow(
      'サポートされていないファイル形式です',
    )
  })

  it('サーバーエラー時はデフォルトメッセージでスローする', async () => {
    server.use(
      http.post(`${baseUrl}/api/images`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const file = new File(['data'], 'test.png', { type: 'image/png' })
    await expect(uploadImage(file)).rejects.toThrow(
      '画像のアップロードに失敗しました: 500',
    )
  })
})

describe('toAbsoluteImageUrl', () => {
  it('相対パスにベース URL を付与する', () => {
    const url = toAbsoluteImageUrl('/api/public/images/abc123.png')
    expect(url).toBe(`${baseUrl}/api/public/images/abc123.png`)
  })

  it('http から始まる URL はそのまま返す', () => {
    const url = toAbsoluteImageUrl('https://example.com/image.png')
    expect(url).toBe('https://example.com/image.png')
  })
})
