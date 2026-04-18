import {
  articles,
  articleTags,
  pendingBodyKeyDeletions,
  tags,
} from '@my-blog/db'
import { and, count, desc, eq, inArray, lte, sql } from 'drizzle-orm'
import {
  type Article,
  ArticleId,
  BodyKey,
  PublicArticleId,
  type PublishedArticle,
  restoreTitle,
  type Title,
} from '../../domain/models/article'
import type {
  ArticleRepository,
  PaginatedResult,
  PaginationParams,
} from '../../domain/ports/article-repository'
import type { DbClient } from '../database'

export class DrizzleArticleRepository implements ArticleRepository {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async save(article: Article): Promise<void> {
    await this.db
      .insert(articles)
      .values({
        id: article.id,
        publicId: article.publicId,
        title: article.title,
        bodyKey: article.bodyKey,
        status: article.status,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        publishedAt: article.publishedAt,
        scheduledAt: article.scheduledAt,
      })
      .onConflictDoUpdate({
        target: articles.id,
        set: {
          title: article.title,
          bodyKey: article.bodyKey,
          status: article.status,
          updatedAt: article.updatedAt,
          publishedAt: article.publishedAt,
          scheduledAt: article.scheduledAt,
        },
      })
  }

  async updateUpdatedAt(id: ArticleId, updatedAt: string): Promise<void> {
    await this.db.update(articles).set({ updatedAt }).where(eq(articles.id, id))
  }

  async updateTitle(
    id: ArticleId,
    title: Title,
    updatedAt: string,
  ): Promise<void> {
    await this.db
      .update(articles)
      .set({ title, updatedAt })
      .where(eq(articles.id, id))
  }

  async updateBodyKey(
    id: ArticleId,
    bodyKey: BodyKey,
    title: Title | undefined,
    updatedAt: string,
  ): Promise<void> {
    await this.db
      .update(articles)
      .set({ bodyKey, ...(title !== undefined ? { title } : {}), updatedAt })
      .where(eq(articles.id, id))
  }

