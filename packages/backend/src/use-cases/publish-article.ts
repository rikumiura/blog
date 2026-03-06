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
  },
): Promise<PublishArticleResult> {
  const article = await deps.repository.findByPublicId(publicId)
  if (!article) {
    return { status: 'not_found' }
  }
  if (article.status !== 'draft') {
    return { status: 'already_published' }
  }

  const now = new Date().toISOString()
  const published = publishDomainArticle(article, now)
  await deps.repository.save(published)

  return { status: 'published', article: published }
}
