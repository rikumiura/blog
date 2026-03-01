import { posts } from '@my-blog/db'
import type { Post } from '../../domain/models/post'
import type { PostRepository } from '../../domain/repositories/post-repository'
import type { DbClient } from '../database'

export class DrizzlePostRepository implements PostRepository {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async findAll(): Promise<Post[]> {
    const rows = await this.db.select().from(posts)
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  }
}
