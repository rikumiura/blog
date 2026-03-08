import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { articleApi } from './articles.api'

const baseUrl = 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('articleApi.create', () => {
  it('正常系: 201で記事が返る', async () => {
    const article = await articleApi.create({
      title: 'テスト記事',
      body: '本文',
    })

    expect(article).toMatchObject({
      title: 'テスト記事',
      status: 'draft',
      publishedAt: null,
    })
    expect(article.publicId).toBeDefined()
  })

  it('400 + エラーメッセージ: サーバーのメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/articles`, () => {
        return HttpResponse.json(
          { error: 'タイトルは空にできません' },
          { status: 400 },
        )
      }),
    )

    await expect(
      articleApi.create({ title: '', body: '本文' }),
    ).rejects.toThrow('タイトルは空にできません')
  })

  it('400 + 不正なレスポンスボディ: フォールバックメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/articles`, () => {
        return new HttpResponse('not json', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    await expect(
      articleApi.create({ title: 'テスト', body: '本文' }),
    ).rejects.toThrow('記事の作成に失敗しました: 400')
  })

  it('500: フォールバックメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/articles`, () => {
        return new HttpResponse('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      }),
    )

    await expect(
      articleApi.create({ title: 'テスト', body: '本文' }),
    ).rejects.toThrow('記事の作成に失敗しました: 500')
  })
})
