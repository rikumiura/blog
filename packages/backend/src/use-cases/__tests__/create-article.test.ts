import { describe, expect, it, vi } from 'vitest'
import { BodyKey } from '../../domain/models/article'
import { createArticle } from '../create-article'
import {
  FakeArticleIdGenerator,
  InMemoryArticleRepository,
  InMemoryBodyStorage,
} from './in-memory-test-doubles'

describe('createArticle', () => {
  const FIXED_DATE = '2025-01-15T10:00:00.000Z'

  const setup = () => {
    const repository = new InMemoryArticleRepository()
    const bodyStorage = new InMemoryBodyStorage()
    const idGenerator = new FakeArticleIdGenerator(
      'article-1',
      'public-1',
      'body-key-1',
    )
    const now = () => FIXED_DATE
    return { repository, bodyStorage, idGenerator, now }
  }

  it('下書き記事が作成される', async () => {
    const deps = setup()

    const result = await createArticle(
      { title: 'テスト記事', body: '本文です' },
      deps,
    )

    expect(result).toEqual({
      status: 'created',
      article: {
        id: 'article-1',
        publicId: 'public-1',
        title: 'テスト記事',
        bodyKey: 'body-key-1',
        status: 'draft',
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        publishedAt: null,
      },
    })
  })

  it('記事がリポジトリに保存される', async () => {
    const deps = setup()

    await createArticle({ title: 'テスト記事', body: '本文' }, deps)

    const saved = await deps.repository.findAll()
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'テスト記事' }),
      ]),
    )
  })

  it('本文がストレージに保存される', async () => {
    const deps = setup()

    await createArticle({ title: 'テスト記事', body: '本文です' }, deps)

    const result = await deps.bodyStorage.get(BodyKey('body-key-1'))
    expect(result).toEqual({ found: true, content: '本文です' })
  })

  it('タイトルが空の場合バリデーションエラーが返る', async () => {
    const deps = setup()

    const result = await createArticle({ title: '', body: '本文' }, deps)

    expect(result).toEqual({
      status: 'validation_error',
      message: 'タイトルは空にできません',
    })
  })

  it('リポジトリ保存失敗時にストレージの本文が削除される', async () => {
    const deps = setup()
    deps.repository.simulateSaveError()

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps),
    ).rejects.toThrow('リポジトリ保存エラー')

    expect(deps.bodyStorage.has(BodyKey('body-key-1'))).toBe(false)
  })

  it('補償処理の削除も失敗した場合、元のエラーがスローされ補償失敗がログ出力される', async () => {
    const deps = setup()
    deps.repository.simulateSaveError()
    deps.bodyStorage.simulateDeleteError()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps),
    ).rejects.toThrow('リポジトリ保存エラー')

    expect(consoleSpy).toHaveBeenCalledWith(
      '補償処理失敗: R2ファイル body-key-1 の削除に失敗しました',
    )
    consoleSpy.mockRestore()
  })
})
