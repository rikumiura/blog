import {
  type PublicArticleId,
  type PublishedArticle,
  publishArticle as publishDomainArticle,
} from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export type PublishArticleResult =
  | { status: 'published'; article: PublishedArticle }
  | { status: 'not_found' }
  | { status: 'already_published' }

export async function publishArticle(
  publicId: PublicArticleId,
  deps: {
    repository: ArticleRepository
    now: () => string
  },
): Promise<PublishArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) {
    return { status: 'not_found' }
  }
  if (article.status === 'published') {
    return { status: 'already_published' }
  }

  const now = deps.now()
  const published = publishDomainArticle(article, now)
  // bodyKey を含む全列 upsert ではなく status/publishedAt/updatedAt のみ narrow UPDATE する
  // （並行する本文更新が bodyKey を書き換えても上書きしない）
  await deps.repository.updateStatus(
    published.id,
    'published',
    published.publishedAt,
    published.scheduledAt,
    now,
  )

  return { status: 'published', article: published }
}