  async updateBodyKeyAndEnqueueOldKey(
    id: ArticleId,
    newBodyKey: BodyKey,
    oldBodyKey: BodyKey,
    title: Title | undefined,
    queuedAt: string,
    updatedAt: string,
  ): Promise<'updated' | 'conflict' | 'not_found'> {
    // CAS で bodyKey を更新しつつ、旧 bodyKey の outbox 登録を原子的に行う。
    // .returning() で UPDATE の影響行を取得する。
    // 後続 SELECT で判定すると batch コミット後に並行更新が割り込み、
    // 成功した更新を conflict と誤分類する恐れがあるため使用しない。
    const [updatedRows] = await this.db.batch([
      this.db
        .update(articles)
        .set({
          bodyKey: newBodyKey,
          ...(title !== undefined ? { title } : {}),
          updatedAt,
        })
        .where(and(eq(articles.id, id), eq(articles.bodyKey, oldBodyKey)))
        .returning({ id: articles.id }),
      this.db
        .insert(pendingBodyKeyDeletions)
        .values({ bodyKey: oldBodyKey, queuedAt })
        .onConflictDoNothing(),
    ] as const)

    // RETURNING に行があれば UPDATE が確実に成功した
    if (updatedRows.length > 0) return 'updated'

    // 行が更新されなかった: 記事不在か bodyKey が既に変わっていた（競合）を区別する
    const rows = await this.db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, id))
    return rows.length === 0 ? 'not_found' : 'conflict'
  }

  async updateStatus(
    id: ArticleId,
    status: 'draft' | 'scheduled' | 'published',
    publishedAt: string | null,
    scheduledAt: string | null,
    updatedAt: string,
  ): Promise<void> {
    await this.db
      .update(articles)
      .set({ status, publishedAt, scheduledAt, updatedAt })
      .where(eq(articles.id, id))
  }

  async deleteAndEnqueueBodyKey(
    id: ArticleId,
    queuedAt: string,
  ): Promise<void> {
    // INSERT INTO pending SELECT body_key FROM articles WHERE id と DELETE を
    // db.batch() で原子的に実行する。呼び出し元の stale な bodyKey ではなく、
    // 削除時点の DB の実際の bodyKey を outbox に記録する。
    await this.db.batch([
      this.db.run(
        sql`INSERT OR IGNORE INTO pending_body_key_deletions (body_key, queued_at)
            SELECT body_key, ${queuedAt} FROM articles WHERE id = ${id}`,
      ),
      this.db.delete(articles).where(eq(articles.id, id)),
    ])
  }

  async delete(id: ArticleId): Promise<void> {
    await this.db.delete(articles).where(eq(articles.id, id))
  }

  async findById(id: ArticleId): Promise<Article | null> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
    const row = rows[0]
    if (!row) return null
    return toEntity(row)
  }

  async findByPublicId(publicId: PublicArticleId): Promise<Article | null> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(eq(articles.publicId, publicId))
    const row = rows[0]
    if (!row) return null
    return toEntity(row)
  }

  async findAll(): Promise<Article[]> {
    const rows = await this.db
      .select()
      .from(articles)
      .orderBy(desc(articles.updatedAt))
    return rows.map(toEntity)
  }

  async findAllPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<Article>> {
    const offset = (params.page - 1) * params.limit
    const tagFilter =
      params.tags && params.tags.length > 0
        ? inArray(
            articles.id,
            this.db
              .select({ id: articleTags.articleId })
              .from(articleTags)
              .innerJoin(tags, eq(articleTags.tagId, tags.id))
              .where(inArray(tags.name, params.tags)),
          )
        : undefined
    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(articles)
        .where(tagFilter)
        .orderBy(desc(articles.updatedAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ count: count() }).from(articles).where(tagFilter),
    ])
    return {
      items: rows.map(toEntity),
      totalCount: countResult[0]?.count ?? 0,
    }
  }

  async findScheduledBefore(before: string): Promise<Article[]> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, 'scheduled'),
          lte(articles.scheduledAt, before),
        ),
      )
    return rows.map(toEntity)
  }

  async findPublished(): Promise<PublishedArticle[]> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
    // WHERE句で published のみに絞っているため、toEntity の結果は必ず PublishedArticle
    return rows.map(toEntity) as PublishedArticle[]
  }

  async findPublishedPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<PublishedArticle>> {
    const offset = (params.page - 1) * params.limit
    const tagFilter =
      params.tags && params.tags.length > 0
        ? inArray(
            articles.id,
            this.db
              .select({ id: articleTags.articleId })
              .from(articleTags)
              .innerJoin(tags, eq(articleTags.tagId, tags.id))
              .where(inArray(tags.name, params.tags)),
          )
        : undefined
    const whereClause = and(eq(articles.status, 'published'), tagFilter)
    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.publishedAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ count: count() }).from(articles).where(whereClause),
    ])
    // WHERE句で published のみに絞っているため、toEntity の結果は必ず PublishedArticle
    return {
      items: rows.map(toEntity) as PublishedArticle[],
      totalCount: countResult[0]?.count ?? 0,
    }
  }
}

function toEntity(row: typeof articles.$inferSelect): Article {
  const base = {
    id: ArticleId(row.id),
    publicId: PublicArticleId(row.publicId),
    title: restoreTitle(row.title),
    bodyKey: BodyKey(row.bodyKey),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }

  if (row.status === 'draft' && row.publishedAt === null) {
    return { ...base, status: 'draft', publishedAt: null, scheduledAt: null }
  }
  if (
    row.status === 'scheduled' &&
    row.publishedAt === null &&
    row.scheduledAt !== null
  ) {
    return {
      ...base,
      status: 'scheduled',
      publishedAt: null,
      scheduledAt: row.scheduledAt,
    }
  }
  if (row.status === 'published' && row.publishedAt !== null) {
    return {
      ...base,
      status: 'published',
      publishedAt: row.publishedAt,
      scheduledAt: row.scheduledAt,
    }
  }
  throw new Error(
    `articles テーブルの status と publishedAt/scheduledAt の組み合わせが不正です (id: ${row.id}, status: ${row.status}, publishedAt: ${row.publishedAt}, scheduledAt: ${row.scheduledAt})`,
  )
}
