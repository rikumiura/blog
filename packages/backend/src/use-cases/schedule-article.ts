import {
  type PublicArticleId,
  type ScheduledArticle,
  scheduleArticle as scheduleDomainArticle,
} from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export type ScheduleArticleResult =
  | { status: 'scheduled'; article: ScheduledArticle }
  | { status: 'not_found' }
  | { status: 'not_draft' }
  | { status: 'validation_error'; message: string }

export async function scheduleArticle(
  publicId: PublicArticleId,
  scheduledAt: string,
  deps: {
    repository: ArticleRepository
    now: () => string
  },
): Promise<ScheduleArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) {
    return { status: 'not_found' }
  }
  if (article.status !== 'draft') {
    return { status: 'not_draft' }
  }

  const now = deps.now()
  if (scheduledAt <= now) {
    return {
      status: 'validation_error',
      message: '予約日時は現在より未来を指定してください',
    }
  }

  const scheduled = scheduleDomainArticle(article, scheduledAt, now)
  // bodyKey を含む全列 upsert ではなく status/scheduledAt/updatedAt のみ narrow UPDATE する
  await deps.repository.updateStatus(
    scheduled.id,
    'scheduled',
    null,
    scheduled.scheduledAt,
    now,
    'draft',
  )

  return { status: 'scheduled', article: scheduled }
}
