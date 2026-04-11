import { comments } from '@my-blog/db'
import { asc, eq } from 'drizzle-orm'
import type { ArticleId } from '../../domain/models/article'
import {
  type Comment,
  CommentId,
  restoreAuthorName,
  restoreCommentContent,
} from '../../domain/models/comment'
import type { CommentRepository } from '../../domain/ports/comment-repository'
import type { DbClient } from '../database'

export class DrizzleCommentRepository implements CommentRepository {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async save(comment: Comment): Promise<void> {
    await this.db.insert(comments).values({
      id: comment.id,
      articleId: comment.articleId,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt,
    })
  }

  async findByArticleId(articleId: ArticleId): Promise<Comment[]> {
    const rows = await this.db
      .select()
      .from(comments)
      .where(eq(comments.articleId, articleId))
      .orderBy(asc(comments.createdAt))
    return rows.map(toEntity)
  }

  async findById(id: CommentId): Promise<Comment | null> {
    const rows = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
    const row = rows[0]
    if (!row) return null
    return toEntity(row)
  }

  async deleteById(id: CommentId): Promise<boolean> {
    const deleted = await this.db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning({ id: comments.id })
    return deleted.length > 0
  }
}

function toEntity(row: typeof comments.$inferSelect): Comment {
  return {
    id: CommentId(row.id),
    articleId: row.articleId,
    authorName: restoreAuthorName(row.authorName),
    content: restoreCommentContent(row.content),
    createdAt: row.createdAt,
  }
}
