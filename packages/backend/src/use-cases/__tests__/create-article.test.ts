import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BodyKey } from '../../domain/models/article'
import { createArticle } from '../create-article'
import {
  FakeArticleIdGenerator,
  InMemoryArticleRepository,
  InMemoryBodyStorage,
} from './in-memory-test-doubles'

describe('createArticle', () => {
  const FIXED_DATE = '2025-01-15T10:00:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_DATE))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = () => {
    const repository = new InMemoryArticleRepository()
    const bodyStorage = new InMemoryBodyStorage()
    const idGenerator = new FakeArticleIdGenerator(
      'article-1',
      'public-1',
      'body-key-1',
    )
    return { repository, bodyStorage, idGenerator }
  }

  it('下書き記事が作成される', async () => {
    const deps = setup()

    const result = await createArticle(
      { title: 'テスト記事', body: '本文です' },
      deps,
    )

    expect(result).toEqual({
      id: 'article-1',
      publicId: 'public-1',
      title: 'テスト記事',
      bodyKey: 'body-key-1',
      status: 'draft',
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
      publishedAt: null,
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

  it('タイトルが空の場合エラー', async () => {
    const deps = setup()

    await expect(
      createArticle({ title: '', body: '本文' }, deps),
    ).rejects.toThrow('タイトルは空にできません')
  })

  it('リポジトリ保存失敗時にストレージの本文が削除される', async () => {
    const deps = setup()
    deps.repository.simulateSaveError()

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps),
    ).rejects.toThrow('リポジトリ保存エラー')

    expect(deps.bodyStorage.has(BodyKey('body-key-1'))).toBe(false)
  })

  it('補償処理の削除も失敗した場合でもエラーがスローされる', async () => {
    const deps = setup()
    deps.repository.simulateSaveError()
    deps.bodyStorage.simulateDeleteError()

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps),
    ).rejects.toThrow('リポジトリ保存エラー')
  })
})
