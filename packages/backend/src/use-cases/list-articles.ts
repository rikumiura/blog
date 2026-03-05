import type { ArticleRepository } from '../domain/repositories/article-repository'

export function listArticles(repository: ArticleRepository) {
  return repository.findAll()
}
