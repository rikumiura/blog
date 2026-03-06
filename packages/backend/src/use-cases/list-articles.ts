import type { ArticleRepository } from '../domain/ports/article-repository'

export function listArticles(repository: ArticleRepository) {
  return repository.findAll()
}
