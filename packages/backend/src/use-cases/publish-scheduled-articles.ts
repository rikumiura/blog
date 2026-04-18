import { publishArticle as publishDomainArticle } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export type PublishScheduledResult = {
  publishedCount: number
}

export async function publishScheduledArticles(deps: {
  repository: ArticleRepository
  now: () => string
}): Promise<PublishScheduledResult> {
  const now = deps.now()
  const scheduledArticles = await deps.repository.findScheduledBefore(now)

  let publishedCount = 0
  for (const article of scheduledArticles) {
    if (article.status !== 'scheduled') continue
    try {
      const published = publishDomainArticle(article, now)
      // CAS: status = 'scheduled' AND scheduled_at <= now の条件で更新し、
      // 並行キャンセルや延期で条件が成立しない場合はスキップする
      const result = await deps.repository.updateStatus(
        published.id,
        'published',
        published.publishedAt,
        published.scheduledAt,
        now,
        'scheduled',
        now,
      )
      if (result === 'updated') publishedCount++
    } catch (error) {
      console.error(
        `予約公開に失敗しました (publicId: ${article.publicId}):`,
        error,
      )
    }
  }

  return { publishedCount }
}
