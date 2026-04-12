import { describe, expect, it, vi } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  restoreTitle,
  type ScheduledArticle,
} from '../../domain/models/article'
import { publishScheduledArticles } from '../publish-scheduled-articles'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

const FIXED_NOW = '2025-02-01T12:00:00.000Z'

function createTestScheduled(
  id: string,
  scheduledAt: string,
): ScheduledArticle {
  return {
    id: ArticleId(id),
    publicId: PublicArticleId(`public-${id}`),
    title: restoreTitle(`予約記事${id}`),
    bodyKey: BodyKey(`body-${id}`),
    status: 'scheduled',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    publishedAt: null,
    scheduledAt,
  }
}

describe('publishScheduledArticles', () => {
  const setup = () => {
    const repository = new InMemoryArticleRepository()
    return { repository, now: () => FIXED_NOW }
  }

  it('予約時刻を過ぎた記事が公開される', async () => {
    const deps = setup()
    await deps.repository.save(
      createTestScheduled('1', '2025-02-01T10:00:00.000Z'),
    )
    await deps.repository.save(
      createTestScheduled('2', '2025-02-01T11:00:00.000Z'),
    )

    const result = await publishScheduledArticles(deps)

    expect(result.publishedCount).toBe(2)

    const article1 = await deps.repository.findById(ArticleId('1'))
    expect(article1?.status).toBe('published')
    const article2 = await deps.repository.findById(ArticleId('2'))
    expect(article2?.status).toBe('published')
  })

  it('対象記事がない場合は publishedCount が 0 になる', async () => {
    const deps = setup()

    const result = await publishScheduledArticles(deps)

    expect(result.publishedCount).toBe(0)
  })

  it('未来の予約記事は公開されない', async () => {
    const deps = setup()
    await deps.repository.save(
      createTestScheduled('1', '2025-03-01T10:00:00.000Z'),
    )

    const result = await publishScheduledArticles(deps)

    expect(result.publishedCount).toBe(0)
    const article = await deps.repository.findById(ArticleId('1'))
    expect(article?.status).toBe('scheduled')
  })

  it('個別の公開失敗時もエラーをログ出力して処理を継続する', async () => {
    const deps = setup()
    await deps.repository.save(
      createTestScheduled('1', '2025-02-01T10:00:00.000Z'),
    )
    await deps.repository.save(
      createTestScheduled('2', '2025-02-01T11:00:00.000Z'),
    )

    // updateStatus をモックし、最初の公開保存でエラーを起こす
    let updateStatusCount = 0
    const originalUpdateStatus = deps.repository.updateStatus.bind(
      deps.repository,
    )
    vi.spyOn(deps.repository, 'updateStatus').mockImplementation(
      async (...args) => {
        updateStatusCount++
        if (updateStatusCount === 1) {
          throw new Error('保存エラー')
        }
        return originalUpdateStatus(...args)
      },
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await publishScheduledArticles(deps)

    // 記事1はエラー、記事2は成功
    expect(result.publishedCount).toBe(1)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('予約公開操作は bodyKey を含む全列 save をしない（並行本文更新の上書き防止）', async () => {
    const deps = setup()
    await deps.repository.save(
      createTestScheduled('1', '2025-02-01T10:00:00.000Z'),
    )

    let saveCalledAfterSetup = false
    const originalSave = deps.repository.save.bind(deps.repository)
    deps.repository.save = async (article) => {
      saveCalledAfterSetup = true
      return originalSave(article)
    }

    await publishScheduledArticles(deps)

    expect(saveCalledAfterSetup).toBe(false)
  })
})
