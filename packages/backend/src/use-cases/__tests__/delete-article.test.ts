import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  type DraftArticle,
  PublicArticleId,
  restoreTitle,
} from '../../domain/models/article'
import { deleteArticle } from '../delete-article'
import {
  InMemoryArticleRepository,
  InMemoryBodyStorage,
} from './in-memory-test-doubles'

function createTestDraft(overrides?: Partial<DraftArticle>): DraftArticle {
  return {
    id: ArticleId('article-1'),
    publicId: PublicArticleId('public-1'),
    title: restoreTitle('テスト記事'),
    bodyKey: BodyKey('body-key-1'),
    status: 'draft',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
    ...overrides,
  }
}

describe('deleteArticle', () => {
  const setup = () => {
    const repository = new InMemoryArticleRepository()
    const bodyStorage = new InMemoryBodyStorage()
    return { repository, bodyStorage }
  }

  it('記事とストレージが削除される', async () => {
    const deps = setup()
    const article = createTestDraft()
    await deps.repository.save(article)
    await deps.bodyStorage.save(BodyKey('body-key-1'), '本文')

    const result = await deleteArticle(PublicArticleId('public-1'), deps)

    expect(result).toEqual({ status: 'deleted' })
    expect(await deps.repository.findAll()).toHaveLength(0)
    expect(deps.bodyStorage.has(BodyKey('body-key-1'))).toBe(false)
  })

  it('存在しない記事の場合 not_found が返る', async () => {
    const deps = setup()

    const result = await deleteArticle(PublicArticleId('nonexistent'), deps)

    expect(result).toEqual({ status: 'not_found' })
  })

  it('R2削除が失敗しても deleted が返り、D1の記事は削除される', async () => {
    const deps = setup()
    const article = createTestDraft()
    await deps.repository.save(article)
    await deps.bodyStorage.save(BodyKey('body-key-1'), '本文')
    deps.bodyStorage.simulateDeleteError()

    const result = await deleteArticle(PublicArticleId('public-1'), deps)

    // ユーザー視点では削除済み（D1から消えている）
    expect(result).toEqual({ status: 'deleted' })
    const remaining = await deps.repository.findAll()
    expect(remaining).toHaveLength(0)
  })
})
