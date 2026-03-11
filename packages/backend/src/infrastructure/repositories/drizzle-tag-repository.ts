import { articleTags, tags } from '@my-blog/db'
import { and, eq, inArray } from 'drizzle-orm'
import type { ArticleId } from '../../domain/models/article'
import { type Tag, TagId, restoreTagName } from '../../domain/models/tag'
import type { TagRepository } from '../../domain/ports/tag-repository'
import type { DbClient } from '../database'

export class DrizzleTagRepository implements TagRepository {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async findByNames(names: Tag['name'][]): Promise<Tag[]> {
    if (names.length === 0) return []
    const rows = await this.db
      .select()
      .from(tags)
      .where(inArray(tags.name, names))
    return rows.map(toEntity)
  }

  async saveMany(tagList: Tag[]): Promise<void> {
    if (tagList.length === 0) return
    await this.db
      .insert(tags)
      .values(tagList.map((t) => ({ id: t.id, name: t.name })))
      .onConflictDoNothing({ target: tags.name })
  }

  async findByArticleId(articleId: ArticleId): Promise<Tag[]> {
    const rows = await this.db
      .select({ id: tags.id, name: tags.name })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, articleId))
    return rows.map(toEntity)
  }

  async findByArticleIds(
    articleIds: ArticleId[],
  ): Promise<Map<string, Tag[]>> {
    if (articleIds.length === 0) return new Map()
    const rows = await this.db
      .select({
        articleId: articleTags.articleId,
        id: tags.id,
        name: tags.name,
      })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(inArray(articleTags.articleId, articleIds))

    const map = new Map<string, Tag[]>()
    for (const row of rows) {
      const list = map.get(row.articleId) ?? []
      list.push(toEntity(row))
      map.set(row.articleId, list)
    }
    return map
  }

  async setArticleTags(
    articleId: ArticleId,
    tagIds: Tag['id'][],
  ): Promise<void> {
    const deleteOp = this.db
      .delete(articleTags)
      .where(eq(articleTags.articleId, articleId))

    if (tagIds.length === 0) {
      await deleteOp
      return
    }

    const insertOp = this.db
      .insert(articleTags)
      .values(tagIds.map((tagId) => ({ articleId, tagId })))

    // batch で原子的に実行
    await this.db.batch([deleteOp, insertOp])
  }
}

function toEntity(row: typeof tags.$inferSelect): Tag {
  return {
    id: TagId(row.id),
    name: restoreTagName(row.name),
  }
}
