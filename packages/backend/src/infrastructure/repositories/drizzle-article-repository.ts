import { articles } from '@my-blog/db'
import { eq } from 'drizzle-orm'
import type {
  Article,
  ArticleId,
  ArticleStatus,
  BodyKey,
  PublicArticleId,
  Title,
} from '../../domain/models/article'
import type { ArticleRepository } from '../../domain/repositories/article-repository'
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
    const rows = await this.db.select().from(articles)
    return rows.map(toEntity)
  }
}

function toEntity(row: typeof articles.$inferSelect): Article {
  return {
    id: row.id as ArticleId,
    publicId: row.publicId as PublicArticleId,
    title: row.title as Title,
    bodyKey: row.bodyKey as BodyKey,
    status: row.status as ArticleStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  }
}
