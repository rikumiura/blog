import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { tagsApi } from './tags.api'

const baseUrl = 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('tagsApi.listAll', () => {
  it('正常系: 全タグ一覧が返る', async () => {
    server.use(
      http.get(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json({
          tags: [
            { id: 'tag-1', name: 'React' },
            { id: 'tag-2', name: 'TypeScript' },
          ],
        })
      }),
    )

    const result = await tagsApi.listAll()

    expect(result).toEqual([
      { id: 'tag-1', name: 'React' },
      { id: 'tag-2', name: 'TypeScript' },
    ])
  })

  it('エラー時にthrowする', async () => {
    server.use(
      http.get(`${baseUrl}/api/tags`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(tagsApi.listAll()).rejects.toThrow(
      'タグ一覧の取得に失敗しました: 500',
    )
  })
})

describe('tagsApi.delete', () => {
  it('正常系: 204で正常終了する', async () => {
    server.use(
      http.delete(`${baseUrl}/api/tags/:id`, () => {
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(tagsApi.delete('tag-1')).resolves.toBeUndefined()
  })

  it('404の場合: エラーメッセージ付きでthrowする', async () => {
    server.use(
      http.delete(`${baseUrl}/api/tags/:id`, () => {
        return HttpResponse.json(
          { error: 'タグが見つかりません' },
          { status: 404 },
        )
      }),
    )

    await expect(tagsApi.delete('missing')).rejects.toThrow(
      'タグが見つかりません',
    )
  })

  it('500の場合: フォールバックメッセージでthrowする', async () => {
    server.use(
      http.delete(`${baseUrl}/api/tags/:id`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(tagsApi.delete('tag-1')).rejects.toThrow(
      'タグの削除に失敗しました: 500',
    )
  })
})
