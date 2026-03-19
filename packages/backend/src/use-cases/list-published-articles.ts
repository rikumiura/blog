import type { PublishedArticle } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export function listPublishedArticles(
  repository: ArticleRepository,
): Promise<PublishedArticle[]> {
  return repository.findPublished()
}
