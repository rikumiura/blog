import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BodyKey } from '../../domain/models/article'
import { createArticle } from '../create-article'
import {
  FakeArticleIdGenerator,
  InMemoryArticleRepository,
  InMemoryBodyStorage,
} from './fakes'

describe('createArticle', () => {
  let repository: InMemoryArticleRepository
  let bodyStorage: InMemoryBodyStorage
  let idGenerator: FakeArticleIdGenerator

  const FIXED_DATE = '2025-01-15T10:00:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_DATE))

    repository = new InMemoryArticleRepository()
    bodyStorage = new InMemoryBodyStorage()
    idGenerator = new FakeArticleIdGenerator(
      'article-1',
      'public-1',
      'body-key-1',
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const deps = () => ({ repository, bodyStorage, idGenerator })

  it('下書き記事が作成される', async () => {
    const result = await createArticle(
      { title: 'テスト記事', body: '本文です' },
      deps(),
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
    await createArticle({ title: 'テスト記事', body: '本文' }, deps())

    const saved = await repository.findAll()
    expect(saved).toHaveLength(1)
    expect(saved[0]?.title).toBe('テスト記事')
  })

  it('本文がストレージに保存される', async () => {
    await createArticle({ title: 'テスト記事', body: '本文です' }, deps())

    const body = await bodyStorage.get('body-key-1' as BodyKey)
    expect(body).toBe('本文です')
  })

  it('タイトルが空の場合エラー', async () => {
    await expect(
      createArticle({ title: '', body: '本文' }, deps()),
    ).rejects.toThrow('タイトルは空にできません')
  })

  it('リポジトリ保存失敗時にストレージの本文が削除される', async () => {
    repository.simulateSaveError()

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps()),
    ).rejects.toThrow('リポジトリ保存エラー')

    expect(bodyStorage.has('body-key-1' as BodyKey)).toBe(false)
  })

  it('補償処理の削除も失敗した場合でもエラーがスローされる', async () => {
    repository.simulateSaveError()
    bodyStorage.simulateDeleteError()

    await expect(
      createArticle({ title: 'テスト記事', body: '本文' }, deps()),
    ).rejects.toThrow('リポジトリ保存エラー')
  })
})
