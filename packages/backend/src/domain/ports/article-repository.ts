import type {
  Article,
  ArticleId,
  BodyKey,
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
  /**
   * bodyKey と updatedAt のみを更新する（title は省略可）。
   * status/publishedAt/scheduledAt を含まず並行更新（公開・予約等）の上書きを防ぐ。
   */
  updateBodyKey(
    id: ArticleId,
    bodyKey: BodyKey,
    title: Title | undefined,
    updatedAt: string,
  ): Promise<void>
  /**
   * bodyKey の更新と旧 bodyKey の outbox 登録を原子的に行う（D1 batch）。
   * CAS（旧 bodyKey を WHERE 条件に含む）で並行更新を検出し、
   * 新 bodyKey が孤立しないよう呼び出し元が処理できるようにする。
   */
  updateBodyKeyAndEnqueueOldKey(
    id: ArticleId,
    newBodyKey: BodyKey,
    oldBodyKey: BodyKey,
    title: Title | undefined,
    queuedAt: string,
    updatedAt: string,
  ): Promise<'updated' | 'conflict' | 'not_found'>
  /**
   * status/publishedAt/scheduledAt/updatedAt のみを更新する。
   * bodyKey/title を含まず並行する本文更新の上書きを防ぐ。
   */
  updateStatus(
    id: ArticleId,
    status: 'draft' | 'scheduled' | 'published',
    publishedAt: string | null,
    scheduledAt: string | null,
    updatedAt: string,
  ): Promise<void>
  /**
   * 記事行の削除と bodyKey の outbox 追加を原子的に行う。
   * D1 実装では db.batch() を使用し、どちらか片方が欠ける状態を防ぐ。
   */
  deleteAndEnqueueBodyKey(
    id: ArticleId,
    bodyKey: BodyKey,
    queuedAt: string,
  ): Promise<void>
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
