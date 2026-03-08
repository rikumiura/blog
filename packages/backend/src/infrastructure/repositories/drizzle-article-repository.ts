import { articles } from '@my-blog/db'
import { desc, eq } from 'drizzle-orm'
import {
  type Article,
  ArticleId,
  BodyKey,
  PublicArticleId,
  restoreTitle,
} from '../../domain/models/article'
import type { ArticleRepository } from '../../domain/ports/article-repository'
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
      })
      .onConflictDoUpdate({
        target: articles.id,
        set: {
          title: article.title,
          bodyKey: article.bodyKey,
          status: article.status,
          updatedAt: article.updatedAt,
          publishedAt: article.publishedAt,
        },
      })
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
    return { ...base, status: 'draft', publishedAt: null }
  }
  if (row.status === 'published' && row.publishedAt !== null) {
    return { ...base, status: 'published', publishedAt: row.publishedAt }
  }
  throw new Error(
    `articles テーブルの status と publishedAt の組み合わせが不正です (id: ${row.id}, status: ${row.status}, publishedAt: ${row.publishedAt})`,
  )
}
