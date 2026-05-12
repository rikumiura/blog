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

describe('tagsApi.create', () => {
  it('正常系: 作成されたタグを返す', async () => {
    server.use(
      http.post(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json(
          { id: 'tag-new', name: 'React' },
          { status: 201 },
        )
      }),
    )

    const result = await tagsApi.create('React')

    expect(result).toEqual({ id: 'tag-new', name: 'React' })
  })

  it('409の場合: 重複エラーメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json(
          { error: '同名のタグが既に存在します' },
          { status: 409 },
        )
      }),
    )

    await expect(tagsApi.create('React')).rejects.toThrow(
      '同名のタグが既に存在します',
    )
  })

  it('400の場合: バリデーションエラーメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/tags`, () => {
        return HttpResponse.json(
          { error: 'タグ名は空にできません' },
          { status: 400 },
        )
      }),
    )

    await expect(tagsApi.create('')).rejects.toThrow('タグ名は空にできません')
  })

  it('500の場合: フォールバックメッセージでthrowする', async () => {
    server.use(
      http.post(`${baseUrl}/api/tags`, () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    await expect(tagsApi.create('React')).rejects.toThrow(
      'タグの作成に失敗しました: 500',
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
