import type { Article, ArticleId, DraftArticle, PublicArticleId, PublishedArticle } from '../models/article'

export interface ArticleRepository {
  save(article: Article): Promise<void>
  findById(id: ArticleId): Promise<Article | null>
  findByPublicId(publicId: PublicArticleId): Promise<Article | null>
  findAll(): Promise<Article[]>
}
