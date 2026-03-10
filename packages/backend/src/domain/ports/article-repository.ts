import type { Article, ArticleId, PublicArticleId } from '../models/article'

export interface ArticleRepository {
  save(article: Article): Promise<void>
  delete(id: ArticleId): Promise<void>
  findById(id: ArticleId): Promise<Article | null>
  findByPublicId(publicId: PublicArticleId): Promise<Article | null>
  findAll(): Promise<Article[]>
}
