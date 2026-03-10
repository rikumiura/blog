import { check, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { articles } from './articles'

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
  },
  (table) => [
    check(
      'tag_name_check',
      sql`length(trim(${table.name})) > 0 AND length(trim(${table.name})) <= 30`,
    ),
  ],
)

export const articleTags = sqliteTable(
  'article_tags',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tagId] })],
)
