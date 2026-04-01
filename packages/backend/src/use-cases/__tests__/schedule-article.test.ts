import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  type DraftArticle,
  PublicArticleId,
  restoreTitle,
} from '../../domain/models/article'
import { scheduleArticle } from '../schedule-article'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

const FIXED_NOW = '2025-01-15T10:00:00.000Z'
const FUTURE_DATE = '2025-02-01T10:00:00.000Z'
const PAST_DATE = '2025-01-01T10:00:00.000Z'

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

describe('scheduleArticle', () => {
  const setup = () => {
    const repository = new InMemoryArticleRepository()
    return { repository, now: () => FIXED_NOW }
  }

  it('下書き記事を予約公開状態にできる', async () => {
    const deps = setup()
    await deps.repository.save(createTestDraft())

    const result = await scheduleArticle(
      PublicArticleId('public-1'),
      FUTURE_DATE,
      deps,
    )

    expect(result.status).toBe('scheduled')
    if (result.status === 'scheduled') {
      expect(result.article.status).toBe('scheduled')
      expect(result.article.scheduledAt).toBe(FUTURE_DATE)
    }
  })

  it('予約した記事がリポジトリに保存される', async () => {
    const deps = setup()
    await deps.repository.save(createTestDraft())

    await scheduleArticle(PublicArticleId('public-1'), FUTURE_DATE, deps)

    const saved = await deps.repository.findByPublicId(
      PublicArticleId('public-1'),
    )
    expect(saved?.status).toBe('scheduled')
  })

  it('存在しない記事の場合 not_found が返る', async () => {
    const deps = setup()

    const result = await scheduleArticle(
      PublicArticleId('nonexistent'),
      FUTURE_DATE,
      deps,
    )

    expect(result).toEqual({ status: 'not_found' })
  })

  it('下書き以外の記事は not_draft が返る', async () => {
    const deps = setup()
    const draft = createTestDraft()
    await deps.repository.save(draft)
    // 一度公開してから予約しようとする
    const published = {
      ...draft,
      status: 'published' as const,
      publishedAt: FIXED_NOW,
      scheduledAt: null,
    }
    await deps.repository.save(published)

    const result = await scheduleArticle(
      PublicArticleId('public-1'),
      FUTURE_DATE,
      deps,
    )

    expect(result).toEqual({ status: 'not_draft' })
  })

  it('過去の日時を指定した場合 validation_error が返る', async () => {
    const deps = setup()
    await deps.repository.save(createTestDraft())

    const result = await scheduleArticle(
      PublicArticleId('public-1'),
      PAST_DATE,
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: '予約日時は現在より未来を指定してください',
    })
  })
})
