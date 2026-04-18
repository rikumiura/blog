import {
  cancelSchedule as cancelScheduleDomain,
  type DraftArticle,
  type PublicArticleId,
} from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export type CancelScheduleResult =
  | { status: 'cancelled'; article: DraftArticle }
  | { status: 'not_found' }
  | { status: 'not_scheduled' }

export async function cancelSchedule(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    now: () => string
  },
): Promise<CancelScheduleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) {
    return { status: 'not_found' }
  }
  if (article.status !== 'scheduled') {
    return { status: 'not_scheduled' }
  }

  const now = deps.now()
  const draft = cancelScheduleDomain(article, now)
  // bodyKey を含む全列 upsert ではなく status/scheduledAt/updatedAt のみ narrow UPDATE する
  await deps.repository.updateStatus(
    draft.id,
    'draft',
    null,
    null,
    now,
    'scheduled',
  )

  return { status: 'cancelled', article: draft }
}
