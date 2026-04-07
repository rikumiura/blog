import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { commentsApi } from './comments.api'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('commentsApi.listByArticle', () => {
  it('正常系: 公開記事のコメント一覧が返る', async () => {
    const result = await commentsApi.listByArticle('abc123')

    expect(Array.isArray(result)).toBe(true)
    for (const comment of result) {
      expect(typeof comment.id).toBe('string')
      expect(typeof comment.authorName).toBe('string')
      expect(typeof comment.content).toBe('string')
      expect(typeof comment.createdAt).toBe('string')
    }
  })

  it('存在しない記事の場合はthrowする', async () => {
    await expect(commentsApi.listByArticle('nonexistent')).rejects.toThrow(
      'コメント一覧の取得に失敗しました: 404',
    )
  })

  it('サーバーエラー時はthrowする', async () => {
    server.use(
      http.get(
        `${baseUrl}/api/public/articles/:publicId/comments`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    )

    await expect(commentsApi.listByArticle('abc123')).rejects.toThrow(
      'コメント一覧の取得に失敗しました: 500',
    )
  })
})

describe('commentsApi.post', () => {
  it('正常系: コメントが投稿されて返る', async () => {
    const result = await commentsApi.post('abc123', {
      authorName: '田中太郎',
      content: '参考になりました。',
    })

    expect(result.authorName).toBe('田中太郎')
    expect(result.content).toBe('参考になりました。')
    expect(typeof result.id).toBe('string')
    expect(typeof result.createdAt).toBe('string')
  })

  it('存在しない記事へのコメント投稿はthrowする', async () => {
    await expect(
      commentsApi.post('nonexistent', {
        authorName: '田中',
        content: '本文',
      }),
    ).rejects.toThrow('記事が見つかりません')
  })

  it('サーバーエラー時はthrowする', async () => {
    server.use(
      http.post(
        `${baseUrl}/api/public/articles/:publicId/comments`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    )

    await expect(
      commentsApi.post('abc123', { authorName: '田中', content: '本文' }),
    ).rejects.toThrow('コメントの投稿に失敗しました: 500')
  })
})

describe('commentsApi.deleteComment', () => {
  it('正常系: コメントが削除される', async () => {
    await expect(
      commentsApi.deleteComment('comment-1'),
    ).resolves.toBeUndefined()
  })

  it('サーバーエラー時はthrowする', async () => {
    server.use(
      http.delete(
        `${baseUrl}/api/comments/:id`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    )

    await expect(commentsApi.deleteComment('comment-1')).rejects.toThrow(
      'コメントの削除に失敗しました: 500',
    )
  })
})
