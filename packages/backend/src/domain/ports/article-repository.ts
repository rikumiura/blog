import type {
  Article,
  ArticleId,
  PublicArticleId,
  PublishedArticle,
  Title,
} from '../models/article'

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
  /** updatedAt のみを更新する。全列 upsert による並行更新の上書きを防ぐ。 */
  updateUpdatedAt(id: ArticleId, updatedAt: string): Promise<void>
  /** title と updatedAt のみを更新する。bodyKey を含まず並行更新の上書きを防ぐ。 */
  updateTitle(id: ArticleId, title: Title, updatedAt: string): Promise<void>
  delete(id: ArticleId): Promise<void>
  findById(id: ArticleId): Promise<Article | null>
  findByPublicId(publicId: PublicArticleId): Promise<Article | null>
  findAll(): Promise<Article[]>
  findAllPaginated(params: PaginationParams): Promise<PaginatedResult<Article>>
  findScheduledBefore(before: string): Promise<Article[]>
  findPublished(): Promise<PublishedArticle[]>
  findPublishedPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<PublishedArticle>>
}
