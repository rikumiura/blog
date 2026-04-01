import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  type DraftArticle,
  PublicArticleId,
  restoreTitle,
  type ScheduledArticle,
} from '../../domain/models/article'
import { cancelSchedule } from '../cancel-schedule'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

const FIXED_NOW = '2025-01-20T10:00:00.000Z'

function createTestScheduled(): ScheduledArticle {
  return {
    id: ArticleId('article-1'),
    publicId: PublicArticleId('public-1'),
    title: restoreTitle('予約記事'),
    bodyKey: BodyKey('body-key-1'),
    status: 'scheduled',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: '2025-02-01T10:00:00.000Z',
  }
}

describe('cancelSchedule', () => {
  const setup = () => {
    const repository = new InMemoryArticleRepository()
    return { repository, now: () => FIXED_NOW }
  }

  it('予約記事を下書きに戻せる', async () => {
    const deps = setup()
    await deps.repository.save(createTestScheduled())

    const result = await cancelSchedule(PublicArticleId('public-1'), deps)

    expect(result.status).toBe('cancelled')
    if (result.status === 'cancelled') {
      expect(result.article.status).toBe('draft')
      expect(result.article.scheduledAt).toBeNull()
      expect(result.article.updatedAt).toBe(FIXED_NOW)
    }
  })

  it('キャンセルした記事がリポジトリに保存される', async () => {
    const deps = setup()
    await deps.repository.save(createTestScheduled())

    await cancelSchedule(PublicArticleId('public-1'), deps)

    const saved = await deps.repository.findByPublicId(
      PublicArticleId('public-1'),
    )
    expect(saved?.status).toBe('draft')
  })

  it('存在しない記事の場合 not_found が返る', async () => {
    const deps = setup()

    const result = await cancelSchedule(PublicArticleId('nonexistent'), deps)

    expect(result).toEqual({ status: 'not_found' })
  })

  it('予約状態でない記事は not_scheduled が返る', async () => {
    const deps = setup()
    const draft: DraftArticle = {
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: restoreTitle('下書き'),
      bodyKey: BodyKey('body-key-1'),
      status: 'draft',
      createdAt: '2025-01-15T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    }
    await deps.repository.save(draft)

    const result = await cancelSchedule(PublicArticleId('public-1'), deps)

    expect(result).toEqual({ status: 'not_scheduled' })
  })
})
