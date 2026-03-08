import type { Article } from '../domain/models/article'
import type { ArticleRepository } from '../domain/ports/article-repository'

export function listArticles(
  repository: ArticleRepository,
): Promise<Article[]> {
  return repository.findAll()
}
