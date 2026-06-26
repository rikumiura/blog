import type { InferInsertModel } from 'drizzle-orm'
import type { articles, articleTags, tags } from '../schema'

// INSERT文には全カラムを明示的に渡すため、defaultを持つカラムも省略不可にする
type ArticleRow = Required<InferInsertModel<typeof articles>>
type TagRow = Required<InferInsertModel<typeof tags>>
type ArticleTagRow = Required<InferInsertModel<typeof articleTags>>

type SeedRows = {
  tags: TagRow[]
  articles: ArticleRow[]
  articleTags: ArticleTagRow[]
}

function toSqlValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  return `'${value.replace(/'/g, "''")}'`
}

function buildInsertStatements<
  T extends Record<string, string | null | undefined>,
>(
  table: string,
  columns: { name: string; key: keyof T }[],
  rows: T[],
): string[] {
  const columnNames = columns.map((column) => column.name).join(', ')
  return rows.map((row) => {
    const values = columns
      .map((column) => toSqlValue(row[column.key]))
      .join(', ')
    return `INSERT INTO ${table} (${columnNames}) VALUES (${values});`
  })
}

export function buildSeedSql({
  tags,
  articles,
  articleTags,
}: SeedRows): string {
  const statements = [
    'DELETE FROM article_tags;',
    'DELETE FROM articles;',
    'DELETE FROM tags;',
    ...buildInsertStatements(
      'tags',
      [
        { name: 'id', key: 'id' },
        { name: 'name', key: 'name' },
      ],
      tags,
    ),
    ...buildInsertStatements(
      'articles',
      [
        { name: 'id', key: 'id' },
        { name: 'public_id', key: 'publicId' },
        { name: 'title', key: 'title' },
        { name: 'body_key', key: 'bodyKey' },
        { name: 'status', key: 'status' },
        { name: 'created_at', key: 'createdAt' },
        { name: 'updated_at', key: 'updatedAt' },
        { name: 'published_at', key: 'publishedAt' },
        { name: 'scheduled_at', key: 'scheduledAt' },
      ],
      articles,
    ),
    ...buildInsertStatements(
      'article_tags',
      [
        { name: 'article_id', key: 'articleId' },
        { name: 'tag_id', key: 'tagId' },
      ],
      articleTags,
    ),
  ]

  return statements.join('\n')
}
