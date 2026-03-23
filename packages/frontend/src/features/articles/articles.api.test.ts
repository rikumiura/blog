import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { articleApi } from './articles.api'

const baseUrl = 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('articleApi.findAll', () => {
  it('正常系: ページネーション付きで記事一覧が返る', async () => {
    const result = await articleApi.findAll({ page: 1, limit: 20 })

    expect(result.items).toBeInstanceOf(Array)
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.totalCount).toBeDefined()
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.totalPages).toBeDefined()
  })

  it('パラメータなしでもデフォルト値で取得できる', async () => {
    const result = await articleApi.findAll()

    expect(result.items).toBeInstanceOf(Array)
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.get(`${baseUrl}/api/articles`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(articleApi.findAll()).rejects.toThrow(
      '記事一覧の取得に失敗しました: 500',
    )
  })
})

describe('articleApi.findByPublicId', () => {
  it('正常系: 記事詳細が返る', async () => {
    const result = await articleApi.findByPublicId('abc123')

    expect(result.publicId).toBe('abc123')
    expect(result.body).toBeDefined()
    expect(result.title).toBe('はじめてのブログ記事')
  })

  it('存在しない記事の場合throwする', async () => {
    await expect(articleApi.findByPublicId('nonexistent')).rejects.toThrow(
      '記事の取得に失敗しました: 404',
    )
  })
})

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

describe('articleApi.update', () => {
  it('正常系: 更新された記事詳細が返る', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId`, () => {
        return HttpResponse.json({
          publicId: 'abc123',
          title: '更新後タイトル',
          status: 'draft',
          tags: [],
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          publishedAt: null,
          scheduledAt: null,
          body: '更新後の本文',
        })
      }),
    )

    const result = await articleApi.update('abc123', {
      title: '更新後タイトル',
    })

    expect(result.title).toBe('更新後タイトル')
    expect(result.body).toBe('更新後の本文')
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId`, () => {
        return HttpResponse.json(
          { error: 'タイトルは空にできません' },
          { status: 400 },
        )
      }),
    )

    await expect(articleApi.update('abc123', { title: '' })).rejects.toThrow(
      'タイトルは空にできません',
    )
  })
})

describe('articleApi.publish', () => {
  it('正常系: 公開された記事が返る', async () => {
    const result = await articleApi.publish('def456')

    expect(result.status).toBe('published')
    expect(result.publishedAt).toBeDefined()
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/publish`, () => {
        return HttpResponse.json(
          { error: 'この記事は既に公開されています' },
          { status: 400 },
        )
      }),
    )

    await expect(articleApi.publish('abc123')).rejects.toThrow(
      'この記事は既に公開されています',
    )
  })
})

describe('articleApi.schedule', () => {
  it('正常系: 予約された記事が返る', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/schedule`, () => {
        return HttpResponse.json({
          publicId: 'def456',
          title: '下書きの記事',
          status: 'scheduled',
          tags: [],
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          publishedAt: null,
          scheduledAt: '2026-04-01T00:00:00.000Z',
        })
      }),
    )

    const result = await articleApi.schedule(
      'def456',
      '2026-04-01T00:00:00.000Z',
    )

    expect(result.status).toBe('scheduled')
    expect(result.scheduledAt).toBe('2026-04-01T00:00:00.000Z')
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/schedule`, () => {
        return HttpResponse.json(
          { error: '予約日時は現在より未来を指定してください' },
          { status: 400 },
        )
      }),
    )

    await expect(
      articleApi.schedule('def456', '2020-01-01T00:00:00.000Z'),
    ).rejects.toThrow('予約日時は現在より未来を指定してください')
  })
})

describe('articleApi.cancelSchedule', () => {
  it('正常系: 下書きに戻った記事が返る', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/cancel-schedule`, () => {
        return HttpResponse.json({
          publicId: 'def456',
          title: '下書きの記事',
          status: 'draft',
          tags: [],
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          publishedAt: null,
          scheduledAt: null,
        })
      }),
    )

    const result = await articleApi.cancelSchedule('def456')

    expect(result.status).toBe('draft')
    expect(result.scheduledAt).toBeNull()
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/cancel-schedule`, () => {
        return new HttpResponse(null, { status: 400 })
      }),
    )

    await expect(articleApi.cancelSchedule('def456')).rejects.toThrow(
      '予約の取消に失敗しました: 400',
    )
  })
})

describe('articleApi.delete', () => {
  it('正常系: エラーなく完了する', async () => {
    server.use(
      http.delete(`${baseUrl}/api/articles/:publicId`, () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(articleApi.delete('abc123')).resolves.toBeUndefined()
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.delete(`${baseUrl}/api/articles/:publicId`, () => {
        return new HttpResponse(null, { status: 404 })
      }),
    )

    await expect(articleApi.delete('nonexistent')).rejects.toThrow(
      '記事の削除に失敗しました: 404',
    )
  })
})

describe('articleApi.updateTags', () => {
  it('正常系: 更新されたタグ配列が返る', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/tags`, () => {
        return HttpResponse.json({ tags: ['TypeScript', 'React'] })
      }),
    )

    const result = await articleApi.updateTags('abc123', [
      'TypeScript',
      'React',
    ])

    expect(result).toEqual(['TypeScript', 'React'])
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.patch(`${baseUrl}/api/articles/:publicId/tags`, () => {
        return new HttpResponse(null, { status: 400 })
      }),
    )

    await expect(articleApi.updateTags('abc123', [''])).rejects.toThrow(
      'タグの更新に失敗しました: 400',
    )
  })
})
