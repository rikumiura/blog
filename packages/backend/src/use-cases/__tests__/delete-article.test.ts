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
    const now = () => '2025-01-20T10:00:00.000Z'
    return { repository, bodyStorage, now }
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

  it('bodyKey は常に outbox に原子的に記録される（R2成功・失敗に関わらず）', async () => {
    const deps = setup()
    const article = createTestDraft()
    await deps.repository.save(article)
    await deps.bodyStorage.save(BodyKey('body-key-1'), '本文')

    await deleteArticle(PublicArticleId('public-1'), deps)

    // D1削除と同時にoutboxへ記録される（cron が再試行可能）
    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-1'))).toBe(true)
  })

  it('R2削除が失敗しても bodyKey は outbox に記録される', async () => {
    const deps = setup()
    const article = createTestDraft()
    await deps.repository.save(article)
    await deps.bodyStorage.save(BodyKey('body-key-1'), '本文')
    deps.bodyStorage.simulateDeleteError()

    await deleteArticle(PublicArticleId('public-1'), deps)

    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-1'))).toBe(true)
  })

  it('削除直前に並行した本文更新があっても、最新の bodyKey が outbox に記録される', async () => {
    const deps = setup()
    const article = createTestDraft()
    await deps.repository.save(article)

    // 削除の直前に並行して bodyKey が更新されたと仮定する
    await deps.repository.save({
      ...article,
      bodyKey: BodyKey('body-key-updated'),
      updatedAt: '2025-01-20T10:00:00.001Z',
    })

    // deleteArticle は findByPublicId で stale な body-key-1 を読むが、
    // deleteAndEnqueueBodyKey は DB の現在の body-key-updated を outbox に記録する
    await deps.repository.deleteAndEnqueueBodyKey(
      article.id,
      '2025-01-20T10:00:00.000Z',
    )

    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-updated'))).toBe(
      true,
    )
    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-1'))).toBe(false)
  })
})
