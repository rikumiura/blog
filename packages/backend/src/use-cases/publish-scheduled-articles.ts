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
    const published = publishDomainArticle(article, now)
    await deps.repository.save(published)
    publishedCount++
  }

  return { publishedCount }
}
