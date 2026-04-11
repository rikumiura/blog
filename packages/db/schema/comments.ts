import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { articles } from './articles'

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  articleId: text('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
})
