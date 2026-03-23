import type { Article } from '../domain/models/article'
import type {
  ArticleRepository,
  PaginatedResult,
  PaginationParams,
} from '../domain/ports/article-repository'

export function listArticles(
  repository: ArticleRepository,
): Promise<Article[]> {
  return repository.findAll()
}

export function listArticlesPaginated(
  repository: ArticleRepository,
  params: PaginationParams,
): Promise<PaginatedResult<Article>> {
  return repository.findAllPaginated(params)
}
