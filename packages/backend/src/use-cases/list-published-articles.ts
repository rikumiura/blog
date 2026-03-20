import type { PublishedArticle } from '../domain/models/article'
import type {
  ArticleRepository,
  PaginatedResult,
  PaginationParams,
} from '../domain/ports/article-repository'

export function listPublishedArticles(
  repository: ArticleRepository,
): Promise<PublishedArticle[]> {
  return repository.findPublished()
}

export function listPublishedArticlesPaginated(
  repository: ArticleRepository,
  params: PaginationParams,
): Promise<PaginatedResult<PublishedArticle>> {
  return repository.findPublishedPaginated(params)
}
