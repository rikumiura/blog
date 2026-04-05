import type { Article, ArticleId, PublicArticleId, PublishedArticle } from '../models/article'

export type PaginatedResult<T> = {
  items: T[]
  totalCount: number
}

export type PaginationParams = {
  page: number
  limit: number
  tags?: string[]
}

export interface ArticleRepository {
  save(article: Article): Promise<void>
  delete(id: ArticleId): Promise<void>
  findById(id: ArticleId): Promise<Article | null>
  findByPublicId(publicId: PublicArticleId): Promise<Article | null>
  findAll(): Promise<Article[]>
  findAllPaginated(params: PaginationParams): Promise<PaginatedResult<Article>>
  findScheduledBefore(before: string): Promise<Article[]>
  findPublished(): Promise<PublishedArticle[]>
  findPublishedPaginated(params: PaginationParams): Promise<PaginatedResult<PublishedArticle>>
}
